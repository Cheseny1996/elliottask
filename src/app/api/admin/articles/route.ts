import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { hasAdminPermission } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { ArticleModel } from "@/lib/models";
import { articleInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminPermission("articles_read");
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
  const denied = await requireAdminPermission("articles_write");
  if (denied) return denied;
  try {
    const input = articleInputSchema.parse(await request.json());
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
    const canPublish = hasAdminPermission(session.role, "articles_publish");
    const status = input.status === "published" && !canPublish ? "pending_approval" : input.status;
    await connectToDatabase();
    const article = await ArticleModel.create({
      ...input,
      status,
      publishedAt: status === "published" ? new Date() : null,
    });
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
