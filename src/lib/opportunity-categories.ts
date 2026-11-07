export const opportunityTypes = ["Full-time", "Project", "AI task"] as const;
export type OpportunityType = (typeof opportunityTypes)[number];

export const opportunityTypeLabels: Record<OpportunityType, string> = {
  "AI task": "AI Training",
  Project: "Project",
  "Full-time": "Full-time",
};
