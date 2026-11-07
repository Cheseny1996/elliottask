import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db";
import { TalentUserModel } from "@/lib/models";
import { checkRateLimit, requestAddress } from "@/lib/rate-limit";
import { talentLoginSchema } from "@/lib/validation";

const providers = [
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
    : []),
  ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
    ? [LinkedIn({ clientId: process.env.LINKEDIN_CLIENT_ID, clientSecret: process.env.LINKEDIN_CLIENT_SECRET })]
    : []),
  Credentials({
    id: "credentials",
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, request) {
      const parsed = talentLoginSchema.safeParse(credentials);
      if (!parsed.success || Buffer.byteLength(parsed.data.password, "utf8") > 72) return null;

      const email = parsed.data.email.toLowerCase();
      const address = requestAddress(request);
      if (!checkRateLimit(`talent-login:${address}:${email}`, 8, 15 * 60 * 1000)) return null;

      await connectToDatabase();
      const user = await TalentUserModel.findOne({ email }).select("+passwordHash");
      if (!user?.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
        return null;
      }

      return { id: user._id.toString(), name: user.name, email: user.email };
    },
  }),
];

type OAuthProfile = { email_verified?: boolean };

const authSecret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;

export const hasGoogleSignIn = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
export const hasLinkedInSignIn = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
export const isTalentAuthConfigured = Boolean(
  process.env.MONGODB_URI && authSecret && authSecret.length >= 32,
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret: authSecret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/talent/auth" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider === "credentials") return true;
      if (account.provider !== "google" && account.provider !== "linkedin") return false;
      if (!(profile as OAuthProfile | undefined)?.email_verified || !user.email) return false;

      const cookieStore = await cookies();
      const consentCookie = cookieStore.get("elliottask_talent_consent")?.value;
      await connectToDatabase();
      const email = user.email.trim().toLowerCase();
      let existing = await TalentUserModel.findOne({
        linkedAccounts: {
          $elemMatch: { provider: account.provider, providerAccountId: account.providerAccountId },
        },
      });

      if (!existing) {
        if (consentCookie !== "accepted") return false;
        existing = await TalentUserModel.findOne({ email });
        if (existing) {
          existing.linkedAccounts.push({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          });
          await existing.save();
        } else {
          try {
            existing = await TalentUserModel.create({
              name: user.name?.trim() || email.split("@")[0],
              email,
              privacyAcceptedAt: new Date(),
              linkedAccounts: [{
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              }],
            });
          } catch (error) {
            if (
              typeof error === "object" &&
              error !== null &&
              "code" in error &&
              error.code === 11000
            ) {
              existing = await TalentUserModel.findOne({ email });
            } else {
              throw error;
            }
          }
        }
      }

      if (!existing) return false;
      if (!existing.linkedAccounts.some(
        (linkedAccount: { provider: string; providerAccountId: string }) =>
          linkedAccount.provider === account.provider &&
          linkedAccount.providerAccountId === account.providerAccountId,
      )) {
        existing.linkedAccounts.push({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        });
        await existing.save();
      }
      user.id = existing._id.toString();
      user.name = existing.name;
      user.email = existing.email;
      cookieStore.delete("elliottask_talent_consent");
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
