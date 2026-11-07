import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentJobsBoard } from "@/components/talent-jobs-board";
import { TalentPortalHeader } from "@/components/talent-portal-header";
import { getTalentPortalOpportunities } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Jobs | elliottask Talent",
  description: "Browse opportunities matched to your skills and experience.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TalentJobsPage() {
  if (!isTalentAuthConfigured) redirect("/talent/auth?mode=login&setup=required");
  const session = await auth();
  if (!session?.user?.id) redirect("/talent/auth?mode=login");

  const { opportunities, usingExamples } = await getTalentPortalOpportunities();

  return (
    <div className="talent-portal">
      <TalentPortalHeader active="jobs" name={session.user.name} />
      <main className="talent-portal-main talent-jobs-page">
        <div className="talent-portal-title">
          <div>
            <p className="talent-portal-eyebrow">Made for your next step</p>
            <h1>Jobs</h1>
            <p className="talent-portal-lede">Explore opportunities and review the details before you decide what fits.</p>
          </div>
          <Link className="talent-portal-secondary" href="/talent/profile">View my profile <span aria-hidden="true">↗</span></Link>
        </div>
        <TalentJobsBoard opportunities={opportunities} usingExamples={usingExamples} />
      </main>
    </div>
  );
}
