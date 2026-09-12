import { NextResponse } from "next/server";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { isComplimentaryEmail } from "@/lib/billing";
import { getAppUrl } from "@/lib/env";
import { createSubscriptionCheckout } from "@/lib/lemonsqueezy";

export async function POST() {
  try {
    const session = await requireApiSession();
    if (
      isComplimentaryEmail(session.email) ||
      session.org.lemon_squeezy_subscription_status === "complimentary"
    ) {
      return NextResponse.json(
        { error: "This account has complimentary access. Checkout is not required." },
        { status: 400 }
      );
    }
    const url = await createSubscriptionCheckout({
      orgId: session.org.id,
      email: session.email,
      name: session.org.name,
      redirectUrl: `${getAppUrl()}/settings?checkout=success`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unable to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
