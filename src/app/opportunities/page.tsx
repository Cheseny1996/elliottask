import type { Metadata } from "next";
import Link from "next/link";
import { OpportunityCard } from "@/components/opportunity-card";
import { SiteShell } from "@/components/site-shell";
import { getPublishedOpportunities } from "@/lib/queries";
import { isDatabaseConfigured } from "@/lib/db";

export const metadata: Metadata = {
  title: "Remote Engineering and AI Opportunities",
  description:
    "Explore full-time engineering roles, project-based work, and AI evaluation opportunities on Elliottask.",
  alternates: { canonical: "/opportunities" },
};

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage() {
  const opportunities = await getPublishedOpportunities();
  const usingExamples = !isDatabaseConfigured();

  return (
    <SiteShell>
      <section className="page-hero page-hero-ink">
        <div className="container">
          <p className="eyebrow eyebrow-on-dark"><span /> Opportunity board</p>
          <h1>Find work that<br />fits <span>how you work.</span></h1>
          <p>Remote roles, defined projects, and AI tasks—presented with the context you need to make an informed choice.</p>
          <Link className="button button-primary" href="/for-talent">Share your experience <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
      <section className="section section-pale">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Browse the board</p><h2>Opportunities with<br /><span>room to do good work.</span></h2></div>
            <p>Read the scope, skills, working model, and compensation details. Ask questions before agreeing to any work.</p>
          </div>
          {usingExamples && <div className="notice-banner"><strong>Example listings</strong><span>These illustrative entries are not confirmed job openings. Verified opportunities appear here after an administrator publishes them.</span></div>}
          {opportunities.length ? (
            <div className="opportunity-grid">
              {opportunities.map((opportunity) => <OpportunityCard key={opportunity.slug} opportunity={opportunity} />)}
            </div>
          ) : (
            <div className="empty-state"><h3>No open opportunities just yet.</h3><p>Share your skills and we’ll be ready when a suitable role is published.</p><Link className="button button-primary" href="/for-talent">Join the network</Link></div>
          )}
        </div>
      </section>
      <section className="section section-white">
        <div className="container section-split">
          <div><p className="eyebrow">No rush to decide</p><h2>Understand the work<br />before you <span>say yes.</span></h2></div>
          <p>Each opportunity should clearly describe the outcome, team, compensation, and next steps. If a listing is missing information, request clarification before sharing sensitive details or starting work.</p>
        </div>
      </section>
    </SiteShell>
  );
}
