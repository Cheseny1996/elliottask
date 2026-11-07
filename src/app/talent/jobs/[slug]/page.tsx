import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, Circle } from "lucide-react";
import { auth, isTalentAuthConfigured } from "@/auth";
import { TalentPortalHeader } from "@/components/talent-portal-header";
import { connectToDatabase } from "@/lib/db";
import { opportunityTypeLabels } from "@/lib/opportunity-categories";
import { getTalentPortalOpportunityBySlug } from "@/lib/queries";
import { TalentUserModel } from "@/lib/models";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { opportunity } = await getTalentPortalOpportunityBySlug(slug);
  return { title: opportunity ? `${opportunity.title} | elliottask Talent` : "Opportunity not found" };
}

export default async function TalentJobDetailsPage({ params }: Props) {
  if (!isTalentAuthConfigured) redirect("/talent/auth?mode=login&setup=required");
  const session = await auth();
  if (!session?.user?.id) redirect("/talent/auth?mode=login");

  const { slug } = await params;
  const { opportunity, usingExamples } = await getTalentPortalOpportunityBySlug(slug);
  if (!opportunity) notFound();

  await connectToDatabase();
  const user = await TalentUserModel.findById(session.user.id).select("profile").lean();
  if (!user) redirect("/talent/auth?mode=login");
  const profile = user.profile;
  const steps = [
    { title: "Profile basics", description: "Add your name, location, and introduction.", complete: Boolean(session.user.name?.trim() && profile.location?.trim() && profile.bio?.trim()) },
    { title: "Skills and experience", description: "Share your skills and years of experience.", complete: Boolean(profile.skills?.length && profile.yearsExperience) },
    { title: "Career preferences", description: "Tell us what kind of work and schedule suits you.", complete: Boolean(profile.workPreference && profile.availability) },
    { title: "Review this opportunity", description: "Read the responsibilities, requirements, and compensation.", complete: false },
  ];
  const completedSteps = steps.filter((step) => step.complete).length;

  return (
    <div className="talent-portal">
      <TalentPortalHeader active="jobs" name={session.user.name} />
      <main className="talent-portal-main talent-job-detail-page">
        <Link className="talent-back-link" href="/talent/jobs"><ArrowLeft aria-hidden="true" size={16} /> Back to jobs</Link>
        {usingExamples && (
          <p className="talent-jobs-example-note">
            This is an illustrative role, not a confirmed opening. Verified role details will appear when a hiring team publishes them.
          </p>
        )}
        <div className="talent-job-detail-layout">
          <article className="talent-job-detail-copy">
            <div className="talent-job-detail-overline"><span className="talent-job-type">{opportunityTypeLabels[opportunity.type]}</span><span>{opportunity.location}</span></div>
            <h1>{opportunity.title}</h1>
            <p className="talent-job-detail-summary">{opportunity.summary}</p>
            <div className="talent-job-facts">
              <div><span>Experience</span><strong>{profile.yearsExperience ? `${profile.yearsExperience} years` : "Not specified"}</strong></div>
              <div><span>Category</span><strong>{opportunityTypeLabels[opportunity.type]}</strong></div>
              <div><span>Compensation</span><strong>{opportunity.compensation}</strong></div>
            </div>

            <section className="talent-job-description">
              <h2>About the opportunity</h2>
              <p>{opportunity.description}</p>
              <h3>Required skills</h3>
              <ul className="talent-job-skills">
                {opportunity.skills.map((skill) => <li key={skill}>{skill}</li>)}
              </ul>
              <h3>Team</h3>
              <p>{opportunity.team}</p>
              <p className="talent-job-notice">Confirm the scope, schedule, and compensation with the hiring team before accepting work.</p>
            </section>
          </article>

          <aside className="talent-application-panel">
            <p className="talent-portal-eyebrow">Your next steps</p>
            <h2>Application checklist</h2>
            <p className="talent-application-progress">{completedSteps} of {steps.length} steps ready</p>
            <ol>
              {steps.map((step) => (
                <li key={step.title} className={step.complete ? "is-complete" : ""}>
                  <span className="talent-application-step-icon">
                    {step.complete ? <Check aria-hidden="true" size={15} /> : <Circle aria-hidden="true" size={14} />}
                  </span>
                  <span><strong>{step.title}</strong><small>{step.description}</small></span>
                </li>
              ))}
            </ol>
            {completedSteps < steps.length - 1 ? (
              <Link className="talent-portal-primary talent-application-action" href="/talent/profile/edit">Complete your profile <ArrowLeft aria-hidden="true" size={15} /></Link>
            ) : (
              <Link className="talent-portal-primary talent-application-action" href={`/opportunities/${opportunity.slug}`}>Continue to opportunity <ArrowLeft aria-hidden="true" size={15} /></Link>
            )}
            <Link className="talent-application-secondary" href="/talent/profile">Review your profile</Link>
          </aside>
        </div>
        <Link className="talent-back-link talent-job-bottom-back" href="/talent/jobs"><ArrowLeft aria-hidden="true" size={16} /> All jobs</Link>
      </main>
    </div>
  );
}
