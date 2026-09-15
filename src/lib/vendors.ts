export const MAX_VENDORS_PER_ORG = 50;

export const VENDOR_LIMIT_MESSAGE =
  "This account has reached the 50-subcontractor limit. Remove a subcontractor to add another.";

export class VendorLimitError extends Error {
  status = 409;
  constructor() {
    super(VENDOR_LIMIT_MESSAGE);
  }
}

type VendorCountResult = { count: number | null; error: { message: string } | null };

export async function countOrgVendors(
  client: { from: (table: string) => unknown },
  orgId: string,
) {
  const query = client.from("vendors") as {
    select: (
      columns: string,
      options: { count: "exact"; head: true },
    ) => { eq: (column: string, value: string) => PromiseLike<VendorCountResult> };
  };
  const { count, error } = await query.select("id", { count: "exact", head: true }).eq("org_id", orgId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function assertCanCreateVendor(
  client: { from: (table: string) => unknown },
  orgId: string,
) {
  const count = await countOrgVendors(client, orgId);
  if (count >= MAX_VENDORS_PER_ORG) {
    throw new VendorLimitError();
  }
}
