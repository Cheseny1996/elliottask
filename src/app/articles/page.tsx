import type { Metadata } from "next";
import { ArticleCard } from "@/components/article-card";
import { SiteShell } from "@/components/site-shell";
import { getPublishedArticles } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Ideas for Better Work",
  description:
    "Original notes on technical hiring, distributed collaboration, software quality, and AI evaluation.",
  alternates: { canonical: "/articles" },
};

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const articles = await getPublishedArticles();
  return (
    <SiteShell>
      <section className="page-hero page-hero-ink">
        <div className="container">
          <p className="eyebrow eyebrow-on-dark"><span /> The Elliottask journal</p>
          <h1>Useful ideas for<br />better <span>work.</span></h1>
          <p>Practical perspectives on building teams, evaluating software, and collaborating across distance.</p>
        </div>
      </section>
      <section className="section section-pale">
        <div className="container">
          <p className="sample-note">Editorial notes are original and informational. Opportunity details are published separately and may change.</p>
          <div className="article-grid">
            {articles.map((article) => <ArticleCard key={article.slug} article={article} />)}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
