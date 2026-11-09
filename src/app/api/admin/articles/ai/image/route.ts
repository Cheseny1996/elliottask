import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";
import { getAdminSession } from "@/lib/auth";
import { MediaAssetModel } from "@/lib/models";

export const runtime = "nodejs";

const imageRequestSchema = z.object({
  prompt: z.string().trim().min(20).max(2000),
  altText: z.string().trim().min(8).max(180),
});

export async function POST(request: Request) {
  const denied = await requireAdminPermission("articles_write");
  if (denied) return denied;

  try {
    const adminSession = await getAdminSession();
    if (!checkRateLimit(`admin-ai-image:${adminSession?.email ?? "unknown"}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Image generation is limited to five images per hour. Please try again later." }, { status: 429 });
    }

    const input = imageRequestSchema.parse(await request.json());
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Image generation requires OPENAI_API_KEY in Vercel. Add it and redeploy." }, { status: 503 });
    }

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
        prompt: `${input.prompt}\nEditorial use: create an original, polished, photorealistic or tasteful editorial illustration. No text, watermark, or logo.`,
        size: "1024x1024",
        quality: "low",
        output_format: "jpeg",
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      console.error("AI image provider rejected the request:", response.status);
      return NextResponse.json({ error: "The image provider could not generate this image. Check the API key, account access, and billing, then try again." }, { status: 502 });
    }

    const result = await response.json();
    const encodedImage = result?.data?.[0]?.b64_json;
    if (typeof encodedImage !== "string" || !encodedImage) {
      return NextResponse.json({ error: "The image provider returned no image data." }, { status: 502 });
    }
    if (Buffer.byteLength(encodedImage, "base64") > 8_000_000) {
      return NextResponse.json({ error: "The generated image was too large to save." }, { status: 502 });
    }

    await connectToDatabase();
    const asset = await MediaAssetModel.create({
      contentType: "image/jpeg",
      data: Buffer.from(encodedImage, "base64"),
      altText: input.altText,
    });
    return NextResponse.json({
      imageUrl: `/api/media/${asset._id.toString()}`,
      altText: input.altText,
    });
  } catch (error) {
    return jsonError(error);
  }
}
