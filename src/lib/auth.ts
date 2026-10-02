import { cookies } from "next/headers";

export const roles = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR", "CITIZEN", "Read-only"] as const;
export type Role = (typeof roles)[number];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OFFICIAL: "Official",
  AUDITOR: "Auditor",
  INVESTIGATOR: "Investigator",
  CITIZEN: "Citizen",
  "Read-only": "Read-only",
};

export type SessionScope = { state?: string | null; district?: string | null };

export type Session = {
  authenticated: boolean;
  role: Role;
  scope: SessionScope;
};

const SUPER_ONLY: Role[] = ["SUPER_ADMIN"];
const ADMIN_LEVEL: Role[] = ["SUPER_ADMIN", "ADMIN"];
const GOVERNMENT: Role[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR"];
const WRITE_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "INVESTIGATOR"];
const CASE_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR"];
const ANALYTICS_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR"];
const DATA_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN"];

export function isGovernment(role: Role): boolean {
  return GOVERNMENT.includes(role);
}

export function isCitizen(role: Role): boolean {
  return role === "CITIZEN" || role === "Read-only";
}

export async function getSession(): Promise<Session> {
  const store = await cookies();
  const rawRole = store.get("nigrani_role")?.value;
  const role: Role = rawRole && roles.includes(rawRole as Role) ? (rawRole as Role) : "Read-only";
  const scope: SessionScope = {
    state: store.get("nigrani_state")?.value || null,
    district: store.get("nigrani_district")?.value || null,
  };
  return {
    authenticated: role !== "Read-only",
    role,
    scope,
  };
}

function permitted(session: Session, allowed: Role[]): boolean {
  return session.authenticated && allowed.includes(session.role);
}

export async function requireRole(allowed: Role[]) {
  const session = await getSession();
  return { ...session, permitted: permitted(session, allowed) };
}

export async function requireSuperAdmin() {
  return requireRole(SUPER_ONLY);
}

export async function requireAdminLevel() {
  return requireRole(ADMIN_LEVEL);
}

export async function requireWriteRole() {
  return requireRole(WRITE_ROLES);
}

export async function requireCaseRole() {
  return requireRole(CASE_ROLES);
}

export async function requireGovernment() {
  return requireRole(GOVERNMENT);
}

export async function requireAnalyticsRole() {
  return requireRole(ANALYTICS_ROLES);
}

export async function requireDataRole() {
  return requireRole(DATA_ROLES);
}

// Legacy aliases kept for existing route imports
export async function requireAdminRole() {
  return requireAdminLevel();
}

export function canWrite(role: Role): boolean {
  return WRITE_ROLES.includes(role);
}

export function canAccessAdmin(role: Role): boolean {
  return ADMIN_LEVEL.includes(role);
}

/**
 * Backend project authorization. Government analysts with an explicit scope
 * are limited to that state/district; admins and un-scoped sessions can view all.
 */
export function canAccessProjectScope(session: Session, projectState?: string | null, projectDistrict?: string | null): boolean {
  if (session.role === "SUPER_ADMIN" || session.role === "ADMIN") return true;
  if (session.scope.state && projectState && session.scope.state !== projectState) return false;
  if (session.scope.district && projectDistrict && session.scope.district !== projectDistrict) return false;
  return true;
}

export const PERMISSION_MATRIX = {
  dashboard: GOVERNMENT.length ? ["SUPER_ADMIN", "ADMIN", "OFFICIAL", "AUDITOR", "INVESTIGATOR", "CITIZEN"] : [],
  nationalOverview: ADMIN_LEVEL,
  riskCenter: ANALYTICS_ROLES,
  financialIntelligence: ANALYTICS_ROLES,
  cases: CASE_ROLES,
  fieldVerification: WRITE_ROLES,
  dataImport: DATA_ROLES,
  governance: ADMIN_LEVEL,
  userManagement: ADMIN_LEVEL,
  roleAssignment: SUPER_ONLY,
  auditLogs: ADMIN_LEVEL,
} as const;
