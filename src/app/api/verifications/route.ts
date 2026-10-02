import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, projects, publicVerifications } from "@/db/schema";
import { requireCaseRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const trackingId = searchParams.get("trackingId")?.trim().toUpperCase();
  const projectId = searchParams.get("projectId")?.trim();

  if (trackingId) {
    const [record] = await db
      .select({
        trackingId: publicVerifications.trackingId,
        projectId: publicVerifications.projectId,
        workName: projects.workName,
        district: projects.district,
        state: projects.state,
        category: publicVerifications.category,
        comment: publicVerifications.comment,
        stateStatus: publicVerifications.state,
        officialResponse: publicVerifications.officialResponse,
        createdAt: publicVerifications.createdAt,
        updatedAt: publicVerifications.updatedAt,
      })
      .from(publicVerifications)
      .leftJoin(projects, eq(projects.id, publicVerifications.projectId))
      .where(eq(publicVerifications.trackingId, trackingId));

    if (!record) {
      return NextResponse.json({ error: "Verification Tracking ID not found." }, { status: 404 });
    }
    return NextResponse.json({ verification: record });
  }

  const listSession = await requireCaseRole();
  if (!listSession.permitted) {
    return NextResponse.json({ error: "Verification listings are restricted to authorized government roles." }, { status: 403 });
  }

  if (projectId) {
    const records = await db
      .select({
        trackingId: publicVerifications.trackingId,
        category: publicVerifications.category,
        stateStatus: publicVerifications.state,
        createdAt: publicVerifications.createdAt,
      })
      .from(publicVerifications)
      .where(eq(publicVerifications.projectId, projectId))
      .limit(20);
    return NextResponse.json({ verifications: records });
  }

  const recent = await db
    .select({
      trackingId: publicVerifications.trackingId,
      projectId: publicVerifications.projectId,
      workName: projects.workName,
      district: projects.district,
      category: publicVerifications.category,
      stateStatus: publicVerifications.state,
      createdAt: publicVerifications.createdAt,
    })
    .from(publicVerifications)
    .leftJoin(projects, eq(projects.id, publicVerifications.projectId))
    .orderBy(publicVerifications.createdAt)
    .limit(30);

  return NextResponse.json({ verifications: recent });
}

export async function POST(request: NextRequest) {
  const input = (await request.json().catch(() => null)) as {
    projectId?: string;
    category?: string;
    comment?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  } | null;

  if (!input?.projectId || !input.category) {
    return NextResponse.json({ error: "Project ID and issue category are mandatory." }, { status: 400 });
  }

  if (input.comment && input.comment.length > 1000) {
    return NextResponse.json({ error: "Comment must be 1,000 characters or fewer." }, { status: 400 });
  }

  // Generate official-style tracking ID
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const trackingId = `VRF-IN-2026-${randSuffix}`;
  const citizenHash = `anon_${Math.random().toString(36).substring(2, 12)}`;

  await db.insert(publicVerifications).values({
    trackingId,
    projectId: input.projectId.trim().toUpperCase(),
    category: input.category,
    comment: input.comment?.trim() || null,
    latitude: Number.isFinite(input.latitude) ? String(input.latitude) : null,
    longitude: Number.isFinite(input.longitude) ? String(input.longitude) : null,
    locationAccuracy: Number.isFinite(input.accuracy) ? Math.round(Number(input.accuracy)) : null,
    citizenHash,
    state: "Received",
  });

  await db.insert(auditLogs).values({
    actor: "citizen-public-portal",
    action: "PUBLIC_VERIFICATION_SIGNAL_SUBMITTED",
    entityType: "public_verification",
    entityId: trackingId,
    newValue: { projectId: input.projectId, category: input.category },
    reason: "Citizen verification signal registered. PII minimized. No public identity retained.",
  });

  return NextResponse.json(
    {
      ok: true,
      trackingId,
      message: `Your public verification signal has been successfully registered under Tracking ID: ${trackingId}. An authorized district quality officer will review the evidence.`,
    },
    { status: 201 }
  );
}
