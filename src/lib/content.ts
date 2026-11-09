import type { OpportunityType } from "@/lib/opportunity-categories";

export type Article = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  heroImage: string;
  heroAlt: string;
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
  type: OpportunityType;
  location: string;
  team: string;
  compensation: string;
  summary: string;
  description: string;
  skills: string[];
  taskDurationHours?: number | null;
  status: "Open" | "Closed";
  publishedAt: Date;
};

export const sampleArticles: Article[] = [
  {
    title: "A practical framework for reviewing AI-generated code",
    slug: "framework-for-reviewing-ai-generated-code",
    excerpt:
      "A repeatable review starts with observable behavior, then checks edge cases, security, and maintainability.",
    heroImage: "",
    heroAlt: "",
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
    heroImage: "",
    heroAlt: "",
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
    heroImage: "",
    heroAlt: "",
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
    title: "AI Code Review Specialist",
    slug: "ai-code-review-specialist",
    type: "AI task",
    location: "Remote · Flexible schedule",
    team: "AI Training",
    compensation: "Task scope and rate confirmed before work begins",
    summary:
      "Assess AI-generated code for correctness, edge cases, and maintainability, then explain your findings with a clear rubric.",
    description:
      "Review code-generation tasks using a supplied evaluation rubric. You will run or reason through examples, identify correctness and edge-case issues, compare alternative approaches, and write concise feedback that another reviewer can follow. Work is task-based and completed remotely; the project team confirms expected time, instructions, and compensation before you accept each batch.",
    skills: ["Code review", "Python", "JavaScript", "Testing", "Technical writing"],
    status: "Open",
    publishedAt: new Date("2026-11-07T09:00:00.000Z"),
  },
  {
    title: "Python Software Engineer — AI Training",
    slug: "python-software-engineer-ai-training",
    type: "AI task",
    location: "Remote · Flexible schedule",
    team: "AI Training",
    compensation: "Rate and task availability confirmed before engagement",
    summary:
      "Use your Python experience to test, debug, and improve solutions produced for realistic software tasks.",
    description:
      "Work through short, independently scoped programming tasks involving Python code. Depending on the task, you may create a reference solution, check a proposed implementation, design useful tests, or explain a failure. Clear written reasoning and careful attention to requirements matter as much as code. This is flexible, task-based work; available tasks, expected effort, and pay are confirmed before you begin.",
    skills: ["Python", "Git", "Debugging", "Unit testing", "Code quality"],
    status: "Open",
    publishedAt: new Date("2026-11-06T09:00:00.000Z"),
  },
  {
    title: "Java, Rust & C++ Code Evaluator",
    slug: "java-rust-cpp-code-evaluator",
    type: "AI task",
    location: "Remote · Flexible schedule",
    team: "AI Training",
    compensation: "Task scope and rate confirmed before work begins",
    summary:
      "Review systems-language solutions for behavior, safety, and clarity using task-specific evaluation guidance.",
    description:
      "Evaluate programming solutions written in Java, Rust, or C++. For each assignment, follow the provided requirements, check whether the implementation behaves as expected, and explain issues such as edge cases, unsafe assumptions, or unclear tradeoffs. Strong practical knowledge in at least one of these languages is required. This is remote, task-based work; instructions, expected effort, and compensation are shared before you accept a task.",
    skills: ["Java", "Rust", "C++", "Debugging", "Testing", "Code review"],
    status: "Open",
    publishedAt: new Date("2026-11-05T12:00:00.000Z"),
  },
  {
    title: "Full-Stack Developer — AI Training",
    slug: "full-stack-developer-ai-training",
    type: "AI task",
    location: "Remote · Flexible schedule",
    team: "AI Training",
    compensation: "Task scope and rate confirmed before work begins",
    summary:
      "Use TypeScript and web development experience to assess full-stack solutions and produce practical technical feedback.",
    description:
      "Work on task-based exercises covering modern web applications. You may review a user interface and its API integration, identify functional gaps, propose useful tests, or prepare a reference implementation. The work rewards clear reasoning about real-world concerns such as accessibility, data handling, and maintainability. The project team provides task instructions and confirms payment terms before each assignment.",
    skills: ["JavaScript", "TypeScript", "React", "Node.js", "APIs", "Testing"],
    status: "Open",
    publishedAt: new Date("2026-11-05T10:00:00.000Z"),
  },
  {
    title: "Java, Rust & C++ Systems Engineer",
    slug: "java-rust-cpp-systems-engineer",
    type: "Full-time",
    location: "Remote · Time-zone overlap agreed with team",
    team: "Software engineering",
    compensation: "Compensation shared during the hiring process",
    summary:
      "Build dependable systems software and help a product team improve performance, reliability, and developer tooling.",
    description:
      "Join a collaborative engineering team working on systems-oriented product features. You will design and implement maintainable services or components, investigate performance and reliability issues, participate in code reviews, and document technical decisions. Strong experience in at least one of Java, Rust, or C++ is useful; the team will agree on responsibilities, work location, compensation, and interview steps before the role is advertised as a verified opening.",
    skills: ["Java", "Rust", "C++", "Data structures", "Testing", "Code review"],
    status: "Open",
    publishedAt: new Date("2026-11-05T09:00:00.000Z"),
  },
  {
    title: "Full-Stack Product Engineer",
    slug: "full-stack-product-engineer",
    type: "Full-time",
    location: "Remote",
    team: "Product engineering",
    compensation: "Compensation shared during the hiring process",
    summary:
      "Deliver accessible product features across a TypeScript web application, from interface through API and data layer.",
    description:
      "Partner with design and product teammates to turn user needs into reliable web features. The role includes building responsive interfaces, implementing and consuming APIs, writing tests, reviewing changes, and improving existing code. Experience with TypeScript and React is helpful, as is curiosity about backend systems and accessibility. Final responsibilities, location expectations, compensation, and hiring stages should be confirmed by the hiring team.",
    skills: ["TypeScript", "React", "Node.js", "REST APIs", "Accessibility", "Testing"],
    status: "Open",
    publishedAt: new Date("2026-11-04T09:00:00.000Z"),
  },
  {
    title: "Interactive 3D Experience Developer",
    slug: "interactive-3d-experience-developer",
    type: "Project",
    location: "Remote · Milestones agreed with client",
    team: "Interactive experiences",
    compensation: "Project fee agreed against a written scope",
    summary:
      "Create a polished browser-based 3D interaction and hand over maintainable code with setup notes.",
    description:
      "Build an interactive 3D proof of concept for a web experience. Work may include scene setup, animation, input handling, performance tuning, and integration with an existing interface. Before work starts, the client and specialist should agree on the target devices, visual assets, milestones, acceptance checks, ownership, and project fee.",
    skills: ["Three.js", "WebGL", "JavaScript", "3D modeling", "Animation"],
    status: "Open",
    publishedAt: new Date("2026-11-03T09:00:00.000Z"),
  },
];
