import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { hasAdminPermission } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { OpportunityModel } from "@/lib/models";
import { opportunityInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("opportunities_write");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
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
    const existing = await OpportunityModel.findById(id).select("status publishedAt");
    if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    const opportunity = await OpportunityModel.findByIdAndUpdate(
      id,
      {
        ...input,
        status,
        publishedAt: status !== "Open"
          ? null
          : existing.status === "Open"
            ? existing.publishedAt
            : new Date(),
      },
      { new: true, runValidators: true },
    );
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ opportunity });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("opportunities_delete");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    await connectToDatabase();
    const result = await OpportunityModel.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
