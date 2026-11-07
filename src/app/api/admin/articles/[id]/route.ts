import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { hasAdminPermission } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { ArticleModel } from "@/lib/models";
import { articleInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("articles_write");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Article not found." }, { status: 404 });
    }
    const input = articleInputSchema.parse(await request.json());
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
    const canPublish = hasAdminPermission(session.role, "articles_publish");
    const status = input.status === "published" && !canPublish ? "pending_approval" : input.status;
    await connectToDatabase();
    const existing = await ArticleModel.findById(id).select("status publishedAt");
    if (!existing) return NextResponse.json({ error: "Article not found." }, { status: 404 });
    const article = await ArticleModel.findByIdAndUpdate(
      id,
      {
        ...input,
        status,
        publishedAt:
          status !== "published"
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
  const denied = await requireAdminPermission("articles_delete");
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
