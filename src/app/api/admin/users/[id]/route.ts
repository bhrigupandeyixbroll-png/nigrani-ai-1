import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { requireAdminLevel, requireSuperAdmin, roles } from "@/lib/auth";
import { ensureDemoUsers } from "@/lib/nigrani";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminLevel();
  if (!session.permitted) return NextResponse.json({ error: "Access restricted to administrators." }, { status: 403 });
  await ensureDemoUsers();

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    role?: string;
    name?: string;
    state?: string;
    district?: string;
    active?: boolean;
  } | null;

  const [before] = await db.select().from(users).where(eq(users.id, id));
  if (!before) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (body?.role && body.role !== before.role) {
    const superAdminSession = await requireSuperAdmin();
    if (!superAdminSession.permitted) {
      return NextResponse.json({ error: "Only a Super Admin can reassign roles." }, { status: 403 });
    }
    if (!roles.includes(body.role as (typeof roles)[number])) {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 });
    }
  }
  if (body?.active !== undefined && body.active !== before.active) {
    const superAdminSession = await requireSuperAdmin();
    if (!superAdminSession.permitted) {
      return NextResponse.json({ error: "Only a Super Admin can deactivate users." }, { status: 403 });
    }
  }

  const update = {
    name: body?.name?.trim() ?? before.name,
    role: body?.role ?? before.role,
    state: body?.state !== undefined ? (body.state?.trim() || null) : before.state,
    district: body?.district !== undefined ? (body.district?.trim() || null) : before.district,
    active: body?.active ?? before.active,
  };

  await db.update(users).set(update).where(eq(users.id, id));
  await db.insert(auditLogs).values({
    actor: session.role,
    action: "USER_UPDATED",
    entityType: "users",
    entityId: before.email,
    oldValue: { name: before.name, role: before.role, active: before.active },
    newValue: { name: update.name, role: update.role, active: update.active },
    reason: "User record updated.",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await requireSuperAdmin();
  if (!session.permitted) return NextResponse.json({ error: "Only a Super Admin can remove users." }, { status: 403 });
  await ensureDemoUsers();

  const { id } = await context.params;
  const [before] = await db.select().from(users).where(eq(users.id, id));
  if (!before) return NextResponse.json({ error: "User not found." }, { status: 404 });

  await db.delete(users).where(eq(users.id, id));
  await db.insert(auditLogs).values({
    actor: session.role,
    action: "USER_DELETED",
    entityType: "users",
    entityId: before.email,
    oldValue: { name: before.name, role: before.role },
    reason: "User account removed by Super Admin.",
  });

  return NextResponse.json({ ok: true });
}
