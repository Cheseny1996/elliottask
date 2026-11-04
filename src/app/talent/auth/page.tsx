import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/site-shell";
import { TalentAuthForm } from "@/components/talent-auth-form";
import { hasGoogleSignIn, hasLinkedInSignIn, isTalentAuthConfigured } from "@/auth";

export const metadata: Metadata = {
  title: "Join or Sign In",
  description: "Create a talent account to complete your profile and explore work opportunities.",
  robots: { index: false, follow: false },
};

type TalentAuthPageProps = {
  searchParams: Promise<{ mode?: string }>;
};

export default async function TalentAuthPage({ searchParams }: TalentAuthPageProps) {
  const { mode } = await searchParams;
  const selectedMode = mode === "login" ? "login" : "signup";

  return (
    <main className="talent-auth-page">
      <header className="talent-auth-header">
        <Brand light />
        <Link href="/for-talent">Back to careers</Link>
      </header>
      <div className="talent-auth-content">
        <TalentAuthForm
          mode={selectedMode}
          googleEnabled={hasGoogleSignIn}
          linkedInEnabled={hasLinkedInSignIn}
          accountSystemReady={isTalentAuthConfigured}
        />
      </div>
    </main>
  );
}
