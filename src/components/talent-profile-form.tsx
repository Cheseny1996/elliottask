"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/site-shell";

type ProfileValues = {
  name: string;
  headline: string;
  location: string;
  bio: string;
  skills: string;
  yearsExperience: string;
  workPreference: string;
  availability: string;
  portfolioUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
};

const emptyProfile: ProfileValues = {
  name: "",
  headline: "",
  location: "",
  bio: "",
  skills: "",
  yearsExperience: "",
  workPreference: "",
  availability: "",
  portfolioUrl: "",
  linkedinUrl: "",
  resumeUrl: "",
};

export function TalentProfileForm() {
  const router = useRouter();
  const [profile, setProfile] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const response = await fetch("/api/talent/profile");
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "We could not load your profile.");
        if (!active) return;
        setProfile({
          ...emptyProfile,
          name: result.name ?? "",
          headline: result.profile?.headline ?? "",
          location: result.profile?.location ?? "",
          bio: result.profile?.bio ?? "",
          skills: Array.isArray(result.profile?.skills) ? result.profile.skills.join(", ") : "",
          yearsExperience: result.profile?.yearsExperience ?? "",
          workPreference: result.profile?.workPreference ?? "",
          availability: result.profile?.availability ?? "",
          portfolioUrl: result.profile?.portfolioUrl ?? "",
          linkedinUrl: result.profile?.linkedinUrl ?? "",
          resumeUrl: result.profile?.resumeUrl ?? "",
        });
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "We could not load your profile.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => { active = false; };
  }, []);

  function update(field: keyof ProfileValues, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/talent/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...profile,
          skills: profile.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "We could not save your profile.");
      router.push("/talent/profile");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We could not save your profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="talent-profile-page">
      <header className="talent-auth-header">
        <Brand light />
        <Link href="/talent/profile">Back to profile</Link>
      </header>
      <div className="talent-profile-layout">
        <section className="talent-profile-intro">
          <p className="eyebrow eyebrow-on-dark"><span /> Your talent profile</p>
          <h1>Tell us about<br />your <span>work.</span></h1>
          <p>Share the skills and experience you want teams to know about. You can update your profile later.</p>
          <ol>
            <li><span>01</span> Add your experience and skills</li>
            <li><span>02</span> Save your profile</li>
            <li><span>03</span> Explore current opportunities</li>
          </ol>
        </section>

        <section className="talent-profile-card">
          {loading ? (
            <p className="talent-profile-loading" role="status">Loading your profile…</p>
          ) : (
            <form className="talent-profile-form" onSubmit={submit}>
              <div>
                <p className="eyebrow">A strong introduction</p>
                <h2>Complete your profile</h2>
                <p className="talent-profile-help">Fields marked * are required. Never share passwords or private client information.</p>
              </div>
              <label>
                Full name *
                <input value={profile.name} onChange={(event) => update("name", event.target.value)} required minLength={2} maxLength={100} autoComplete="name" />
              </label>
              <label>
                Professional headline *
                <input value={profile.headline} onChange={(event) => update("headline", event.target.value)} required minLength={5} maxLength={120} placeholder="e.g. Data analyst focused on product insights" />
              </label>
              <label>
                Location *
                <input value={profile.location} onChange={(event) => update("location", event.target.value)} required minLength={2} maxLength={120} placeholder="City, country or time zone" autoComplete="address-level2" />
              </label>
              <label className="talent-profile-full">
                About your experience *
                <textarea value={profile.bio} onChange={(event) => update("bio", event.target.value)} required minLength={50} maxLength={2000} rows={5} placeholder="Summarize your experience, strengths, and the kinds of problems you enjoy solving." />
              </label>
              <label className="talent-profile-full">
                Skills *
                <input value={profile.skills} onChange={(event) => update("skills", event.target.value)} required placeholder="Python, data analysis, machine learning" />
                <small>Separate skills with commas.</small>
              </label>
              <label>
                Years of experience *
                <select value={profile.yearsExperience} onChange={(event) => update("yearsExperience", event.target.value)} required>
                  <option value="" disabled>Select experience</option>
                  <option value="0-2">0–2 years</option>
                  <option value="3-5">3–5 years</option>
                  <option value="6-9">6–9 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </label>
              <label>
                Preferred work *
                <select value={profile.workPreference} onChange={(event) => update("workPreference", event.target.value)} required>
                  <option value="" disabled>Select work type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Project">Project work</option>
                  <option value="AI task">AI training tasks</option>
                  <option value="Open to any">Open to any</option>
                </select>
              </label>
              <label>
                Availability *
                <select value={profile.availability} onChange={(event) => update("availability", event.target.value)} required>
                  <option value="" disabled>Select availability</option>
                  <option value="Immediately">Immediately</option>
                  <option value="Within a month">Within a month</option>
                  <option value="Within 3 months">Within 3 months</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </label>
              <label>
                Portfolio URL
                <input type="url" value={profile.portfolioUrl} onChange={(event) => update("portfolioUrl", event.target.value)} maxLength={300} placeholder="https://" />
              </label>
              <label>
                LinkedIn profile URL
                <input type="url" value={profile.linkedinUrl} onChange={(event) => update("linkedinUrl", event.target.value)} maxLength={300} placeholder="https://linkedin.com/in/…" />
              </label>
              <label className="talent-profile-full">
                Resume URL
                <input type="url" value={profile.resumeUrl} onChange={(event) => update("resumeUrl", event.target.value)} maxLength={300} placeholder="Link to a resume you’re comfortable sharing" />
              </label>
              {error && <p className="form-error talent-profile-full" role="alert">{error}</p>}
              <button className="button button-primary talent-profile-full talent-profile-submit" type="submit" disabled={submitting}>
                {submitting ? "Saving profile…" : "Save profile and see available jobs"}
                <ArrowRight aria-hidden="true" />
              </button>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}
