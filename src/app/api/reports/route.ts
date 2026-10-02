import { NextRequest, NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { assets, evidenceItems, investigationCases, projects, publicVerifications, riskScores, riskSignals, satelliteObservations } from "@/db/schema";
import { ensureDemoData, formatInrCurrency, getProjectFullDetail } from "@/lib/nigrani";
import { requireGovernment } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireGovernment();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to authorized government roles." }, { status: 403 });
  await ensureDemoData();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "project";
  const projectId = searchParams.get("projectId") || "NIG-DEMO-001";
  const format = searchParams.get("format") || "json";

  if (type === "district") {
    const rows = await db
      .select({
        district: projects.district,
        state: projects.state,
        count: sql<number>`count(*)::int`,
        highRisk: sql<number>`count(*) filter (where ${riskScores.score} >= 70)::int`,
        sanctioned: sql<string>`coalesce(sum(${projects.sanctionedAmount}),0)`,
        spent: sql<string>`coalesce(sum(${projects.expenditureAmount}),0)`,
        avgRisk: sql<number>`round(avg(${riskScores.score}))::int`,
        avgQuality: sql<number>`round(avg(${projects.dataQualityScore}))::int`,
      })
      .from(projects)
      .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
      .groupBy(projects.district, projects.state)
      .orderBy(desc(sql`count(*) filter (where ${riskScores.score} >= 70)`))
      .limit(30);

    const payload = {
      reportType: "District Summary",
      generatedAt: new Date().toISOString(),
      dataClassification: "Synthetic demonstration data",
      modelVersion: "NIG-RISK-2.4-IND",
      rows: rows.map((row) => ({
        ...row,
        sanctionedLabel: formatInrCurrency(row.sanctioned),
        spentLabel: formatInrCurrency(row.spent),
      })),
      provenance: {
        source: "NIGRANI synthetic MVP dataset",
        sourceType: "Derived analytics",
        datasetVersion: "NIGRANI-DATASET-V2026.1-IND",
      },
    };
    return respond(payload, format, "nigrani-district-summary");
  }

  const detail = await getProjectFullDetail(projectId);
  if (!detail) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const payload = {
    reportType:
      type === "satellite"
        ? "Satellite Evidence Report"
        : type === "financial"
          ? "Financial Intelligence Report"
          : type === "investigation"
            ? "Investigation Report"
            : type === "asset"
              ? "Asset Passport Report"
              : type === "evidence"
                ? "Evidence Report"
                : "Project Risk Report",
    generatedAt: new Date().toISOString(),
    dataClassification: detail.project.recordKind === "synthetic" ? "Synthetic demonstration data" : "Official source snapshot",
    modelVersion: detail.score?.modelVersion || "NIG-RISK-2.4-IND",
    project: {
      id: detail.project.id,
      workName: detail.project.workName,
      state: detail.project.state,
      district: detail.project.district,
      constituency: detail.project.constituency,
      sector: detail.project.sector,
      status: detail.project.status,
      sanctionedAmount: detail.project.sanctionedAmount,
      expenditureAmount: detail.project.expenditureAmount,
      physicalProgress: detail.project.physicalProgress,
      financialProgress: detail.project.financialProgress,
      sourceRecordId: detail.project.sourceRecordId,
      sourceTimestamp: detail.project.sourceTimestamp,
      dataQualityScore: detail.project.dataQualityScore,
      completenessScore: detail.project.completenessScore,
    },
    risk: detail.score,
    signals: detail.signals,
    evidence: detail.evidence,
    documents: detail.docs,
    satellite: detail.observations,
    cases: detail.cases,
    citizenSignals: detail.verifications,
    asset: detail.asset,
    disclaimer: "NIGRANI risk indicators are analytical signals and do not constitute findings of wrongdoing.",
    provenance: {
      source: detail.project.sourceId,
      sourceType: detail.project.recordKind,
      recordId: detail.project.sourceRecordId,
      datasetVersion: "NIGRANI-DATASET-V2026.1-IND",
    },
  };

  return respond(payload, format, `nigrani-${type}-report-${projectId}`);
}

function respond(payload: unknown, format: string, filename: string) {
  if (format === "csv") {
    const flat = flattenForCsv(payload);
    const headers = Object.keys(flat[0] || { value: "" });
    const csv = [headers.join(","), ...flat.map((row) => headers.map((h) => csvEscape(row[h])).join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}.csv\"`,
      },
    });
  }

  return NextResponse.json(payload);
}

function flattenForCsv(payload: any): Array<Record<string, string>> {
  if (payload?.rows && Array.isArray(payload.rows)) {
    return payload.rows.map((row: any) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, String(v ?? "")])));
  }
  return [
    {
      reportType: String(payload?.reportType ?? ""),
      projectId: String(payload?.project?.id ?? ""),
      workName: String(payload?.project?.workName ?? ""),
      riskScore: String(payload?.risk?.score ?? ""),
      evidenceConfidence: String(payload?.risk?.evidenceConfidence ?? ""),
      recommendation: String(payload?.risk?.recommendation ?? ""),
      dataClassification: String(payload?.dataClassification ?? ""),
      modelVersion: String(payload?.modelVersion ?? ""),
      generatedAt: String(payload?.generatedAt ?? ""),
    },
  ];
}

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) return `"${text.replaceAll("\"", "\"\"")}"`;
  return text;
}
