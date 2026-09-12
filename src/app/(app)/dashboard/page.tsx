import { InviteDialog } from "@/components/dashboard/invite-dialog";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { UploadCoiDialog } from "@/components/dashboard/upload-coi-dialog";
import { VendorTable } from "@/components/dashboard/vendor-table";
import { requireSession } from "@/lib/auth";
import { withPreviewUrls } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import type { VendorLatest } from "@/types/database";

export const metadata = { title: "Certificates" };

export default async function DashboardPage() {
  const session = await requireSession();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendor_latest_documents")
    .select("*")
    .eq("org_id", session.org.id)
    .order("name");

  if (error) {
    throw new Error(error.message);
  }

  const vendors = await withPreviewUrls((data ?? []) as VendorLatest[]);
  const expiring = vendors.filter((row) => row.status === "expiring_soon").length;
  const expired = vendors.filter((row) => row.status === "expired").length;

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
            <InviteDialog />
            <UploadCoiDialog orgId={session.org.id} vendors={vendors} />
          </div>
        ) : null}
      </div>

      {vendors.length === 0 ? (
        <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">Add the first certificate</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Upload an ACORD 25 you already have, or send a link so the sub can do it from their
            phone. We&apos;ll read the expiration and start watching it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <UploadCoiDialog orgId={session.org.id} vendors={vendors} />
            <InviteDialog />
          </div>
        </div>
      ) : (
        <>
          <MetricCards active={vendors.length} expiring={expiring} expired={expired} />
          <VendorTable vendors={vendors} />
        </>
      )}
    </div>
  );
}
