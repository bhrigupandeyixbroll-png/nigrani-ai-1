import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdminLevel, requireSuperAdmin, roles } from "@/lib/auth";
import { ensureDemoUsers, listUsers } from "@/lib/nigrani";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireAdminLevel();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to administrators." }, { status: 403 });
  await ensureDemoUsers();
  return NextResponse.json({ users: await listUsers() });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminLevel();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to administrators." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    name?: string;
    email?: string;
    role?: string;
    state?: string;
    district?: string;
  } | null;

  if (!body?.name?.trim() || !body?.email?.trim() || !body?.role) {
    return NextResponse.json({ error: "Name, email and role are required." }, { status: 400 });
  }
  if (!roles.includes(body.role as (typeof roles)[number])) {
    return NextResponse.json({ error: "Invalid role." }, { status: 400 });
  }

  // Only Super Admin may create Super Admin or Admin accounts.
  if (["SUPER_ADMIN", "ADMIN"].includes(body.role) && session.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only a Super Admin can create privileged accounts." }, { status: 403 });
  }

  await ensureDemoUsers();
  try {
    await db.insert(users).values({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      role: body.role,
      state: body.state?.trim() || null,
      district: body.district?.trim() || null,
      active: true,
    });
  } catch {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  await db.insert(auditLogs).values({
    actor: session.role,
    action: "USER_CREATED",
    entityType: "users",
    entityId: body.email.trim().toLowerCase(),
    newValue: { role: body.role, state: body.state ?? null, district: body.district ?? null },
    reason: "User account created.",
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
