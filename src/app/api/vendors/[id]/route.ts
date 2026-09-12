import { NextResponse } from "next/server";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { STORAGE_BUCKET } from "@/lib/coi";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const session = await requireApiSession();
    const { id } = await context.params;
    const supabase = await createClient();

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, name")
      .eq("id", id)
      .eq("org_id", session.org.id)
      .maybeSingle();

    if (vendorError) {
      return NextResponse.json({ error: vendorError.message }, { status: 400 });
    }
    if (!vendor) {
      return NextResponse.json({ error: "Subcontractor not found." }, { status: 404 });
    }

    const { data: documents } = await supabase
      .from("documents")
      .select("file_url")
      .eq("vendor_id", vendor.id)
      .eq("org_id", session.org.id);

    await supabase.from("invites").delete().eq("vendor_id", vendor.id).eq("org_id", session.org.id);

    const { error: deleteError } = await supabase
      .from("vendors")
      .delete()
      .eq("id", vendor.id)
      .eq("org_id", session.org.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    const paths = [...new Set((documents ?? []).map((doc) => doc.file_url).filter(Boolean))];
    if (paths.length > 0) {
      const admin = createAdminClient();
      await admin.storage.from(STORAGE_BUCKET).remove(paths);
    }

    return NextResponse.json({ ok: true, id: vendor.id, name: vendor.name });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Failed to delete subcontractor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
