import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { InquiryModel } from "@/lib/models";

export const runtime = "nodejs";

const messageSchema = z.object({
  subject: z.string().trim().min(5).max(160),
  body: z.string().trim().min(20).max(4000),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Outbound email is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL." },
      { status: 503 },
    );
  }

  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const input = messageSchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await InquiryModel.findById(id).select("name email");
    if (!inquiry) return NextResponse.json({ error: "Request not found." }, { status: 404 });

    const providerResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [inquiry.email],
        subject: input.subject,
        text: `Hello ${inquiry.name},\n\n${input.body}\n\nelliottask`,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!providerResponse.ok) {
      console.error("elliottask email provider rejected a message:", providerResponse.status);
      return NextResponse.json(
        { error: "The email provider could not send this message. Check its configuration and try again." },
        { status: 502 },
      );
    }

    const sentAt = new Date();
    await InquiryModel.updateOne(
      { _id: id },
      {
        $set: { status: "contacted" },
        $push: { replies: { $each: [{ ...input, sentAt }], $slice: -20 } },
      },
    );
    return NextResponse.json({ ok: true, sentAt });
  } catch (error) {
    return jsonError(error);
  }
}
