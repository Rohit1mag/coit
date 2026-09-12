"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, UserPlus } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

export function InviteDialog({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [trade, setTrade] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function reset() {
    setVendorName("");
    setContactEmail("");
    setTrade("");
    setSendEmail(true);
    setLink(null);
    setCopied(false);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/vendors/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_name: vendorName,
          contact_email: contactEmail,
          trade: trade || undefined,
          send_email: sendEmail,
        }),
      });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Could not create invite");
      }
      setLink(payload.url);
      toast.success(sendEmail ? "Invite sent." : "Upload link created.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invite failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copied");
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
        <Button variant="outline" disabled={disabled}>
          <UserPlus className="size-4" />
          Invite subcontractor
        </Button>
      </DialogTrigger>
      <DialogContent>
        {link ? (
          <div className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Share this upload link</DialogTitle>
              <DialogDescription>
                Anyone with the link can submit a COI. No account required.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input readOnly value={link} />
              <Button type="button" variant="outline" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copy
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-4">
            <DialogHeader>
              <DialogTitle>Invite subcontractor</DialogTitle>
              <DialogDescription>
                Generate a public upload page so they can send their ACORD 25 without signing up.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="invite-name">Vendor name</Label>
                <Input
                  id="invite-name"
                  required
                  value={vendorName}
                  onChange={(event) => setVendorName(event.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="invite-email">Contact email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Required so expiration reminders can be emailed to this sub.
                </p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="invite-trade">Trade</Label>
                <Input
                  id="invite-trade"
                  value={trade}
                  onChange={(event) => setTrade(event.target.value)}
                  placeholder="Optional"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={sendEmail}
                  onCheckedChange={(value) => setSendEmail(value === true)}
                />
                Email them the link
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                Create link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
