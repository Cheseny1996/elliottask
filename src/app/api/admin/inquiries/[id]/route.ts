import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { InquiryModel } from "@/lib/models";

export const runtime = "nodejs";

const statusSchema = z.object({
  status: z.enum(["new", "in_review", "contacted", "closed"]),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("inquiries_manage");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Request not found." }, { status: 404 });
    }
    const { status } = statusSchema.parse(await request.json());
    await connectToDatabase();
    const inquiry = await InquiryModel.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true },
    );
    if (!inquiry) return NextResponse.json({ error: "Request not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
