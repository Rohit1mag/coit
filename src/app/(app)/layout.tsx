import { AppShell } from "@/components/app-shell";
import { BillingBanner } from "@/components/billing-banner";
import { requireSession } from "@/lib/auth";
import { getBillingAccess } from "@/lib/billing";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const access = getBillingAccess(session.org);

  return (
    <AppShell orgName={session.org.name} email={session.email}>
      <BillingBanner access={access} />
      {children}
    </AppShell>
  );
}
