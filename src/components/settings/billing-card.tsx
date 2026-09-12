"use client";

import { useState } from "react";
import Script from "next/script";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPaidStatus } from "@/lib/coi";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup: (options: { eventHandler: (event: { event: string }) => void }) => void;
      Url: { Open: (url: string) => void };
    };
  }
}

function openLemonUrl(url: string) {
  window.createLemonSqueezy?.();
  window.LemonSqueezy?.Setup({
    eventHandler: (event) => {
      if (event.event === "Checkout.Success") {
        window.location.href = "/settings?checkout=success";
      }
    },
  });
  if (window.LemonSqueezy?.Url.Open) {
    window.LemonSqueezy.Url.Open(url);
    return;
  }
  window.location.href = url;
}

export function BillingCard({
  status,
  configured,
}: {
  status: string;
  configured: boolean;
}) {
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const subscribed = isPaidStatus(status);

  async function go(
    path: "/api/lemonsqueezy/checkout" | "/api/lemonsqueezy/portal",
    kind: "checkout" | "portal"
  ) {
    setBusy(kind);
    try {
      const response = await fetch(path, { method: "POST" });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Lemon Squeezy request failed");
      }
      openLemonUrl(payload.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Billing request failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      {status !== "complimentary" ? (
        <Script src="https://app.lemonsqueezy.com/js/lemon.js" strategy="afterInteractive" />
      ) : null}
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Billing</CardTitle>
          <Badge variant={subscribed ? "secondary" : "outline"}>
            {status === "complimentary" ? "Unlimited trial" : status}
          </Badge>
        </div>
        <CardDescription>
          {status === "complimentary"
            ? "This workspace has an unlimited complimentary trial. No payment is required."
            : "$99/month, 14-day trial. The product works either way — this is just how you pay. Lemon Squeezy handles tax."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {status === "complimentary" ? (
          <p className="text-sm text-muted-foreground">All product features are included at no charge.</p>
        ) : !configured ? (
          <p className="text-sm text-muted-foreground">
            Lemon Squeezy is not configured. Add LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, and
            LEMONSQUEEZY_VARIANT_ID.
          </p>
        ) : subscribed ? (
          <Button
            variant="outline"
            disabled={busy !== null}
            onClick={() => go("/api/lemonsqueezy/portal", "portal")}
          >
            {busy === "portal" ? <Loader2 className="size-4 animate-spin" /> : null}
            Manage subscription
          </Button>
        ) : (
          <Button disabled={busy !== null} onClick={() => go("/api/lemonsqueezy/checkout", "checkout")}>
            {busy === "checkout" ? <Loader2 className="size-4 animate-spin" /> : null}
            Start 14-day trial
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
