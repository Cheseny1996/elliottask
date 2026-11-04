import type { Metadata } from "next";
import { InquiryForm } from "@/components/inquiry-form";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Join the elliottask Talent Network",
  description:
    "Share your skills and interests to explore remote engineering, data, and AI project opportunities.",
  alternates: { canonical: "/for-talent" },
};

export default function ForTalentPage() {
  return (
    <SiteShell>
      <section className="page-hero page-hero-ink">
        <div className="container">
          <p className="eyebrow eyebrow-on-dark"><span /> For independent talent</p>
          <h1>Let your work open<br />the next <span>door.</span></h1>
          <p>Share the kinds of problems you solve and the way you like to work. A profile starts a conversation—it does not guarantee a placement.</p>
        </div>
      </section>
      <section className="section section-pale">
        <div className="container form-page-grid">
          <div className="form-page-copy">
            <p className="eyebrow">A useful introduction</p>
            <h2>Show us what<br />you bring <span>to the work.</span></h2>
            <p>Include a concise skills summary, relevant experience, preferred engagement, and links you are comfortable sharing. Never include passwords, identity documents, or private client data.</p>
            <div className="process-note"><span>01</span><p><strong>Share your focus</strong>Tell us about your technical strengths and the work you want.</p></div>
            <div className="process-note"><span>02</span><p><strong>Review the details</strong>We’ll follow up with questions and any relevant opportunity information.</p></div>
            <div className="process-note"><span>03</span><p><strong>Decide together</strong>Confirm responsibilities and terms before accepting an engagement.</p></div>
          </div>
          <div className="form-card"><InquiryForm kind="talent" /></div>
        </div>
      </section>
    </SiteShell>
  );
}
