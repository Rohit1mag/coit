import { AlertCadenceForm } from "@/components/settings/alert-cadence-form";
import { BillingCard } from "@/components/settings/billing-card";
import { ReminderLog, type ReminderLogRow } from "@/components/settings/reminder-log";
import { requireSession } from "@/lib/auth";
import { getBillingAccess } from "@/lib/billing";
import { isBillingConfigured } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Settings" };

async function loadReminderLog(orgId: string): Promise<ReminderLogRow[]> {
  const admin = createAdminClient();
  const withRecipients = await admin
    .from("alert_sends")
    .select("id, alert_type, sent_on, sent_at, recipients, vendors(name, contact_email)")
    .eq("org_id", orgId)
    .order("sent_on", { ascending: false })
    .limit(50);

  const result = withRecipients.error
    ? await admin
        .from("alert_sends")
        .select("id, alert_type, sent_on, vendors(name, contact_email)")
        .eq("org_id", orgId)
        .order("sent_on", { ascending: false })
        .limit(50)
    : withRecipients;

  return (result.data ?? []) as ReminderLogRow[];
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const access = getBillingAccess(session.org);
  const logRows = await loadReminderLog(session.org.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alerts and billing for {session.org.name}.
        </p>
      </div>

      {params.checkout === "success" ? (
        <p className="rounded-lg border bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Payment received. You&apos;re on the $99/mo plan.
        </p>
      ) : null}
      {params.checkout === "canceled" ? (
        <p className="rounded-lg border bg-muted px-3 py-2 text-sm text-muted-foreground">
          Checkout was canceled. You can start the trial whenever you are ready.
        </p>
      ) : null}

      <BillingCard
        status={session.org.lemon_squeezy_subscription_status}
        access={access}
        configured={isBillingConfigured()}
      />
      <AlertCadenceForm
        cadences={session.org.alert_cadences ?? [30, 14, 7]}
        alertEmail={session.org.alert_email ?? session.email ?? ""}
        disabled={!access.allowed}
      />
      <ReminderLog
        rows={logRows}
        fallbackEmail={session.org.alert_email ?? session.email ?? ""}
      />
    </div>
  );
}
