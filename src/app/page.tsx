import Link from "next/link";
import { Bell, FileSearch, Link2, ShieldCheck } from "lucide-react";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Button } from "@/components/ui/button";

const steps = [
  {
    title: "Collect the ACORD 25",
    body: "Upload one you already have, or send the sub a link. They submit from their phone. No login.",
    icon: Link2,
  },
  {
    title: "We read the coverage",
    body: "Vendor name, expiration, GL limit, and endorsements come off the certificate. You confirm them on a split-screen before anything is approved.",
    icon: FileSearch,
  },
  {
    title: "Reminders go out automatically",
    body: "You and the sub get email at 30, 14, and 7 days — and the day it lapses — with a one-click upload.",
    icon: Bell,
  },
];

const included = [
  "50 subcontractors per account",
  "AI extraction from ACORD 25 PDFs and photos",
  "1-click split-screen review before a COI is approved",
  "Public upload links (no vendor account)",
  "Email reminders to you and the sub",
  "Adjustable alert cadence",
  "Cancel anytime during or after the trial",
];

export default function LandingPage() {
  return (
    <MarketingShell>
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:pb-24 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" />
            Built for GCs and property managers
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Know which subs are uncovered before the job starts.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground text-pretty">
            SubCertify collects certificates, reads the expiration date, and emails the sub a new
            upload link before you&apos;re the one exposed.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" className="h-11 px-5" asChild>
              <Link href="/signup">Start 14-day trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-11 px-5" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">$99/month after trial. No setup call.</p>
        </div>
        <div className="mx-auto mt-14 max-w-4xl">
          <ProductPreview />
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3 sm:py-14">
          {[
            { title: "Stop chasing PDFs", body: "One board for every sub. No shared drive, no inbox search." },
            { title: "See risk in a glance", body: "Expired and expiring certificates sit at the top of the list." },
            { title: "The sub does the work", body: "They get a link, take a photo, and you get the date on file." },
          ].map((item) => (
            <div key={item.title}>
              <h2 className="font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-20">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-muted-foreground">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">Three steps. Then it watches itself.</h2>
        </div>
        <ol className="mt-10 grid gap-6 sm:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-2xl border bg-card p-5">
                <p className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
                <Icon className="mt-4 size-5" />
                <h3 className="mt-3 font-medium">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="pricing" className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-12 pt-20 lg:grid-cols-[1fr_24rem]">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pricing</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">One plan. Built for a small office.</h2>
            <p className="mt-4 max-w-xl text-muted-foreground">
              Most shops don&apos;t need a compliance suite. They need to know who is expired before
              someone walks on site.
            </p>
          </div>
          <div className="rounded-2xl border bg-background p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">SubCertify</p>
            <p className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">$99</span>
              <span className="text-muted-foreground">/month</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">14-day free trial. Cancel anytime.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {included.map((item) => (
                <li key={item} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="mt-6 h-11 w-full" asChild>
              <Link href="/signup">Start free trial</Link>
            </Button>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-20">
          <p className="text-sm font-medium text-muted-foreground">Compared to</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight">
            A spreadsheet, SubCertify, and myCOI
          </h3>
          <div className="mt-6">
            <ComparisonTable />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Ready to stop guessing on coverage?</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
          Create a workspace, add one certificate, and see who is actually covered.
        </p>
        <Button size="lg" className="mt-8 h-11 px-5" asChild>
          <Link href="/signup">Get started</Link>
        </Button>
      </section>
    </MarketingShell>
  );
}
