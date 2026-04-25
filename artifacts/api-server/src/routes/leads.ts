import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, leadsTable } from "@workspace/db";
import { sendLeadEmail } from "../lib/email";

const router: IRouter = Router();

const leadInputSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.email(),
  service: z.string().min(1),
  description: z.string().optional().nullable(),
  dateNeeded: z.string().optional().nullable(),
  urgency: z.string().min(1),
});

router.post("/leads", async (req, res) => {
  const parsed = leadInputSchema.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ issues: parsed.error.issues }, "Invalid lead payload");
    return res.status(400).json({
      ok: false,
      error: "Invalid form data",
      issues: parsed.error.issues,
    });
  }

  const data = parsed.data;

  // Always store the lead first so it is never lost, even if email fails.
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

  // Try to send the notification email. If it fails (e.g. Resend not yet
  // connected), the lead is still saved and we surface a soft-success so the
  // homeowner is told to call.
  const emailResult = await sendLeadEmail(data).catch((err) => {
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

  if (!emailResult.sent) {
    req.log.warn(
      { leadId, reason: emailResult.reason },
      "Lead saved but email not sent",
    );
  }

  return res.json({ ok: true, leadId, emailSent: emailResult.sent });
});

export default router;
