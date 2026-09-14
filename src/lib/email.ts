import { Resend } from "resend";
import { getAppUrl, isEmailConfigured } from "@/lib/env";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  return process.env.EMAIL_FROM?.trim() || "SubCertify <onboarding@resend.dev>";
}

async function sendEmail(payload: {
  from: string;
  to: string | string[];
  cc?: string[];
  subject: string;
  html: string;
}) {
  const { error } = await getResend().emails.send(payload);
  if (error) throw new Error(error.message);
}

function layout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f4f5;font-family:Geist,ui-sans-serif,system-ui,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:12px;padding:32px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">SubCertify</p>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;">${title}</h1>
                ${body}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(href: string, label: string) {
  return `<p style="margin:24px 0 8px;">
    <a href="${href}" style="display:inline-block;background:#18181b;color:#fafafa;text-decoration:none;padding:10px 16px;border-radius:8px;font-size:14px;font-weight:600;">
      ${label}
    </a>
  </p>`;
}

export async function sendExpirationEmails(input: {
  contractorEmails: string[];
  contractorName: string;
  vendorName: string;
  vendorEmail: string | null;
  expirationDate: string;
  alertType: string;
  uploadToken: string;
}): Promise<string[]> {
  if (!isEmailConfigured()) {
    console.warn("Email skipped — RESEND_API_KEY or EMAIL_FROM is not set");
    return [];
  }

  const uploadUrl = `${getAppUrl()}/upload/${input.uploadToken}`;
  const subject = `Action Required: Update your Certificate of Insurance for ${input.contractorName}`;
  const vendorHtml = layout(
    input.alertType === "expired"
      ? "Your certificate of insurance has expired"
      : `Please renew your COI — ${input.alertType} days left`,
    `<p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
      ${input.contractorName} needs an updated certificate of insurance on file.
      Current expiration: <strong>${input.expirationDate}</strong>.
    </p>
    ${button(uploadUrl, "Upload updated COI")}`
  );

  const recipients = [
    ...new Set(
      [input.vendorEmail, ...input.contractorEmails]
        .map((email) => email?.trim())
        .filter((email): email is string => Boolean(email))
    ),
  ];
  if (recipients.length === 0) return [];

  if (input.vendorEmail) {
    await sendEmail({
      from: fromAddress(),
      to: input.vendorEmail,
      cc: input.contractorEmails.length > 0 ? input.contractorEmails : undefined,
      subject,
      html: vendorHtml,
    });
    return recipients;
  }

  await sendEmail({
    from: fromAddress(),
    to: input.contractorEmails,
    subject,
    html: vendorHtml,
  });
  return recipients;
}

export async function sendRejectReuploadEmail(input: {
  to: string;
  cc?: string[];
  contractorName: string;
  vendorName: string;
  token: string;
  reason: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const uploadUrl = `${getAppUrl()}/upload/${input.token}`;
  await sendEmail({
    from: fromAddress(),
    to: input.to,
    cc: input.cc?.length ? input.cc : undefined,
    subject: `Action Required: Update your Certificate of Insurance for ${input.contractorName}`,
    html: layout(
      "A new certificate is needed",
      `<p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        ${input.contractorName} could not approve the COI for ${input.vendorName}.
      </p>
      <p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">${input.reason}</p>
      ${button(uploadUrl, "Upload updated COI")}`
    ),
  });
}

export async function sendInviteEmail(input: {
  to: string;
  contractorName: string;
  vendorName: string;
  token: string;
}) {
  if (!isEmailConfigured()) {
    throw new Error("RESEND_API_KEY is not set");
  }
  const uploadUrl = `${getAppUrl()}/upload/${input.token}`;
  await sendEmail({
    from: fromAddress(),
    to: input.to,
    subject: `${input.contractorName} requested your certificate of insurance`,
    html: layout(
      "Upload your Certificate of Insurance",
      `<p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
        ${input.contractorName} invited ${input.vendorName} to submit an ACORD 25 certificate.
      </p>
      ${button(uploadUrl, "Upload COI")}`
    ),
  });
}
