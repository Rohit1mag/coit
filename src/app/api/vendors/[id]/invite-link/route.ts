import { NextResponse } from "next/server";
import { jsonAuthError, requireProductAccess } from "@/lib/auth";
import { ensureVendorInviteToken } from "@/lib/documents";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  try {
    const session = await requireProductAccess();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("id, name, contact_email, trade")
      .eq("id", id)
      .eq("org_id", session.org.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (!vendor) {
      return NextResponse.json({ error: "Subcontractor not found." }, { status: 404 });
    }

    const token = await ensureVendorInviteToken({
      orgId: session.org.id,
      vendorId: vendor.id,
      vendorName: vendor.name,
      contactEmail: vendor.contact_email,
      trade: vendor.trade,
    });

    return NextResponse.json({ token, url: `${getAppUrl()}/upload/${token}` });
  } catch (error) {
    const authError = jsonAuthError(error);
    if (authError) return authError;
    const message = error instanceof Error ? error.message : "Could not create invite link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
