"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Bookmark, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import type { Opportunity } from "@/lib/content";
import { opportunityTypeLabels } from "@/lib/opportunity-categories";

type TalentJobsBoardProps = {
  opportunities: Opportunity[];
  usingExamples?: boolean;
};

type SortOrder = "newest" | "title";
type ListingView = "all" | "saved";

const SAVED_OPPORTUNITIES_KEY = "elliottask-saved-opportunities";
const SAVED_OPPORTUNITIES_EVENT = "elliottask:saved-opportunities";

function subscribeToSavedOpportunities(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SAVED_OPPORTUNITIES_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SAVED_OPPORTUNITIES_EVENT, onChange);
  };
}

function getSavedOpportunitiesSnapshot() {
  try {
    return window.localStorage.getItem(SAVED_OPPORTUNITIES_KEY) ?? "[]";
  } catch {
    return "!storage-unavailable!";
  }
}

function parseSavedOpportunities(snapshot: string): string[] {
  if (snapshot === "!storage-unavailable!") {
    throw new Error("Saved jobs are unavailable because browser storage is blocked.");
  }
  const parsed: unknown = JSON.parse(snapshot);
  if (!Array.isArray(parsed) || !parsed.every((slug) => typeof slug === "string")) {
    throw new Error("Saved jobs could not be read. Clear your browser storage and try again.");
  }
  return parsed;
}

export function TalentJobsBoard({ opportunities, usingExamples = false }: TalentJobsBoardProps) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All opportunity types");
  const [location, setLocation] = useState("All locations");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [view, setView] = useState<ListingView>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [storageError, setStorageError] = useState("");
  const savedSnapshot = useSyncExternalStore(
    subscribeToSavedOpportunities,
    getSavedOpportunitiesSnapshot,
    () => "[]",
  );
  const savedState = useMemo(() => {
    try {
      return { slugs: parseSavedOpportunities(savedSnapshot), error: "" };
    } catch (error) {
      return {
        slugs: [],
        error: error instanceof Error ? error.message : "Saved jobs could not be loaded.",
      };
    }
  }, [savedSnapshot]);
  const savedSlugs = savedState.slugs;

  const types = useMemo(
    () => [...new Set(opportunities.map((opportunity) => opportunityTypeLabels[opportunity.type]))].sort(),
    [opportunities],
  );
  const locations = useMemo(
    () => [...new Set(opportunities.map((opportunity) => opportunity.location).filter(Boolean))].sort(),
    [opportunities],
  );
  const savedCount = opportunities.filter((opportunity) => savedSlugs.includes(opportunity.slug)).length;

  const filteredOpportunities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return opportunities
      .filter((opportunity) => {
        const matchesType = type === "All opportunity types" || opportunityTypeLabels[opportunity.type] === type;
        const matchesLocation = location === "All locations" || opportunity.location === location;
        const matchesSaved = view === "all" || savedSlugs.includes(opportunity.slug);
        const searchableText = [
          opportunity.title,
          opportunity.summary,
          opportunity.team,
          opportunity.location,
          ...opportunity.skills,
        ].join(" ").toLowerCase();
        return matchesType && matchesLocation && matchesSaved && (!normalizedQuery || searchableText.includes(normalizedQuery));
      })
      .sort((a, b) => sortOrder === "newest"
        ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        : a.title.localeCompare(b.title));
  }, [opportunities, query, type, location, view, savedSlugs, sortOrder]);

  function toggleSaved(slug: string) {
    const nextSaved = savedSlugs.includes(slug)
      ? savedSlugs.filter((savedSlug) => savedSlug !== slug)
      : [...savedSlugs, slug];
    try {
      window.localStorage.setItem(SAVED_OPPORTUNITIES_KEY, JSON.stringify(nextSaved));
      window.dispatchEvent(new Event(SAVED_OPPORTUNITIES_EVENT));
      setStorageError("");
    } catch {
      setStorageError("We couldn’t save this job in your browser. Check your browser storage settings and try again.");
    }
  }

  function clearFilters() {
    setQuery("");
    setType("All opportunity types");
    setLocation("All locations");
    setSortOrder("newest");
  }

  function renderSaveButton(opportunity: Opportunity) {
    const isSaved = savedSlugs.includes(opportunity.slug);
    return (
      <button
        className={`talent-job-save${isSaved ? " is-saved" : ""}`}
        type="button"
        aria-label={`${isSaved ? "Remove" : "Save"} ${opportunity.title} ${isSaved ? "from" : "to"} saved jobs`}
        aria-pressed={isSaved}
        onClick={() => toggleSaved(opportunity.slug)}
      >
        <Bookmark aria-hidden="true" size={17} />
        <span>{isSaved ? "Saved" : "Save"}</span>
      </button>
    );
  }

  return (
    <div className="talent-jobs-board">
      {usingExamples && (
        <p className="talent-jobs-example-note">
          These are illustrative listings, not confirmed openings. Verified opportunities appear when a hiring team publishes them.
        </p>
      )}
      {(storageError || savedState.error) && <p className="talent-jobs-storage-error" role="status">{storageError || savedState.error}</p>}

      <section className="talent-jobs-overview" aria-label="Opportunity overview">
        <div>
          <span className="talent-jobs-overview-label">Explore your next opportunity</span>
          <h2>Work that moves you forward.</h2>
          <p>Browse open roles, find a good match for your skills, and keep the ones you like close by.</p>
        </div>
        <div className="talent-jobs-overview-stats">
          <div><strong>{opportunities.length}</strong><span>{usingExamples ? "example roles" : "open opportunities"}</span></div>
          <div><strong>{types.length}</strong><span>opportunity categories</span></div>
          <div><strong>{savedCount}</strong><span>saved for later</span></div>
        </div>
      </section>

      <div className="talent-jobs-view-tabs" role="group" aria-label="Opportunity list">
        <button
          type="button"
          aria-pressed={view === "all"}
          className={view === "all" ? "is-active" : ""}
          onClick={() => setView("all")}
        >
          All opportunities <span>{opportunities.length}</span>
        </button>
        <button
          type="button"
          aria-pressed={view === "saved"}
          className={view === "saved" ? "is-active" : ""}
          onClick={() => setView("saved")}
        >
          Saved jobs <span>{savedCount}</span>
        </button>
      </div>

      <div className="talent-jobs-toolbar">
        <div className="talent-jobs-search">
          <Search aria-hidden="true" size={17} />
          <input
            aria-label="Search jobs"
            placeholder="Search roles, skills, or teams"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {query && (
            <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>
        <button
          className={`talent-filter-toggle${filtersOpen ? " is-active" : ""}`}
          type="button"
          aria-expanded={filtersOpen}
          aria-controls="talent-jobs-filter-panel"
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Filters <SlidersHorizontal aria-hidden="true" size={17} />
        </button>
      </div>

      {filtersOpen && (
        <div className="talent-jobs-filters" id="talent-jobs-filter-panel">
          <label>
            Opportunity type
            <select value={type} onChange={(event) => setType(event.target.value)}>
              <option>All opportunity types</option>
              {types.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Location
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              <option>All locations</option>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Sort by
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)}>
              <option value="newest">Recently added</option>
              <option value="title">Role name (A–Z)</option>
            </select>
          </label>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </div>
      )}

      <div className="talent-jobs-results-heading" aria-live="polite">
        <p><strong>{filteredOpportunities.length}</strong> {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"} found</p>
      </div>

      {filteredOpportunities.length ? (
        <>
          <div className="talent-jobs-table-wrap">
            <table className="talent-jobs-table">
              <thead>
                <tr>
                  <th scope="col">Type</th>
                  <th scope="col">Opportunity</th>
                  <th scope="col">Technologies</th>
                  <th scope="col">Compensation</th>
                  <th scope="col"><span className="visually-hidden">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredOpportunities.map((opportunity) => (
                  <tr key={opportunity.slug}>
                    <td><span className="talent-job-type">{opportunityTypeLabels[opportunity.type]}</span></td>
                    <td>
                      <Link className="talent-job-title" href={`/talent/jobs/${opportunity.slug}`}>{opportunity.title}</Link>
                      <span className="talent-job-location"><MapPin aria-hidden="true" size={13} />{opportunity.location}</span>
                    </td>
                    <td>
                      <ul className="talent-job-skills" aria-label="Technologies and skills">
                        {opportunity.skills.slice(0, 5).map((skill) => <li key={skill}>{skill}</li>)}
                        {opportunity.skills.length > 5 && <li className="talent-job-more-skills">+{opportunity.skills.length - 5}</li>}
                      </ul>
                    </td>
                    <td><span className="talent-job-compensation">{opportunity.compensation}</span></td>
                    <td className="talent-job-actions-cell">
                      {renderSaveButton(opportunity)}
                      <Link className="talent-job-details" href={`/talent/jobs/${opportunity.slug}`}>View details <span aria-hidden="true">→</span></Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="talent-jobs-cards">
            {filteredOpportunities.map((opportunity) => (
              <article className="talent-job-card" key={opportunity.slug}>
                <div className="talent-job-card-heading">
                  <span className="talent-job-type">{opportunityTypeLabels[opportunity.type]}</span>
                  {renderSaveButton(opportunity)}
                </div>
                <h2><Link href={`/talent/jobs/${opportunity.slug}`}>{opportunity.title}</Link></h2>
                <p className="talent-job-card-location"><MapPin aria-hidden="true" size={14} />{opportunity.location}</p>
                <p className="talent-job-card-summary">{opportunity.summary}</p>
                <ul className="talent-job-skills" aria-label="Technologies and skills">
                  {opportunity.skills.slice(0, 5).map((skill) => <li key={skill}>{skill}</li>)}
                  {opportunity.skills.length > 5 && <li className="talent-job-more-skills">+{opportunity.skills.length - 5}</li>}
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
          <span className="talent-jobs-empty-icon"><Bookmark aria-hidden="true" size={23} /></span>
          <h2>{view === "saved" && !savedSlugs.length ? "Your saved jobs will appear here" : "No matching opportunities"}</h2>
          <p>{view === "saved" && !savedSlugs.length
            ? "Save a role that interests you and come back to it whenever you’re ready."
            : "Try a different search, change the filters, or explore all opportunities."}</p>
          <button type="button" onClick={() => { setView("all"); clearFilters(); }}>Explore all opportunities</button>
        </div>
      )}
    </div>
  );
}
