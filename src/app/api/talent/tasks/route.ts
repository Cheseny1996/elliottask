import { NextResponse } from "next/server";
import { auth, isTalentAuthConfigured } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { TalentTaskAssignmentModel } from "@/lib/models";
import { checkRateLimit } from "@/lib/rate-limit";
import { expireOverdueTasks } from "@/lib/timed-tasks";

export const runtime = "nodejs";

export async function GET() {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Task tracking is not configured yet." }, { status: 503 });
  }
  const session = await auth();
  const talentUserId = session?.user?.id;
  if (!talentUserId) {
    return NextResponse.json({ error: "Please sign in to view your tasks." }, { status: 401 });
  }
  if (!checkRateLimit(`talent-task-list:${talentUserId}`, 150, 5 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many task refreshes. Wait a moment and try again." }, { status: 429 });
  }

  try {
    await connectToDatabase();
    await expireOverdueTasks();
    const assignments = await TalentTaskAssignmentModel.find({ talentUserId })
      .sort({ status: 1, deadlineAt: 1, updatedAt: -1 })
      .limit(100)
      .populate({ path: "opportunityId", select: "title slug type summary description skills compensation taskDurationHours" })
      .lean();
    return NextResponse.json({
      tasks: assignments.map((assignment) => ({
        id: String(assignment._id),
        status: assignment.status,
        progress: assignment.progress,
        assignedAt: assignment.assignedAt,
        deadlineAt: assignment.deadlineAt,
        completedAt: assignment.completedAt,
        expiredAt: assignment.expiredAt,
        opportunity: assignment.opportunityId && typeof assignment.opportunityId === "object"
          ? {
              title: assignment.opportunityId.title,
              slug: assignment.opportunityId.slug,
              type: assignment.opportunityId.type,
              summary: assignment.opportunityId.summary,
              description: assignment.opportunityId.description,
              skills: assignment.opportunityId.skills,
              compensation: assignment.opportunityId.compensation,
              taskDurationHours: assignment.opportunityId.taskDurationHours,
            }
          : null,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
