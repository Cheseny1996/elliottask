import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { ArticleModel } from "@/lib/models";
import { articleInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    const input = articleInputSchema.parse(await request.json());
    await connectToDatabase();
    const existing = await ArticleModel.findById(id).select("status publishedAt");
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    const article = await ArticleModel.findByIdAndUpdate(
      id,
      {
        ...input,
        publishedAt:
          input.status !== "published"
            ? null
            : existing.status === "published"
              ? existing.publishedAt
              : new Date(),
      },
      { new: true, runValidators: true },
    );
    if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    return NextResponse.json({ article });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    await connectToDatabase();
    const result = await ArticleModel.findByIdAndDelete(id);
    if (!result) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
