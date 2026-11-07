import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { hasAdminPermission } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { OpportunityModel } from "@/lib/models";
import { opportunityInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminPermission("opportunities_read");
  if (denied) return denied;
  try {
    await connectToDatabase();
    const opportunities = await OpportunityModel.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ opportunities });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminPermission("opportunities_write");
  if (denied) return denied;
  try {
    const input = opportunityInputSchema.parse(await request.json());
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
    const canPublish = hasAdminPermission(session.role, "opportunities_publish");
    const status = canPublish
      ? input.status
      : input.status === "Draft"
        ? "Draft"
        : "Pending approval";
    await connectToDatabase();
    const opportunity = await OpportunityModel.create({
      ...input,
      status,
      publishedAt: status === "Open" ? new Date() : null,
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
