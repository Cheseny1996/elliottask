import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { isTalentAuthConfigured } from "@/auth";

export async function POST(request: Request) {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Talent account sign-up is not configured yet." }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request origin could not be verified." }, { status: 403 });
  }

  const cookieStore = await cookies();
  cookieStore.set("elliottask_talent_consent", "accepted", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.json({ ok: true });
}
