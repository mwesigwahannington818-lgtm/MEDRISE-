import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, patientFeedbackTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const FeedbackInputSchema = z.object({
  patientName: z.string().min(1),
  phone: z.string().optional(),
  service: z.string().optional(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  wouldRecommend: z.enum(["yes", "no", "maybe"]).optional(),
});

router.get("/feedback", async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(patientFeedbackTable)
    .orderBy(desc(patientFeedbackTable.createdAt));

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/feedback", async (req, res): Promise<void> => {
  const parsed = FeedbackInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(patientFeedbackTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone ?? null,
      service: parsed.data.service ?? null,
      rating: parsed.data.rating,
      comment: parsed.data.comment ?? null,
      wouldRecommend: parsed.data.wouldRecommend ?? null,
    })
    .returning();

  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

export default router;
