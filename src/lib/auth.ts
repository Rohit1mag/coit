import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { hasProductAccess, isComplimentaryEmail, TRIAL_ENDED_MESSAGE } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Profile, SessionContext } from "@/types/database";

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, org_id, role, email, created_at, organizations(*)")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  const org = (profile as { organizations: Organization | Organization[] }).organizations;
  let organization = Array.isArray(org) ? org[0] : org;
  if (!organization) return null;

  const email = user.email ?? profile.email;
  if (
    isComplimentaryEmail(email) &&
    organization.lemon_squeezy_subscription_status !== "complimentary"
  ) {
    await supabase
      .from("organizations")
      .update({ lemon_squeezy_subscription_status: "complimentary" })
      .eq("id", organization.id);
    organization = {
      ...organization,
      lemon_squeezy_subscription_status: "complimentary",
    };
  }

  if (!organization.alert_email && email) {
    await supabase.from("organizations").update({ alert_email: email }).eq("id", organization.id);
    organization = { ...organization, alert_email: email };
  }

  const profileRow = profile as Profile & {
    organizations: Organization | Organization[];
  };

  return {
    userId: user.id,
    email,
    profile: {
      id: profileRow.id,
      org_id: profileRow.org_id,
      role: profileRow.role,
      email: profileRow.email,
      created_at: profileRow.created_at,
    },
    org: organization,
  };
}

export async function requireSession() {
  const session = await getSessionContext();
  if (!session) redirect("/login");
  return session;
}

export async function requireApiSession() {
  const session = await getSessionContext();
  if (!session) {
    throw new ApiAuthError();
  }
  return session;
}

export async function requireProductAccess() {
  const session = await requireApiSession();
  if (!hasProductAccess(session.org)) {
    throw new BillingRequiredError();
  }
  return session;
}

export function jsonAuthError(error: unknown) {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (error instanceof BillingRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 402 });
  }
  return null;
}

export class ApiAuthError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
  }
}

export class BillingRequiredError extends Error {
  status = 402;
  constructor() {
    super(TRIAL_ENDED_MESSAGE);
  }
}
