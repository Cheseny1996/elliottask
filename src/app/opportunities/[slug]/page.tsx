import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InquiryForm } from "@/components/inquiry-form";
import { SiteShell } from "@/components/site-shell";
import { getOpportunityBySlug } from "@/lib/queries";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) return { title: "Opportunity not found" };
  return {
    title: `${opportunity.title} | Elliottask Opportunities`,
    description: opportunity.summary,
    alternates: { canonical: `/opportunities/${opportunity.slug}` },
    openGraph: { title: opportunity.title, description: opportunity.summary, type: "article" },
  };
}

export default async function OpportunityPage({ params }: Props) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) notFound();

  return (
    <SiteShell>
      <section className="page-hero page-hero-ink detail-hero">
        <div className="container">
          <Link className="back-link back-link-light" href="/opportunities">← All opportunities</Link>
          <div className="opportunity-topline"><span className="opportunity-type">{opportunity.type}</span><span>{opportunity.location}</span></div>
          <h1>{opportunity.title}</h1>
          <p>{opportunity.summary}</p>
          <div className="detail-meta"><span><small>TEAM</small>{opportunity.team}</span><span><small>COMPENSATION</small>{opportunity.compensation}</span></div>
        </div>
      </section>
      <section className="section section-pale">
        <div className="container detail-layout">
          <article className="detail-copy">
            <p className="eyebrow">About the opportunity</p>
            <h2>Make an impact<br />with <span>clear expectations.</span></h2>
            <p>{opportunity.description}</p>
            <h3>Skills and experience</h3>
            <ul className="tag-row">{opportunity.skills.map((skill) => <li key={skill}>{skill}</li>)}</ul>
            <p className="sample-note">Before accepting work, confirm the scope, compensation, timeline, and contract directly with the hiring team.</p>
          </article>
          <aside className="detail-form-card"><InquiryForm kind="talent" opportunity={opportunity.title} compact /></aside>
        </div>
      </section>
    </SiteShell>
  );
}
