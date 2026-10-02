import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { ensureDemoData } from "@/lib/nigrani";
import { requireGovernment } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireGovernment();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to authorized government roles." }, { status: 403 });
  await ensureDemoData();
  const [row] = await db.select({
    total: sql<number>`count(*)::int`,
    avgQuality: sql<number>`round(avg(${projects.dataQualityScore}))::int`,
    avgCompleteness: sql<number>`round(avg(${projects.completenessScore}))::int`,
    avgConsistency: sql<number>`round(avg(${projects.consistencyScore}))::int`,
    avgFreshness: sql<number>`round(avg(${projects.freshnessScore}))::int`,
    withCoords: sql<number>`count(*) filter (where ${projects.latitude} is not null and ${projects.longitude} is not null)::int`,
    needsReview: sql<number>`count(*) filter (where ${projects.verificationStatus} = 'Needs Review')::int`,
    synthetic: sql<number>`count(*) filter (where ${projects.recordKind} = 'synthetic')::int`,
  }).from(projects);

  const geographicValidity = row.total ? Math.round((row.withCoords / row.total) * 100) : 0;
  const sourceReliability = row.synthetic === row.total ? 0 : Math.max(0, 100 - Math.round((row.synthetic / Math.max(row.total, 1)) * 100));

  return NextResponse.json({
    totals: row,
    scores: {
      dataQuality: row.avgQuality,
      completeness: row.avgCompleteness,
      consistency: row.avgConsistency,
      freshness: row.avgFreshness,
      geographicValidity,
      sourceReliability,
    },
    interpretation: [
      { metric: "Completeness", score: row.avgCompleteness, why: "Share of core identity, financial and status fields present across the corpus." },
      { metric: "Consistency", score: row.avgConsistency, why: "Cross-field agreement between progress, expenditure and status labels." },
      { metric: "Freshness", score: row.avgFreshness, why: "Relative recency of the snapshot timestamp used for the demonstration corpus." },
      { metric: "Geographic validity", score: geographicValidity, why: "Percentage of records with usable latitude/longitude values." },
      { metric: "Source reliability", score: sourceReliability, why: "Official-source weight. Synthetic demonstration records intentionally score low." },
    ],
    classification: "Synthetic demonstration data",
    disclaimer: "These scores describe data quality, not wrongdoing.",
  });
}
