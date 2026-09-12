"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LiabilityDisclaimer } from "@/components/liability-disclaimer";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REVIEW_CONFIDENCE_THRESHOLD, confidencePercent } from "@/lib/coi";
import type { Document, ReviewStatus, Vendor } from "@/types/database";

export function ReviewForm({
  document,
  vendor,
}: {
  document: Document;
  vendor: Pick<Vendor, "id" | "name" | "contact_email" | "trade">;
}) {
  const router = useRouter();
  const [effectiveDate, setEffectiveDate] = useState(document.effective_date ?? "");
  const [expirationDate, setExpirationDate] = useState(document.expiration_date ?? "");
  const [limit, setLimit] = useState(document.liability_limit ?? "");
  const [notes, setNotes] = useState(document.notes ?? "");
  const [rejectReason, setRejectReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const percent = confidencePercent(document.confidence_score);
  const lowConfidence =
    document.confidence_score == null || document.confidence_score < REVIEW_CONFIDENCE_THRESHOLD;

  async function submit(action: "approve" | "reject") {
    setBusy(true);
    try {
      const response = await fetch(`/api/documents/${document.id}/review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          effective_date: effectiveDate || null,
          expiration_date: expirationDate || null,
          gl_occurrence_limit: limit || null,
          notes: notes || null,
          reject_reason: action === "reject" ? rejectReason : undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Review failed");
      toast.success(action === "approve" ? "Certificate approved." : "Re-upload requested.");
      setConfirmOpen(false);
      setRejectOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Review failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Subcontractor</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{vendor.name}</h2>
        <p className="text-sm text-muted-foreground">
          {[vendor.trade, vendor.contact_email].filter(Boolean).join(" · ") || "No contact on file"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">
          {percent == null ? "No confidence score" : `${percent}% confidence`}
        </Badge>
        <ReviewChip status={document.review_status} />
      </div>

      {lowConfidence ? (
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertTitle>Please double check dates manually against the PDF.</AlertTitle>
          <AlertDescription>
            Extraction confidence is below 85%. Confirm the dates and limit against the PDF.
          </AlertDescription>
        </Alert>
      ) : null}

      {document.status === "parse_failed" ? (
        <Alert variant="destructive">
          <AlertTitle>Automatic read failed</AlertTitle>
          <AlertDescription>Enter the values from the certificate on the left.</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="gl-expiration">General Liability expiration</Label>
        <Input
          id="gl-expiration"
          type="date"
          value={expirationDate}
          onChange={(event) => setExpirationDate(event.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="gl-effective">Policy effective date</Label>
        <Input
          id="gl-effective"
          type="date"
          value={effectiveDate}
          onChange={(event) => setEffectiveDate(event.target.value)}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="gl-limit">General Liability each-occurrence limit</Label>
        <Input
          id="gl-limit"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          placeholder="$1,000,000"
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Note / memo</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Internal notes for the office"
          rows={3}
        />
      </div>

      <LiabilityDisclaimer />

      <div className="grid gap-2 sm:grid-cols-2">
        <Button type="button" onClick={() => setConfirmOpen(true)} disabled={busy}>
          Confirm & Approve
        </Button>
        <Button type="button" variant="outline" onClick={() => setRejectOpen(true)} disabled={busy}>
          Reject & Request Re-upload
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve this certificate?</DialogTitle>
            <DialogDescription>
              This marks the COI as reviewed and schedules expiration reminders. You are confirming
              the dates and limits against the PDF.
            </DialogDescription>
          </DialogHeader>
          <LiabilityDisclaimer />
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => submit("approve")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Confirm & Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a re-upload</DialogTitle>
            <DialogDescription>
              We email {vendor.contact_email ?? "the subcontractor"} a new upload link with your note.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-1.5">
            <Label htmlFor="reject-reason">What is missing or wrong?</Label>
            <Textarea
              id="reject-reason"
              required
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              placeholder="GL expiration is cut off / Additional Insured not shown / wrong named insured"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRejectOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" disabled={busy} onClick={() => submit("reject")}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReviewChip({ status }: { status: ReviewStatus }) {
  const label =
    status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending Review";
  return <Badge variant="secondary">{label}</Badge>;
}
