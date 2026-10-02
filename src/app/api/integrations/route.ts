import { NextResponse } from "next/server";
import { db } from "@/db";
import { dataSources } from "@/db/schema";
import { ensureDemoData } from "@/lib/nigrani";
import { requireAdminLevel } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminLevel();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to administrators." }, { status: 403 });
  await ensureDemoData();
  const sources = await db.select().from(dataSources);
  return NextResponse.json({ sources, note: "Connector status reflects configured credentials and approved access only." });
}
