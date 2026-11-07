import { randomBytes, createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { adminRoleLabels } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { AdminInvitationModel, AdminStaffModel } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { adminInvitationInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  if (session.role !== "super_admin") return NextResponse.json({ error: "Only the Super Admin can manage staff." }, { status: 403 });

  try {
    await connectToDatabase();
    const [staff, invitations] = await Promise.all([
      AdminStaffModel.find().select("-passwordHash").sort({ createdAt: -1 }).lean(),
      AdminInvitationModel.find({ acceptedAt: null, expiresAt: { $gt: new Date() } })
        .select("email role expiresAt createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);
    return NextResponse.json({
      staff: staff.map(({ _id, name, email, role, status, lastLoginAt, createdAt }) => ({
        id: String(_id), name, email, role, status, lastLoginAt, createdAt,
      })),
      invitations: invitations.map(({ _id, email, role, expiresAt, createdAt }) => ({
        id: String(_id), email, role, expiresAt, createdAt,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  if (session.role !== "super_admin") return NextResponse.json({ error: "Only the Super Admin can invite staff." }, { status: 403 });
  if (!checkRateLimit(`admin-invite:${session.email}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many invitations. Try again later." }, { status: 429 });
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Email invitations are not configured. Add RESEND_API_KEY and a verified CONTACT_FROM_EMAIL in Vercel, then redeploy." },
      { status: 503 },
    );
  }

  try {
    const input = adminInvitationInputSchema.parse(await request.json());
    const email = input.email.toLowerCase();
    const rootEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (email === rootEmail) {
      return NextResponse.json({ error: "The configured Super Admin account cannot be invited as staff." }, { status: 409 });
    }
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = siteUrl ? new URL(siteUrl) : new URL(request.url);
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) {
      return NextResponse.json({ error: "The site URL is invalid; invitation was not created." }, { status: 503 });
    }

    await connectToDatabase();
    if (await AdminStaffModel.exists({ email })) {
      return NextResponse.json({ error: "A staff account already exists for this email." }, { status: 409 });
    }
    await AdminInvitationModel.deleteMany({ email, acceptedAt: null });

    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await AdminInvitationModel.create({
      email,
      role: input.role,
      tokenHash,
      expiresAt,
      invitedBy: session.email,
    });

    const inviteUrl = new URL("/admin/accept-invite", origin);
    inviteUrl.searchParams.set("token", token);
    const emailConfigured = Boolean(apiKey && from);
    if (emailConfigured) {
      let emailResponse: Response;
      try {
        emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Your elliottask workspace invitation",
          text: `Hello ${input.name},\n\nYou have been invited to join the elliottask workspace as ${adminRoleLabels[input.role]}.\n\nAccept your single-use invitation within 48 hours:\n${inviteUrl.toString()}\n\nIf you were not expecting this invitation, you can ignore this message.`,
        }),
          signal: AbortSignal.timeout(10000),
        });
      } catch (emailError) {
        try {
          await AdminInvitationModel.deleteOne({ tokenHash });
        } catch (cleanupError) {
          console.error("Could not remove a staff invitation after email delivery failed:", cleanupError);
        }
        console.error("elliottask staff invitation email delivery failed:", emailError);
        return NextResponse.json({ error: "The invitation email could not be delivered. Try again." }, { status: 502 });
      }
      if (!emailResponse.ok) {
        await AdminInvitationModel.deleteOne({ tokenHash });
        console.error("elliottask staff invitation email was rejected:", emailResponse.status);
        return NextResponse.json({ error: "The invitation email could not be sent. Check the email configuration and try again." }, { status: 502 });
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent: true,
      expiresAt,
    }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
