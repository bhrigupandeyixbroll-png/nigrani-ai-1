import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  investigationCases,
  projects,
  publicVerifications,
  riskScores,
  riskSignals,
  satelliteObservations,
} from "@/db/schema";
import { formatInrCurrency } from "@/lib/nigrani";
import { requireGovernment } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await requireGovernment();
  if (!session.permitted) return NextResponse.json({ error: "NIGRANI Copilot is available to authorized government roles." }, { status: 403 });
  const body = (await request.json().catch(() => null)) as { query?: string; projectId?: string } | null;
  const userQuery = body?.query?.trim() || "";
  const projectId = body?.projectId?.trim();

  if (!userQuery) {
    return NextResponse.json({ error: "Please enter an intelligence question." }, { status: 400 });
  }

  const qLower = userQuery.toLowerCase();

  // If asking about a specific project or NIG-DEMO-001
  const targetId = projectId || (userQuery.match(/NIG-[A-Z0-9-]+/i)?.[0]?.toUpperCase());

  if (targetId) {
    const [proj] = await db.select().from(projects).where(eq(projects.id, targetId));
    if (proj) {
      const [score] = await db.select().from(riskScores).where(eq(riskScores.projectId, targetId));
      const signals = await db.select().from(riskSignals).where(eq(riskSignals.projectId, targetId));
      const [sat] = await db.select().from(satelliteObservations).where(eq(satelliteObservations.projectId, targetId));
      const cases = await db.select().from(investigationCases).where(eq(investigationCases.projectId, targetId));
      const verifs = await db.select().from(publicVerifications).where(eq(publicVerifications.projectId, targetId));

      let answerText = "";
      const citations = [
        { id: proj.sourceRecordId || "SOURCE-MPLADS", type: "Official Sanction Record", date: "FY 2024-2025" },
        { id: score ? `MODEL-${score.modelVersion}` : "NIG-RISK-2.4", type: "Risk Engine Signal", date: "2026-03-01" },
      ];

      if (qLower.includes("why") || qLower.includes("risk") || qLower.includes("flag")) {
        answerText = `Project **${proj.workName}** (${proj.id}) in **${proj.district}, ${proj.state}** has a Risk Score of **${score?.score || 0}/100** (${score?.classification || "Monitor"}) with Evidence Confidence of **${score?.evidenceConfidence || 0}/100**.\n\n**Key Risk Contributors:**\n` +
          signals.map((s) => `• **${s.dimension} (+${s.contribution})**: ${s.explanation} (Rule: \`${s.ruleReference}\`)`).join("\n") +
          `\n\n**Financial Analysis:**\n• Sanctioned: ${formatInrCurrency(proj.sanctionedAmount)}\n• Recorded Expenditure: ${formatInrCurrency(proj.expenditureAmount)} (${proj.financialProgress}% drawn)\n• Physical Progress Reported: ${proj.physicalProgress}%\n\n**Recommended Action:** ${score?.recommendation || "Conduct authorized field verification."}`;
      } else if (qLower.includes("satellite") || qLower.includes("sentinel") || qLower.includes("imagery")) {
        if (sat) {
          citations.push({ id: sat.sceneId || "S2B_MSIL2A", type: "Copernicus Sentinel-2", date: "2026-02-24" });
          answerText = `**Satellite Observation Summary for ${proj.id}:**\n• **Provider**: ${sat.provider}\n• **Acquisition Date**: 24 Feb 2026 (Scene: \`${sat.sceneId}\`)\n• **Cloud Cover**: ${sat.cloudCover}%\n• **Spectral Indices**: NDVI = ${sat.ndviValue}, NDWI = ${sat.ndwiValue}\n• **Interpretation**: ${sat.corroborationStatus}\n\n*Note: Satellite evidence is corroborative and is combined with ground inspections for authorized verification.*`;
        } else {
          answerText = `No direct satellite scene is stored for ${proj.id}. Use the **Check with Satellite** feature to query Copernicus Sentinel-2 L2A for coordinates ${proj.latitude}, ${proj.longitude}.`;
        }
      } else if (qLower.includes("citizen") || qLower.includes("public") || qLower.includes("verif")) {
        answerText = `**Public Verification Activity for ${proj.id}:**\n• Total Citizen Signals Received: **${verifs.length}**\n` +
          (verifs.length > 0
            ? verifs.map((v) => `• Tracking ID \`${v.trackingId}\`: "${v.category}" — *Status: ${v.state}* (${v.comment || "No comment"})`).join("\n")
            : "• No public verification signals registered yet for this project.") +
          `\n\n*All citizen reports are treated as analytical verification signals for district officers.*`;
      } else {
        answerText = `**Project Dossier: ${proj.workName} (${proj.id})**\n• **Location**: ${proj.district}, ${proj.state} (${proj.constituency})\n• **Sanctioned Amount**: ${formatInrCurrency(proj.sanctionedAmount)}\n• **Recorded Expenditure**: ${formatInrCurrency(proj.expenditureAmount)}\n• **Physical Progress**: ${proj.physicalProgress}%\n• **Current Status**: ${proj.status}\n• **Risk Score**: ${score?.score || 0}/100\n• **Open Cases**: ${cases.length > 0 ? cases[0].id + " (" + cases[0].state + ")" : "None"}\n• **Recommended Next Step**: ${score?.recommendation}`;
      }

      return NextResponse.json({
        answer: answerText,
        projectId: proj.id,
        workName: proj.workName,
        confidence: score?.evidenceConfidence || 85,
        citations,
        sourceTimestamp: new Date().toISOString(),
      });
    }
  }

  // General or District-level queries
  if (qLower.includes("district") || qLower.includes("highest") || qLower.includes("backlog")) {
    const highRiskDistricts = await db
      .select({
        district: projects.district,
        state: projects.state,
        count: sql<number>`count(*)::int`,
        highRisk: sql<number>`count(*) filter (where ${riskScores.score} >= 70)::int`,
        avgRisk: sql<number>`round(avg(${riskScores.score}))::int`,
      })
      .from(projects)
      .leftJoin(riskScores, eq(riskScores.projectId, projects.id))
      .groupBy(projects.district, projects.state)
      .orderBy(desc(sql`count(*) filter (where ${riskScores.score} >= 70)`))
      .limit(5);

    const answerText = `**Top Districts with Priority Verification Signals:**\n` +
      highRiskDistricts
        .map(
          (d, idx) =>
            `${idx + 1}. **${d.district}** (${d.state}): **${d.highRisk}** high-risk signals out of ${d.count} projects (Avg Risk Score: ${d.avgRisk}/100)`
        )
        .join("\n") +
      `\n\n*Data is aggregated from the active NIGRANI national development database.*`;

    return NextResponse.json({
      answer: answerText,
      confidence: 94,
      citations: [{ id: "NIGRANI-AGG-DISTRICT", type: "District Risk Rollup", date: "2026-03-01" }],
      sourceTimestamp: new Date().toISOString(),
    });
  }

  // Fallback grounded summary
  const [totals] = await db
    .select({
      total: sql<number>`count(*)::int`,
      highRisk: sql<number>`count(*) filter (where ${riskScores.score} >= 70)::int`,
      totalSanctioned: sql<string>`coalesce(sum(${projects.sanctionedAmount}), 0)`,
    })
    .from(projects)
    .leftJoin(riskScores, eq(riskScores.projectId, projects.id));

  return NextResponse.json({
    answer: `NIGRANI AI is currently monitoring **${totals.total}** public-development projects across India with a total sanctioned value of **${formatInrCurrency(totals.totalSanctioned)}**.\n\n• **${totals.highRisk}** projects have been flagged with potential inconsistencies (Risk Score ≥ 70/100) requiring authorized human review.\n\nYou can ask about specific projects (e.g. \`NIG-DEMO-001\`), district risk rankings, satellite verification methods, or financial vs progress anomalies.`,
    confidence: 90,
    citations: [{ id: "NIGRANI-DATASET-V2026.1-IND", type: "Nationwide Corpus Snapshot", date: "2026-03-01" }],
    sourceTimestamp: new Date().toISOString(),
  });
}
