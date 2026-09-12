import { createAdminClient } from "@/lib/supabase/admin";
import { STORAGE_BUCKET } from "@/lib/coi";
import type { VendorLatest } from "@/types/database";

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
