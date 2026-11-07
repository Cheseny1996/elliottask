import { z } from "zod";
import { adminRoles } from "@/lib/admin-roles";
import { opportunityTypes } from "@/lib/opportunity-categories";

const slugSchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase words separated by hyphens.");

export const articleInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  slug: slugSchema,
  excerpt: z.string().trim().min(20).max(320),
  body: z.string().trim().min(80).max(30000),
  category: z.string().trim().min(2).max(60),
  author: z.string().trim().min(2).max(80),
  metaTitle: z.string().trim().min(5).max(70),
  metaDescription: z.string().trim().min(30).max(170),
  keywords: z.array(z.string().trim().min(2).max(40)).max(12),
  status: z.enum(["draft", "pending_approval", "published"]),
});

export const opportunityInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  slug: slugSchema,
  type: z.enum(opportunityTypes),
  location: z.string().trim().min(2).max(100),
  team: z.string().trim().min(2).max(80),
  compensation: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(20).max(320),
  description: z.string().trim().min(40).max(12000),
  skills: z.array(z.string().trim().min(1).max(40)).max(16),
  taskDurationHours: z.number().int().min(1).max(720).nullable(),
  status: z.enum(["Draft", "Pending approval", "Open", "Closed"]),
}).superRefine((input, context) => {
  if (input.type !== "Full-time" && (input.status === "Open" || input.status === "Pending approval") && input.taskDurationHours === null) {
    context.addIssue({
      code: "custom",
      path: ["taskDurationHours"],
      message: "Set a deadline for every published or approval-ready contract task.",
    });
  }
});

export const inquiryInputSchema = z.object({
  kind: z.enum(["hire", "quote", "talent"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(120).optional().default(""),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(20).max(5000),
  opportunity: z.string().trim().max(120).optional().default(""),
  privacyAccepted: z.literal(true),
  website: z.string().max(200).optional().default(""),
});

export const talentRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
  privacyAccepted: z.literal(true),
});

export const adminInvitationInputSchema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().min(2).max(100),
  role: z.enum(adminRoles),
});

export const adminInvitationAcceptanceSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  name: z.string().trim().min(2).max(100),
  password: z.string().min(12).max(72),
});

export const talentLoginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72),
});

const optionalUrl = z.union([z.literal(""), z.string().trim().url().max(300)]);

export const talentProfileInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  headline: z.string().trim().min(5).max(120),
  location: z.string().trim().min(2).max(120),
  bio: z.string().trim().min(50).max(2000),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(30),
  yearsExperience: z.enum(["0-2", "3-5", "6-9", "10+"]),
  workPreference: z.enum(["Full-time", "Project", "AI task", "Open to any"]),
  availability: z.enum(["Immediately", "Within a month", "Within 3 months", "Flexible"]),
  portfolioUrl: optionalUrl,
  linkedinUrl: optionalUrl,
  resumeUrl: optionalUrl,
});
