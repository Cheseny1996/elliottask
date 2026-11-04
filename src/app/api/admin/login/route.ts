import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminSession } from "@/lib/auth";
import { checkRateLimit, requestAddress } from "@/lib/rate-limit";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const address = requestAddress(request);
  if (!checkRateLimit(`admin-login:${address}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Try again in 15 minutes." },
      { status: 429 },
    );
  }

  try {
    const { email, password } = loginSchema.parse(await request.json());
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH;
    if (!adminEmail || !passwordHash || !process.env.SESSION_SECRET) {
      return NextResponse.json(
        { error: "Administrator access is not configured on this deployment." },
        { status: 503 },
      );
    }

    const passwordMatches = await bcrypt.compare(password, passwordHash);
    if (email.toLowerCase() !== adminEmail || !passwordMatches) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    await createAdminSession(adminEmail);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    }
    console.error("Elliottask admin sign-in failed:", error);
    return NextResponse.json(
      { error: "Sign-in could not be completed. Please try again later." },
      { status: 500 },
    );
  }
}
