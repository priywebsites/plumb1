import { Router, type IRouter } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import { sendLeadEmail } from "../lib/email";

// =============================================================================
// Lead capture endpoint — POST /api/contact
//
// The website request form (artifacts/flowguard-plumbing/src/App.tsx) submits
// to this route. Every submission is:
//   1. Validated with Zod (required fields below).
//   2. Stored in the `leads` table (so leads are never lost, even if email
//      delivery fails).
//   3. Forwarded as an email notification to LEAD_TO_EMAIL via Gmail SMTP
//      (see ../lib/email.ts).
//
// To change the destination inbox, update the LEAD_TO_EMAIL Replit Secret.
// To change the SMTP account, update SMTP_USER and SMTP_PASS Replit Secrets.
// SMTP credentials must NEVER be hardcoded or shipped to the browser.
// =============================================================================

const router: IRouter = Router();

const contactInputSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  phone: z.string().trim().min(7, "Phone number is required"),
  email: z.string().trim().email("Valid email is required"),
  service: z.string().trim().min(1, "Service is required"),
  description: z.string().trim().optional().nullable(),
  dateNeeded: z.string().trim().optional().nullable(),
  urgency: z.string().trim().min(1, "Urgency is required"),
  source: z.string().trim().optional().nullable(),
});

async function handleContact(
  req: import("express").Request,
  res: import("express").Response,
) {
  const parsed = contactInputSchema.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid contact payload");
    return res.status(400).json({
      ok: false,
      error: "Please fill out all required fields.",
      issues: parsed.error.issues,
    });
  }

  const data = parsed.data;

  // 1) Persist the lead first so it is never lost.
  let leadId: number;
  try {
    const [row] = await db
      .insert(leadsTable)
      .values({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        service: data.service,
        description: data.description ?? null,
        dateNeeded: data.dateNeeded ?? null,
        urgency: data.urgency,
      })
      .returning({ id: leadsTable.id });
    leadId = row!.id;
    req.log.info({ leadId }, "Lead stored");
  } catch (err) {
    req.log.error({ err }, "Failed to store lead");
    return res.status(500).json({ ok: false, error: "Failed to save request" });
  }

  // 2) Send the email notification (Gmail SMTP via Nodemailer).
  const emailResult = await sendLeadEmail({
    ...data,
    source: data.source ?? "FlowGuard website request form",
  }).catch((err) => {
    req.log.error({ err }, "Email send threw");
    return { sent: false as const, reason: "exception" as const };
  });

  try {
    await db
      .update(leadsTable)
      .set({
        emailStatus: emailResult.sent ? "sent" : `failed:${emailResult.reason}`,
      })
      .where(eq(leadsTable.id, leadId));
  } catch (err) {
    req.log.error({ err }, "Failed to update lead email status");
  }

  if (emailResult.sent) {
    req.log.info({ leadId }, "Lead notification email sent");
    return res.json({ ok: true, leadId, emailSent: true });
  }

  // The DB row is saved; the homeowner's request is captured. We still report
  // an error to the frontend so they're prompted to call directly.
  req.log.warn(
    { leadId, reason: emailResult.reason },
    "Lead saved but email not sent",
  );
  return res.status(502).json({
    ok: false,
    error: "Email delivery failed",
    leadId,
  });
}

// Primary route per spec.
router.post("/contact", handleContact);

// Backwards-compatible alias for the original /api/leads endpoint.
router.post("/leads", handleContact);

export default router;
