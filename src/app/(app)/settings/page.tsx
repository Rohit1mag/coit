import { AlertCadenceForm } from "@/components/settings/alert-cadence-form";
import { BillingCard } from "@/components/settings/billing-card";
import { requireSession } from "@/lib/auth";
import { isBillingConfigured } from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;

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
        configured={isBillingConfigured()}
      />
      <AlertCadenceForm cadences={session.org.alert_cadences ?? [30, 14, 3]} />
    </div>
  );
}
