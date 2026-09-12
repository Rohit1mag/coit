import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <MarketingShell>
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          That link is invalid or the page does not exist.
        </p>
        <Button className="mt-8" asChild>
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </MarketingShell>
  );
}
