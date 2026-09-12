import { notFound } from "next/navigation";
import { LiabilityDisclaimer } from "@/components/liability-disclaimer";
import { Logo } from "@/components/logo";
import { PublicUploadForm } from "@/components/upload/public-upload-form";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = { title: "Upload certificate" };

export default async function PublicUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("vendor_name, contact_email, trade, expires_at, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) notFound();

  const org = invite.organizations as { name: string } | { name: string }[] | null;
  const contractorName = Array.isArray(org) ? org[0]?.name : org?.name;

  return (
    <div className="min-h-full bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-lg items-center px-4">
          <Logo />
        </div>
      </header>
      <main className="mx-auto w-full max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold tracking-tight">
          {contractorName ?? "Your contractor"} requests your updated Certificate of Insurance (ACORD 25).
        </h1>
        <p className="mb-6 mt-2 text-sm text-muted-foreground">
          No account required. Upload a PDF or a clear photo from your phone.
        </p>
        <PublicUploadForm
          token={token}
          contractorName={contractorName ?? "your contractor"}
          vendorName={invite.vendor_name}
          contactEmail={invite.contact_email}
          trade={invite.trade}
        />
        <div className="mt-8">
          <LiabilityDisclaimer />
        </div>
      </main>
    </div>
  );
}
