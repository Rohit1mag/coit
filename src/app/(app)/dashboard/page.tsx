import Link from "next/link";
import { InviteDialog } from "@/components/dashboard/invite-dialog";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { UploadCoiDialog } from "@/components/dashboard/upload-coi-dialog";
import { VendorTable } from "@/components/dashboard/vendor-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireSession } from "@/lib/auth";
import { getBillingAccess } from "@/lib/billing";
import { toCertificateRows, uniqueVendors, withPreviewUrls } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import { MAX_VENDORS_PER_ORG } from "@/lib/vendors";
import type { Document, Vendor } from "@/types/database";

export const metadata = { title: "Certificates" };

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const [vendorResult, documentResult] = await Promise.all([
    supabase.from("vendors").select("*").eq("org_id", session.org.id).order("name"),
    supabase
      .from("documents")
      .select("*")
      .eq("org_id", session.org.id)
      .order("created_at", { ascending: false }),
  ]);

  if (vendorResult.error) {
    throw new Error(vendorResult.error.message);
  }
  if (documentResult.error) {
    throw new Error(documentResult.error.message);
  }

  const writesLocked = !getBillingAccess(session.org).allowed;
  const vendors = await withPreviewUrls(
    toCertificateRows(
      (vendorResult.data ?? []) as Vendor[],
      (documentResult.data ?? []) as Document[],
    ),
  );
  const vendorOptions = uniqueVendors(vendors);
  const atVendorLimit = vendorOptions.length >= MAX_VENDORS_PER_ORG;
  const pendingReview = vendors.filter(
    (row) => row.document_id && row.review_status !== "approved" && row.review_status !== "rejected",
  ).length;
  const expiring = vendors.filter(
    (row) => row.review_status === "approved" && row.status === "expiring_soon",
  ).length;
  const expired = vendors.filter(
    (row) => row.review_status === "approved" && row.status === "expired",
  ).length;
  const missingVendorEmail = vendorOptions.filter((row) => !row.contact_email).length;
  const reminderEmail = session.org.alert_email?.trim();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Coverage status for {session.org.name}.
          </p>
        </div>
        {vendors.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <InviteDialog disabled={writesLocked || atVendorLimit} />
            <UploadCoiDialog
              orgId={session.org.id}
              vendors={vendorOptions}
              disabled={writesLocked}
              atLimit={atVendorLimit}
            />
          </div>
        ) : null}
      </div>

      {!reminderEmail && !session.email ? (
        <Alert>
          <AlertTitle>Reminder email required</AlertTitle>
          <AlertDescription>
            Expiration emails will not send until you add a reminder inbox in{" "}
            <Link href="/settings">Settings</Link>.
          </AlertDescription>
        </Alert>
      ) : !reminderEmail ? (
        <Alert>
          <AlertTitle>Confirm your reminder email</AlertTitle>
          <AlertDescription>
            Save a reminder inbox in <Link href="/settings">Settings</Link> so expiration emails
            have a destination. Subcontractors also need a contact email.
          </AlertDescription>
        </Alert>
      ) : null}
      {pendingReview > 0 ? (
        <Alert>
          <AlertTitle>
            {pendingReview === 1
              ? "1 certificate is waiting for review"
              : `${pendingReview} certificates are waiting for review`}
          </AlertTitle>
          <AlertDescription>
            Confirm the expiration date on the PDF. Leaving review without approving still saves
            the upload — use Review on that row to finish.
          </AlertDescription>
        </Alert>
      ) : null}
      {atVendorLimit ? (
        <Alert>
          <AlertTitle>50-subcontractor limit reached</AlertTitle>
          <AlertDescription>
            This account can track {MAX_VENDORS_PER_ORG} subcontractors. Remove one to invite or
            upload a new vendor. Existing certificates can still be updated.
          </AlertDescription>
        </Alert>
      ) : null}
      {missingVendorEmail > 0 ? (
        <Alert>
          <AlertTitle>
            {missingVendorEmail === 1
              ? "1 subcontractor has no contact email"
              : `${missingVendorEmail} subcontractors have no contact email`}
          </AlertTitle>
          <AlertDescription>
            They will not receive reminder emails. Add a contact email when you invite or upload.
          </AlertDescription>
        </Alert>
      ) : null}

      {vendors.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Add the first certificate</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Upload an ACORD 25 you already have, or send a link so the sub can do it from their
            phone. We&apos;ll read the expiration and start watching it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <UploadCoiDialog
              orgId={session.org.id}
              vendors={vendorOptions}
              disabled={writesLocked}
              atLimit={atVendorLimit}
            />
            <InviteDialog disabled={writesLocked || atVendorLimit} />
          </div>
        </div>
      ) : (
        <>
          <MetricCards
            active={vendorOptions.length}
            activeLimit={MAX_VENDORS_PER_ORG}
            pendingReview={pendingReview}
            expiring={expiring}
            expired={expired}
          />
          <VendorTable vendors={vendors} writesLocked={writesLocked} />
        </>
      )}
    </div>
  );
}
