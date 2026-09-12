import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated September 11, 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            COI Tracker stores the account, organization, vendor, and certificate data you submit so
            we can show coverage status and send expiration reminders.
          </p>
          <p>
            Files you upload are stored in a private bucket and read by a vision model only to
            extract dates, limits, and the insured name. We do not sell that data.
          </p>
          <p>
            Authentication is handled by Supabase. Payments, if you subscribe, are processed by
            Lemon Squeezy. Emails are sent through Resend.
          </p>
          <p>
            To request deletion of an account or stored certificates, sign in and remove vendors
            from the dashboard, or contact us from the email on your account.
          </p>
        </div>
      </article>
    </MarketingShell>
  );
}
