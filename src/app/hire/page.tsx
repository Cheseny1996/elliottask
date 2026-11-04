import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Check, Code2, Layers3, Sparkles } from "lucide-react";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Hire Developers and Build Your Team",
  description:
    "Tell Elliottask what your team needs and explore developer hiring, project teams, and AI training support.",
  alternates: { canonical: "/hire" },
};

type HirePageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HirePage({ searchParams }: HirePageProps) {
  const { type } = await searchParams;
  const hireTeam = type !== "developer";

  return (
    <SiteShell>
      <section className="company-hire-hero">
        <div className="container company-hire-grid">
          <div className="company-hire-copy">
            <p className="eyebrow eyebrow-on-dark"><span /> Technology talent and project work</p>
            <h1>{hireTeam ? <>Build your team<br />with the right<br /><span>developers.</span></> : <>Hire skilled<br />developers for<br /><span>what’s next.</span></>}</h1>
            <p className="company-hire-lede">
              Whether you need one specialist or a coordinated team, start with the skills,
              scope, and timeline that fit your work.
            </p>
            <ul className="company-hire-points">
              <li><Check aria-hidden="true" /> Full-time and contract developers</li>
              <li><Check aria-hidden="true" /> Project teams for defined outcomes</li>
              <li><Check aria-hidden="true" /> AI training and evaluation support</li>
            </ul>
            <div className="company-hire-actions">
              <Link className="button button-primary" href={`/hire/request?type=${hireTeam ? "team" : "developer"}`}>
                Hire {hireTeam ? "a team" : "developers"} <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link className="button button-dark-outline" href="/hire/request?type=team">Tell us what you need</Link>
            </div>
            <p className="company-hire-note">Share your requirements first; there’s no obligation to hire.</p>
          </div>
          <div className="company-hire-art" aria-label="Examples of technology roles and projects">
            <div className="company-hire-orbit" />
            <article className="hire-role-card hire-role-card-one">
              <span className="hire-role-icon"><Code2 aria-hidden="true" /></span>
              <div><small>ENGINEERING</small><strong>Full-stack developer</strong><span>Product · Web platform</span></div>
              <span className="hire-role-dot" />
            </article>
            <article className="hire-role-card hire-role-card-two">
              <span className="hire-role-icon hire-role-icon-cyan"><Sparkles aria-hidden="true" /></span>
              <div><small>AI PROJECT</small><strong>Model evaluation team</strong><span>Review · Quality workflows</span></div>
              <span className="hire-role-dot" />
            </article>
            <article className="hire-role-card hire-role-card-three">
              <span className="hire-role-icon hire-role-icon-gold"><Layers3 aria-hidden="true" /></span>
              <div><small>PROJECT WORK</small><strong>Data platform build</strong><span>Scoped · Collaborative</span></div>
              <span className="hire-role-dot" />
            </article>
            <span className="hire-art-caption">PEOPLE × PROJECTS × PROGRESS</span>
          </div>
        </div>
      </section>
      <section className="section section-pale company-hire-options">
        <div className="container form-page-grid">
          <div className="form-page-copy">
            <p className="eyebrow">A useful first step</p>
            <h2>Start with your<br /><span>hiring brief.</span></h2>
            <p>Tell us about the roles, expected duration, and team size. We’ll use your answers to understand what kind of support may fit.</p>
            <div className="process-note"><span>01</span><p><strong>Hire a developer</strong>Describe the role, skills, and experience your team is looking for.</p></div>
            <div className="process-note"><span>02</span><p><strong>Hire a team</strong>Share the roles, timeline, and company size for your project or hiring plan.</p></div>
            <div className="process-note"><span>03</span><p><strong>AI training projects</strong>Tell us about AI/ML, data, evaluation, and review work.</p></div>
          </div>
          <div className="company-hire-choice-card">
            <p className="eyebrow">Choose how to continue</p>
            <h3>What are you looking to hire?</h3>
            <Link className="company-hire-choice" href="/hire/request?type=team">
              <span><strong>Hire a team</strong><small>Plan a group of specialists for your project.</small></span><ArrowUpRight aria-hidden="true" />
            </Link>
            <Link className="company-hire-choice" href="/hire/request?type=developer">
              <span><strong>Hire a developer</strong><small>Find a specialist for your product or team.</small></span><ArrowUpRight aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
