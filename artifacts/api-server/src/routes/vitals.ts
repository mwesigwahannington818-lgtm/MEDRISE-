import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, vitalSignsTable, patientsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const VitalsInputSchema = z.object({
  patientId: z.number().int(),
  consultationId: z.number().int().optional(),
  bloodPressure: z.string().optional(),
  temperature: z.string().optional(),
  pulse: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  oxygenSaturation: z.string().optional(),
  respiratoryRate: z.string().optional(),
  recordedBy: z.number().int().optional(),
});

async function mapVitals(v: typeof vitalSignsTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, v.patientId)).then(r => r[0]);
  return { ...v, patientName: patient?.fullName ?? null, recordedAt: v.recordedAt.toISOString() };
}

router.get("/vitals", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const rows = patientId
    ? await db.select().from(vitalSignsTable).where(eq(vitalSignsTable.patientId, patientId)).orderBy(desc(vitalSignsTable.recordedAt))
    : await db.select().from(vitalSignsTable).orderBy(desc(vitalSignsTable.recordedAt));
  const mapped = await Promise.all(rows.map(mapVitals));
  res.json(mapped);
});

router.post("/vitals", async (req, res): Promise<void> => {
  const parsed = VitalsInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(vitalSignsTable).values({
    patientId: parsed.data.patientId,
    consultationId: parsed.data.consultationId ?? null,
    bloodPressure: parsed.data.bloodPressure ?? null,
    temperature: parsed.data.temperature ?? null,
    pulse: parsed.data.pulse ?? null,
    weight: parsed.data.weight ?? null,
    height: parsed.data.height ?? null,
    oxygenSaturation: parsed.data.oxygenSaturation ?? null,
    respiratoryRate: parsed.data.respiratoryRate ?? null,
    recordedBy: parsed.data.recordedBy ?? null,
  }).returning();
  res.status(201).json(await mapVitals(row));
});

router.delete("/vitals/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(vitalSignsTable).where(eq(vitalSignsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
