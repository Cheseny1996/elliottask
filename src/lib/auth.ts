import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { AdminStaffModel } from "@/lib/models";
import type { AdminRole } from "@/lib/admin-roles";

const cookieName = "elliottask_admin";
const lifetimeSeconds = 60 * 60 * 8;

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email: string, staffId?: string) {
  const token = await new SignJWT({ email, ...(staffId ? { staffId } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${lifetimeSeconds}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: lifetimeSeconds,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName);
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;
  if (!token) return null;

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getSecret()));
  } catch {
    return null;
  }

  if (typeof payload.email !== "string") return null;
  const email = payload.email.trim().toLowerCase();
  const superAdminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (superAdminEmail && email === superAdminEmail) {
    return { email, role: "super_admin" as const, staffId: null };
  }
  if (typeof payload.staffId !== "string") return null;

  await connectToDatabase();
  const staff = await AdminStaffModel.findOne({
    _id: payload.staffId,
    email,
    status: "active",
  }).select("role").lean();
  if (!staff) return null;
  return {
    email,
    role: staff.role as AdminRole,
    staffId: String(staff._id),
  };
}
