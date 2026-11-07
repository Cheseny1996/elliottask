import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import type { AdminPermission } from "@/lib/admin-roles";
import { hasAdminPermission } from "@/lib/admin-roles";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  }
  return null;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  }
  if (!hasAdminPermission(session.role, permission)) {
    return NextResponse.json({ error: "Your department role does not allow this action." }, { status: 403 });
  }
  return null;
}

export function parseJson(request: Request) {
  return request.json() as Promise<unknown>;
}
