import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { investigationCases, projects, riskScores } from "@/db/schema";
import { ensureDemoData } from "@/lib/nigrani";
import { requireCaseRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireCaseRole();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to authorized case roles." }, { status: 403 });
  await ensureDemoData();
  const { searchParams } = new URL(request.url);
  const priority = searchParams.get("priority");
  const state = searchParams.get("state");

  const rows = await db
    .select({
      id: investigationCases.id,
      projectId: investigationCases.projectId,
      workName: projects.workName,
      stateName: projects.state,
      district: projects.district,
      sector: projects.sector,
      caseState: investigationCases.state,
      priority: investigationCases.priority,
      assignedTo: investigationCases.assignedTo,
      reason: investigationCases.reason,
      notes: investigationCases.notes,
      riskScore: riskScores.score,
      evidenceConfidence: riskScores.evidenceConfidence,
      updatedAt: investigationCases.updatedAt,
    })
    .from(investigationCases)
    .leftJoin(projects, eq(projects.id, investigationCases.projectId))
    .leftJoin(riskScores, eq(riskScores.projectId, investigationCases.projectId))
    .orderBy(desc(riskScores.score), desc(investigationCases.updatedAt))
    .limit(100);

  const filtered = rows.filter((row) => {
    if (priority && priority !== "All" && row.priority !== priority) return false;
    if (state && state !== "All" && row.caseState !== state) return false;
    return true;
  });

  return NextResponse.json({
    cases: filtered,
    counts: {
      total: filtered.length,
      critical: filtered.filter((c) => c.priority === "Critical").length,
      high: filtered.filter((c) => c.priority === "High").length,
      open: filtered.filter((c) => !["Resolved", "Closed"].includes(c.caseState || "")).length,
    },
    sourceLabel: "Synthetic demonstration workflow data",
  });
}

export async function POST(request: NextRequest) {
  const session = await requireCaseRole();
  if (!session.permitted) return NextResponse.json({ error: "Authorized officer role required." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as {
    projectId?: string;
    reason?: string;
    priority?: string;
    assignedTo?: string;
  } | null;
  if (!body?.projectId || !body.reason) return NextResponse.json({ error: "projectId and reason are required." }, { status: 400 });

  await ensureDemoData();
  const [project] = await db.select().from(projects).where(eq(projects.id, body.projectId));
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const id = `CASE-IND-${Date.now().toString().slice(-8)}`;
  await db.insert(investigationCases).values({
    id,
    projectId: body.projectId,
    state: "Alert",
    priority: body.priority || "High",
    assignedTo: body.assignedTo || `${session.role} desk`,
    assignedOfficerRole: session.role,
    reason: body.reason.slice(0, 2000),
    notes: "Case created from NIGRANI investigation workspace.",
  });

  return NextResponse.json({ ok: true, id }, { status: 201 });
}
