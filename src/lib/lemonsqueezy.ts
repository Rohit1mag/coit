import {
  createCheckout,
  getCustomer,
  getSubscription,
  lemonSqueezySetup,
  listStores,
} from "@lemonsqueezy/lemonsqueezy.js";

export function configureLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) throw new Error("LEMONSQUEEZY_API_KEY is not set");
  lemonSqueezySetup({ apiKey });
}

export async function resolveStoreId() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!storeId) throw new Error("LEMONSQUEEZY_STORE_ID is not set");
  if (/^\d+$/.test(storeId)) return storeId;

  configureLemonSqueezy();
  const stores = await listStores();
  if (stores.error) throw new Error(stores.error.message);
  const match = stores.data?.data.find(
    (store) => store.attributes.slug === storeId || store.attributes.name === storeId
  );
  if (!match) {
    throw new Error(
      `No Lemon Squeezy store matches "${storeId}". Use the numeric store ID from Settings.`
    );
  }
  return match.id;
}

export function requireVariantId() {
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (!variantId) throw new Error("LEMONSQUEEZY_VARIANT_ID is not set");
  return Number(variantId);
}

export async function createSubscriptionCheckout(input: {
  orgId: string;
  email: string;
  name: string;
  redirectUrl: string;
}) {
  configureLemonSqueezy();
  const variantId = requireVariantId();
  const checkout = await createCheckout(await resolveStoreId(), variantId, {
    checkoutOptions: {
      embed: true,
      media: false,
    },
    checkoutData: {
      email: input.email,
      name: input.name,
      custom: {
        org_id: input.orgId,
      },
    },
    productOptions: {
      redirectUrl: input.redirectUrl,
      receiptButtonText: "Open dashboard",
      receiptThankYouNote: "Your SubCertify trial is starting.",
    },
  });

  if (checkout.error) {
    const detail = checkout.error.message;
    throw new Error(
      detail === "Not Found"
        ? "Lemon Squeezy store or variant was not found. Use the numeric store ID from Settings, not the store slug."
        : detail
    );
  }

  const url = checkout.data?.data.attributes.url;
  if (!url) throw new Error("Lemon Squeezy did not return a checkout URL.");
  return url;
}

export async function getCustomerPortalUrl(input: {
  subscriptionId: string | null;
  customerId: string | null;
}) {
  configureLemonSqueezy();

  if (input.subscriptionId) {
    const subscription = await getSubscription(input.subscriptionId);
    if (subscription.error) throw new Error(subscription.error.message);
    const url = subscription.data?.data.attributes.urls.customer_portal;
    if (url) return url;
  }

  if (input.customerId) {
    const customer = await getCustomer(input.customerId);
    if (customer.error) throw new Error(customer.error.message);
    const url = customer.data?.data.attributes.urls.customer_portal;
    if (url) return url;
  }

  throw new Error("No Lemon Squeezy customer portal is available yet.");
}
