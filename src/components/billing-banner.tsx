import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { BillingAccess } from "@/lib/billing";

export function BillingBanner({ access }: { access: BillingAccess }) {
  if (access.kind === "complimentary" || access.kind === "subscribed") {
    return null;
  }

  if (access.kind === "trial") {
    const days = access.daysRemaining ?? 0;
    return (
      <Alert className="mb-8">
        <AlertTitle>
          {days === 1 ? "1 day left in your trial" : `${days} days left in your trial`}
        </AlertTitle>
        <AlertDescription>
          Upload, review, and reminders stay on until then. After that you&apos;ll need the $99/mo
          plan. <Link href="/settings">Subscribe in Settings</Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-8">
      <AlertTitle>Trial ended</AlertTitle>
      <AlertDescription>
        You can still view certificates. Upload, invites, review, and reminders are paused until you
        subscribe. <Link href="/settings">Start $99/mo</Link>
      </AlertDescription>
    </Alert>
  );
}
