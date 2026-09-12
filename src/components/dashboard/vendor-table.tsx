"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ExternalLink, Loader2, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DocumentStatus, VendorLatest } from "@/types/database";

const FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "valid", label: "Valid" },
  { value: "expiring_soon", label: "Expiring soon" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
] as const;

function formatDate(value: string | null) {
  if (!value) return "—";
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function VendorTable({ vendors }: { vendors: VendorLatest[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [pending, setPending] = useState<VendorLatest | null>(null);
  const [busy, setBusy] = useState(false);
  const [removed, setRemoved] = useState<string[]>([]);

  const rows = useMemo(() => {
    return vendors.filter((vendor) => {
      if (removed.includes(vendor.vendor_id)) return false;
      const haystack = [vendor.name, vendor.contact_email, vendor.trade]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = haystack.includes(query.toLowerCase().trim());
      const current = vendor.status ?? "pending";
      const matchesStatus = status === "all" || current === status;
      return matchesQuery && matchesStatus;
    });
  }, [vendors, query, status, removed]);

  async function removeVendor() {
    if (!pending) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/vendors/${pending.vendor_id}`, { method: "DELETE" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not delete subcontractor");
      }
      setRemoved((ids) => [...ids, pending.vendor_id]);
      toast.success(`${pending.name} removed.`);
      setPending(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search vendor, email, or trade"
            className="pl-8"
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Contact email</TableHead>
              <TableHead>Trade</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">COI</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No subcontractors match this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((vendor) => (
                <TableRow key={vendor.vendor_id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.contact_email ?? "—"}
                  </TableCell>
                  <TableCell>{vendor.trade ?? "—"}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {formatDate(vendor.expiration_date)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={vendor.status as DocumentStatus | null} />
                  </TableCell>
                  <TableCell className="text-right">
                    {vendor.preview_url ? (
                      <a
                        href={vendor.preview_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        Preview
                        <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${vendor.name}`}
                      onClick={() => setPending(vendor)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={pending != null} onOpenChange={(open) => !busy && setPending(open ? pending : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {pending?.name}?</DialogTitle>
            <DialogDescription>
              Their certificates and upload links will be deleted. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={removeVendor}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
