import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { getSession, isGovernment, roles } from "@/lib/auth";
import { ensureDemoUsers } from "@/lib/nigrani";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  return NextResponse.json(session);
}

export async function POST(request: NextRequest) {
  await ensureDemoUsers();
  const body = (await request.json().catch(() => null)) as { role?: string; state?: string; district?: string } | null;
  const role = body?.role;
  if (!role || !roles.includes(role as (typeof roles)[number]) || role === "Read-only") {
    return NextResponse.json({ error: "Select a valid role." }, { status: 400 });
  }

  const prior = await getSession();
  const state = isGovernment(role as (typeof roles)[number]) ? (body?.state?.trim() || null) : null;
  const district = isGovernment(role as (typeof roles)[number]) ? (body?.district?.trim() || null) : null;

  const response = NextResponse.json({
    ok: true,
    role,
    authenticated: true,
    scope: { state, district },
  });

  response.cookies.set("nigrani_role", role, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  if (state) response.cookies.set("nigrani_state", state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  else response.cookies.set("nigrani_state", "", { httpOnly: true, expires: new Date(0), path: "/" });
  if (district) response.cookies.set("nigrani_district", district, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
  else response.cookies.set("nigrani_district", "", { httpOnly: true, expires: new Date(0), path: "/" });

  await db.insert(auditLogs).values({
    actor: role,
    action: prior.authenticated ? "ROLE_CHANGED" : "SIGN_IN",
    entityType: "auth",
    entityId: role,
    oldValue: prior.authenticated ? { role: prior.role } : null,
    newValue: { role, state: state ?? null, district: district ?? null },
    reason: "Authorized session established for demonstration access control.",
  });

  return response;
}

export async function DELETE() {
  const prior = await getSession();
  const response = NextResponse.json({ ok: true });
  response.cookies.set("nigrani_role", "", { httpOnly: true, expires: new Date(0), path: "/" });
  response.cookies.set("nigrani_state", "", { httpOnly: true, expires: new Date(0), path: "/" });
  response.cookies.set("nigrani_district", "", { httpOnly: true, expires: new Date(0), path: "/" });

  await db.insert(auditLogs).values({
    actor: prior.role,
    action: "SIGN_OUT",
    entityType: "auth",
    entityId: prior.role,
    oldValue: { role: prior.role },
    newValue: { role: "Read-only" },
    reason: "Session cleared.",
  });

  return response;
}
