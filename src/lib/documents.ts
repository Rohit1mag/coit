import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/coi";
import type { Document, Vendor, VendorLatest } from "@/types/database";

export function toCertificateRows(vendors: Vendor[], documents: Document[]): VendorLatest[] {
  const docsByVendor = new Map<string, Document[]>();
  for (const document of documents) {
    const list = docsByVendor.get(document.vendor_id) ?? [];
    list.push(document);
    docsByVendor.set(document.vendor_id, list);
  }

  const rows: VendorLatest[] = [];
  for (const vendor of vendors) {
    const docs = [...(docsByVendor.get(vendor.id) ?? [])].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    if (docs.length === 0) {
      rows.push({
        vendor_id: vendor.id,
        org_id: vendor.org_id,
        name: vendor.name,
        contact_name: vendor.contact_name,
        contact_email: vendor.contact_email,
        phone: vendor.phone,
        trade: vendor.trade,
        vendor_created_at: vendor.created_at,
        document_id: null,
        file_url: null,
        effective_date: null,
        expiration_date: null,
        liability_limit: null,
        workers_comp_included: null,
        additional_insured: null,
        waiver_subrogation: null,
        notes: null,
        confidence_score: null,
        status: null,
        review_status: null,
        verified_at: null,
        document_created_at: null,
      });
      continue;
    }

    for (const document of docs) {
      rows.push({
        vendor_id: vendor.id,
        org_id: vendor.org_id,
        name: vendor.name,
        contact_name: vendor.contact_name,
        contact_email: vendor.contact_email,
        phone: vendor.phone,
        trade: vendor.trade,
        vendor_created_at: vendor.created_at,
        document_id: document.id,
        file_url: document.file_url,
        effective_date: document.effective_date,
        expiration_date: document.expiration_date,
        liability_limit: document.liability_limit,
        workers_comp_included: document.workers_comp_included,
        additional_insured: document.additional_insured,
        waiver_subrogation: document.waiver_subrogation,
        notes: document.notes,
        confidence_score: document.confidence_score,
        status: document.status,
        review_status: document.review_status,
        verified_at: document.verified_at,
        document_created_at: document.created_at,
      });
    }
  }
  return rows;
}

export function uniqueVendors(rows: VendorLatest[]): VendorLatest[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.vendor_id)) return false;
    seen.add(row.vendor_id);
    return true;
  });
}

export async function signDocumentPaths(paths: string[]) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (unique.length === 0) return new Map<string, string>();

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(STORAGE_BUCKET)
    .createSignedUrls(unique, 60 * 60);

  if (error || !data) return new Map<string, string>();

  const map = new Map<string, string>();
  data.forEach((item, index) => {
    if (item.signedUrl) map.set(unique[index], item.signedUrl);
  });
  return map;
}

export async function withPreviewUrls(rows: VendorLatest[]): Promise<VendorLatest[]> {
  const urls = await signDocumentPaths(rows.map((row) => row.file_url ?? "").filter(Boolean));
  return rows.map((row) => ({
    ...row,
    preview_url: row.file_url ? (urls.get(row.file_url) ?? null) : null,
  }));
}

export async function ensureVendorInviteToken(input: {
  orgId: string;
  vendorId: string;
  vendorName: string;
  contactEmail: string | null;
  trade: string | null;
}) {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("invites")
    .select("token")
    .eq("org_id", input.orgId)
    .eq("vendor_id", input.vendorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) return existing.token;

  const token = crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
  const { data, error } = await admin
    .from("invites")
    .insert({
      org_id: input.orgId,
      vendor_id: input.vendorId,
      token,
      vendor_name: input.vendorName,
      contact_email: input.contactEmail,
      trade: input.trade,
    })
    .select("token")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create upload invite");
  }
  return data.token;
}
