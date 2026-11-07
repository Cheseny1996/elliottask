import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminSession } from "@/lib/auth";
import { requireAdminPermission } from "@/lib/admin-api";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { AdminStaffModel, OpportunityModel, TalentMatchModel, TalentUserModel } from "@/lib/models";

export const runtime = "nodejs";

const matchInputSchema = z.object({
  opportunityId: z.string().refine(isValidObjectId, "Choose a valid opportunity."),
  talentUserId: z.string().refine(isValidObjectId, "Choose a valid talent profile."),
  projectManagerStaffId: z.string().refine(isValidObjectId, "Choose an active project manager."),
  notes: z.string().trim().max(1000).default(""),
});

export async function GET() {
  const denied = await requireAdminPermission("matches_read");
  if (denied) return denied;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });

  try {
    await connectToDatabase();
    const isMatcher = session.role === "matching" || session.role === "super_admin";
    const matchQuery = isMatcher ? {} : { projectManagerStaffId: session.staffId };
    const matches = await TalentMatchModel.find(matchQuery)
      .sort({ updatedAt: -1 })
      .limit(300)
      .populate({ path: "opportunityId", select: "title slug type status" })
      .populate({ path: "talentUserId", select: "name profile" })
      .populate({ path: "projectManagerStaffId", select: "name" })
      .lean();

    const response: {
      matches: unknown[];
      candidates?: unknown[];
      opportunities?: unknown[];
      projectManagers?: unknown[];
    } = {
      matches: matches.map((match) => ({
        id: String(match._id),
        status: match.status,
        notes: match.notes,
        invitedAt: match.invitedAt,
        updatedAt: match.updatedAt,
        opportunity: match.opportunityId && typeof match.opportunityId === "object"
          ? {
              id: String(match.opportunityId._id),
              title: match.opportunityId.title,
              slug: match.opportunityId.slug,
              type: match.opportunityId.type,
              status: match.opportunityId.status,
            }
          : null,
        talent: match.talentUserId && typeof match.talentUserId === "object"
          ? {
              id: String(match.talentUserId._id),
              name: match.talentUserId.name,
              profile: match.talentUserId.profile,
            }
          : null,
        projectManager: match.projectManagerStaffId && typeof match.projectManagerStaffId === "object"
          ? { id: String(match.projectManagerStaffId._id), name: match.projectManagerStaffId.name }
          : null,
      })),
    };

    if (isMatcher) {
      const [candidates, opportunities, projectManagers] = await Promise.all([
        TalentUserModel.find().select("name profile").sort({ updatedAt: -1 }).limit(200).lean(),
        OpportunityModel.find({ status: "Open" }).select("title slug type skills location").sort({ publishedAt: -1 }).lean(),
        AdminStaffModel.find({ role: "project_manager", status: "active" }).select("name email").sort({ name: 1 }).lean(),
      ]);
      response.candidates = candidates.map((candidate) => ({
        id: String(candidate._id),
        name: candidate.name,
        profile: candidate.profile,
      }));
      response.opportunities = opportunities.map((opportunity) => ({
        id: String(opportunity._id),
        title: opportunity.title,
        slug: opportunity.slug,
        type: opportunity.type,
        skills: opportunity.skills,
        location: opportunity.location,
      }));
      response.projectManagers = projectManagers.map((manager) => ({
        id: String(manager._id),
        name: manager.name,
        email: manager.email,
      }));
    }

    return NextResponse.json(response);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminPermission("matches_manage");
  if (denied) return denied;
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });

  try {
    const input = matchInputSchema.parse(await request.json());
    await connectToDatabase();
    const [opportunity, talent, projectManager] = await Promise.all([
      OpportunityModel.findOne({ _id: input.opportunityId, status: "Open" }).select("_id"),
      TalentUserModel.findById(input.talentUserId).select("_id"),
      AdminStaffModel.findOne({
        _id: input.projectManagerStaffId,
        role: "project_manager",
        status: "active",
      }).select("_id"),
    ]);
    if (!opportunity) return NextResponse.json({ error: "Select an active published opportunity." }, { status: 404 });
    if (!talent) return NextResponse.json({ error: "Talent profile not found." }, { status: 404 });
    if (!projectManager) return NextResponse.json({ error: "Select an active project manager." }, { status: 404 });

    const match = await TalentMatchModel.create({
      opportunityId: opportunity._id,
      talentUserId: talent._id,
      projectManagerStaffId: projectManager._id,
      notes: input.notes,
      matchedBy: session.email,
      status: "shortlisted",
    });
    return NextResponse.json({ ok: true, id: String(match._id) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
