"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Brand } from "@/components/site-shell";

const roles = [
  "Fullstack",
  "Back end",
  "Front end",
  "DevOps",
  "Mobile",
  "Cybersecurity",
  "AI/ML",
  "Data Scientist",
  "Data Engineer",
  "Product",
  "Design",
  "Other",
];

const durations = ["0-3 months", "3-6 months", "6-12 months", "12+ months"];
const companySizes = ["1-24", "25-99", "100-999", "1000+"];

type CompanyHiringWizardProps = {
  hiringType: "team" | "developer";
};

export function CompanyHiringWizard({ hiringType }: CompanyHiringWizardProps) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [notes, setNotes] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role) ? current.filter((item) => item !== role) : [...current, role],
    );
  }

  function continueToReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedRoles.length === 0) {
      setError("Choose at least one role so we know what kind of support you need.");
      return;
    }
    setError("");
    setStep(2);
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const message = [
      `Hiring type: ${hiringType === "team" ? "Team" : "Developer"}`,
      `Roles: ${selectedRoles.join(", ")}`,
      `Expected duration: ${duration}`,
      `Company size: ${companySize} employees`,
      notes.trim() ? `Additional details: ${notes.trim()}` : "",
    ].filter(Boolean).join("\n");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "hire",
          name,
          email,
          company,
          subject: `Hire ${hiringType === "team" ? "a team" : "a developer"}: ${selectedRoles.slice(0, 3).join(", ")}`,
          message,
          privacyAccepted,
          website,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Your request could not be sent.");
      setSubmitted(true);
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
    <main className="hire-request-page">
      <header className="hire-request-header">
        <Brand light />
        <Link href="/hire" className="hire-request-back"><ArrowLeft aria-hidden="true" /> Back to hiring</Link>
      </header>

      <div className="hire-request-layout">
        <aside className="hire-request-intro">
          <p className="eyebrow eyebrow-on-dark"><span /> For hiring teams</p>
          <h1>Tell us what you need.<br /><span>We’ll help with the next step.</span></h1>
          <p>Share a few details about your hiring plan. Your answers help us understand the roles, timing, and team size you have in mind.</p>
          <ul>
            <li><Check aria-hidden="true" /> Developer and team hiring</li>
            <li><Check aria-hidden="true" /> Project and AI training work</li>
            <li><Check aria-hidden="true" /> Your details stay private</li>
          </ul>
        </aside>

        <section className="hire-request-form-panel" aria-label="Hiring request form">
          {submitted ? (
            <div className="hire-request-success" role="status">
              <span className="hire-request-success-icon"><Check aria-hidden="true" /></span>
              <p className="eyebrow">Request received</p>
              <h2>Thanks for sharing your hiring needs.</h2>
              <p>We’ve received your request and will follow up using your work email.</p>
              <Link className="button button-primary" href="/">Return to elliottask</Link>
            </div>
          ) : (
            <>
              <div className="hire-request-progress">
                <span className={`hire-request-progress-bar${step === 2 ? " is-complete" : ""}`} />
                <span>Step {step} of 2</span>
              </div>

              {step === 1 ? (
                <form className="hire-wizard-form" onSubmit={continueToReview}>
                  <h2>{hiringType === "team" ? "Let’s plan your ideal team" : "Let’s find your ideal developer"}</h2>
                  <label className="hire-wizard-label">
                    Your work email <span aria-hidden="true">*</span>
                    <input
                      autoComplete="email"
                      type="email"
                      name="email"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      maxLength={254}
                    />
                  </label>

                  <fieldset className="hire-wizard-fieldset">
                    <legend>Which roles describe what you’re looking to hire? <span aria-hidden="true">*</span></legend>
                    <div className="hire-role-options">
                      {roles.map((role) => (
                        <label className={`hire-role-option${selectedRoles.includes(role) ? " is-selected" : ""}`} key={role}>
                          <input
                            type="checkbox"
                            value={role}
                            checked={selectedRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                          />
                          <span>{role}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="hire-wizard-fieldset">
                    <legend>How long will you need this {hiringType === "team" ? "team" : "role"} for? <span aria-hidden="true">*</span></legend>
                    <p className="hire-wizard-help">Let us know your expected timeline.</p>
                    <div className="hire-radio-options">
                      {durations.map((item) => (
                        <label className="hire-radio-option" key={item}>
                          <input type="radio" name="duration" value={item} checked={duration === item} onChange={() => setDuration(item)} required />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="hire-wizard-fieldset">
                    <legend>How many full-time employees work at your company? <span aria-hidden="true">*</span></legend>
                    <div className="hire-radio-options">
                      {companySizes.map((item) => (
                        <label className="hire-radio-option" key={item}>
                          <input type="radio" name="companySize" value={item} checked={companySize === item} onChange={() => setCompanySize(item)} required />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="hire-wizard-label">
                    Would you like to tell us anything else? <span className="hire-wizard-optional">Optional</span>
                    <textarea
                      name="notes"
                      rows={4}
                      maxLength={1200}
                      placeholder="Share any details that will help us understand your hiring needs."
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                  </label>

                  <label className="hire-wizard-privacy">
                    <input type="checkbox" checked={privacyAccepted} onChange={(event) => setPrivacyAccepted(event.target.checked)} required />
                    <span>By continuing, I agree to the <Link href="/privacy" target="_blank">Privacy Policy</Link> and to be contacted about this request.</span>
                  </label>
                  <label className="hire-wizard-honeypot" aria-hidden="true">
                    Leave this field empty
                    <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} />
                  </label>

                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="button button-primary hire-wizard-submit" type="submit">
                    Continue <ArrowRight aria-hidden="true" />
                  </button>
                </form>
              ) : (
                <form className="hire-wizard-form" onSubmit={submitRequest}>
                  <button className="hire-wizard-back" type="button" onClick={() => setStep(1)}><ArrowLeft aria-hidden="true" /> Back to details</button>
                  <h2>Where should we send your follow-up?</h2>
                  <p className="hire-wizard-summary">{email} · {selectedRoles.join(", ")} · {duration} · {companySize} employees</p>
                  <label className="hire-wizard-label">
                    Your full name <span aria-hidden="true">*</span>
                    <input autoComplete="name" name="name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={100} />
                  </label>
                  <label className="hire-wizard-label">
                    Company name <span aria-hidden="true">*</span>
                    <input autoComplete="organization" name="company" value={company} onChange={(event) => setCompany(event.target.value)} required maxLength={120} />
                  </label>
                  {error && <p className="form-error" role="alert">{error}</p>}
                  <button className="button button-primary hire-wizard-submit" type="submit" disabled={submitting}>
                    {submitting ? "Sending…" : "Submit hiring request"} <ArrowRight aria-hidden="true" />
                  </button>
                </form>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
