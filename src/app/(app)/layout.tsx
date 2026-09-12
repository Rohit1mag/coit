import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <AppShell orgName={session.org.name} email={session.email}>
      {children}
    </AppShell>
  );
}
