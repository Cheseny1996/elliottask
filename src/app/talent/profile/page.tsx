import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentProfileForm } from "@/components/talent-profile-form";

export const metadata: Metadata = {
  title: "Complete Your Talent Profile",
  description: "Build your elliottask talent profile and continue to current opportunities.",
  robots: { index: false, follow: false },
};

export default async function TalentProfilePage() {
  if (!isTalentAuthConfigured) {
    redirect("/talent/auth?mode=login&setup=required");
  }
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/talent/auth?mode=login");
  }

  return <TalentProfileForm />;
}
