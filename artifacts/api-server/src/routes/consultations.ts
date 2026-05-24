import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, consultationsTable, patientsTable, adminsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const ConsultationInputSchema = z.object({
  patientId: z.number().int(),
  staffId: z.number().int().optional(),
  visitDate: z.string().min(1),
  chiefComplaint: z.string().optional(),
  diagnosis: z.string().optional(),
  treatmentPlan: z.string().optional(),
  prescriptions: z.string().optional(),
  referral: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

async function mapConsultation(c: typeof consultationsTable.$inferSelect) {
  const patient = c.patientId
    ? await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, c.patientId)).then(r => r[0])
    : null;
  const staff = c.staffId
    ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, c.staffId)).then(r => r[0])
    : null;
  return {
    ...c,
    patientName: patient?.fullName ?? null,
    staffName: staff?.name ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

router.get("/consultations", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const rows = patientId
    ? await db.select().from(consultationsTable).where(eq(consultationsTable.patientId, patientId)).orderBy(desc(consultationsTable.visitDate))
    : await db.select().from(consultationsTable).orderBy(desc(consultationsTable.visitDate));
  const mapped = await Promise.all(rows.map(mapConsultation));
  res.json(mapped);
});

router.post("/consultations", async (req, res): Promise<void> => {
  const parsed = ConsultationInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(consultationsTable).values({
    patientId: parsed.data.patientId,
    staffId: parsed.data.staffId ?? null,
    visitDate: parsed.data.visitDate,
    chiefComplaint: parsed.data.chiefComplaint ?? null,
    diagnosis: parsed.data.diagnosis ?? null,
    treatmentPlan: parsed.data.treatmentPlan ?? null,
    prescriptions: parsed.data.prescriptions ?? null,
    referral: parsed.data.referral ?? null,
    followUpDate: parsed.data.followUpDate ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();
  logAudit(req, "create_consultation", { entityType: "consultation", entityId: row.id, details: parsed.data.chiefComplaint ?? parsed.data.diagnosis ?? "" }).catch(() => {});
  res.status(201).json(await mapConsultation(row));
});

router.get("/consultations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.select().from(consultationsTable).where(eq(consultationsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await mapConsultation(row));
});

router.patch("/consultations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = ConsultationInputSchema.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(consultationsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(consultationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "update_consultation", { entityType: "consultation", entityId: row.id, details: parsed.data.diagnosis ?? "" }).catch(() => {});
  res.json(await mapConsultation(row));
});

router.delete("/consultations/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(consultationsTable).where(eq(consultationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "delete_consultation", { entityType: "consultation", entityId: row.id }).catch(() => {});
  res.sendStatus(204);
});

export default router;
