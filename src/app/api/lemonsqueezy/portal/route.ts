import { NextResponse } from "next/server";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { isComplimentaryEmail } from "@/lib/billing";
import { getCustomerPortalUrl } from "@/lib/lemonsqueezy";

export async function POST() {
  try {
    const session = await requireApiSession();
    if (
      isComplimentaryEmail(session.email) ||
      session.org.lemon_squeezy_subscription_status === "complimentary"
    ) {
      return NextResponse.json(
        { error: "This account has complimentary access. There is no billing portal." },
        { status: 400 }
      );
    }
    const url = await getCustomerPortalUrl({
      subscriptionId: session.org.lemon_squeezy_subscription_id,
      customerId: session.org.lemon_squeezy_customer_id,
    });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const message = error instanceof Error ? error.message : "Unable to open billing portal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
