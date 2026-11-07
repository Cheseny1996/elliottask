import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { adminRoleLabels, permissionsForAdminRole } from "@/lib/admin-roles";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    role: session.role,
    roleLabel: adminRoleLabels[session.role],
    permissions: permissionsForAdminRole(session.role),
  });
}
