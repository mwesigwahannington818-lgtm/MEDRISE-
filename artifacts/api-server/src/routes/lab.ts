import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, labOrdersTable, labResultsTable, patientsTable, adminsTable } from "@workspace/db";
import { z } from "zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

const LabOrderInputSchema = z.object({
  patientId: z.number().int(),
  consultationId: z.number().int().optional(),
  orderedBy: z.number().int().optional(),
  testName: z.string().min(1),
  testCategory: z.string().optional(),
  priority: z.enum(["routine", "urgent", "stat"]).optional(),
  clinicalInfo: z.string().optional(),
  notes: z.string().optional(),
});

const LabOrderUpdateSchema = z.object({
  status: z.enum(["pending", "in-progress", "completed", "cancelled"]).optional(),
  notes: z.string().optional(),
});

const LabResultInputSchema = z.object({
  labOrderId: z.number().int(),
  result: z.string().optional(),
  unit: z.string().optional(),
  referenceRange: z.string().optional(),
  interpretation: z.string().optional(),
  notes: z.string().optional(),
  recordedBy: z.number().int().optional(),
});

async function mapOrder(o: typeof labOrdersTable.$inferSelect) {
  const patient = await db.select({ fullName: patientsTable.fullName }).from(patientsTable).where(eq(patientsTable.id, o.patientId)).then(r => r[0]);
  const staff = o.orderedBy ? await db.select({ name: adminsTable.name }).from(adminsTable).where(eq(adminsTable.id, o.orderedBy)).then(r => r[0]) : null;
  const results = await db.select().from(labResultsTable).where(eq(labResultsTable.labOrderId, o.id));
  return {
    ...o,
    patientName: patient?.fullName ?? null,
    orderedByName: staff?.name ?? null,
    orderedAt: o.orderedAt.toISOString(),
    completedAt: o.completedAt?.toISOString() ?? null,
    results: results.map(r => ({ ...r, recordedAt: r.recordedAt.toISOString() })),
  };
}

router.get("/lab/orders", async (req, res): Promise<void> => {
  const patientId = req.query.patientId ? parseInt(String(req.query.patientId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  let rows = patientId
    ? await db.select().from(labOrdersTable).where(eq(labOrdersTable.patientId, patientId)).orderBy(desc(labOrdersTable.orderedAt))
    : await db.select().from(labOrdersTable).orderBy(desc(labOrdersTable.orderedAt));
  if (status) rows = rows.filter(r => r.status === status);
  const mapped = await Promise.all(rows.map(mapOrder));
  res.json(mapped);
});

router.post("/lab/orders", async (req, res): Promise<void> => {
  const parsed = LabOrderInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(labOrdersTable).values({
    patientId: parsed.data.patientId,
    consultationId: parsed.data.consultationId ?? null,
    orderedBy: parsed.data.orderedBy ?? null,
    testName: parsed.data.testName,
    testCategory: parsed.data.testCategory ?? null,
    priority: parsed.data.priority ?? "routine",
    clinicalInfo: parsed.data.clinicalInfo ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();
  logAudit(req, "create_lab_order", { entityType: "lab_order", entityId: row.id, details: `${parsed.data.testName} — ${parsed.data.priority ?? "routine"}` }).catch(() => {});
  res.status(201).json(await mapOrder(row));
});

router.patch("/lab/orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = LabOrderUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) {
    updateData.status = parsed.data.status;
    if (parsed.data.status === "completed") updateData.completedAt = new Date();
  }
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  const [row] = await db.update(labOrdersTable).set(updateData).where(eq(labOrdersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  if (parsed.data.status) {
    logAudit(req, "update_lab_order_status", { entityType: "lab_order", entityId: row.id, details: `${row.testName} → ${parsed.data.status}` }).catch(() => {});
  }
  res.json(await mapOrder(row));
});

router.delete("/lab/orders/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  await db.delete(labResultsTable).where(eq(labResultsTable.labOrderId, id));
  const [row] = await db.delete(labOrdersTable).where(eq(labOrdersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  logAudit(req, "delete_lab_order", { entityType: "lab_order", entityId: row.id, details: row.testName }).catch(() => {});
  res.sendStatus(204);
});

router.post("/lab/results", async (req, res): Promise<void> => {
  const parsed = LabResultInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(labResultsTable).values({
    labOrderId: parsed.data.labOrderId,
    result: parsed.data.result ?? null,
    unit: parsed.data.unit ?? null,
    referenceRange: parsed.data.referenceRange ?? null,
    interpretation: parsed.data.interpretation ?? null,
    notes: parsed.data.notes ?? null,
    recordedBy: parsed.data.recordedBy ?? null,
  }).returning();
  await db.update(labOrdersTable).set({ status: "completed", completedAt: new Date() }).where(eq(labOrdersTable.id, parsed.data.labOrderId));
  logAudit(req, "record_lab_result", { entityType: "lab_result", entityId: row.id, details: `Order #${parsed.data.labOrderId} — ${parsed.data.interpretation ?? "recorded"}` }).catch(() => {});
  res.status(201).json({ ...row, recordedAt: row.recordedAt.toISOString() });
});

router.delete("/lab/results/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(labResultsTable).where(eq(labResultsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
