import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, projects } from "@/db/schema";
import { getProjectFullDetail, validateProjectInput } from "@/lib/nigrani";
import { canAccessProjectScope, getSession, isCitizen, requireWriteRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

function serializePublicProject(detail: NonNullable<Awaited<ReturnType<typeof getProjectFullDetail>>>) {
  const p = detail.project;
  return {
    project: {
      id: p.id,
      workName: p.workName,
      state: p.state,
      district: p.district,
      constituency: p.constituency,
      sector: p.sector,
      status: p.status,
      physicalProgress: p.physicalProgress,
      sanctionedAmount: p.sanctionedAmount,
      latitude: p.latitude,
      longitude: p.longitude,
      sourceLabel: "Public project record",
    },
    publicEvidence: (detail.evidence ?? []).filter((e) =>
      ["Location", "Timeline"].includes(e.type)
    ),
    publicVerification: {
      count: (detail.verifications ?? []).length,
      statuses: (detail.verifications ?? []).slice(0, 6).map((v) => ({
        trackingId: v.trackingId,
        state: v.state,
        createdAt: v.createdAt,
      })),
    },
    disclaimer: "NIGRANI risk indicators are analytical signals and do not constitute findings of wrongdoing.",
  };
}

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await getSession();
  const detail = await getProjectFullDetail(id);
  if (!detail) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  if (isCitizen(session.role)) {
    return NextResponse.json(serializePublicProject(detail));
  }

  if (!canAccessProjectScope(session, detail.project.state, detail.project.district)) {
    return NextResponse.json({ error: "You do not have access to this project's jurisdiction." }, { status: 403 });
  }

  return NextResponse.json(detail);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireWriteRole();
  if (!session.permitted) return NextResponse.json({ error: "An authorized officer role is required." }, { status: 403 });
  const { id } = await context.params;
  const parsed = validateProjectInput({ ...(await request.json().catch(() => null)), id });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const input = parsed.data;
  const [before] = await db.select().from(projects).where(eq(projects.id, id));
  if (!before) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  if (!canAccessProjectScope(session, before.state, before.district)) {
    return NextResponse.json({ error: "You do not have access to this project's jurisdiction." }, { status: 403 });
  }
  const update = {
    workName: String(input.workName), state: String(input.state), district: String(input.district), sector: String(input.sector),
    constituency: typeof input.constituency === "string" ? input.constituency : before.constituency, status: typeof input.status === "string" ? input.status : before.status,
    sanctionedAmount: input.sanctionedAmount !== undefined ? String(input.sanctionedAmount) : before.sanctionedAmount, expenditureAmount: input.expenditureAmount !== undefined ? String(input.expenditureAmount) : before.expenditureAmount,
    physicalProgress: input.physicalProgress !== undefined ? Number(input.physicalProgress) : before.physicalProgress, financialProgress: input.financialProgress !== undefined ? Number(input.financialProgress) : before.financialProgress,
    dataQualityScore: Math.min(100, (before.dataQualityScore ?? 0) + 2), normalizedRecord: { previous: before.normalizedRecord, updatedBy: session.role, updatedAt: new Date().toISOString() },
  };
  await db.update(projects).set(update).where(eq(projects.id, id));
  await db.insert(auditLogs).values({ actor: session.role, action: "update", entityType: "project", entityId: id, oldValue: before, newValue: update, reason: "Project record amendment" });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireWriteRole();
  if (!session.permitted || session.role !== "SUPER_ADMIN" && session.role !== "ADMIN") return NextResponse.json({ error: "Administrator role is required to archive a project." }, { status: 403 });
  const { id } = await context.params;
  const [before] = await db.select().from(projects).where(eq(projects.id, id));
  if (!before) return NextResponse.json({ error: "Project not found." }, { status: 404 });
  await db.delete(projects).where(eq(projects.id, id));
  await db.insert(auditLogs).values({ actor: session.role, action: "archive", entityType: "project", entityId: id, oldValue: before, reason: "Authorized archive" });
  return NextResponse.json({ ok: true });
}
