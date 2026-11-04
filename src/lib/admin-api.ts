import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  }
  return null;
}

export function parseJson(request: Request) {
  return request.json() as Promise<unknown>;
}
