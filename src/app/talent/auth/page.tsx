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
  searchParams: Promise<{ mode?: string; error?: string }>;
};

function getAuthErrorMessage(error?: string) {
  switch (error) {
    case "AccessDenied":
      return "Sign-in was declined. For signup, accept the Privacy Policy and use a Google or LinkedIn account with a verified email address.";
    case "OAuthAccountNotLinked":
      return "An account already exists with this email. Sign in using the method you originally chose.";
    case "OAuthCallback":
    case "OAuthCallbackError":
    case "OAuthSignin":
      return "The provider sign-in could not be completed. Check that the OAuth credentials and callback URL are configured correctly.";
    case "Configuration":
      return "Sign-in is not configured correctly on this deployment. Please contact the site administrator.";
    default:
      return error ? "We could not complete sign-in. Please try again or use email and password." : undefined;
  }
}

export default async function TalentAuthPage({ searchParams }: TalentAuthPageProps) {
  const { mode, error } = await searchParams;
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
          authError={getAuthErrorMessage(error)}
        />
      </div>
    </main>
  );
}
