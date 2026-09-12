"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AlertCadenceForm({ cadences }: { cadences: number[] }) {
  const router = useRouter();
  const [values, setValues] = useState(
    (cadences.length ? cadences : [30, 14, 3]).slice(0, 3).concat([30, 14, 3]).slice(0, 3)
  );
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/settings/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alert_cadences: values.map((value) => Number(value)).filter((value) => value > 0),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Save failed");
      toast.success("Alert cadence saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expiration alerts</CardTitle>
        <CardDescription>
          Email the contractor and the subcontractor this many days before a policy lapses. Expired
          certificates are always flagged the day they expire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {values.map((value, index) => (
              <div key={index} className="grid gap-1.5">
                <Label htmlFor={`cadence-${index}`}>Reminder {index + 1} (days)</Label>
                <Input
                  id={`cadence-${index}`}
                  type="number"
                  min={1}
                  max={365}
                  value={value}
                  onChange={(event) => {
                    const next = [...values];
                    next[index] = Number(event.target.value);
                    setValues(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save alerts
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
