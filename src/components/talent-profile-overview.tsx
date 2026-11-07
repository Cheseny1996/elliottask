"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, CircleUserRound, BriefcaseBusiness, Languages, Link2, MapPin, Sparkles } from "lucide-react";
import { TalentPortalHeader } from "@/components/talent-portal-header";

type ProfileData = {
  name: string;
  email: string;
  profile: {
    headline?: string;
    location?: string;
    bio?: string;
    skills?: string[];
    yearsExperience?: string;
    workPreference?: string;
    availability?: string;
    portfolioUrl?: string;
    linkedinUrl?: string;
    resumeUrl?: string;
  };
};

type ProfileItem = {
  label: string;
  description: string;
  complete: boolean;
  icon: typeof CircleUserRound;
};

export function TalentProfileOverview() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/talent/profile");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "We could not load your profile.");
        if (active) setData(result as ProfileData);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "We could not load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, []);

  const sections = useMemo(() => {
    if (!data) return [];
    const profile = data.profile ?? {};
    const groups: { title: string; items: ProfileItem[] }[] = [
      {
        title: "About me",
        items: [
          { label: "Full name", description: data.name || "Add your name", complete: Boolean(data.name.trim()), icon: CircleUserRound },
          { label: "Location", description: profile.location || "Add your location or time zone", complete: Boolean(profile.location?.trim()), icon: MapPin },
          { label: "Introduction", description: profile.bio ? "Your professional introduction is saved" : "Tell teams about your experience", complete: Boolean(profile.bio?.trim()), icon: Sparkles },
        ],
      },
      {
        title: "Professional profile",
        items: [
          { label: "Career information", description: profile.headline || "Add a professional headline", complete: Boolean(profile.headline?.trim()), icon: BriefcaseBusiness },
          { label: "LinkedIn", description: profile.linkedinUrl || "Connect your LinkedIn profile", complete: Boolean(profile.linkedinUrl?.trim()), icon: Link2 },
          { label: "Portfolio", description: profile.portfolioUrl || "Add work samples or a portfolio link", complete: Boolean(profile.portfolioUrl?.trim()), icon: Link2 },
        ],
      },
      {
        title: "Skills and experience",
        items: [
          { label: "Skills", description: profile.skills?.length ? profile.skills.join(", ") : "Add your skills", complete: Boolean(profile.skills?.length), icon: Sparkles },
          { label: "Work experience", description: profile.yearsExperience ? `${profile.yearsExperience} years of experience` : "Add your experience level", complete: Boolean(profile.yearsExperience), icon: BriefcaseBusiness },
          { label: "Work preferences", description: profile.workPreference || "Choose the work that suits you", complete: Boolean(profile.workPreference && profile.availability), icon: Languages },
          { label: "Resume", description: profile.resumeUrl || "Add a resume link (optional)", complete: Boolean(profile.resumeUrl?.trim()), icon: Link2 },
        ],
      },
    ];
    return groups;
  }, [data]);

  const progress = useMemo(() => {
    const allItems = sections.flatMap((section) => section.items);
    if (!allItems.length) return 0;
    const requiredItems = allItems.filter((item) => item.label !== "LinkedIn" && item.label !== "Portfolio" && item.label !== "Resume");
    const completeCount = requiredItems.filter((item) => item.complete).length;
    return Math.round((completeCount / requiredItems.length) * 100);
  }, [sections]);

  return (
    <div className="talent-portal">
      <TalentPortalHeader active="profile" name={data?.name} />
      <main className="talent-portal-main talent-profile-overview">
        <div className="talent-portal-title">
          <div>
            <p className="talent-portal-eyebrow">Your talent account</p>
            <h1>My profile</h1>
          </div>
          <Link className="talent-portal-primary" href="/talent/profile/edit">
            Edit profile <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        {loading && <p className="talent-portal-status" role="status">Loading your profile…</p>}
        {error && <p className="talent-portal-error" role="alert">{error}</p>}
        {data && (
          <>
            <section className="talent-profile-progress" aria-label="Profile completeness">
              <div className="talent-profile-progress-copy">
                <div className="talent-profile-avatar">{data.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "T"}</div>
                <div>
                  <h2>{data.name}</h2>
                  <p>{data.profile.headline || data.email}</p>
                </div>
              </div>
              <div className="talent-profile-progress-meter">
                <div><strong>{progress}%</strong><span>profile complete</span></div>
                <div className="talent-profile-progress-track"><span style={{ width: `${progress}%` }} /></div>
              </div>
            </section>

            <div className="talent-profile-groups">
              {sections.map((section) => (
                <section className="talent-profile-group" key={section.title}>
                  <div className="talent-profile-group-heading">
                    <h2>{section.title}</h2>
                    <Link href="/talent/profile/edit">Edit section <ArrowRight aria-hidden="true" size={14} /></Link>
                  </div>
                  <ul>
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label}>
                          <Link href="/talent/profile/edit">
                            <span className="talent-profile-item-icon"><Icon aria-hidden="true" size={19} /></span>
                            <span className="talent-profile-item-copy"><strong>{item.label}</strong><small>{item.description}</small></span>
                            <span className={`talent-profile-item-status${item.complete ? " is-complete" : ""}`} aria-label={item.complete ? "Complete" : "Needs attention"}>
                              {item.complete ? <Check aria-hidden="true" size={15} /> : <ArrowRight aria-hidden="true" size={16} />}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
            <aside className="talent-profile-next-step">
              <div><h2>Explore opportunities</h2><p>Find roles that fit your skills, experience, and work preferences.</p></div>
              <Link href="/talent/jobs">Browse jobs <ArrowRight aria-hidden="true" size={16} /></Link>
            </aside>
          </>
        )}
      </main>
    </div>
  );
}
