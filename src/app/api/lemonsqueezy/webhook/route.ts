import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type LemonWebhook = {
  meta?: {
    event_name?: string;
    custom_data?: { org_id?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      customer_id?: number | string;
      status?: string;
    };
  };
};

function verifySignature(rawBody: string, signatureHeader: string | null, secret: string) {
  if (!signatureHeader) return false;
  const digest = Buffer.from(createHmac("sha256", secret).update(rawBody).digest("hex"), "hex");
  const signature = Buffer.from(signatureHeader, "hex");
  if (digest.length !== signature.length) return false;
  return timingSafeEqual(digest, signature);
}

async function syncSubscription(input: {
  orgId?: string;
  customerId: string;
  subscriptionId: string;
  status: string;
}) {
  const admin = createAdminClient();
  const payload = {
    lemon_squeezy_customer_id: input.customerId,
    lemon_squeezy_subscription_id: input.subscriptionId,
    lemon_squeezy_subscription_status: input.status,
  };

  if (input.orgId) {
    await admin
      .from("organizations")
      .update(payload)
      .eq("id", input.orgId)
      .neq("lemon_squeezy_subscription_status", "complimentary");
    return;
  }

  await admin
    .from("organizations")
    .update(payload)
    .eq("lemon_squeezy_customer_id", input.customerId)
    .neq("lemon_squeezy_subscription_status", "complimentary");
}

export async function POST(request: Request) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "LEMONSQUEEZY_WEBHOOK_SECRET is not set." }, { status: 500 });
  }

  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get("x-signature"), secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as LemonWebhook;
  const name = event.meta?.event_name;
  const attributes = event.data?.attributes;
  const subscriptionId = event.data?.id;
  const customerId = attributes?.customer_id != null ? String(attributes.customer_id) : null;
  const status = attributes?.status;
  const orgId = event.meta?.custom_data?.org_id;

  const subscriptionEvents = new Set([
    "subscription_created",
    "subscription_updated",
    "subscription_cancelled",
    "subscription_resumed",
    "subscription_expired",
    "subscription_paused",
    "subscription_unpaused",
    "subscription_payment_failed",
    "subscription_payment_success",
    "subscription_payment_recovered",
  ]);

  if (name && subscriptionEvents.has(name) && subscriptionId && customerId && status) {
    await syncSubscription({
      orgId,
      customerId,
      subscriptionId,
      status,
    });
  }

  return NextResponse.json({ received: true });
}
