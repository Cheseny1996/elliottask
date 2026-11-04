import Link from "next/link";
import type { Opportunity } from "@/lib/content";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className="opportunity-card">
      <div className="opportunity-topline">
        <span className="opportunity-type">{opportunity.type}</span>
        <span className="opportunity-location">{opportunity.location}</span>
      </div>
      <h2>{opportunity.title}</h2>
      <p className="opportunity-summary">{opportunity.summary}</p>
      <ul className="tag-row" aria-label="Required skills">
        {opportunity.skills.map((skill) => <li key={skill}>{skill}</li>)}
      </ul>
      <div className="opportunity-bottom">
        <span>{opportunity.compensation}</span>
        <Link href={`/opportunities/${opportunity.slug}`}>
          View opportunity <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </article>
  );
}
