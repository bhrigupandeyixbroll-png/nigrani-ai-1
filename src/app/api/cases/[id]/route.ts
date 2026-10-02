import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { actions, auditLogs, investigationCases } from "@/db/schema";
import { requireCaseRole } from "@/lib/auth";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireCaseRole();
  if (!session.permitted) return NextResponse.json({ error: "An authorized officer role is required." }, { status: 403 });
  const { id } = await context.params;
  const input = await request.json().catch(() => null) as { state?: string; notes?: string; priority?: string } | null;
  const allowed = ["Alert", "Assigned", "Desk review", "Field verification", "Finding", "Resolved", "Escalated"];
  if (!input?.state || !allowed.includes(input.state)) return NextResponse.json({ error: "Choose a valid workflow state." }, { status: 400 });
  const [before] = await db.select().from(investigationCases).where(eq(investigationCases.id, id));
  if (!before) return NextResponse.json({ error: "Case not found." }, { status: 404 });
  const update = { state: input.state, notes: input.notes?.slice(0, 2000) ?? before.notes, priority: input.priority ?? before.priority, updatedAt: new Date() };
  await db.update(investigationCases).set(update).where(eq(investigationCases.id, id));
  await db.insert(actions).values({ caseId: id, actionType: "workflow_transition", detail: `${before.state} → ${input.state}`, actor: session.role });
  await db.insert(auditLogs).values({ actor: session.role, action: "update", entityType: "investigation_case", entityId: id, oldValue: before, newValue: update, reason: "Workflow update" });
  return NextResponse.json({ ok: true });
}
