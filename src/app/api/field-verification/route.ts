import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { actions, auditLogs, inspections, investigationCases, projects } from "@/db/schema";
import { requireWriteRole } from "@/lib/auth";
import { ensureDemoData } from "@/lib/nigrani";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireWriteRole();
  if (!session.permitted) return NextResponse.json({ error: "Authorized officer role required for field verification." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    projectId?: string;
    caseId?: string;
    notes?: string;
    physicalCondition?: string;
    latitude?: number;
    longitude?: number;
    checklist?: Record<string, boolean | string>;
  } | null;

  if (!body?.projectId) return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  await ensureDemoData();

  const [project] = await db.select().from(projects).where(eq(projects.id, body.projectId));
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  let caseId = body.caseId;
  if (caseId) {
    const [existingCase] = await db.select().from(investigationCases).where(eq(investigationCases.id, caseId));
    if (!existingCase) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  } else {
    caseId = `CASE-FIELD-${Date.now().toString().slice(-8)}`;
    await db.insert(investigationCases).values({
      id: caseId,
      projectId: body.projectId,
      state: "Field verification",
      priority: "High",
      assignedTo: session.role,
      assignedOfficerRole: session.role,
      reason: "Field verification initiated from NIGRANI investigation workflow.",
      notes: body.notes?.slice(0, 2000) || null,
    });
  }

  const [inspection] = await db.insert(inspections).values({
    caseId,
    projectId: body.projectId,
    scheduledFor: new Date(),
    conductedBy: session.role,
    status: "Field observation recorded",
    gpsLatitude: Number.isFinite(body.latitude) ? String(body.latitude) : project.latitude,
    gpsLongitude: Number.isFinite(body.longitude) ? String(body.longitude) : project.longitude,
    physicalCondition: body.physicalCondition || "Observed",
    finding: body.notes?.slice(0, 2000) || "Field observation recorded. No automatic finding of wrongdoing.",
    checklistResults: body.checklist || {
      structureVisible: true,
      progressConsistent: false,
      publicAccessAvailable: true,
      geoTagCaptured: true,
    },
  }).returning();

  await db.update(investigationCases).set({
    state: "Field verification",
    notes: body.notes?.slice(0, 2000) || "Field observation recorded.",
    updatedAt: new Date(),
  }).where(eq(investigationCases.id, caseId));

  await db.insert(actions).values({
    caseId,
    actionType: "field_verification",
    detail: "Field observation recorded with GPS and checklist evidence.",
    actor: session.role,
  });
  await db.insert(auditLogs).values({
    actor: session.role,
    action: "FIELD_VERIFICATION_RECORDED",
    entityType: "inspection",
    entityId: inspection.id,
    newValue: {
      projectId: body.projectId,
      caseId,
      physicalCondition: body.physicalCondition || "Observed",
    },
    reason: "Authorized field verification evidence capture",
  });

  return NextResponse.json({
    ok: true,
    caseId,
    inspectionId: inspection.id,
    message: "Field observation recorded. This is not an automatic finding of wrongdoing.",
  }, { status: 201 });
}
