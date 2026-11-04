import type { Metadata } from "next";
import { CompanyHiringWizard } from "@/components/company-hiring-wizard";

export const metadata: Metadata = {
  title: "Tell Us About Your Hiring Needs",
  description:
    "Share your developer, team, or AI project requirements with Elliottask.",
  robots: { index: false, follow: false },
};

type HiringRequestPageProps = {
  searchParams: Promise<{ type?: string }>;
};

export default async function HiringRequestPage({ searchParams }: HiringRequestPageProps) {
  const { type } = await searchParams;
  const hiringType = type === "developer" ? "developer" : "team";

  return <CompanyHiringWizard hiringType={hiringType} />;
}
