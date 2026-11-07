import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectToDatabase, isDatabaseConfigured } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { requestAddress, checkRateLimit } from "@/lib/rate-limit";
import { VisitorDailyModel } from "@/lib/models";

export const runtime = "nodejs";

const pageviewSchema = z.object({
  visitorId: z.string().uuid(),
  path: z.string().min(1).max(500).startsWith("/").refine((path) => !path.startsWith("//")),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Visitor analytics storage is not configured." }, { status: 503 });
  }
  if (!checkRateLimit(`analytics:${requestAddress(request)}`, 120, 60 * 1000)) {
    return NextResponse.json({ error: "Too many page view events." }, { status: 429 });
  }

  try {
    const input = pageviewSchema.parse(await request.json());
    await connectToDatabase();
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const visitorHash = createHash("sha256").update(input.visitorId).digest("hex");
    try {
      await VisitorDailyModel.updateOne(
        { day, visitorHash },
        {
          $inc: { pageViews: 1 },
          $set: { lastSeenAt: now },
          $setOnInsert: { day, visitorHash },
        },
        { upsert: true },
      );
    } catch (error) {
      if (!error || typeof error !== "object" || !("code" in error) || error.code !== 11000) throw error;
      await VisitorDailyModel.updateOne(
        { day, visitorHash },
        { $inc: { pageViews: 1 }, $set: { lastSeenAt: now } },
      );
    }
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    return jsonError(error);
  }
}
