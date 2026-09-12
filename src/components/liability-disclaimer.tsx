import { cn } from "@/lib/utils";

export const LIABILITY_DISCLAIMER =
  "COIT is an administrative scheduling tool, not an insurance broker or legal compliance audit. The contractor is solely responsible for verifying coverage.";

export function LiabilityDisclaimer({ className }: { className?: string }) {
  return <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>{LIABILITY_DISCLAIMER}</p>;
}
