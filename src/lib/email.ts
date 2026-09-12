import { Resend } from "resend";
import { getAppUrl, isEmailConfigured } from "@/lib/env";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not set");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function fromAddress() {
  return process.env.EMAIL_FROM?.trim() || "COI Tracker <onboarding@resend.dev>";
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
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">COI Tracker</p>
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
}) {
  if (!isEmailConfigured()) {
    console.warn("Email skipped — RESEND_API_KEY or EMAIL_FROM is not set");
    return;
  }

  const uploadUrl = `${getAppUrl()}/upload/${input.uploadToken}`;
  const dashboardUrl = `${getAppUrl()}/dashboard`;
  const headline =
    input.alertType === "expired"
      ? `${input.vendorName}'s certificate expired today`
      : `${input.vendorName}'s certificate expires in ${input.alertType} days`;

  const resend = getResend();

  const contractorHtml = layout(
    headline,
    `<p style="margin:0 0 12px;color:#3f3f46;line-height:1.6;">
      ${input.vendorName}'s COI ${input.alertType === "expired" ? "expired" : "expires"} on
      <strong>${input.expirationDate}</strong>. Ask them to upload a renewed ACORD 25.
    </p>
    ${button(dashboardUrl, "Open dashboard")}`
  );

  if (input.contractorEmails.length > 0) {
    await resend.emails.send({
      from: fromAddress(),
      to: input.contractorEmails,
      subject: headline,
      html: contractorHtml,
    });
  }

  if (input.vendorEmail) {
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

    await resend.emails.send({
      from: fromAddress(),
      to: input.vendorEmail,
      subject:
        input.alertType === "expired"
          ? `Action required: expired COI for ${input.contractorName}`
          : `COI renewal needed (${input.alertType} days) — ${input.contractorName}`,
      html: vendorHtml,
    });
  }
}

export async function sendInviteEmail(input: {
  to: string;
  contractorName: string;
  vendorName: string;
  token: string;
}) {
  if (!isEmailConfigured()) return;
  const uploadUrl = `${getAppUrl()}/upload/${input.token}`;
  await getResend().emails.send({
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
