"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { Opportunity } from "@/lib/content";

type TalentJobsBoardProps = {
  opportunities: Opportunity[];
  usingExamples?: boolean;
};

const typeLabels: Record<Opportunity["type"], string> = {
  "AI task": "AI training",
  Project: "Project",
  "Full-time": "Full-time",
};

export function TalentJobsBoard({ opportunities, usingExamples = false }: TalentJobsBoardProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All opportunities");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return opportunities.filter((opportunity) => {
      const matchesType = type === "All opportunities" || typeLabels[opportunity.type] === type;
      const searchableText = [
        opportunity.title,
        opportunity.summary,
        opportunity.team,
        opportunity.location,
        ...opportunity.skills,
      ].join(" ").toLowerCase();
      return matchesType && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [opportunities, query, type]);

  return (
    <div className="talent-jobs-board">
      {usingExamples && (
        <p className="talent-jobs-example-note">
          These are illustrative listings, not confirmed openings. Verified opportunities appear when a hiring team publishes them.
        </p>
      )}
      <div className="talent-jobs-toolbar">
        <div className="talent-jobs-search">
          <Search aria-hidden="true" size={17} />
          <input
            aria-label="Search jobs"
            placeholder="Search opportunities or skills"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <button
          className={`talent-filter-toggle${filtersOpen ? " is-active" : ""}`}
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters <SlidersHorizontal aria-hidden="true" size={17} />
        </button>
      </div>

      {filtersOpen && (
        <div className="talent-jobs-filters">
          <label>
            Opportunity type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All opportunities</option>
              <option>AI training</option>
              <option>Project</option>
              <option>Full-time</option>
            </select>
          </label>
          <button type="button" onClick={() => { setType("All opportunities"); setQuery(""); }}>Clear filters</button>
        </div>
      )}

      {filteredOpportunities.length ? (
        <>
          <div className="talent-jobs-table-wrap">
            <table className="talent-jobs-table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Opportunity</th>
                  <th scope="col">Skills</th>
                  <th scope="col">Compensation</th>
                  <th scope="col"><span className="visually-hidden">Details</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.slug}>
                    <td><span className="talent-job-type">{typeLabels[opportunity.type]}</span></td>
                    <td>
                      <Link className="talent-job-title" href={`/talent/jobs/${opportunity.slug}`}>{opportunity.title}</Link>
                      <span className="talent-job-location">{opportunity.location}</span>
                    </td>
                    <td>
                      <ul className="talent-job-skills" aria-label="Skills">
                        {opportunity.skills.slice(0, 5).map((skill) => <li key={skill}>{skill}</li>)}
                      </ul>
                    </td>
                    <td><span className="talent-job-compensation">{opportunity.compensation}</span></td>
                    <td><Link className="talent-job-details" href={`/talent/jobs/${opportunity.slug}`}>View details <span aria-hidden="true">→</span></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="talent-jobs-cards">
            {filteredOpportunities.map((opportunity) => (
              <article className="talent-job-card" key={opportunity.slug}>
                <span className="talent-job-type">{typeLabels[opportunity.type]}</span>
                <h2><Link href={`/talent/jobs/${opportunity.slug}`}>{opportunity.title}</Link></h2>
                <p>{opportunity.location}</p>
                <ul className="talent-job-skills" aria-label="Skills">
                  {opportunity.skills.slice(0, 5).map((skill) => <li key={skill}>{skill}</li>)}
                </ul>
                <div className="talent-job-card-footer">
                  <span>{opportunity.compensation}</span>
                  <Link className="talent-job-details" href={`/talent/jobs/${opportunity.slug}`}>View details <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : (
        <div className="talent-jobs-empty">
          <h2>No matching opportunities</h2>
          <p>Try a different search or clear the selected filters.</p>
          <button type="button" onClick={() => { setType("All opportunities"); setQuery(""); }}>Clear search and filters</button>
        </div>
      )}
    </div>
  );
}
