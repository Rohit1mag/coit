import { Badge } from "@/components/ui/badge";
import { statusLabel } from "@/lib/coi";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types/database";

const styles: Record<DocumentStatus, string> = {
  valid: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expiring_soon: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  expired: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  pending: "bg-muted text-muted-foreground",
  parse_failed: "border-transparent bg-red-100 text-red-800",
};

export function StatusBadge({ status }: { status: DocumentStatus | null | undefined }) {
  const value = status ?? "pending";
  return <Badge className={cn(styles[value])}>{statusLabel(value)}</Badge>;
}
