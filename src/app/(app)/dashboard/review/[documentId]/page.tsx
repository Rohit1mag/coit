import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ReviewForm } from "@/components/dashboard/review-form";
import { requireSession } from "@/lib/auth";
import { signDocumentPaths } from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";
import type { Document, Vendor } from "@/types/database";

export const metadata = { title: "Review certificate" };

export default async function ReviewDocumentPage({
  params,
}: {
  params: Promise<{ documentId: string }>;
}) {
  const session = await requireSession();
  const { documentId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("*, vendors(id, name, contact_email, trade)")
    .eq("id", documentId)
    .eq("org_id", session.org.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) notFound();

  const document = data as Document & {
    vendors: Pick<Vendor, "id" | "name" | "contact_email" | "trade"> | null;
  };
  const vendor = document.vendors;
  if (!vendor) notFound();

  const urls = await signDocumentPaths([document.file_url]);
  const previewUrl = urls.get(document.file_url) ?? null;
  const isPdf = document.file_url.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-4">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to certificates
      </Link>

      <div className="flex min-h-[calc(100vh-12rem)] flex-col gap-4 lg:flex-row">
        <div className="min-h-[420px] overflow-hidden rounded-xl border bg-muted lg:w-[60%]">
          {previewUrl ? (
            isPdf ? (
              <iframe title="Certificate of Insurance" src={previewUrl} className="h-full min-h-[420px] w-full bg-background" />
            ) : (
              <div className="flex h-full items-start justify-center overflow-auto p-3">
                <img src={previewUrl} alt={`COI for ${vendor.name}`} className="max-w-full" />
              </div>
            )
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Could not load the uploaded file.</p>
          )}
        </div>
        <div className="rounded-xl border bg-card p-5 lg:w-[40%]">
          <ReviewForm document={document} vendor={vendor} />
        </div>
      </div>
    </div>
  );
}
