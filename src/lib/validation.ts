import { z } from "zod";

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
  status: z.enum(["draft", "published"]),
});

export const opportunityInputSchema = z.object({
  title: z.string().trim().min(5).max(120),
  slug: slugSchema,
  type: z.enum(["Full-time", "Project", "AI task"]),
  location: z.string().trim().min(2).max(100),
  team: z.string().trim().min(2).max(80),
  compensation: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(20).max(320),
  description: z.string().trim().min(40).max(12000),
  skills: z.array(z.string().trim().min(1).max(40)).max(16),
  status: z.enum(["Open", "Closed"]),
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
