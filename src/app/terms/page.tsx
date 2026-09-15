import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <MarketingShell>
      <article className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Terms</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated September 11, 2026</p>
        <div className="mt-8 space-y-4 text-sm leading-6 text-muted-foreground">
          <p>
            SubCertify is software for organizing Certificates of Insurance. It is not an insurance
            broker, agent, or advisor, and it does not confirm that a policy is valid with the
            carrier.
          </p>
          <p>
            Extraction from uploaded certificates can be incomplete or incorrect. You remain
            responsible for reviewing dates, limits, and additional-insured wording before a
            subcontractor starts work.
          </p>
          <p>
            The service is billed at $99 per month after a 14-day trial, unless you cancel. Each
            account can track up to 50 subcontractors. Lemon Squeezy is the merchant of record for
            paid subscriptions.
          </p>
          <p>
            We may suspend an account that abuses upload, email, or authentication systems. You may
            stop using the service at any time.
          </p>
        </div>
      </article>
    </MarketingShell>
  );
}
