import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight, Code2, Layers3, Sparkles } from "lucide-react";
import { ArticleCard } from "@/components/article-card";
import { OpportunityCard } from "@/components/opportunity-card";
import { SiteShell } from "@/components/site-shell";
import { getPublishedArticles, getPublishedOpportunities } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [opportunities, articles] = await Promise.all([
    getPublishedOpportunities(),
    getPublishedArticles(),
  ]);

  return (
    <SiteShell>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow eyebrow-on-dark"><span /> A better way to do good work</p>
            <h1>Find your next<br />meaningful <span>move.</span></h1>
            <p className="hero-lede">
              A thoughtful network for technology teams and independent talent.
              Find a long-term role, take on a focused project, or bring in the
              right specialist.
            </p>
            <ul className="hero-promises">
              <li><Check aria-hidden="true" /> Full-time roles and scoped project work</li>
              <li><Check aria-hidden="true" /> AI evaluation tasks with clear review criteria</li>
              <li><Check aria-hidden="true" /> A human introduction, without the noise</li>
            </ul>
            <div className="hero-actions">
              <Link className="button button-primary" href="/for-talent">
                Explore talent opportunities <ArrowUpRight aria-hidden="true" />
              </Link>
              <Link className="button button-dark-outline" href="/hire">
                Find a specialist
              </Link>
            </div>
            <p className="hero-note">A starting point for your next good collaboration.</p>
          </div>
          <div className="hero-art" aria-label="Illustration of a talent profile and matched work">
            <div className="hero-art-orbit hero-art-orbit-one" />
            <div className="hero-art-orbit hero-art-orbit-two" />
            <div className="profile-float">
              <div className="profile-avatar">AM</div>
              <div><strong>Alex Morgan</strong><span>Product-minded engineer</span></div>
              <span className="verified-mark"><Check size={14} /></span>
              <div className="profile-skills"><span>TypeScript</span><span>React</span><span>Node.js</span></div>
            </div>
            <div className="match-card">
              <div className="match-card-head"><strong>Opportunities to explore</strong><span>CURATED</span></div>
              <div className="match-row">
                <span className="match-icon"><Code2 /></span>
                <div><strong>Full-stack engineer</strong><small>Product team · Full-time</small></div>
                <ChevronRight />
              </div>
              <div className="match-row">
                <span className="match-icon match-icon-cyan"><Sparkles /></span>
                <div><strong>AI code evaluation</strong><small>Applied AI · Project</small></div>
                <ChevronRight />
              </div>
              <div className="match-row">
                <span className="match-icon match-icon-gold"><Layers3 /></span>
                <div><strong>Data platform build</strong><small>Infrastructure · Contract</small></div>
                <ChevronRight />
              </div>
              <div className="match-foot"><span className="status-dot" /> Clear scope. Direct conversation.</div>
            </div>
            <div className="floating-note"><span className="floating-note-symbol">↗</span><span><b>Built around people</b><small>Not just job titles.</small></span></div>
            <span className="hero-coordinate">TALENT × OPPORTUNITY / 01</span>
          </div>
        </div>
        <div className="container hero-bottom">
          <span>FULL-TIME ROLES</span><i /><span>PROJECT-BASED WORK</span><i /><span>AI EVALUATION</span><i /><span>HUMAN-CENTERED MATCHING</span>
        </div>
      </section>

      <section className="section section-pale" aria-labelledby="pathways-title">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Two ways to move forward</p><h2 id="pathways-title">Choose the work<br />that fits <span>your next chapter.</span></h2></div>
            <p>One place to find a lasting team or bring your expertise to a clearly defined challenge.</p>
          </div>
          <div className="pathway-grid">
            <article className="pathway-card">
              <div className="pathway-illustration pathway-illustration-hire"><div className="illustration-shape shape-main" /><div className="illustration-shape shape-a" /><div className="illustration-shape shape-b" /><div className="illustration-path" /></div>
              <div className="pathway-content">
                <span className="card-kicker">FOR TEAMS</span>
                <h3>Build the team you need.</h3>
                <p>Meet experienced specialists for full-time roles or a scoped project. Set the goals, working model, and budget up front.</p>
                <ul className="check-list"><li><Check /> Direct, considered introductions</li><li><Check /> Clear scope and expectations</li><li><Check /> Flexible engagement models</li></ul>
                <Link className="text-link" href="/hire">Talk through a hiring need <ArrowUpRight /></Link>
              </div>
            </article>
            <article className="pathway-card">
              <div className="pathway-illustration pathway-illustration-work"><div className="illustration-panel" /><div className="illustration-column col-one" /><div className="illustration-column col-two" /><div className="illustration-column col-three" /></div>
              <div className="pathway-content">
                <span className="card-kicker">FOR SPECIALISTS</span>
                <h3>Put your skills to work.</h3>
                <p>Explore remote roles, focused projects, and AI evaluation tasks. Review the details before you decide what fits.</p>
                <ul className="check-list"><li><Check /> Full-time and project opportunities</li><li><Check /> Flexible, remote collaboration</li><li><Check /> No fee to express interest</li></ul>
                <Link className="text-link" href="/opportunities">Browse opportunities <ArrowUpRight /></Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section section-ink" aria-labelledby="how-title">
        <div className="container">
          <div className="section-heading section-heading-ink">
            <div><p className="eyebrow eyebrow-on-dark">A clearer path from hello to done</p><h2 id="how-title">Good work starts<br />with <span>good context.</span></h2></div>
            <p>Whether you are hiring or looking for your next challenge, the process is designed to keep expectations clear at every step.</p>
          </div>
          <div className="steps-grid">
            {[
              ["01", "Share what matters", "Tell us about your goals, skills, constraints, and preferred way of working."],
              ["02", "Review the fit", "We clarify the scope and connect the right people for a useful first conversation."],
              ["03", "Agree on the details", "Confirm responsibilities, timeline, compensation, and how success will be measured."],
              ["04", "Get to meaningful work", "Move forward with a shared plan, clear communication, and a thoughtful handoff."],
            ].map(([number, title, copy]) => (
              <article className="step-card" key={number}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-white" aria-labelledby="opportunities-title">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">A few ways to get started</p><h2 id="opportunities-title">Work worth<br /><span>taking a closer look.</span></h2></div>
            <Link className="text-link" href="/opportunities">See all opportunities <ArrowUpRight /></Link>
          </div>
          <p className="sample-note">Example listings are shown until an administrator publishes verified opportunities.</p>
          <div className="opportunity-grid">
            {opportunities.slice(0, 3).map((opportunity) => <OpportunityCard key={opportunity.slug} opportunity={opportunity} />)}
          </div>
        </div>
      </section>

      <section className="section section-pale" aria-labelledby="editorial-title">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Notes for better work</p><h2 id="editorial-title">Practical ideas,<br /><span>shared with care.</span></h2></div>
            <Link className="text-link" href="/articles">Visit the journal <ArrowUpRight /></Link>
          </div>
          <div className="article-grid">
            {articles.slice(0, 3).map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="container closing-inner">
          <div><p className="eyebrow eyebrow-on-dark">Make the next move count</p><h2>Bring your next<br />good idea <span>to life.</span></h2></div>
          <div className="closing-actions"><p>Tell us what you are building, or what kind of challenge you want to take on.</p><div><Link className="button button-primary" href="/hire">Hire a specialist <ArrowUpRight /></Link><Link className="button button-dark-outline" href="/for-talent">Join the network</Link></div></div>
        </div>
      </section>
    </SiteShell>
  );
}
