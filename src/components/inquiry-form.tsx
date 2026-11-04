"use client";

import { useState } from "react";
import Link from "next/link";

type InquiryKind = "hire" | "quote" | "talent";

type InquiryFormProps = {
  kind: InquiryKind;
  opportunity?: string;
  compact?: boolean;
};

const formCopy: Record<InquiryKind, { title: string; submit: string; success: string }> = {
  hire: {
    title: "Tell us what your team needs",
    submit: "Request an introduction",
    success: "Thanks — your hiring request has been received.",
  },
  quote: {
    title: "Get a project estimate",
    submit: "Request a quote",
    success: "Thanks — your project request has been received.",
  },
  talent: {
    title: "Start your talent profile",
    submit: "Send my interest",
    success: "Thanks — your interest has been received.",
  },
};

export function InquiryForm({ kind, opportunity = "", compact = false }: InquiryFormProps) {
  const copy = formCopy[kind];
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setMessage("");
    setError("");
    setSubmitting(true);

    const formData = new FormData(form);
    const payload = {
      kind,
      opportunity,
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      subject: String(formData.get("subject") ?? ""),
      message: String(formData.get("message") ?? ""),
      privacyAccepted: formData.has("privacyAccepted"),
      website: String(formData.get("website") ?? ""),
    };

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Your request could not be sent.");
      form.reset();
      setMessage(copy.success);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Your request could not be sent. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className={`inquiry-form${compact ? " inquiry-form-compact" : ""}`} onSubmit={submit}>
      <h2>{copy.title}</h2>
      <div className="form-grid">
        <label>
          Your name
          <input autoComplete="name" name="name" required maxLength={100} />
        </label>
        <label>
          Work email
          <input autoComplete="email" name="email" type="email" required maxLength={254} />
        </label>
        {kind !== "talent" && (
          <label>
            Company
            <input autoComplete="organization" name="company" maxLength={120} />
          </label>
        )}
        {kind === "hire" && (
          <label>
            Hiring need
            <select name="subject" defaultValue="">
              <option value="" disabled>Select one</option>
              <option>Full-time specialist</option>
              <option>Project team</option>
              <option>AI evaluation work</option>
              <option>Not sure yet</option>
            </select>
          </label>
        )}
        {kind === "talent" && (
          <label>
            Primary focus
            <select name="subject" defaultValue="">
              <option value="" disabled>Select one</option>
              <option>Full-stack engineering</option>
              <option>AI evaluation</option>
              <option>Data and machine learning</option>
              <option>Other technical work</option>
            </select>
          </label>
        )}
        <label className="field-full">
          {kind === "talent" ? "Skills and experience" : "What are you looking for?"}
          <textarea
            name="message"
            rows={5}
            required
            minLength={20}
            maxLength={5000}
            placeholder="Share the goals, timing, and context that would help us understand your request."
          />
        </label>
      </div>
      <label className="honeypot" aria-hidden="true">
        Leave this field empty
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="privacy-check">
        <input name="privacyAccepted" type="checkbox" required />
        <span>I agree to be contacted about this request and understand my information will be used to respond. See our <Link href="/privacy">privacy information</Link>.</span>
      </label>
      {message && <p className="form-success" role="status">{message}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary" type="submit" disabled={submitting}>
        {submitting ? "Sending…" : copy.submit} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
