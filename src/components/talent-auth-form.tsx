"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type TalentAuthFormProps = {
  mode: "login" | "signup";
  googleEnabled: boolean;
  linkedInEnabled: boolean;
  accountSystemReady: boolean;
  authError?: string;
};

export function TalentAuthForm({ mode, googleEnabled, linkedInEnabled, accountSystemReady, authError }: TalentAuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isSignup = mode === "signup";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isSignup) {
        const response = await fetch("/api/talent/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, email, password, privacyAccepted }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "We could not create your account.");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: "/talent/profile",
      });
      if (!result?.ok) throw new Error("We couldn’t sign you in with those details. Please check your email and password.");
      router.replace("/talent/profile");
      router.refresh();
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not complete your request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function socialSignIn(provider: "google" | "linkedin") {
    setError("");
    if (!accountSystemReady) return;
    if (isSignup && !privacyAccepted) {
      setError("Please agree to the Privacy Policy before creating an account.");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        const response = await fetch("/api/talent/consent", { method: "POST" });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "We could not confirm your privacy consent.");
      }
      await signIn(provider, { redirectTo: "/talent/profile" });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not start sign-in. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <section className="talent-auth-card">
      <div className="talent-auth-heading">
        <p className="eyebrow">{isSignup ? "Create your talent account" : "Welcome back"}</p>
        <h1>{isSignup ? "Join elliottask" : "Sign in to elliottask"}</h1>
        <p>{isSignup ? "Create an account to build your profile and explore opportunities." : "Sign in to continue to your profile and opportunities."}</p>
      </div>

      {authError && <p className="form-error" role="alert">{authError}</p>}

        {isSignup && (
          <label className="talent-auth-privacy talent-auth-social-privacy">
            <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required />
            <span>I agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link> and to receive account-related communications.</span>
          </label>
        )}

        {!accountSystemReady && (
          <p className="talent-auth-setup-note" role="status">
            Talent accounts are not configured on this deployment yet. Please try again later.
          </p>
        )}

        <div className="talent-social-buttons">
          <button type="button" onClick={() => socialSignIn("google")} disabled={!accountSystemReady || !googleEnabled || submitting}>
          <span className="social-google-mark" aria-hidden="true">G</span>
          Continue with Google
          {!googleEnabled && <small>Setup required</small>}
        </button>
        <button type="button" onClick={() => socialSignIn("linkedin")} disabled={!accountSystemReady || !linkedInEnabled || submitting}>
          <span className="social-linkedin-mark" aria-hidden="true">in</span>
          Continue with LinkedIn
          {!linkedInEnabled && <small>Setup required</small>}
        </button>
      </div>

      {accountSystemReady && (!googleEnabled || !linkedInEnabled) && (
        <p className="talent-oauth-note">
          Google or LinkedIn sign-in appears when its secure OAuth keys are configured for this site.
        </p>
      )}

      <div className="talent-auth-divider"><span>or use email</span></div>

      <form className="talent-auth-form" onSubmit={submit}>
        {isSignup && (
          <label>
            Full name
            <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} />
          </label>
        )}
        <label>
          Email
          <input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
        </label>
        <label>
          Password
          <input
            autoComplete={isSignup ? "new-password" : "current-password"}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={isSignup ? 12 : 1}
            maxLength={72}
          />
          {isSignup && <small>Use at least 12 characters.</small>}
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary talent-auth-submit" type="submit" disabled={submitting || !accountSystemReady}>
          {submitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="talent-auth-switch">
        {isSignup ? "Already have an account?" : "New to elliottask?"}{" "}
        <Link href={`/talent/auth?mode=${isSignup ? "login" : "signup"}`}>
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </section>
  );
}
