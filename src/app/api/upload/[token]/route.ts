import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseStorageObject } from "@/lib/parse-coi";
import { STORAGE_BUCKET } from "@/lib/coi";

export const maxDuration = 60;
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ token: string }> };

async function loadInvite(token: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invites")
    .select("*, organizations(name)")
    .eq("token", token)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expires_at && new Date(data.expires_at) < new Date()) return null;
  return data;
}

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;
  const invite = await loadInvite(token);
  if (!invite) {
    return NextResponse.json({ error: "This upload link is invalid or expired." }, { status: 404 });
  }

  const org = invite.organizations as { name: string } | { name: string }[] | null;
  const orgName = Array.isArray(org) ? org[0]?.name : org?.name;

  return NextResponse.json({
    contractor_name: orgName ?? "your contractor",
    vendor_name: invite.vendor_name,
    contact_email: invite.contact_email,
    trade: invite.trade,
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params;
    const invite = await loadInvite(token);
    if (!invite) {
      return NextResponse.json({ error: "This upload link is invalid or expired." }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A PDF or image file is required." }, { status: 400 });
    }

    const vendorName = String(form.get("vendor_name") ?? invite.vendor_name ?? "").trim();
    const contactEmail = String(form.get("contact_email") ?? invite.contact_email ?? "").trim();
    const contactName = String(form.get("contact_name") ?? "").trim();
    const trade = String(form.get("trade") ?? invite.trade ?? "").trim();

    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `${invite.org_id}/public/${crypto.randomUUID()}.${ext}`;
    const admin = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType: file.type || "application/pdf",
      upsert: false,
    });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const result = await parseStorageObject({
      orgId: invite.org_id,
      path,
      vendorId: invite.vendor_id,
      vendorName: vendorName || invite.vendor_name,
      contactName: contactName || null,
      contactEmail: contactEmail || invite.contact_email,
      trade: trade || invite.trade,
      uploadToken: token,
    });

    if (invite.vendor_id == null && result.vendorId) {
      await admin.from("invites").update({ vendor_id: result.vendorId }).eq("id", invite.id);
    }

    return NextResponse.json({
      ok: true,
      vendor_id: result.vendorId,
      status: result.document.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
