import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { hasAdminPermission } from "@/lib/admin-roles";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { OpportunityModel, TalentTaskAssignmentModel } from "@/lib/models";
import { assignOpenTimedTasks } from "@/lib/timed-tasks";
import { opportunityInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("opportunities_write");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    const input = opportunityInputSchema.parse(await request.json());
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
    const canPublish = hasAdminPermission(session.role, "opportunities_publish");
    const status = canPublish
      ? input.status
      : input.status === "Draft"
        ? "Draft"
        : "Pending approval";
    await connectToDatabase();
    const existing = await OpportunityModel.findById(id).select("status publishedAt type taskDurationHours");
    if (!existing) return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    if (
      (input.type !== existing.type || input.taskDurationHours !== existing.taskDurationHours) &&
      await TalentTaskAssignmentModel.exists({ opportunityId: id, status: "in_progress" })
    ) {
      return NextResponse.json(
        { error: "The task type or deadline cannot change while someone has an active assignment. Wait for the assignment to finish or expire." },
        { status: 409 },
      );
    }
    const opportunity = await OpportunityModel.findByIdAndUpdate(
      id,
      {
        ...input,
        taskDurationHours: input.type === "Full-time" ? null : input.taskDurationHours,
        status,
        publishedAt: status !== "Open"
          ? null
          : existing.status === "Open"
            ? existing.publishedAt
            : new Date(),
      },
      { new: true, runValidators: true },
    );
    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    let assignmentWarning: string | undefined;
    if (status === "Open" && input.type !== "Full-time" && input.taskDurationHours) {
      try {
        await assignOpenTimedTasks();
      } catch (assignmentError) {
        console.error("Could not auto-assign a published contract task:", assignmentError);
        assignmentWarning = "The opportunity was saved, but automatic assignment needs attention.";
      }
    }
    return NextResponse.json({ opportunity, assignmentWarning });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const denied = await requireAdminPermission("opportunities_delete");
  if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    await connectToDatabase();
    if (await TalentTaskAssignmentModel.exists({ opportunityId: id, status: "in_progress" })) {
      return NextResponse.json(
        { error: "This opportunity has an active task assignment and cannot be deleted yet. Wait for the assignment to finish or expire." },
        { status: 409 },
      );
    }
    const result = await OpportunityModel.findByIdAndDelete(id);
    if (!result) {
      return NextResponse.json({ error: "Opportunity not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
