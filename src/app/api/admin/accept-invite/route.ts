import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { AdminInvitationModel, AdminStaffModel } from "@/lib/models";
import { checkRateLimit, requestAddress } from "@/lib/rate-limit";
import { adminInvitationAcceptanceSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!checkRateLimit(`admin-invite-accept:${requestAddress(request)}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  try {
    const input = adminInvitationAcceptanceSchema.parse(await request.json());
    await connectToDatabase();
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const acceptedAt = new Date();
    const invitation = await AdminInvitationModel.findOneAndUpdate(
      { tokenHash, acceptedAt: null, expiresAt: { $gt: acceptedAt } },
      { $set: { acceptedAt } },
      { new: true },
    );
    if (!invitation) {
      return NextResponse.json({ error: "This invitation is invalid, expired, or already used. Ask your Super Admin for a new one." }, { status: 410 });
    }

    try {
      const passwordHash = await bcrypt.hash(input.password, 12);
      const staff = await AdminStaffModel.create({
        name: input.name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
        status: "active",
        invitedBy: invitation.invitedBy,
      });
      return NextResponse.json({ ok: true, email: staff.email });
    } catch (error) {
      await AdminInvitationModel.updateOne({ _id: invitation._id, acceptedAt }, { $set: { acceptedAt: null } });
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
