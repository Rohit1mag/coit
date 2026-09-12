import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { deriveStatus } from "@/lib/coi";
import { ensureVendorInviteToken } from "@/lib/documents";
import { sendRejectReuploadEmail } from "@/lib/email";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const bodySchema = z.object({
  action: z.enum(["approve", "reject"]),
  effective_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  expiration_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  gl_occurrence_limit: z.string().nullable().optional(),
  additional_insured: z.boolean().optional(),
  waiver_subrogation: z.boolean().optional(),
  workers_comp: z.boolean().optional(),
  notes: z.string().nullable().optional(),
  reject_reason: z.string().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    const { id } = await context.params;
    const body = bodySchema.parse(await request.json());
    const supabase = await createClient();

    const { data: document, error } = await supabase
      .from("documents")
      .select("id, vendor_id, org_id")
      .eq("id", id)
      .eq("org_id", session.org.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!document) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (body.action === "reject") {
      const reason = body.reject_reason?.trim();
      if (!reason) {
        return NextResponse.json({ error: "Explain what is missing so the sub can re-upload." }, { status: 400 });
      }

      const { error: updateError } = await supabase
        .from("documents")
        .update({
          review_status: "rejected",
          notes: body.notes ?? reason,
          verified_by: session.userId,
          verified_at: new Date().toISOString(),
        })
        .eq("id", document.id)
        .eq("org_id", session.org.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 });
      }

      const { data: vendor } = await supabase
        .from("vendors")
        .select("id, name, contact_email, trade")
        .eq("id", document.vendor_id)
        .eq("org_id", session.org.id)
        .maybeSingle();

      if (vendor?.contact_email) {
        const token = await ensureVendorInviteToken({
          orgId: session.org.id,
          vendorId: vendor.id,
          vendorName: vendor.name,
          contactEmail: vendor.contact_email,
          trade: vendor.trade,
        });
        await sendRejectReuploadEmail({
          to: vendor.contact_email,
          cc: [session.email],
          contractorName: session.org.name,
          vendorName: vendor.name,
          token,
          reason,
        });
      }

      return NextResponse.json({ ok: true, review_status: "rejected" });
    }

    const expiration = body.expiration_date ?? null;
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        effective_date: body.effective_date ?? null,
        expiration_date: expiration,
        liability_limit: body.gl_occurrence_limit ?? null,
        additional_insured: body.additional_insured ?? false,
        waiver_subrogation: body.waiver_subrogation ?? false,
        workers_comp_included: body.workers_comp ?? false,
        notes: body.notes ?? null,
        status: deriveStatus(expiration),
        review_status: "approved",
        verified_by: session.userId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", document.id)
      .eq("org_id", session.org.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, review_status: "approved" });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid review payload." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Review failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
