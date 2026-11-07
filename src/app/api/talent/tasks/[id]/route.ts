import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth, isTalentAuthConfigured } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { TalentTaskAssignmentModel, TalentUserModel } from "@/lib/models";
import { expireOverdueTasks } from "@/lib/timed-tasks";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };
const progressSchema = z.object({ progress: z.number().int().min(0).max(100) });

export async function PATCH(request: Request, context: RouteContext) {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Task tracking is not configured yet." }, { status: 503 });
  }
  const session = await auth();
  const talentUserId = session?.user?.id;
  if (!talentUserId) {
    return NextResponse.json({ error: "Please sign in to update task progress." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Task assignment not found." }, { status: 404 });
    const { progress } = progressSchema.parse(await request.json());
    await connectToDatabase();
    await expireOverdueTasks();

    const now = new Date();
    const assignment = progress === 100
      ? await TalentTaskAssignmentModel.findOneAndUpdate(
          { _id: id, talentUserId, status: "in_progress", deadlineAt: { $gt: now } },
          {
            $max: { progress: 100 },
            $set: { status: "completed", completedAt: now },
          },
          { new: true },
        )
      : await TalentTaskAssignmentModel.findOneAndUpdate(
          { _id: id, talentUserId, status: "in_progress", deadlineAt: { $gt: now } },
          { $max: { progress } },
          { new: true },
        );

    if (!assignment) {
      return NextResponse.json({ error: "This task is no longer active. It may have expired or already been completed." }, { status: 409 });
    }
    if (progress === 100) {
      await TalentUserModel.updateOne(
        { _id: talentUserId, activeTaskCount: { $gt: 0 } },
        { $inc: { activeTaskCount: -1 } },
      );
    }
    return NextResponse.json({
      ok: true,
      status: assignment.status,
      progress: assignment.progress,
      completedAt: assignment.completedAt,
    });
  } catch (error) {
    return jsonError(error);
  }
}
