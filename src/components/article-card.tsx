import Link from "next/link";
import type { Article } from "@/lib/content";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      <div className="article-card-art" aria-hidden="true"><span>{article.category.slice(0, 2).toUpperCase()}</span></div>
      <div className="article-card-body">
        <div className="article-meta"><span>{article.category}</span><time dateTime={article.publishedAt.toISOString()}>{article.publishedAt.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</time></div>
        <h3><Link href={`/articles/${article.slug}`}>{article.title}</Link></h3>
        <p>{article.excerpt}</p>
        <Link className="text-link" href={`/articles/${article.slug}`}>Read article <span aria-hidden="true">↗</span></Link>
      </div>
    </article>
  );
}
