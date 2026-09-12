import { addDays, format, parseISO } from "date-fns";
import type { DocumentStatus, ReviewStatus } from "@/types/database";

export const DEFAULT_ALERT_CADENCES = [30, 14, 7] as const;
export const REVIEW_CONFIDENCE_THRESHOLD = 0.85;
export const EXPIRING_SOON_DAYS = 30;
export const STORAGE_BUCKET = "coi-documents";

export function utcToday() {
  return format(new Date(), "yyyy-MM-dd");
}

export function utcDateOffset(days: number) {
  return format(addDays(new Date(), days), "yyyy-MM-dd");
}

export function deriveStatus(expirationDate: string | null | undefined): DocumentStatus {
  if (!expirationDate) return "pending";
  const today = utcToday();
  if (expirationDate < today) return "expired";
  const soon = utcDateOffset(EXPIRING_SOON_DAYS);
  if (expirationDate <= soon) return "expiring_soon";
  return "valid";
}

export function daysUntil(expirationDate: string | null | undefined) {
  if (!expirationDate) return null;
  const today = parseISO(utcToday());
  const exp = parseISO(expirationDate);
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000);
}

export function statusLabel(status: DocumentStatus | null | undefined) {
  switch (status) {
    case "valid":
      return "Valid";
    case "expiring_soon":
      return "Expiring Soon";
    case "expired":
      return "Expired";
    case "parse_failed":
      return "Parse Failed";
    default:
      return "Pending";
  }
}

export function reviewLabel(
  review: ReviewStatus | null | undefined,
  status?: DocumentStatus | null,
) {
  if (review === "rejected") return "Rejected";
  if (review !== "approved") return "Pending Review";
  if (status === "expired") return "Expired";
  return "Approved";
}

export function confidencePercent(score: number | null | undefined) {
  if (score == null || Number.isNaN(score)) return null;
  const normalized = score > 1 ? score : score * 100;
  return Math.round(normalized);
}

export function isPaidStatus(status: string | null | undefined) {
  return status === "active" || status === "on_trial" || status === "trialing";
}

export function randomToken(bytes = 18) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}
