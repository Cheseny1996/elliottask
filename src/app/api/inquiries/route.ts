import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { InquiryModel } from "@/lib/models";
import { checkRateLimit, requestAddress } from "@/lib/rate-limit";
import { inquiryInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const address = requestAddress(request);
  if (!checkRateLimit(`inquiry:${address}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  try {
    const body = inquiryInputSchema.parse(await request.json());
    if (body.website) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    await connectToDatabase();
    await InquiryModel.create({
      kind: body.kind,
      name: body.name,
      email: body.email,
      company: body.company,
      subject: body.subject,
      message: body.message,
      opportunity: body.opportunity,
      privacyAccepted: body.privacyAccepted,
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
