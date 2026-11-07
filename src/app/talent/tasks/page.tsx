import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentTasksDashboard } from "@/components/talent-tasks-dashboard";
import { TalentPortalHeader } from "@/components/talent-portal-header";

export const metadata: Metadata = {
  title: "My tasks | elliottask Talent",
  description: "Track your assigned contract and AI training tasks.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TalentTasksPage() {
  if (!isTalentAuthConfigured) redirect("/talent/auth?mode=login&setup=required");
  const session = await auth();
  if (!session?.user?.id) redirect("/talent/auth?mode=login");

  return (
    <div className="talent-portal">
      <TalentPortalHeader active="tasks" name={session.user.name} />
      <main className="talent-portal-main">
        <div className="talent-portal-title">
          <div>
            <p className="talent-portal-eyebrow">Matched to your profile</p>
            <h1>My timed tasks</h1>
            <p className="talent-portal-lede">Tasks are matched automatically using your skills and work preferences. Each timer begins when you are assigned; unfinished tasks return to the available pool at the deadline.</p>
          </div>
        </div>
        <TalentTasksDashboard />
      </main>
    </div>
  );
}
