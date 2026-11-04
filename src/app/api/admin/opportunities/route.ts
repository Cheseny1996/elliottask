import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { OpportunityModel } from "@/lib/models";
import { opportunityInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
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
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const input = opportunityInputSchema.parse(await request.json());
    await connectToDatabase();
    const opportunity = await OpportunityModel.create({
      ...input,
      publishedAt: input.status === "Open" ? new Date() : null,
    });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
