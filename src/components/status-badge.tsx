import { Badge } from "@/components/ui/badge";
import { reviewLabel, statusLabel } from "@/lib/coi";
import { cn } from "@/lib/utils";
import type { DocumentStatus, ReviewStatus } from "@/types/database";

const styles: Record<string, string> = {
  valid: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  approved: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  expiring_soon: "border-transparent bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300",
  expired: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  pending: "bg-muted text-muted-foreground",
  pending_review: "border-transparent bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-300",
  rejected: "border-transparent bg-red-100 text-red-800",
  parse_failed: "border-transparent bg-red-100 text-red-800",
};

export function StatusBadge({
  status,
  review,
}: {
  status: DocumentStatus | null | undefined;
  review?: ReviewStatus | null;
}) {
  const tone =
    review === "rejected"
      ? "rejected"
      : review && review !== "approved"
        ? "pending_review"
        : review === "approved" && status !== "expired" && status !== "expiring_soon"
          ? "approved"
          : (status ?? "pending");

  return (
    <Badge className={cn(styles[tone] ?? styles.pending)}>
      {review ? reviewLabel(review, status) : statusLabel(status)}
    </Badge>
  );
}
