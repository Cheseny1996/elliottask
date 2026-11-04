export type Article = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  author: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  publishedAt: Date;
};

export type Opportunity = {
  title: string;
  slug: string;
  type: "Full-time" | "Project" | "AI task";
  location: string;
  team: string;
  compensation: string;
  summary: string;
  description: string;
  skills: string[];
  status: "Open" | "Closed";
  publishedAt: Date;
};

export const sampleArticles: Article[] = [
  {
    title: "A practical framework for reviewing AI-generated code",
    slug: "framework-for-reviewing-ai-generated-code",
    excerpt:
      "A repeatable review starts with observable behavior, then checks edge cases, security, and maintainability.",
    category: "AI engineering",
    author: "elliottask editorial",
    metaTitle: "How to Review AI-Generated Code | elliottask",
    metaDescription:
      "A practical, evidence-led checklist for evaluating AI-generated code for correctness, edge cases, security, and maintainability.",
    keywords: ["AI code review", "software quality", "AI engineering"],
    publishedAt: new Date("2026-10-12T09:00:00.000Z"),
    body: `AI-generated code can look convincing before it is correct. A useful review process makes claims testable and keeps the reviewer focused on behavior rather than presentation.

## Start with the requested behavior

Turn the task into a short list of observable outcomes. Identify inputs, outputs, constraints, and failure cases before reading implementation details. This gives the review a stable reference point.

## Test the boundaries

Check empty values, malformed input, unexpected ordering, duplicate requests, and dependency failures. The most important defect is often in a case the happy-path demo never exercises.

## Trace data and trust boundaries

Follow untrusted data from the request through validation, storage, and output. Confirm that authorization is checked on the server and that secrets never reach browser code or logs.

## Prefer evidence over confidence

Run focused tests and inspect the actual diff. When a claim cannot be verified, describe the uncertainty explicitly instead of treating a plausible explanation as proof.

## Leave actionable feedback

Good review notes identify the impact, point to the relevant behavior, and suggest a verifiable next step. This makes feedback useful to both the person changing the code and the team maintaining it later.`,
  },
  {
    title: "Writing project briefs that help distributed teams deliver",
    slug: "writing-project-briefs-for-distributed-teams",
    excerpt:
      "A strong brief gives a remote team enough context to estimate, build, review, and hand off work with fewer surprises.",
    category: "Team operations",
    author: "elliottask editorial",
    metaTitle: "How to Write Clear Project Briefs | elliottask",
    metaDescription:
      "Learn how to define outcomes, constraints, communication practices, and acceptance criteria in a concise remote project brief.",
    keywords: ["project brief", "remote teams", "project planning"],
    publishedAt: new Date("2026-10-06T09:00:00.000Z"),
    body: `A project brief is a shared map, not a long list of instructions. It helps clients and specialists agree on the result, the constraints, and the way they will work together.

## Define the outcome

Describe the user or business problem and how the team will know it has improved. Concrete acceptance criteria help distinguish a complete deliverable from activity that merely looks busy.

## Make constraints visible

List the systems, deadlines, dependencies, security needs, and decisions that shape the work. If a detail is still unknown, mark it as an open question and assign an owner.

## Agree on collaboration

Set expectations for working hours, response times, review cycles, and written updates. Distributed teams benefit when important decisions are recorded where everyone can find them.

## Keep the brief maintainable

Use concise sections and update the brief as assumptions change. A current, readable source of truth is more valuable than a long document nobody trusts.`,
  },
  {
    title: "Choosing between a full-time hire and a focused specialist project",
    slug: "full-time-hire-or-specialist-project",
    excerpt:
      "Match the engagement model to the duration of the need, the clarity of the outcome, and how the work fits your team.",
    category: "Hiring",
    author: "elliottask editorial",
    metaTitle: "Full-Time Hire or Specialist Project? | elliottask",
    metaDescription:
      "Compare full-time hiring and project-based specialist work using duration, scope clarity, continuity, and team capacity.",
    keywords: ["technical hiring", "contract engineering", "project staffing"],
    publishedAt: new Date("2026-09-29T09:00:00.000Z"),
    body: `The right engagement depends on the work, not a default preference for one contract type. A deliberate choice can improve continuity and make expectations clearer on both sides.

## Consider how long the capability is needed

Ongoing product ownership, repeated planning, and long-term maintenance often need sustained team capacity. A bounded deliverable with a clear handoff can be a better fit for a specialist project.

## Assess scope clarity

Project work benefits from a defined outcome, acceptance criteria, and access to the people who can make decisions. If priorities are expected to change every week, a longer-running team relationship may be easier to manage.

## Include onboarding and knowledge transfer

Every model has setup costs. Account for access, documentation, review, and handoff rather than comparing only the visible delivery hours.

## Be transparent about expectations

Document responsibilities, communication, compensation, and the process for changing scope. Good agreements reduce uncertainty for the hiring team and the specialist.`,
  },
];

export const sampleOpportunities: Opportunity[] = [
  {
    title: "Senior Full-Stack Engineer",
    slug: "senior-full-stack-engineer",
    type: "Full-time",
    location: "Remote · Americas-friendly",
    team: "Product engineering",
    compensation: "Discussed with the hiring team",
    summary:
      "Build and improve customer-facing product workflows with a small, collaborative engineering team.",
    description:
      "An illustrative listing for the elliottask opportunity board. Hiring teams can publish verified role details, scope, compensation, and application steps from the admin panel.",
    skills: ["TypeScript", "React", "Node.js", "REST APIs"],
    status: "Open",
    publishedAt: new Date("2026-10-10T09:00:00.000Z"),
  },
  {
    title: "AI Output Evaluation Specialist",
    slug: "ai-output-evaluation-specialist",
    type: "AI task",
    location: "Remote · Flexible schedule",
    team: "AI evaluation",
    compensation: "Scope and rate confirmed before engagement",
    summary:
      "Evaluate model responses against a rubric, test edge cases, and write clear, evidence-based feedback.",
    description:
      "An illustrative listing for the elliottask opportunity board. The project owner will provide task instructions, evaluation criteria, expected hours, and payment terms before work begins.",
    skills: ["Code review", "Testing", "Technical writing", "AI evaluation"],
    status: "Open",
    publishedAt: new Date("2026-10-08T09:00:00.000Z"),
  },
  {
    title: "Data Platform Engineer",
    slug: "data-platform-engineer",
    type: "Project",
    location: "Remote",
    team: "Data systems",
    compensation: "Quoted against a defined scope",
    summary:
      "Design reliable data ingestion and reporting workflows for a growing product team.",
    description:
      "An illustrative project listing. The client should confirm requirements, data access, security expectations, milestones, and acceptance criteria before publishing a real opportunity.",
    skills: ["Python", "SQL", "ETL", "Cloud"],
    status: "Open",
    publishedAt: new Date("2026-10-02T09:00:00.000Z"),
  },
];
