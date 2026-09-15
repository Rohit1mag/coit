import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonAuthError, requireProductAccess } from "@/lib/auth";
import { randomToken } from "@/lib/coi";
import { sendInviteEmail } from "@/lib/email";
import { getAppUrl } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { assertCanCreateVendor, VendorLimitError } from "@/lib/vendors";

const bodySchema = z.object({
  vendor_id: z.string().uuid().optional(),
  vendor_name: z.string().min(1),
  contact_email: z.string().email(),
  contact_name: z.string().optional(),
  trade: z.string().optional(),
  send_email: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireProductAccess();

    const body = bodySchema.parse(await request.json());
    const supabase = await createClient();

    let vendorId = body.vendor_id ?? null;
    if (!vendorId) {
      await assertCanCreateVendor(supabase, session.org.id);
      const { data: vendor, error } = await supabase
        .from("vendors")
        .insert({
          org_id: session.org.id,
          name: body.vendor_name,
          contact_email: body.contact_email,
          contact_name: body.contact_name ?? null,
          trade: body.trade ?? null,
        })
        .select("id")
        .single();
      if (error || !vendor) {
        return NextResponse.json({ error: error?.message ?? "Could not create vendor." }, { status: 400 });
      }
      vendorId = vendor.id;
    }

    const token = randomToken();
    const { error: inviteError } = await supabase.from("invites").insert({
      org_id: session.org.id,
      vendor_id: vendorId,
      token,
      vendor_name: body.vendor_name,
      contact_email: body.contact_email,
      trade: body.trade ?? null,
    });

    if (inviteError) {
      return NextResponse.json({ error: inviteError.message }, { status: 400 });
    }

    const url = `${getAppUrl()}/upload/${token}`;
    let emailed = false;
    let emailError: string | null = null;

    if (body.send_email !== false) {
      try {
        await sendInviteEmail({
          to: body.contact_email,
          contractorName: session.org.name,
          vendorName: body.vendor_name,
          token,
        });
        emailed = true;
      } catch (error) {
        emailError = error instanceof Error ? error.message : "Email failed";
      }
    }

    return NextResponse.json({ token, url, vendor_id: vendorId, emailed, emailError });
  } catch (error) {
    const authError = jsonAuthError(error);
    if (authError) return authError;
    if (error instanceof VendorLimitError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid invite details." }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Failed to create invite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
