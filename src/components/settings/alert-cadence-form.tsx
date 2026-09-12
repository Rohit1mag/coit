"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function reminderErrors(values: number[]) {
  return values.map((value, index) => {
    if (!Number.isInteger(value) || value < 1 || value > 365) {
      return "Enter a whole number between 1 and 365.";
    }
    if (index > 0 && value >= values[index - 1]) {
      return `Must be after Reminder ${index} (fewer days).`;
    }
    return null;
  });
}

export function AlertCadenceForm({ cadences }: { cadences: number[] }) {
  const router = useRouter();
  const [values, setValues] = useState(
    (cadences.length ? cadences : [30, 14, 7]).slice(0, 3).concat([30, 14, 7]).slice(0, 3)
  );
  const [busy, setBusy] = useState(false);
  const errors = reminderErrors(values);
  const invalid = errors.some(Boolean);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (invalid) {
      toast.error("Reminder 2 must be after Reminder 1, and Reminder 3 after Reminder 2.");
      return;
    }
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
          We email the subcontractor this many days before a policy lapses. Reminder 1 sends first,
          then 2, then 3. Expired certificates are always flagged the day they expire.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {values.map((value, index) => {
              const later = values[index + 1];
              const earlier = values[index - 1];
              const min =
                index === values.length - 1
                  ? 1
                  : Math.max(1, (Number.isFinite(later) ? later : 0) + 1);
              const max =
                index === 0 ? 365 : Math.max(1, (Number.isFinite(earlier) ? earlier : 366) - 1);
              const error = errors[index];
              return (
                <div key={index} className="grid gap-1.5">
                  <Label htmlFor={`cadence-${index}`}>Reminder {index + 1} (days)</Label>
                  <Input
                    id={`cadence-${index}`}
                    type="number"
                    min={min}
                    max={max}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `cadence-${index}-error` : undefined}
                    value={Number.isFinite(value) ? value : ""}
                    onChange={(event) => {
                      const next = [...values];
                      next[index] = Number(event.target.value);
                      setValues(next);
                    }}
                  />
                  {error ? (
                    <p id={`cadence-${index}-error`} className="text-xs text-destructive">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div>
            <Button type="submit" disabled={busy || invalid}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Save alerts
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
