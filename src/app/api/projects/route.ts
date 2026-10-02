import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, projects, riskScores } from "@/db/schema";
import { listProjectsFiltered, validateProjectInput } from "@/lib/nigrani";
import { getSession, isCitizen, requireWriteRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  // Backend scope enforcement: scoped government roles only see their state.
  const state = session.authenticated && !isCitizen(session.role) && session.scope.state ? session.scope.state : undefined;

  const rows = await listProjectsFiltered({ query, status, state });
  const result = isCitizen(session.role)
    ? rows.map((row) => ({
        id: row.id,
        workName: row.workName,
        state: row.state,
        district: row.district,
        constituency: row.constituency,
        sector: row.sector,
        status: row.status,
        physicalProgress: row.physicalProgress,
        sanctionedAmount: row.sanctionedAmount,
        latitude: row.latitude,
        longitude: row.longitude,
        sourceLabel: "Public project record",
      }))
    : rows;

  return NextResponse.json({
    rows: result,
    sourceLabel: "Synthetic demonstration data",
    scoped: Boolean(state),
    scope: session.scope,
  });
}

export async function POST(request: NextRequest) {
  const session = await requireWriteRole();
  if (!session.permitted) return NextResponse.json({ error: "An authorized officer role is required." }, { status: 403 });
  const parsed = validateProjectInput(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const item = parsed.data;
  try {
    await db.insert(projects).values({
      id: String(item.id).trim().toUpperCase(), workName: String(item.workName).trim(), state: String(item.state).trim(), district: String(item.district).trim(), sector: String(item.sector).trim(),
      constituency: typeof item.constituency === "string" ? item.constituency : null, status: typeof item.status === "string" ? item.status : "Unknown", sanctionedAmount: item.sanctionedAmount ? String(item.sanctionedAmount) : null,
      expenditureAmount: item.expenditureAmount ? String(item.expenditureAmount) : null, physicalProgress: item.physicalProgress !== undefined ? Number(item.physicalProgress) : null, financialProgress: item.financialProgress !== undefined ? Number(item.financialProgress) : null,
      dataQualityScore: 45, verificationStatus: "Insufficient evidence", recordKind: "manual", sourceId: "synthetic-mvp", sourceRecordId: `MANUAL-${Date.now()}`, sourceDocument: "Manually entered — requires an approved source attachment", rawRecord: item, normalizedRecord: { normalizedBy: session.role }, derivedRecord: { validation: "manual intake" },
    });
    await db.insert(riskScores).values({ projectId: String(item.id).trim().toUpperCase(), score: 0, evidenceConfidence: 0, classification: "Insufficient evidence", recommendation: "Attach authorized source records and complete validation.", modelVersion: "NIG-RISK-0.9-demo" });
    await db.insert(auditLogs).values({ actor: session.role, action: "create", entityType: "project", entityId: String(item.id).trim().toUpperCase(), newValue: item, reason: "Manual project intake" });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Project ID already exists or the record could not be saved." }, { status: 409 });
  }
}
