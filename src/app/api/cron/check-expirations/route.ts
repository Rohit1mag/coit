import { NextResponse } from "next/server";
import { utcDateOffset, utcToday } from "@/lib/coi";
import { ensureVendorInviteToken } from "@/lib/documents";
import { sendExpirationEmails } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Organization, VendorLatest } from "@/types/database";

export const maxDuration = 60;
export const runtime = "nodejs";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = utcToday();

  await admin
    .from("documents")
    .update({ status: "expired" })
    .lt("expiration_date", today)
    .neq("status", "expired");

  await admin
    .from("documents")
    .update({ status: "expiring_soon" })
    .gte("expiration_date", today)
    .lte("expiration_date", utcDateOffset(30))
    .neq("status", "expiring_soon");

  await admin
    .from("documents")
    .update({ status: "valid" })
    .gt("expiration_date", utcDateOffset(30))
    .neq("status", "valid");

  const { data: orgs, error: orgError } = await admin
    .from("organizations")
    .select("id, name, alert_cadences");

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  let sent = 0;
  const failures: string[] = [];

  for (const org of (orgs ?? []) as Pick<Organization, "id" | "name" | "alert_cadences">[]) {
    const cadences = org.alert_cadences?.length ? org.alert_cadences : [30, 14, 3];
    const targetDates = new Set<string>([today, ...cadences.map((days) => utcDateOffset(days))]);

    const { data: rows } = await admin
      .from("vendor_latest_documents")
      .select("*")
      .eq("org_id", org.id)
      .in("expiration_date", [...targetDates]);

    const { data: owners } = await admin
      .from("users")
      .select("email")
      .eq("org_id", org.id)
      .in("role", ["owner", "admin"]);

    const contractorEmails = (owners ?? []).map((user) => user.email).filter(Boolean);

    for (const row of (rows ?? []) as VendorLatest[]) {
      if (!row.expiration_date || !row.document_id) continue;

      const days = cadences.find((day) => utcDateOffset(day) === row.expiration_date);
      const alertType = row.expiration_date === today ? "expired" : String(days ?? "soon");

      const { error: insertError } = await admin.from("alert_sends").insert({
        org_id: org.id,
        vendor_id: row.vendor_id,
        document_id: row.document_id,
        alert_type: alertType,
        sent_on: today,
      });

      if (insertError) continue;

      try {
        const token = await ensureVendorInviteToken({
          orgId: org.id,
          vendorId: row.vendor_id,
          vendorName: row.name,
          contactEmail: row.contact_email,
          trade: row.trade,
        });

        await sendExpirationEmails({
          contractorEmails,
          contractorName: org.name,
          vendorName: row.name,
          vendorEmail: row.contact_email,
          expirationDate: row.expiration_date,
          alertType,
          uploadToken: token,
        });
        sent += 1;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : "send failed");
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failures });
}
