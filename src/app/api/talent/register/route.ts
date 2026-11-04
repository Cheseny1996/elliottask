import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import { isTalentAuthConfigured } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TalentUserModel } from "@/lib/models";
import { checkRateLimit, requestAddress } from "@/lib/rate-limit";
import { talentRegistrationSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Talent account sign-up is not configured yet." }, { status: 503 });
  }

  const address = requestAddress(request);
  if (!checkRateLimit(`talent-register:${address}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many sign-up attempts. Please try again later." }, { status: 429 });
  }

  try {
    const body = talentRegistrationSchema.parse(await request.json());
    if (Buffer.byteLength(body.password, "utf8") > 72) {
      return NextResponse.json({ error: "Password must be 72 bytes or fewer." }, { status: 400 });
    }

    await connectToDatabase();
    const email = body.email.toLowerCase();
    const existing = await TalentUserModel.exists({ email });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists. Please sign in." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await TalentUserModel.create({
      name: body.name,
      email,
      passwordHash,
      privacyAcceptedAt: new Date(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json({ error: "Please check your name, email, password, and privacy consent." }, { status: 400 });
    }
    if (error instanceof Error && error.message.includes("MongoDB is not configured")) {
      return NextResponse.json(
        { error: "Sign-up is not configured yet. Please try again later." },
        { status: 503 },
      );
    }
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json({ error: "An account with that email already exists. Please sign in." }, { status: 409 });
    }
    console.error("elliottask talent sign-up failed:", error);
    return NextResponse.json({ error: "We could not create your account. Please try again later." }, { status: 500 });
  }
}
