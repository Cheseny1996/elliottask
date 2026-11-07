import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentProfileForm } from "@/components/talent-profile-form";

export const metadata: Metadata = {
  title: "Edit Your Talent Profile",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function EditTalentProfilePage() {
  if (!isTalentAuthConfigured) redirect("/talent/auth?mode=login&setup=required");
  const session = await auth();
  if (!session?.user?.id) redirect("/talent/auth?mode=login");
  return <TalentProfileForm />;
}
