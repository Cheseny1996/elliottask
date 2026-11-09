import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import {
  OpportunityModel,
  TalentTaskAssignmentModel,
  TalentUserModel,
  VisitorDailyModel,
} from "@/lib/models";
import { expireOverdueTasks } from "@/lib/timed-tasks";

export const runtime = "nodejs";

function dayString(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  const denied = await requireAdminPermission("analytics_read");
  if (denied) return denied;

  try {
    const url = new URL(request.url);
    const requestedDays = Number(url.searchParams.get("days") ?? "30");
    const days = Number.isInteger(requestedDays) && requestedDays >= 7 && requestedDays <= 90 ? requestedDays : 30;
    await connectToDatabase();
    await expireOverdueTasks();

    const today = new Date();
    const start = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - (days - 1)));
    const startDay = dayString(start);
    const startDate = new Date(start);
    const [visitorDaily, signupDaily, totalVisitors, taskStatus, recentTimeline, activeTimeline, timedTasks, activeAssignments, completedAssignments, onboardedCount, publishedOpportunityCount, pendingOpportunityCount, publishedOpportunities] = await Promise.all([
      VisitorDailyModel.aggregate([
        { $match: { day: { $gte: startDay } } },
        { $group: { _id: "$day", visitors: { $sum: 1 }, pageViews: { $sum: "$pageViews" } } },
      ]),
      TalentUserModel.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } }, count: { $sum: 1 } } },
      ]),
      VisitorDailyModel.distinct("visitorHash", { day: { $gte: startDay } }),
      TalentTaskAssignmentModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      TalentTaskAssignmentModel.find({ assignedAt: { $gte: startDate } })
        .sort({ assignedAt: -1 })
        .limit(500)
        .populate({ path: "opportunityId", select: "title slug type taskDurationHours" })
        .populate({ path: "talentUserId", select: "name" })
        .lean(),
      TalentTaskAssignmentModel.find({ status: "in_progress" })
        .sort({ deadlineAt: 1 })
        .limit(500)
        .populate({ path: "opportunityId", select: "title slug type taskDurationHours" })
        .populate({ path: "talentUserId", select: "name" })
        .lean(),
      OpportunityModel.find({ status: "Open", type: { $in: ["Project", "AI task"] }, taskDurationHours: { $gte: 1 } })
        .select("_id")
        .lean(),
      TalentTaskAssignmentModel.distinct("opportunityId", { status: "in_progress" }),
      TalentTaskAssignmentModel.distinct("opportunityId", { status: "completed" }),
      TalentUserModel.countDocuments({ "profile.completed": true }),
      OpportunityModel.countDocuments({ status: "Open" }),
      OpportunityModel.countDocuments({ status: "Pending approval" }),
      OpportunityModel.find({ status: "Open" })
        .select("title slug type location publishedAt createdAt")
        .sort({ publishedAt: -1, createdAt: -1 })
        .lean(),
    ]);

    const visitorsByDay = new Map<string, { visitors: number; pageViews: number }>(
      visitorDaily.map((row: { _id: string; visitors: number; pageViews: number }) => [
        row._id,
        { visitors: row.visitors, pageViews: row.pageViews },
      ]),
    );
    const signupsByDay = new Map<string, number>(
      signupDaily.map((row: { _id: string; count: number }) => [row._id, row.count]),
    );
    const daysData = Array.from({ length: days }, (_, index) => {
      const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
      const day = dayString(date);
      const visitors = visitorsByDay.get(day);
      return {
        day,
        visitors: visitors?.visitors ?? 0,
        pageViews: visitors?.pageViews ?? 0,
        signups: signupsByDay.get(day) ?? 0,
      };
    });
    const taskCounts = Object.fromEntries(taskStatus.map((row: { _id: string; count: number }) => [row._id, row.count]));
    const assignedOpportunityIds = new Set([...activeAssignments, ...completedAssignments].map(String));
    const timelineById = new Map(
      [...recentTimeline, ...activeTimeline].map((assignment) => [String(assignment._id), assignment]),
    );
    const timeline = [...timelineById.values()].sort(
      (left, right) => left.assignedAt.getTime() - right.assignedAt.getTime(),
    );
    const activeTaskCount = taskCounts.in_progress ?? 0;
    const completedTaskCount = taskCounts.completed ?? 0;
    const expiredTaskCount = taskCounts.expired ?? 0;

    return NextResponse.json({
      rangeDays: days,
      visitors: {
        uniqueVisitors: totalVisitors.length,
        pageViews: daysData.reduce((sum, day) => sum + day.pageViews, 0),
        days: daysData,
      },
      signups: {
        total: daysData.reduce((sum, day) => sum + day.signups, 0),
        days: daysData.map(({ day, signups }) => ({ day, signups })),
      },
      onboarded: onboardedCount,
      opportunities: {
        published: publishedOpportunityCount,
        pendingApproval: pendingOpportunityCount,
        recent: publishedOpportunities.map((opportunity) => ({
          title: opportunity.title,
          slug: opportunity.slug,
          type: opportunity.type,
          location: opportunity.location,
          publishedAt: opportunity.publishedAt ?? opportunity.createdAt,
        })),
      },
      tasks: {
        active: activeTaskCount,
        completed: completedTaskCount,
        expired: expiredTaskCount,
        available: timedTasks.filter((task) => !assignedOpportunityIds.has(String(task._id))).length,
        timeline: timeline.map((assignment) => ({
          id: String(assignment._id),
          status: assignment.status,
          progress: assignment.progress,
          assignedAt: assignment.assignedAt,
          deadlineAt: assignment.deadlineAt,
          completedAt: assignment.completedAt,
          expiredAt: assignment.expiredAt,
          talentName: assignment.talentUserId && typeof assignment.talentUserId === "object"
            ? assignment.talentUserId.name
            : "Talent unavailable",
          opportunity: assignment.opportunityId && typeof assignment.opportunityId === "object"
            ? {
                title: assignment.opportunityId.title,
                slug: assignment.opportunityId.slug,
                type: assignment.opportunityId.type,
                taskDurationHours: assignment.opportunityId.taskDurationHours,
              }
            : null,
        })),
      },
      payments: {
        available: false,
        message: "No payment ledger or provider is connected. Payment totals are not available.",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
