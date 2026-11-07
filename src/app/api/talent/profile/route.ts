import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { auth, isTalentAuthConfigured } from "@/auth";
import { connectToDatabase } from "@/lib/db";
import { TalentUserModel } from "@/lib/models";
import { talentProfileInputSchema } from "@/lib/validation";
import { assignOpenTimedTasks } from "@/lib/timed-tasks";

export const runtime = "nodejs";

export async function GET() {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Talent profile storage is not configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to view your profile." }, { status: 401 });
  }

  try {
    await connectToDatabase();
    const user = await TalentUserModel.findById(session.user.id).select("name email profile").lean();
    if (!user) return NextResponse.json({ error: "Talent account not found." }, { status: 404 });

    return NextResponse.json({
      name: user.name,
      email: user.email,
      profile: user.profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("MongoDB is not configured")) {
      return NextResponse.json({ error: "Profile storage is not configured yet." }, { status: 503 });
    }
    console.error("elliottask talent profile lookup failed:", error);
    return NextResponse.json({ error: "We could not load your profile. Please try again later." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!isTalentAuthConfigured) {
    return NextResponse.json({ error: "Talent profile storage is not configured yet." }, { status: 503 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to update your profile." }, { status: 401 });
  }

  try {
    const body = talentProfileInputSchema.parse(await request.json());
    await connectToDatabase();

    const user = await TalentUserModel.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          name: body.name,
          profile: { ...body, completed: true },
        },
      },
      { new: true, runValidators: true, projection: { name: 1, email: 1, profile: 1 } },
    ).lean();

    if (!user) return NextResponse.json({ error: "Talent account not found." }, { status: 404 });
    let assignmentWarning: string | undefined;
    try {
      await assignOpenTimedTasks();
    } catch (assignmentError) {
      console.error("Could not auto-assign eligible contract tasks after a talent profile update:", assignmentError);
      assignmentWarning = "Profile saved, but automatic task matching is temporarily unavailable.";
    }
    return NextResponse.json({ ok: true, assignmentWarning });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
    }
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Please correct the profile fields and try again.", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof Error && error.message.includes("MongoDB is not configured")) {
      return NextResponse.json({ error: "Profile saving is not configured yet." }, { status: 503 });
    }
    console.error("elliottask talent profile update failed:", error);
    return NextResponse.json({ error: "We could not save your profile. Please try again later." }, { status: 500 });
  }
}
