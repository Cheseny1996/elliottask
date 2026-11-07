import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { AdminStaffModel, OpportunityModel, TalentMatchModel, TalentUserModel } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("matches_invite");
  if (denied) return denied;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  if (!checkRateLimit(`talent-match-invite:${session.email}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many talent invitations. Try again later." }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Invitation email is not configured. Set RESEND_API_KEY and CONTACT_FROM_EMAIL." },
      { status: 503 },
    );
  }

  let claimedMatchId: string | null = null;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Match not found." }, { status: 404 });
    await connectToDatabase();

    const assignedManager = session.role === "super_admin"
      ? undefined
      : session.staffId;
    const claimed = await TalentMatchModel.findOneAndUpdate(
      {
        _id: id,
        status: "shortlisted",
        ...(assignedManager ? { projectManagerStaffId: assignedManager } : {}),
      },
      { $set: { status: "inviting" } },
      { new: true },
    );
    if (!claimed) {
      return NextResponse.json({ error: "This match is not available for your account to invite. It may already have an invitation in progress." }, { status: 409 });
    }
    claimedMatchId = String(claimed._id);

    const [talent, opportunity, manager] = await Promise.all([
      TalentUserModel.findById(claimed.talentUserId).select("name email"),
      OpportunityModel.findOne({ _id: claimed.opportunityId, status: "Open" }).select("title slug"),
      AdminStaffModel.findById(claimed.projectManagerStaffId).select("name"),
    ]);
    if (!talent || !opportunity || !manager) {
      await TalentMatchModel.updateOne({ _id: id, status: "inviting" }, { $set: { status: "shortlisted" } });
      return NextResponse.json({ error: "The matched talent, manager, or active opportunity is no longer available." }, { status: 409 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    const origin = siteUrl ? new URL(siteUrl) : new URL(request.url);
    if (!["http:", "https:"].includes(origin.protocol)) {
      await TalentMatchModel.updateOne({ _id: id, status: "inviting" }, { $set: { status: "shortlisted" } });
      return NextResponse.json({ error: "The site URL is invalid; invitation was not sent." }, { status: 503 });
    }
    const opportunityUrl = new URL(`/talent/jobs/${opportunity.slug}`, origin).toString();
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
      body: JSON.stringify({
        from,
        to: [talent.email],
        subject: `You’re invited to explore: ${opportunity.title}`,
        text: `Hello ${talent.name},\n\n${manager.name} from the elliottask project team would like to invite you to review this opportunity:\n\n${opportunity.title}\n${opportunityUrl}\n\nSign in to your talent account to review the role and decide whether you’re interested. This invitation is not an offer of employment or a guarantee of paid work. Confirm scope and compensation with the hiring team before accepting work.\n\nelliottask`,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      await TalentMatchModel.updateOne({ _id: id, status: "inviting" }, { $set: { status: "shortlisted" } });
      console.error("elliottask talent invitation email was rejected:", response.status);
      return NextResponse.json({ error: "The email provider could not send this invitation. Check its configuration and try again." }, { status: 502 });
    }

    await TalentMatchModel.updateOne(
      { _id: id, status: "inviting" },
      { $set: { status: "invited", invitedAt: new Date() } },
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (claimedMatchId) {
      try {
        await TalentMatchModel.updateOne(
          { _id: claimedMatchId, status: "inviting" },
          { $set: { status: "shortlisted" } },
        );
      } catch (rollbackError) {
        console.error("Could not release a talent match after an invitation error:", rollbackError);
      }
    }
    return jsonError(error);
  }
}
