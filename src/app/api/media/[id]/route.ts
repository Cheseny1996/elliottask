import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { MediaAssetModel } from "@/lib/models";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!isValidObjectId(id)) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  try {
    await connectToDatabase();
    const asset = await MediaAssetModel.findById(id).select("contentType data");
    if (!asset) return NextResponse.json({ error: "Image not found." }, { status: 404 });

    return new Response(new Uint8Array(asset.data), {
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
