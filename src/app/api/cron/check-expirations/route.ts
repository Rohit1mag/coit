import { NextResponse } from "next/server";
import { hasProductAccess } from "@/lib/billing";
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

  let { data: orgs, error: orgError } = await admin
    .from("organizations")
    .select("id, name, alert_cadences, alert_email, created_at, lemon_squeezy_subscription_status");
  if (orgError) {
    ({ data: orgs, error: orgError } = await admin
      .from("organizations")
      .select("id, name, alert_cadences, created_at, lemon_squeezy_subscription_status"));
  }

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  let sent = 0;
  let skippedNoInbox = 0;
  let skippedBilling = 0;
  const failures: string[] = [];

  for (const org of (orgs ?? []) as Pick<
    Organization,
    "id" | "name" | "alert_cadences" | "alert_email" | "created_at" | "lemon_squeezy_subscription_status"
  >[]) {
    if (!hasProductAccess(org)) {
      skippedBilling += 1;
      continue;
    }
    const { data: owners } = await admin
      .from("users")
      .select("email")
      .eq("org_id", org.id)
      .in("role", ["owner", "admin"]);

    const contractorEmails = [
      ...new Set(
        [org.alert_email, ...(owners ?? []).map((user) => user.email)]
          .map((email) => email?.trim())
          .filter((email): email is string => Boolean(email))
      ),
    ];

    if (contractorEmails.length === 0) {
      skippedNoInbox += 1;
      continue;
    }

    const cadences = org.alert_cadences?.length ? org.alert_cadences : [30, 14, 7];
    const targetDates = new Set<string>([today, ...cadences.map((days) => utcDateOffset(days))]);

    const { data: rows } = await admin
      .from("vendor_latest_documents")
      .select("*")
      .eq("org_id", org.id)
      .eq("review_status", "approved")
      .in("expiration_date", [...targetDates]);

    for (const row of (rows ?? []) as VendorLatest[]) {
      if (!row.expiration_date || !row.document_id) continue;

      const days = cadences.find((day) => utcDateOffset(day) === row.expiration_date);
      const alertType = row.expiration_date === today ? "expired" : String(days ?? "soon");

      const { data: locked, error: insertError } = await admin
        .from("alert_sends")
        .insert({
          org_id: org.id,
          vendor_id: row.vendor_id,
          document_id: row.document_id,
          alert_type: alertType,
          sent_on: today,
        })
        .select("id")
        .single();

      if (insertError || !locked) continue;

      try {
        const token = await ensureVendorInviteToken({
          orgId: org.id,
          vendorId: row.vendor_id,
          vendorName: row.name,
          contactEmail: row.contact_email,
          trade: row.trade,
        });

        const recipients = await sendExpirationEmails({
          contractorEmails,
          contractorName: org.name,
          vendorName: row.name,
          vendorEmail: row.contact_email,
          expirationDate: row.expiration_date,
          alertType,
          uploadToken: token,
        });

        if (recipients.length === 0) {
          await admin.from("alert_sends").delete().eq("id", locked.id);
          continue;
        }

        await admin
          .from("alert_sends")
          .update({ recipients, sent_at: new Date().toISOString() })
          .eq("id", locked.id);
        sent += 1;
      } catch (error) {
        await admin.from("alert_sends").delete().eq("id", locked.id);
        failures.push(error instanceof Error ? error.message : "send failed");
      }
    }
  }

  return NextResponse.json({ ok: true, sent, skippedNoInbox, skippedBilling, failures });
}
