import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentProfileOverview } from "@/components/talent-profile-overview";

export const metadata: Metadata = {
  title: "My Talent Profile",
  description: "Review your profile, track what is complete, and explore current opportunities.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TalentProfilePage() {
  if (!isTalentAuthConfigured) {
    redirect("/talent/auth?mode=login&setup=required");
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/talent/auth?mode=login");
  }

  return <TalentProfileOverview />;
}
