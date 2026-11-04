import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Code2, Database, Sparkles } from "lucide-react";
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
      <section className="careers-hero">
        <div className="container careers-hero-grid">
          <div className="careers-hero-copy">
            <p className="eyebrow eyebrow-on-dark"><span /> For technologists and AI specialists</p>
            <h1>Build your next<br />chapter through<br /><span>meaningful work.</span></h1>
            <p>Explore full-time roles, focused projects, and AI training tasks. Create a profile to share your skills and see the opportunities currently listed.</p>
            <ul>
              <li><Check aria-hidden="true" /> Full-time and project-based work</li>
              <li><Check aria-hidden="true" /> AI, data, and machine-learning tasks</li>
              <li><Check aria-hidden="true" /> Browse details before you apply</li>
            </ul>
            <div className="careers-hero-actions">
              <Link className="button button-primary" href="/talent/auth?mode=signup">Apply now <ArrowUpRight aria-hidden="true" /></Link>
              <Link className="button button-dark-outline" href="/opportunities">See open opportunities</Link>
            </div>
            <p className="careers-hero-note">Create your account, complete your profile, then explore available roles and projects.</p>
          </div>
          <div className="careers-hero-art" aria-label="Examples of technology and AI work">
            <div className="careers-orbit" />
            <article className="careers-work-card careers-work-card-one">
              <span className="careers-work-icon"><Code2 aria-hidden="true" /></span>
              <div><small>ENGINEERING</small><strong>Full-stack developer</strong><span>Product · Full-time</span></div>
              <ArrowUpRight aria-hidden="true" />
            </article>
            <article className="careers-work-card careers-work-card-two">
              <span className="careers-work-icon careers-work-icon-violet"><Sparkles aria-hidden="true" /></span>
              <div><small>AI TRAINING</small><strong>AI response reviewer</strong><span>Evaluation · Project</span></div>
              <ArrowUpRight aria-hidden="true" />
            </article>
            <article className="careers-work-card careers-work-card-three">
              <span className="careers-work-icon careers-work-icon-gold"><Database aria-hidden="true" /></span>
              <div><small>DATA &amp; ML</small><strong>Data analyst</strong><span>Insights · Contract</span></div>
              <ArrowUpRight aria-hidden="true" />
            </article>
            <span className="careers-art-caption">SKILLS · PROJECTS · OPPORTUNITY</span>
          </div>
        </div>
      </section>
      <section className="section section-pale careers-next-steps">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Your next steps</p><h2>From profile to<br /><span>opportunity.</span></h2></div>
            <p>Create a profile to introduce your experience, then explore the roles and projects listed on Elliottask.</p>
          </div>
          <div className="careers-steps">
            <article><span>01</span><h3>Create your account</h3><p>Sign up with email and password, Google, or LinkedIn.</p></article>
            <article><span>02</span><h3>Complete your profile</h3><p>Add your skills, experience, preferred work, and links.</p></article>
            <article><span>03</span><h3>Explore opportunities</h3><p>Browse open listings and review each role’s details.</p></article>
          </div>
          <div className="careers-bottom-cta">
            <p>Ready to take a look?</p>
            <div>
              <Link className="button button-primary" href="/talent/auth?mode=signup">Join as an expert <ArrowRight aria-hidden="true" /></Link>
              <Link className="careers-text-link" href="/opportunities">Browse opportunities <ArrowUpRight aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
