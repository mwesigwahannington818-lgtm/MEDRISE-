import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, patientQueueTable, patientsTable, adminsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const QueueEntryInputSchema = z.object({
  patientId: z.number().int().optional(),
  patientName: z.string().min(1),
  queueDate: z.string().optional(),
  priority: z.enum(["normal", "urgent"]).optional().default("normal"),
  staffId: z.number().int().optional(),
  notes: z.string().optional(),
  referralSource: z.enum(["home", "facility_referral", "self_referral"]).optional().default("home"),
  referralFacility: z.string().optional(),
  department: z.string().optional().default("general"),
  notificationPhone: z.string().optional(),
});

const QueueEntryUpdateSchema = z.object({
  status: z.enum(["waiting", "in-consultation", "done", "skipped"]).optional(),
  priority: z.enum(["normal", "urgent"]).optional(),
  staffId: z.number().int().optional().nullable(),
  notes: z.string().optional(),
  department: z.string().optional(),
  transferNote: z.string().optional(),
  managementPlan: z.string().optional(),
  vitalsSnapshot: z.string().optional(),
  notificationPhone: z.string().optional(),
});

async function getNextArrivalOrder(date: string): Promise<number> {
  const existing = await db
    .select({ arrivalOrder: patientQueueTable.arrivalOrder })
    .from(patientQueueTable)
    .where(eq(patientQueueTable.queueDate, date));
  if (existing.length === 0) return 1;
  return Math.max(...existing.map((e) => e.arrivalOrder)) + 1;
}

function mapEntry(e: typeof patientQueueTable.$inferSelect) {
  return {
    ...e,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}

router.get("/queue", async (req, res): Promise<void> => {
  const today = new Date().toISOString().slice(0, 10);
  const date = typeof req.query.date === "string" ? req.query.date : today;

  const entries = await db
    .select()
    .from(patientQueueTable)
    .where(eq(patientQueueTable.queueDate, date))
    .orderBy(patientQueueTable.arrivalOrder);

  res.json(entries.map(mapEntry));
});

router.post("/queue", async (req, res): Promise<void> => {
  const parsed = QueueEntryInputSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const queueDate = parsed.data.queueDate ?? today;

  let patientName = parsed.data.patientName;
  let notificationPhone = parsed.data.notificationPhone ?? null;

  if (parsed.data.patientId) {
    const patient = await db
      .select({ fullName: patientsTable.fullName, phone: patientsTable.phone })
      .from(patientsTable)
      .where(eq(patientsTable.id, parsed.data.patientId))
      .then((r) => r[0]);
    if (patient) {
      patientName = patient.fullName;
      if (!notificationPhone) notificationPhone = patient.phone;
    }
  }

  let staffName: string | null = null;
  if (parsed.data.staffId) {
    const staff = await db
      .select({ name: adminsTable.name })
      .from(adminsTable)
      .where(eq(adminsTable.id, parsed.data.staffId))
      .then((r) => r[0]);
    if (staff) staffName = staff.name;
  }

  const arrivalOrder = await getNextArrivalOrder(queueDate);

  const [entry] = await db
    .insert(patientQueueTable)
    .values({
      patientId: parsed.data.patientId ?? null,
      patientName,
      queueDate,
      status: "waiting",
      arrivalOrder,
      staffId: parsed.data.staffId ?? null,
      staffName,
      priority: parsed.data.priority ?? "normal",
      notes: parsed.data.notes ?? null,
      referralSource: parsed.data.referralSource ?? "home",
      referralFacility: parsed.data.referralFacility ?? null,
      department: parsed.data.department ?? "general",
      notificationPhone,
    })
    .returning();

  res.status(201).json(mapEntry(entry));
});

router.patch("/queue/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = QueueEntryUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof patientQueueTable.$inferInsert> = {
    updatedAt: new Date(),
  };

  if (parsed.data.status !== undefined) updateData.status = parsed.data.status;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
  if (parsed.data.department !== undefined) updateData.department = parsed.data.department;
  if (parsed.data.transferNote !== undefined) updateData.transferNote = parsed.data.transferNote;
  if (parsed.data.managementPlan !== undefined) updateData.managementPlan = parsed.data.managementPlan;
  if (parsed.data.vitalsSnapshot !== undefined) updateData.vitalsSnapshot = parsed.data.vitalsSnapshot;
  if (parsed.data.notificationPhone !== undefined) updateData.notificationPhone = parsed.data.notificationPhone;

  if (parsed.data.staffId !== undefined) {
    updateData.staffId = parsed.data.staffId;
    if (parsed.data.staffId) {
      const staff = await db
        .select({ name: adminsTable.name })
        .from(adminsTable)
        .where(eq(adminsTable.id, parsed.data.staffId))
        .then((r) => r[0]);
      updateData.staffName = staff?.name ?? null;
    } else {
      updateData.staffName = null;
    }
  }

  const [entry] = await db
    .update(patientQueueTable)
    .set(updateData)
    .where(eq(patientQueueTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Queue entry not found" });
    return;
  }

  res.json(mapEntry(entry));
});

router.delete("/queue/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [entry] = await db
    .delete(patientQueueTable)
    .where(eq(patientQueueTable.id, id))
    .returning();

  if (!entry) {
    res.status(404).json({ error: "Queue entry not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
