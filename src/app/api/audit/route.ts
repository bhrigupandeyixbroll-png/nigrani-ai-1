import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { ensureDemoData } from "@/lib/nigrani";
import { requireAdminLevel } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await requireAdminLevel();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to administrators." }, { status: 403 });
  await ensureDemoData();
  const limit = Math.min(Number(new URL(request.url).searchParams.get("limit") || 50), 200);
  const rows = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
  return NextResponse.json({ rows, sourceLabel: "Persistent application audit trail" });
}
