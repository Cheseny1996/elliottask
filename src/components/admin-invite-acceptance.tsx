"use client";

import Link from "next/link";
import { useState } from "react";
import { Brand, BrandMark } from "@/components/site-shell";

type Props = { token: string };

export function AdminInviteAcceptance({ token }: Props) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);

  async function acceptInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/admin/accept-invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, name, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "The invitation could not be accepted.");
      setComplete(true);
      setPassword("");
      setConfirmation("");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "The invitation could not be accepted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-login">
      <Brand />
      <div className="admin-login-mark"><BrandMark /></div>
      <p className="eyebrow">elliottask workspace</p>
      {complete ? (
        <>
          <h1>Your staff account is ready</h1>
          <p>You can now sign in with your invited email and the password you just created.</p>
          <Link className="button button-primary admin-invite-login-link" href="/admin">Go to administrator sign in</Link>
        </>
      ) : (
        <>
          <h1>Accept your invitation</h1>
          <p>Create a secure password to activate your department account. This link can be used once.</p>
          <form className="admin-login-form" onSubmit={acceptInvitation}>
            <label>Your name<input autoComplete="name" maxLength={100} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} /></label>
            <label>Password<input type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} maxLength={72} /><small>Use at least 12 characters.</small></label>
            <label>Confirm password<input type="password" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required minLength={12} maxLength={72} /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" disabled={busy || !token}>{busy ? "Activating account…" : "Accept invitation"}</button>
          </form>
          {!token && <p className="form-error" role="alert">This invitation link is missing its security token. Ask your Super Admin for a new invitation.</p>}
        </>
      )}
    </section>
  );
}
