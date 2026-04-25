import { logger } from "./logger";

// To: business owner inbox. Hardcoded per requirements.
const NOTIFICATION_TO = "priypatel008@gmail.com";
const NOTIFICATION_SUBJECT_PREFIX = "New Plumbing Service Request";

type LeadEmailInput = {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  description?: string | null;
  dateNeeded?: string | null;
  urgency: string;
};

type EmailResult =
  | { sent: true }
  | { sent: false; reason: "no_resend_key" | "resend_error" | "exception" };

function buildSubject(lead: LeadEmailInput): string {
  return `${NOTIFICATION_SUBJECT_PREFIX} — ${lead.fullName} (${lead.urgency})`;
}

function buildHtml(lead: LeadEmailInput): string {
  const row = (label: string, value: string | null | undefined) => `
    <tr>
      <td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#0f172a;width:180px;border:1px solid #e2e8f0;">${label}</td>
      <td style="padding:8px 12px;color:#0f172a;border:1px solid #e2e8f0;">${value ? escapeHtml(value) : "—"}</td>
    </tr>`;
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:640px;">
      <h2 style="color:#0f172a;margin:0 0 8px;">New plumbing service request</h2>
      <p style="color:#475569;margin:0 0 16px;">A new request was submitted on the FlowGuard Winnipeg Plumbing website.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${row("Name", lead.fullName)}
        ${row("Phone", lead.phone)}
        ${row("Email", lead.email)}
        ${row("Service Needed", lead.service)}
        ${row("Urgency", lead.urgency)}
        ${row("Date Needed By", lead.dateNeeded)}
        ${row("Description", lead.description)}
      </table>
      <p style="color:#64748b;font-size:12px;margin-top:16px;">Submitted ${new Date().toLocaleString("en-CA", { timeZone: "America/Winnipeg" })} (Winnipeg time)</p>
    </div>
  `;
}

function buildText(lead: LeadEmailInput): string {
  return [
    "New plumbing service request",
    "",
    `Name: ${lead.fullName}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Service Needed: ${lead.service}`,
    `Urgency: ${lead.urgency}`,
    `Date Needed By: ${lead.dateNeeded ?? "—"}`,
    "",
    "Description:",
    lead.description ?? "—",
  ].join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Send a lead notification email via Resend.
 *
 * Configure by setting environment variables:
 *   - RESEND_API_KEY  (required)
 *   - RESEND_FROM     (optional, defaults to "FlowGuard Plumbing <onboarding@resend.dev>")
 *
 * The "onboarding@resend.dev" sender works without verifying a domain but is
 * limited to the Resend account's own email address. To send to
 * priypatel008@gmail.com from any address, verify a domain in Resend and set
 * RESEND_FROM to something like "FlowGuard <leads@yourdomain.com>".
 */
export async function sendLeadEmail(lead: LeadEmailInput): Promise<EmailResult> {
  const apiKey = process.env["RESEND_API_KEY"];
  if (!apiKey) {
    logger.warn(
      { lead: { name: lead.fullName, email: lead.email } },
      "RESEND_API_KEY not set — skipping email send (lead is still stored in DB)",
    );
    return { sent: false, reason: "no_resend_key" };
  }

  const from =
    process.env["RESEND_FROM"] ?? "FlowGuard Plumbing <onboarding@resend.dev>";

  const payload = {
    from,
    to: [NOTIFICATION_TO],
    reply_to: lead.email,
    subject: buildSubject(lead),
    html: buildHtml(lead),
    text: buildText(lead),
  };

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "<no body>");
      logger.error(
        { status: resp.status, body: body.slice(0, 500) },
        "Resend API returned an error",
      );
      return { sent: false, reason: "resend_error" };
    }

    return { sent: true };
  } catch (err) {
    logger.error({ err }, "Resend request failed");
    return { sent: false, reason: "exception" };
  }
}
