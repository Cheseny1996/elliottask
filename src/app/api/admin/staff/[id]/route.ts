import { isValidObjectId } from "mongoose";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { AdminStaffModel } from "@/lib/models";
import { z } from "zod";

export const runtime = "nodejs";

const staffStatusSchema = z.object({ status: z.enum(["active", "disabled"]) });
type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Please sign in as an administrator." }, { status: 401 });
  if (session.role !== "super_admin") return NextResponse.json({ error: "Only the Super Admin can manage staff." }, { status: 403 });

  try {
    const { id } = await context.params;
    if (!isValidObjectId(id)) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    const { status } = staffStatusSchema.parse(await request.json());
    await connectToDatabase();
    const staff = await AdminStaffModel.findById(id);
    if (!staff) return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    if (staff.email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
      return NextResponse.json({ error: "The configured Super Admin account cannot be changed here." }, { status: 409 });
    }
    if (session.staffId === id && status === "disabled") {
      return NextResponse.json({ error: "You cannot disable your own staff account." }, { status: 409 });
    }
    staff.status = status;
    await staff.save();
    return NextResponse.json({
      staff: { id: String(staff._id), name: staff.name, email: staff.email, role: staff.role, status: staff.status },
    });
  } catch (error) {
    return jsonError(error);
  }
}
