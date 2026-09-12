"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPaidStatus } from "@/lib/coi";

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
      window.location.href = payload.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Billing request failed");
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Billing</CardTitle>
          <Badge variant={subscribed ? "secondary" : "outline"}>{status}</Badge>
        </div>
        <CardDescription>
          $99/month, 14-day trial. The product works either way — this is just how you pay. Lemon
          Squeezy handles tax.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {!configured ? (
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
