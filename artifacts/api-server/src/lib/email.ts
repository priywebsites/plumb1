import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "./logger";

// =============================================================================
// Lead notification email — Gmail SMTP via Nodemailer
// =============================================================================
//
// Where this lives:
//   Backend route:    artifacts/api-server/src/routes/leads.ts  (POST /api/contact)
//   Email transport:  artifacts/api-server/src/lib/email.ts     (this file)
//
// How to update the receiving email:
//   Change the LEAD_TO_EMAIL Replit Secret / environment variable.
//   (Currently set to priypatel008@gmail.com.)
//
// How to update the Gmail SMTP account:
//   1. Sign in to the new Gmail account at https://myaccount.google.com/
//   2. Enable 2-Step Verification.
//   3. Create an App Password (Mail / Other) at
//      https://myaccount.google.com/apppasswords
//   4. Update the SMTP_USER and SMTP_PASS Replit Secrets with the new
//      Gmail address and the 16-character app password.
//
// SECURITY:
//   SMTP_USER, SMTP_PASS, and LEAD_TO_EMAIL must ONLY live in Replit Secrets /
//   environment variables. They must never be hardcoded in source files and
//   must never be referenced from the frontend / browser bundle. This module
//   runs on the Express API server only.
// =============================================================================

const SUBJECT = "New Plumbing Lead - FlowGuard Winnipeg Plumbing";

type LeadEmailInput = {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  description?: string | null;
  dateNeeded?: string | null;
  urgency: string;
  source?: string | null;
};

type EmailResult =
  | { sent: true }
  | { sent: false; reason: "missing_smtp_config" | "smtp_error" | "exception" };

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  if (!user || !pass) {
    return null;
  }
  if (cachedTransporter) {
    return cachedTransporter;
  }
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildText(lead: LeadEmailInput, submittedAt: string): string {
  return [
    "New plumbing service request — FlowGuard Winnipeg Plumbing",
    "",
    `Full Name: ${lead.fullName}`,
    `Phone Number: ${lead.phone}`,
    `Email Address: ${lead.email}`,
    `Service Needed: ${lead.service}`,
    `Description / Requirements: ${lead.description?.trim() || "—"}`,
    `Date Needed By: ${lead.dateNeeded?.trim() || "—"}`,
    `Urgency: ${lead.urgency}`,
    `Page / Form Source: ${lead.source?.trim() || "Website request form"}`,
    `Submission Time: ${submittedAt}`,
  ].join("\n");
}

function buildHtml(lead: LeadEmailInput, submittedAt: string): string {
  const row = (label: string, value: string | null | undefined) => `
    <tr>
      <td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#0f172a;width:200px;border:1px solid #e2e8f0;vertical-align:top;">${label}</td>
      <td style="padding:8px 12px;color:#0f172a;border:1px solid #e2e8f0;white-space:pre-wrap;">${value ? escapeHtml(value) : "—"}</td>
    </tr>`;
  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#0f172a;max-width:680px;">
      <h2 style="color:#0f172a;margin:0 0 8px;">New Plumbing Lead</h2>
      <p style="color:#475569;margin:0 0 16px;">A homeowner submitted the request form on the FlowGuard Winnipeg Plumbing website.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px;">
        ${row("Full Name", lead.fullName)}
        ${row("Phone Number", lead.phone)}
        ${row("Email Address", lead.email)}
        ${row("Service Needed", lead.service)}
        ${row("Description / Requirements", lead.description)}
        ${row("Date Needed By", lead.dateNeeded)}
        ${row("Urgency", lead.urgency)}
        ${row("Page / Form Source", lead.source ?? "Website request form")}
        ${row("Submission Time", submittedAt)}
      </table>
    </div>
  `;
}

/**
 * Send the lead notification email via Gmail SMTP.
 * Reads SMTP_USER, SMTP_PASS, and LEAD_TO_EMAIL from Replit Secrets /
 * environment variables. Never call this from frontend code.
 */
export async function sendLeadEmail(lead: LeadEmailInput): Promise<EmailResult> {
  const transporter = getTransporter();
  const to = process.env["LEAD_TO_EMAIL"];

  if (!transporter || !to) {
    logger.warn(
      "SMTP_USER, SMTP_PASS, or LEAD_TO_EMAIL not set — skipping email send (lead is still stored in DB).",
    );
    return { sent: false, reason: "missing_smtp_config" };
  }

  const submittedAt = new Date().toLocaleString("en-CA", {
    timeZone: "America/Winnipeg",
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    await transporter.sendMail({
      from: `FlowGuard Winnipeg Plumbing <${process.env["SMTP_USER"]}>`,
      to,
      replyTo: lead.email,
      subject: SUBJECT,
      text: buildText(lead, submittedAt),
      html: buildHtml(lead, submittedAt),
    });
    return { sent: true };
  } catch (err) {
    logger.error({ err }, "Nodemailer/Gmail SMTP send failed");
    return { sent: false, reason: "smtp_error" };
  }
}
