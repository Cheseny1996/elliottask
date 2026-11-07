import mongoose, { type InferSchemaType } from "mongoose";
import { adminRoles } from "@/lib/admin-roles";
import { opportunityTypes } from "@/lib/opportunity-categories";

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    excerpt: { type: String, required: true, trim: true, maxlength: 320 },
    body: { type: String, required: true, maxlength: 30000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    author: { type: String, required: true, trim: true, maxlength: 80 },
    metaTitle: { type: String, required: true, trim: true, maxlength: 70 },
    metaDescription: { type: String, required: true, trim: true, maxlength: 170 },
    keywords: { type: [String], default: [] },
    status: { type: String, enum: ["draft", "pending_approval", "published"], default: "draft" },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
articleSchema.index({ status: 1, publishedAt: -1 });

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, unique: true, lowercase: true },
    type: { type: String, enum: opportunityTypes, required: true },
    location: { type: String, required: true, trim: true, maxlength: 100 },
    team: { type: String, required: true, trim: true, maxlength: 80 },
    compensation: { type: String, required: true, trim: true, maxlength: 120 },
    summary: { type: String, required: true, trim: true, maxlength: 320 },
    description: { type: String, required: true, maxlength: 12000 },
    skills: { type: [String], default: [] },
    status: { type: String, enum: ["Draft", "Pending approval", "Open", "Closed"], default: "Draft" },
    publishedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
opportunitySchema.index({ status: 1, publishedAt: -1 });

const inquirySchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["hire", "quote", "talent"], required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    company: { type: String, trim: true, maxlength: 120, default: "" },
    subject: { type: String, trim: true, maxlength: 160, default: "" },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    opportunity: { type: String, trim: true, maxlength: 120, default: "" },
    status: { type: String, enum: ["new", "in_review", "contacted", "closed"], default: "new" },
    privacyAccepted: { type: Boolean, required: true },
    replies: {
      type: [
        new mongoose.Schema(
          {
            subject: { type: String, required: true, maxlength: 160 },
            body: { type: String, required: true, maxlength: 4000 },
            sentAt: { type: Date, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true },
);
inquirySchema.index({ createdAt: -1, status: 1 });
inquirySchema.index({ email: 1, createdAt: -1 });

const talentProfileSchema = new mongoose.Schema(
  {
    headline: { type: String, trim: true, maxlength: 120, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },
    bio: { type: String, trim: true, maxlength: 2000, default: "" },
    skills: { type: [String], default: [] },
    yearsExperience: { type: String, default: "" },
    workPreference: { type: String, default: "" },
    availability: { type: String, default: "" },
    portfolioUrl: { type: String, trim: true, maxlength: 300, default: "" },
    linkedinUrl: { type: String, trim: true, maxlength: 300, default: "" },
    resumeUrl: { type: String, trim: true, maxlength: 300, default: "" },
    completed: { type: Boolean, default: false },
  },
  { _id: false },
);

const linkedAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    providerAccountId: { type: String, required: true },
  },
  { _id: false },
);

const talentUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
    passwordHash: { type: String, select: false, default: null },
    privacyAcceptedAt: { type: Date, default: null },
    linkedAccounts: { type: [linkedAccountSchema], default: [] },
    profile: { type: talentProfileSchema, default: () => ({}) },
  },
  { timestamps: true },
);
talentUserSchema.index(
  { "linkedAccounts.provider": 1, "linkedAccounts.providerAccountId": 1 },
  { unique: true, sparse: true },
);

const adminStaffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: adminRoles, required: true },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    invitedBy: { type: String, required: true, maxlength: 254 },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

const adminInvitationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    role: { type: String, enum: adminRoles, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
    invitedBy: { type: String, required: true, maxlength: 254 },
  },
  { timestamps: true },
);
adminInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const talentMatchSchema = new mongoose.Schema(
  {
    opportunityId: { type: mongoose.Schema.Types.ObjectId, ref: "Opportunity", required: true },
    talentUserId: { type: mongoose.Schema.Types.ObjectId, ref: "TalentUser", required: true },
    projectManagerStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "AdminStaff", required: true },
    status: { type: String, enum: ["shortlisted", "inviting", "invited"], default: "shortlisted" },
    notes: { type: String, trim: true, maxlength: 1000, default: "" },
    matchedBy: { type: String, required: true, maxlength: 254 },
    invitedAt: { type: Date, default: null },
  },
  { timestamps: true },
);
talentMatchSchema.index({ opportunityId: 1, talentUserId: 1 }, { unique: true });
talentMatchSchema.index({ projectManagerStaffId: 1, status: 1 });

export const ArticleModel =
  mongoose.models.Article ?? mongoose.model("Article", articleSchema);
export const OpportunityModel =
  mongoose.models.Opportunity ?? mongoose.model("Opportunity", opportunitySchema);
export const InquiryModel =
  mongoose.models.Inquiry ?? mongoose.model("Inquiry", inquirySchema);
export const TalentUserModel =
  mongoose.models.TalentUser ?? mongoose.model("TalentUser", talentUserSchema);
export const AdminStaffModel =
  mongoose.models.AdminStaff ?? mongoose.model("AdminStaff", adminStaffSchema);
export const AdminInvitationModel =
  mongoose.models.AdminInvitation ?? mongoose.model("AdminInvitation", adminInvitationSchema);
export const TalentMatchModel =
  mongoose.models.TalentMatch ?? mongoose.model("TalentMatch", talentMatchSchema);

export type ArticleDocument = InferSchemaType<typeof articleSchema>;
export type OpportunityDocument = InferSchemaType<typeof opportunitySchema>;
