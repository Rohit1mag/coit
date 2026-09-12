import { NextResponse } from "next/server";
import { ApiAuthError, requireApiSession } from "@/lib/auth";
import { getAppUrl } from "@/lib/env";
import { createSubscriptionCheckout } from "@/lib/lemonsqueezy";

export async function POST() {
  try {
    const session = await requireApiSession();
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
