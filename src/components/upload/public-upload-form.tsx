"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export function PublicUploadForm({
  token,
  contractorName,
  vendorName,
  contactEmail,
  trade,
}: {
  token: string;
  contractorName: string;
  vendorName: string | null;
  contactEmail: string | null;
  trade: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [name, setName] = useState(vendorName ?? "");
  const [email, setEmail] = useState(contactEmail ?? "");
  const [tradeValue, setTradeValue] = useState(trade ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onFile(next: File | null) {
    if (!next) return;
    if (next.size > 20 * 1024 * 1024) {
      setError("File must be 20MB or smaller.");
      return;
    }
    setError(null);
    setFile(next);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Attach your ACORD 25 PDF or a clear photo of the certificate.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("vendor_name", name);
      form.set("contact_email", email);
      form.set("trade", tradeValue);
      const response = await fetch(`/api/upload/${token}`, { method: "POST", body: form });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Upload failed");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Card>
        <CardHeader className="items-center text-center">
          <CheckCircle2 className="size-10 text-emerald-600" />
          <CardTitle>You&apos;re done</CardTitle>
          <CardDescription>
            {contractorName} has the certificate. You can close this page.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload your Certificate of Insurance</CardTitle>
        <CardDescription>
          {contractorName} needs a current ACORD 25 on file. PDF or phone photo is fine.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Upload failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <label
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              onFile(event.dataTransfer.files[0] ?? null);
            }}
            className={`flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center text-sm ${
              dragging ? "border-foreground bg-muted" : "border-border"
            }`}
          >
            <Upload className="mb-2 size-5 text-muted-foreground" />
            <span className="font-medium">{file ? file.name : "Drop your COI here"}</span>
            <span className="mt-1 text-muted-foreground">PDF, JPG, or PNG · 20MB max</span>
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" required value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Contact email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="trade">Trade</Label>
              <Input
                id="trade"
                value={tradeValue}
                onChange={(event) => setTradeValue(event.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {busy ? "Uploading and reading certificate…" : "Submit certificate"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
