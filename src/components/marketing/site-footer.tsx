import Link from "next/link";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Certificate of Insurance tracking for general contractors and property managers.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <p className="font-medium text-foreground">Product</p>
            <a href="/#how-it-works" className="block text-muted-foreground hover:text-foreground">
              How it works
            </a>
            <a href="/#pricing" className="block text-muted-foreground hover:text-foreground">
              Pricing
            </a>
            <Link href="/signup" className="block text-muted-foreground hover:text-foreground">
              Start trial
            </Link>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-foreground">Legal</p>
            <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
            <Link href="/terms" className="block text-muted-foreground hover:text-foreground">
              Terms
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} COI Tracker. Software for tracking certificates — not insurance advice.
        </p>
      </div>
    </footer>
  );
}
