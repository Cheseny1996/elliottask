import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Privacy Information",
  description: "How elliottask handles contact form, talent profile, and privacy-minimal site analytics data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <SiteShell>
      <section className="page-hero page-hero-ink"><div className="container"><p className="eyebrow eyebrow-on-dark">Privacy</p><h1>Your information,<br /><span>handled with care.</span></h1></div></section>
      <section className="section section-white"><div className="container article-narrow privacy-copy">
        <h2>Information submitted to elliottask</h2>
        <p>When you submit a hiring request or talent profile, elliottask stores the details you provide so the team can review and respond. Access to these requests is restricted to authenticated administrators.</p>
        <h2>Site usage measurement</h2>
        <p>elliottask uses a first-party random browser identifier to count daily unique visitors and page views. The identifier is transformed into a one-way hash before storage; page paths are validated and are not retained with the visitor record. This measurement is used to understand aggregate site usage, not to identify you.</p>
        <h2>What to leave out</h2>
        <p>Do not include account passwords, payment-card information, identity documents, or confidential information belonging to another person or organization.</p>
        <h2>Questions or removal requests</h2>
        <p>Use the contact details provided in your conversation with elliottask to request an update or deletion of a submission. A production launch should add the operator’s verified privacy contact and applicable jurisdiction-specific notices.</p>
      </div></section>
    </SiteShell>
  );
}
