import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { ArticleModel } from "@/lib/models";
import { articleInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    await connectToDatabase();
    const articles = await ArticleModel.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ articles });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const input = articleInputSchema.parse(await request.json());
    await connectToDatabase();
    const article = await ArticleModel.create({
      ...input,
      publishedAt: input.status === "published" ? new Date() : null,
    });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
