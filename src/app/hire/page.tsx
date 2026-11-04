import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Hire Technology Talent",
  description:
    "Share your hiring or project needs and request a thoughtful introduction to technology specialists.",
  alternates: { canonical: "/hire" },
};

export default function HirePage() {
  return (
    <SiteShell>
      <section className="page-hero page-hero-ink">
        <div className="container">
          <p className="eyebrow eyebrow-on-dark"><span /> For hiring teams</p>
          <h1>Find the right people<br />for the work <span>ahead.</span></h1>
          <p>Tell us about your team, project, timeline, and budget. We’ll use that context to help you explore a useful next step.</p>
        </div>
      </section>
      <section className="section section-pale">
        <div className="container form-page-grid">
          <div className="form-page-copy">
            <p className="eyebrow">Start with a conversation</p>
            <h2>Good matches begin<br />with <span>the real brief.</span></h2>
            <p>Share the outcome you need, the skills involved, and how you expect the team to work together. We’ll follow up to discuss scope and fit.</p>
            <div className="process-note"><span>01</span><p><strong>Full-time hiring</strong>Share the role, experience, location, and compensation range.</p></div>
            <div className="process-note"><span>02</span><p><strong>Project or quote</strong>Describe the deliverables, access, timeline, and acceptance criteria.</p></div>
            <div className="process-note"><span>03</span><p><strong>AI evaluation</strong>Outline the task types, review rubric, expected volume, and quality bar.</p></div>
          </div>
          <div className="form-card"><InquiryForm kind="hire" /></div>
        </div>
      </section>
    </SiteShell>
  );
}
