export type UserRole = "owner" | "admin" | "member";

export type DocumentStatus =
  | "pending"
  | "valid"
  | "expiring_soon"
  | "expired"
  | "parse_failed";

export type ReviewStatus = "pending_review" | "approved" | "rejected";

export type SubscriptionStatus =
  | "none"
  | "complimentary"
  | "on_trial"
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "canceled"
  | "unpaid"
  | "expired"
  | "paused";

export type Organization = {
  id: string;
  name: string;
  lemon_squeezy_customer_id: string | null;
  lemon_squeezy_subscription_id: string | null;
  lemon_squeezy_subscription_status: SubscriptionStatus;
  alert_cadences: number[];
  alert_email: string | null;
  created_at: string;
};

export type AlertSend = {
  id: string;
  org_id: string;
  vendor_id: string;
  document_id: string | null;
  alert_type: string;
  sent_on: string;
  sent_at: string;
  recipients: string[];
};

export type Profile = {
  id: string;
  org_id: string;
  role: UserRole;
  email: string;
  created_at: string;
};

export type Vendor = {
  id: string;
  org_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  trade: string | null;
  created_at: string;
};

export type Invite = {
  id: string;
  org_id: string;
  vendor_id: string | null;
  token: string;
  vendor_name: string | null;
  contact_email: string | null;
  trade: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Document = {
  id: string;
  vendor_id: string;
  org_id: string;
  file_url: string;
  effective_date: string | null;
  expiration_date: string | null;
  liability_limit: string | null;
  workers_comp_included: boolean | null;
  additional_insured: boolean | null;
  waiver_subrogation: boolean | null;
  notes: string | null;
  confidence_score: number | null;
  status: DocumentStatus;
  review_status: ReviewStatus;
  raw_ai_json: CoiExtraction | null;
  upload_token: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
};

export type VendorLatest = {
  vendor_id: string;
  org_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  phone: string | null;
  trade: string | null;
  vendor_created_at: string;
  document_id: string | null;
  file_url: string | null;
  effective_date: string | null;
  expiration_date: string | null;
  liability_limit: string | null;
  workers_comp_included: boolean | null;
  additional_insured: boolean | null;
  waiver_subrogation: boolean | null;
  notes: string | null;
  confidence_score: number | null;
  status: DocumentStatus | null;
  review_status: ReviewStatus | null;
  verified_at: string | null;
  document_created_at: string | null;
  preview_url?: string | null;
};

export type CoiExtraction = {
  vendor_name: string | null;
  policy_effective_date: string | null;
  policy_expiration_date: string | null;
  gl_occurrence_limit: string | null;
  additional_insured_checked: boolean;
  waiver_of_subrogation_checked: boolean;
  workers_comp_present: boolean;
  confidence_score: number;
};

export type SessionContext = {
  userId: string;
  email: string;
  profile: Profile;
  org: Organization;
};
