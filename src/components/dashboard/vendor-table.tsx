"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Copy, Loader2, Search, Trash2 } from "lucide-react";
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
  { value: "pending_review", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "expired", label: "Expired" },
  { value: "rejected", label: "Rejected" },
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
      const review = vendor.review_status ?? (vendor.document_id ? "pending_review" : null);
      const matchesStatus =
        status === "all" ||
        (status === "expired" && review === "approved" && vendor.status === "expired") ||
        (status === "approved" && review === "approved" && vendor.status !== "expired") ||
        (status === "pending_review" && review === "pending_review") ||
        (status === "rejected" && review === "rejected");
      return matchesQuery && matchesStatus;
    });
  }, [vendors, query, status, removed]);

  async function copyInvite(vendor: VendorLatest) {
    try {
      const response = await fetch(`/api/vendors/${vendor.vendor_id}/invite-link`, { method: "POST" });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Could not create invite link");
      }
      await navigator.clipboard.writeText(payload.url);
      toast.success("Invite link copied.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Copy failed");
    }
  }

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
              <TableHead>GL expiration</TableHead>
              <TableHead>Review status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
                    <StatusBadge
                      status={vendor.status as DocumentStatus | null}
                      review={vendor.review_status}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {vendor.document_id ? (
                        <Button type="button" variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/review/${vendor.document_id}`}>Review</Link>
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Copy invite link for ${vendor.name}`}
                        onClick={() => copyInvite(vendor)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${vendor.name}`}
                        onClick={() => setPending(vendor)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
