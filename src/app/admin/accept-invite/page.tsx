import type { Metadata } from "next";
import { AdminInviteAcceptance } from "@/components/admin-invite-acceptance";

export const metadata: Metadata = {
  title: "Accept workspace invitation",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function AcceptAdminInvitePage({ searchParams }: Props) {
  const { token = "" } = await searchParams;
  return <AdminInviteAcceptance token={token} />;
}
