import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { isPaidStatus, utcToday } from "@/lib/coi";

export const TRIAL_DAYS = 14;
export const TRIAL_ENDED_MESSAGE =
  "Your 14-day trial has ended. Subscribe in Settings to keep uploading, reviewing, and sending reminders.";
export const PUBLIC_UPLOAD_PAUSED_MESSAGE =
  "This contractor is not accepting certificate uploads right now. Ask them to send a new link.";

const CLOSED_BILLING = new Set(["expired", "cancelled", "canceled", "unpaid", "paused"]);

const HARDCODED_COMPLIMENTARY_EMAILS = [
  "rohitkota4@gmail.com",
  "rkdscnd@gmail.com",
];

function complimentaryEmails() {
  const fromEnv = (process.env.COMPLIMENTARY_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...HARDCODED_COMPLIMENTARY_EMAILS, ...fromEnv]);
}

export function isComplimentaryEmail(email: string | null | undefined) {
  return Boolean(email && complimentaryEmails().has(email.trim().toLowerCase()));
}

export type BillingOrg = {
  created_at: string;
  lemon_squeezy_subscription_status?: string | null;
};

export type BillingAccess =
  | { allowed: true; kind: "complimentary" | "subscribed" | "trial"; daysRemaining: number | null }
  | { allowed: false; kind: "ended"; daysRemaining: 0 };

export function trialEndDate(createdAt: string) {
  return format(addDays(parseISO(createdAt.slice(0, 10)), TRIAL_DAYS), "yyyy-MM-dd");
}

export function trialDaysRemaining(createdAt: string) {
  return Math.max(
    0,
    differenceInCalendarDays(parseISO(trialEndDate(createdAt)), parseISO(utcToday())),
  );
}

export function getBillingAccess(org: BillingOrg): BillingAccess {
  const status = org.lemon_squeezy_subscription_status ?? "none";
  if (status === "complimentary") {
    return { allowed: true, kind: "complimentary", daysRemaining: null };
  }
  if (isPaidStatus(status)) {
    return { allowed: true, kind: "subscribed", daysRemaining: null };
  }
  if (CLOSED_BILLING.has(status)) {
    return { allowed: false, kind: "ended", daysRemaining: 0 };
  }
  const daysRemaining = trialDaysRemaining(org.created_at);
  if (daysRemaining > 0) {
    return { allowed: true, kind: "trial", daysRemaining };
  }
  return { allowed: false, kind: "ended", daysRemaining: 0 };
}

export function hasProductAccess(org: BillingOrg) {
  return getBillingAccess(org).allowed;
}
