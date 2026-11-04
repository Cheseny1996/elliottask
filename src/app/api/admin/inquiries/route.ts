import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { InquiryModel } from "@/lib/models";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectToDatabase();
    const inquiries = await InquiryModel.find()
      .sort({ createdAt: -1 })
      .limit(250)
      .lean();
    return NextResponse.json({ inquiries });
  } catch (error) {
    return jsonError(error);
  }
}
