import { redirect } from "next/navigation";
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
  const organization = Array.isArray(org) ? org[0] : org;
  if (!organization) return null;

  const profileRow = profile as Profile & {
    organizations: Organization | Organization[];
  };

  return {
    userId: user.id,
    email: user.email ?? profileRow.email,
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

export class ApiAuthError extends Error {
  status = 401;
  constructor() {
    super("Unauthorized");
  }
}
