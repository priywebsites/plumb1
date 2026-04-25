// =============================================================================
// Vercel serverless function — POST /api/contact
//
// Lives inside the Vercel deployment root (artifacts/flowguard-plumbing/api/)
// so that the live FlowGuard Winnipeg Plumbing website can submit its lead
// form to /api/contact in production.
//
// This is a slim port of the Replit/Express backend in
//   artifacts/api-server/src/routes/leads.ts
//   artifacts/api-server/src/lib/email.ts
// — keeping the same Gmail SMTP transport, the same email subject, and the
// same field layout. Database persistence is intentionally not done here so
// the function has zero infra dependencies on Vercel beyond SMTP.
//
// Environment variables (set in the Vercel project settings):
//   SMTP_USER       Gmail address used to send the notification.
//   SMTP_PASS       Gmail App Password (NOT the account password).
//   LEAD_TO_EMAIL   Inbox that receives the lead notifications.
//
// SECURITY: SMTP credentials must NEVER be committed to source or shipped to
// the browser. They are only ever read here, on the server, from env vars.
// =============================================================================

import nodemailer from "nodemailer";

const SUBJECT = "New Plumbing Lead - FlowGuard Winnipeg Plumbing";

let cachedTransporter = null;

function getTransporter(user, pass) {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildText(lead, submittedAt) {
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

function buildHtml(lead, submittedAt) {
  const row = (label, value) => `
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

function readBody(req) {
  // Vercel parses JSON automatically when content-type is application/json,
  // but fall back to manual parse if a string slipped through.
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function validate(body) {
  const errors = [];
  const get = (k) => (typeof body[k] === "string" ? body[k].trim() : "");

  const fullName = get("fullName");
  const phone = get("phone");
  const email = get("email");
  const service = get("service");
  const urgency = get("urgency");

  if (fullName.length < 2) errors.push("Full name is required");
  if (phone.length < 7) errors.push("Phone number is required");
  if (!/^\S+@\S+\.\S+$/.test(email)) errors.push("Valid email is required");
  if (service.length < 1) errors.push("Service is required");
  if (urgency.length < 1) errors.push("Urgency is required");

  return {
    errors,
    lead: {
      fullName,
      phone,
      email,
      service,
      description: get("description") || null,
      dateNeeded: get("dateNeeded") || null,
      urgency,
      source: get("source") || "FlowGuard website request form",
    },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed" });
  }

  const body = readBody(req);
  const { errors, lead } = validate(body);

  if (errors.length) {
    return res.status(400).json({
      ok: false,
      error: "Please fill out all required fields.",
      issues: errors,
    });
  }

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const to = process.env.LEAD_TO_EMAIL;

  if (!user || !pass || !to) {
    console.error(
      "SMTP_USER, SMTP_PASS, or LEAD_TO_EMAIL is not configured on Vercel.",
    );
    return res.status(500).json({
      ok: false,
      error: "Email service is not configured.",
    });
  }

  const submittedAt = new Date().toLocaleString("en-CA", {
    timeZone: "America/Winnipeg",
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    const transporter = getTransporter(user, pass);
    await transporter.sendMail({
      from: `FlowGuard Winnipeg Plumbing <${user}>`,
      to,
      replyTo: lead.email,
      subject: SUBJECT,
      text: buildText(lead, submittedAt),
      html: buildHtml(lead, submittedAt),
    });
    return res.status(200).json({ ok: true, emailSent: true });
  } catch (err) {
    console.error("Nodemailer/Gmail SMTP send failed", err);
    return res.status(502).json({
      ok: false,
      error: "Email delivery failed. Please call us directly.",
    });
  }
}
