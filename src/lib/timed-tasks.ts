import { OpportunityModel, TalentTaskAssignmentModel, TalentUserModel } from "@/lib/models";
import type { OpportunityType } from "@/lib/opportunity-categories";

const taskTypes: OpportunityType[] = ["Project", "AI task"];
const maxActiveTasksPerTalent = 10;

function taskPreference(type: OpportunityType) {
  return type === "AI task" ? "AI task" : "Project";
}

function matchScore(
  talent: { profile?: { skills?: string[]; workPreference?: string; availability?: string; yearsExperience?: string } },
  task: { type: OpportunityType; skills?: string[] },
) {
  const profile = talent.profile;
  if (!profile || !profile.workPreference || !profile.availability || !profile.yearsExperience) return 0;
  if (profile.workPreference !== "Open to any" && profile.workPreference !== taskPreference(task.type)) return 0;

  const skills = new Set((profile.skills ?? []).map((skill) => skill.trim().toLowerCase()));
  const overlap = (task.skills ?? []).filter((skill) => skills.has(skill.trim().toLowerCase())).length;
  if (task.skills?.length && overlap === 0) return 0;
  return 1 + overlap * 10 + (profile.workPreference === taskPreference(task.type) ? 5 : 0);
}

export async function assignOpenTimedTasks() {
  const [tasks, candidates] = await Promise.all([
    OpportunityModel.find({
      status: "Open",
      type: { $in: taskTypes },
      taskDurationHours: { $gte: 1 },
    }).select("_id type skills taskDurationHours publishedAt").sort({ publishedAt: 1 }).limit(100).lean(),
    TalentUserModel.find({ "profile.completed": true })
      .select("_id profile activeTaskCount")
      .limit(500)
      .lean(),
  ]);

  let assigned = 0;
  for (const task of tasks) {
    if (await TalentTaskAssignmentModel.exists({ opportunityId: task._id, status: "completed" })) continue;
    if (await TalentTaskAssignmentModel.exists({ opportunityId: task._id, status: "in_progress" })) continue;

    const previouslyAssigned = await TalentTaskAssignmentModel.distinct("talentUserId", {
      opportunityId: task._id,
    });
    const previouslyAssignedIds = new Set(previouslyAssigned.map(String));
    const rankedCandidates = candidates
      .filter((candidate) => !previouslyAssignedIds.has(String(candidate._id)))
      .map((candidate) => ({
        candidate,
        score: matchScore(candidate, task),
        activeTasks: candidate.activeTaskCount ?? 0,
      }))
      .filter((item) => item.score > 0 && item.activeTasks < maxActiveTasksPerTalent)
      .sort((left, right) => left.activeTasks - right.activeTasks || right.score - left.score);

    for (const { candidate } of rankedCandidates) {
      const reserved = await TalentUserModel.findOneAndUpdate(
        {
          _id: candidate._id,
          $or: [
            { activeTaskCount: { $lt: maxActiveTasksPerTalent } },
            { activeTaskCount: { $exists: false } },
          ],
        },
        { $inc: { activeTaskCount: 1 } },
        { new: true },
      ).select("_id");
      if (!reserved) continue;

      const assignedAt = new Date();
      const durationHours = task.taskDurationHours;
      try {
        await TalentTaskAssignmentModel.create({
          opportunityId: task._id,
          talentUserId: reserved._id,
          status: "in_progress",
          progress: 0,
          assignedAt,
          deadlineAt: new Date(assignedAt.getTime() + durationHours * 60 * 60 * 1000),
        });
        assigned += 1;
        break;
      } catch (error) {
        await TalentUserModel.updateOne({ _id: reserved._id }, { $inc: { activeTaskCount: -1 } });
        if (error && typeof error === "object" && "code" in error && error.code === 11000) break;
        throw error;
      }
    }
  }
  return assigned;
}

export async function expireOverdueTasks() {
  const now = new Date();
  const overdue = await TalentTaskAssignmentModel.find({
    status: "in_progress",
    deadlineAt: { $lte: now },
  }).select("_id talentUserId").limit(500).lean();

  let expired = 0;
  for (const task of overdue) {
    const updated = await TalentTaskAssignmentModel.findOneAndUpdate(
      { _id: task._id, status: "in_progress", deadlineAt: { $lte: now } },
      { $set: { status: "expired", expiredAt: now } },
      { new: true },
    ).select("_id");
    if (!updated) continue;
    await TalentUserModel.updateOne(
      { _id: task.talentUserId, activeTaskCount: { $gt: 0 } },
      { $inc: { activeTaskCount: -1 } },
    );
    expired += 1;
  }

  const reassigned = await assignOpenTimedTasks();
  return { expired, reassigned };
}
