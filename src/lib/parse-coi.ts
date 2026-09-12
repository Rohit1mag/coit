import { generateText, Output } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { deriveStatus, STORAGE_BUCKET } from "@/lib/coi";
import type { CoiExtraction } from "@/types/database";

function toIsoDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const slash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) {
    const [, month, day, year] = slash;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  return trimmed;
}

const optionalIsoDate = z
  .union([z.string(), z.null()])
  .transform((value) => {
    if (!value?.trim()) return null;
    const iso = toIsoDate(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : null;
  });

export const coiExtractionSchema = z.object({
  vendor_name: z.string().nullable(),
  policy_effective_date: optionalIsoDate,
  policy_expiration_date: optionalIsoDate,
  gl_occurrence_limit: z.string().nullable(),
  additional_insured_checked: z.boolean(),
  waiver_of_subrogation_checked: z.boolean(),
  workers_comp_present: z.boolean(),
  confidence_score: z
    .number()
    .transform((value) => (value > 1 ? value / 100 : value))
    .pipe(z.number().min(0).max(1)),
});

const SYSTEM_PROMPT = `You extract data from ACORD 25 Certificates of Insurance.
Return only fields you can read from the document. Use null when a field is not visible.
Dates must be YYYY-MM-DD (convert MM/DD/YYYY).
vendor_name is the INSURED named on the form (the subcontractor/vendor), not the producer/agency and not the certificate holder.
gl_occurrence_limit is the commercial general liability each-occurrence limit, like "$1,000,000".
additional_insured_checked is true if Additional Insured is marked on the certificate.
waiver_of_subrogation_checked is true if Waiver of Subrogation is marked.
workers_comp_present is true if a workers compensation policy is listed.
confidence_score is 0-1 based on how readable the document is.`;

function visionModel() {
  return process.env.LLM_PROVIDER === "anthropic"
    ? anthropic("claude-sonnet-5")
    : openai("gpt-4o");
}

function mediaTypeFor(path: string, blobType: string) {
  if (blobType.startsWith("image/") || blobType === "application/pdf") return blobType;
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "webp") return "image/webp";
  return "application/pdf";
}

export function parseErrorMessage(error: unknown) {
  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause.message : "";
    return cause ? `${error.message}: ${cause}` : error.message;
  }
  return "Parse failed";
}

export async function extractCoiFromFile(file: {
  buffer: Buffer;
  mediaType: string;
}): Promise<CoiExtraction> {
  const result = await generateText({
    model: visionModel(),
    output: Output.object({ schema: coiExtractionSchema }),
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: SYSTEM_PROMPT },
          { type: "file", data: file.buffer, mediaType: file.mediaType },
        ],
      },
    ],
  });

  if (!result.output) {
    throw new Error("Vision model returned no structured output");
  }

  return result.output;
}

export async function downloadStorageObject(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(STORAGE_BUCKET).download(path);
  if (error || !data) {
    throw new Error(error?.message ?? "Unable to download uploaded file");
  }
  return {
    buffer: Buffer.from(await data.arrayBuffer()),
    mediaType: mediaTypeFor(path, data.type || ""),
  };
}

export async function upsertVendorAndDocument(input: {
  orgId: string;
  path: string;
  extracted: CoiExtraction | null;
  parseError?: string;
  vendorId?: string | null;
  vendorName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  trade?: string | null;
  uploadToken?: string | null;
  reuseVendor?: boolean;
}) {
  const admin = createAdminClient();
  const name =
    input.vendorName?.trim() ||
    input.extracted?.vendor_name?.trim() ||
    "Unknown vendor";

  let vendorId = input.vendorId ?? null;

  if (vendorId) {
    await admin
      .from("vendors")
      .update({
        name,
        contact_name: input.contactName ?? undefined,
        contact_email: input.contactEmail ?? undefined,
        trade: input.trade ?? undefined,
      })
      .eq("id", vendorId)
      .eq("org_id", input.orgId);
  } else {
    if (input.reuseVendor !== false && input.contactEmail) {
      const { data: existing } = await admin
        .from("vendors")
        .select("id")
        .eq("org_id", input.orgId)
        .ilike("contact_email", input.contactEmail)
        .maybeSingle();
      vendorId = existing?.id ?? null;
    }

    if (input.reuseVendor !== false && !vendorId) {
      const { data: byName } = await admin
        .from("vendors")
        .select("id")
        .eq("org_id", input.orgId)
        .ilike("name", name)
        .maybeSingle();
      vendorId = byName?.id ?? null;
    }

    if (vendorId) {
      await admin
        .from("vendors")
        .update({
          name,
          contact_name: input.contactName ?? undefined,
          contact_email: input.contactEmail ?? undefined,
          trade: input.trade ?? undefined,
        })
        .eq("id", vendorId);
    } else {
      const { data: created, error } = await admin
        .from("vendors")
        .insert({
          org_id: input.orgId,
          name,
          contact_name: input.contactName ?? null,
          contact_email: input.contactEmail ?? null,
          trade: input.trade ?? null,
        })
        .select("id")
        .single();
      if (error || !created) {
        throw new Error(error?.message ?? "Failed to create vendor");
      }
      vendorId = created.id;
    }
  }

  const expiration = input.extracted?.policy_expiration_date ?? null;
  const status = input.extracted ? deriveStatus(expiration) : "parse_failed";

  const { data: document, error: docError } = await admin
    .from("documents")
    .insert({
      vendor_id: vendorId,
      org_id: input.orgId,
      file_url: input.path,
      effective_date: input.extracted?.policy_effective_date ?? null,
      expiration_date: expiration,
      liability_limit: input.extracted?.gl_occurrence_limit ?? null,
      workers_comp_included: input.extracted?.workers_comp_present ?? null,
      additional_insured: input.extracted?.additional_insured_checked ?? null,
      waiver_subrogation: input.extracted?.waiver_of_subrogation_checked ?? null,
      confidence_score: input.extracted?.confidence_score ?? null,
      status,
      review_status: "pending_review",
      raw_ai_json: input.extracted ?? { error: input.parseError ?? "parse_failed" },
      upload_token: input.uploadToken ?? null,
    })
    .select("*")
    .single();

  if (docError || !document) {
    throw new Error(docError?.message ?? "Failed to save document");
  }

  return { vendorId, document };
}

export async function parseStorageObject(input: {
  orgId: string;
  path: string;
  vendorId?: string | null;
  vendorName?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  trade?: string | null;
  uploadToken?: string | null;
  reuseVendor?: boolean;
}) {
  const file = await downloadStorageObject(input.path);

  try {
    const extracted = await extractCoiFromFile(file);
    return upsertVendorAndDocument({ ...input, extracted });
  } catch (error) {
    return upsertVendorAndDocument({
      ...input,
      extracted: null,
      parseError: parseErrorMessage(error),
    });
  }
}
