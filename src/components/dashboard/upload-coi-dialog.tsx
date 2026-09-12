"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import type { VendorLatest } from "@/types/database";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp";

export function UploadCoiDialog({
  orgId,
  vendors,
  disabled,
}: {
  orgId: string;
  vendors: VendorLatest[];
  disabled?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [busy, setBusy] = useState(false);

  function reset() {
    setFile(null);
    setVendorId("");
    setVendorName("");
    setContactEmail("");
    setTrade("");
  }

  function onFile(next: File | null) {
    if (!next) return;
    if (next.size > 20 * 1024 * 1024) {
      toast.error("File must be 20MB or smaller.");
      return;
    }
    setFile(next);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      toast.error("Drop or choose a COI PDF or image.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
      const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("coi-documents")
        .upload(path, file, { contentType: file.type || "application/pdf" });

      if (uploadError) throw new Error(uploadError.message);

      const response = await fetch("/api/parse-coi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path,
          vendor_id: vendorId || null,
          vendor_name: vendorName || null,
          contact_email: contactEmail || null,
          trade: trade || null,
        }),
      });
      const payload = (await response.json()) as { error?: string; document?: { id?: string } };
      if (!response.ok) throw new Error(payload.error ?? "Parse failed");

      toast.success("Certificate uploaded. Confirm the extracted fields.");
      reset();
      setOpen(false);
      if (payload.document?.id) {
        router.push(`/dashboard/review/${payload.document.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Upload className="size-4" />
          Upload COI
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={onSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Upload certificate</DialogTitle>
            <DialogDescription>
              Drop an ACORD 25 PDF or photo. We extract dates, limits, and vendor name automatically.
            </DialogDescription>
          </DialogHeader>

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
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed px-4 py-10 text-center text-sm ${
              dragging ? "border-foreground bg-muted" : "border-border"
            }`}
          >
            <Upload className="mb-2 size-5 text-muted-foreground" />
            <span className="font-medium">{file ? file.name : "Drop PDF or image here"}</span>
            <span className="mt-1 text-muted-foreground">or click to browse · PDF, JPG, PNG · 20MB max</span>
            <input
              type="file"
              accept={ACCEPT}
              className="sr-only"
              onChange={(event) => onFile(event.target.files?.[0] ?? null)}
            />
          </label>

          <div className="grid gap-3">
            {vendors.length > 0 ? (
              <div className="grid gap-1.5">
                <Label htmlFor="existing-vendor">Existing vendor</Label>
                <select
                  id="existing-vendor"
                  value={vendorId}
                  onChange={(event) => {
                    const id = event.target.value;
                    setVendorId(id);
                    const match = vendors.find((vendor) => vendor.vendor_id === id);
                    if (match) {
                      setVendorName(match.name);
                      setContactEmail(match.contact_email ?? "");
                      setTrade(match.trade ?? "");
                    }
                  }}
                  className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                >
                  <option value="">Create new vendor from the COI</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.vendor_id} value={vendor.vendor_id}>
                      {vendor.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div className="grid gap-1.5">
              <Label htmlFor="vendor-name">Vendor name</Label>
              <Input
                id="vendor-name"
                value={vendorName}
                onChange={(event) => setVendorName(event.target.value)}
                placeholder="Optional — AI fills this in"
              />
            </div>
            <div className="grid gap-1.5 sm:grid-cols-2 sm:gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="vendor-email">Contact email</Label>
                <Input
                  id="vendor-email"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="vendor-trade">Trade</Label>
                <Input
                  id="vendor-trade"
                  value={trade}
                  onChange={(event) => setTrade(event.target.value)}
                  placeholder="Electrical, roofing…"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {busy ? "Parsing…" : "Upload and parse"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
