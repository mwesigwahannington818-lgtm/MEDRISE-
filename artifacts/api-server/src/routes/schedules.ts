import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, shiftsTable, leaveRequestsTable, adminsTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

const ShiftInputSchema = z.object({
  staffId: z.number().int(),
  date: z.string().min(1),
  shift: z.enum(["day", "night", "morning", "afternoon"]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().optional(),
});

const LeaveInputSchema = z.object({
  staffId: z.number().int(),
  leaveType: z.enum(["annual", "sick", "maternity", "paternity", "emergency", "unpaid"]),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().optional(),
});

const LeaveUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  approvedBy: z.number().int().optional(),
  approverNotes: z.string().optional(),
});

async function mapShift(s: typeof shiftsTable.$inferSelect) {
  const staff = await db.select({ name: adminsTable.name, role: adminsTable.role }).from(adminsTable).where(eq(adminsTable.id, s.staffId)).then(r => r[0]);
  return { ...s, staffName: staff?.name ?? null, staffRole: staff?.role ?? null, createdAt: s.createdAt.toISOString() };
}

async function mapLeave(l: typeof leaveRequestsTable.$inferSelect) {
  const staff = await db.select({ name: adminsTable.name, role: adminsTable.role }).from(adminsTable).where(eq(adminsTable.id, l.staffId)).then(r => r[0]);
  return { ...l, staffName: staff?.name ?? null, staffRole: staff?.role ?? null, createdAt: l.createdAt.toISOString(), updatedAt: l.updatedAt.toISOString() };
}

router.get("/schedules/shifts", async (req, res): Promise<void> => {
  const staffId = req.query.staffId ? parseInt(String(req.query.staffId), 10) : undefined;
  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  let rows = await db.select().from(shiftsTable).orderBy(shiftsTable.date);
  if (staffId) rows = rows.filter(r => r.staffId === staffId);
  if (month) rows = rows.filter(r => r.date.startsWith(month));
  const mapped = await Promise.all(rows.map(mapShift));
  res.json(mapped);
});

router.post("/schedules/shifts", async (req, res): Promise<void> => {
  const parsed = ShiftInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(shiftsTable).values({
    staffId: parsed.data.staffId,
    date: parsed.data.date,
    shift: parsed.data.shift,
    startTime: parsed.data.startTime ?? null,
    endTime: parsed.data.endTime ?? null,
    notes: parsed.data.notes ?? null,
  }).returning();
  res.status(201).json(await mapShift(row));
});

router.delete("/schedules/shifts/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(shiftsTable).where(eq(shiftsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

router.get("/schedules/leave", async (req, res): Promise<void> => {
  const staffId = req.query.staffId ? parseInt(String(req.query.staffId), 10) : undefined;
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  let rows = await db.select().from(leaveRequestsTable).orderBy(leaveRequestsTable.createdAt);
  if (staffId) rows = rows.filter(r => r.staffId === staffId);
  if (status) rows = rows.filter(r => r.status === status);
  const mapped = await Promise.all(rows.map(mapLeave));
  res.json(mapped);
});

router.post("/schedules/leave", async (req, res): Promise<void> => {
  const parsed = LeaveInputSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.insert(leaveRequestsTable).values({
    staffId: parsed.data.staffId,
    leaveType: parsed.data.leaveType,
    startDate: parsed.data.startDate,
    endDate: parsed.data.endDate,
    reason: parsed.data.reason ?? null,
  }).returning();
  res.status(201).json(await mapLeave(row));
});

router.patch("/schedules/leave/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const parsed = LeaveUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [row] = await db.update(leaveRequestsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(leaveRequestsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await mapLeave(row));
});

router.delete("/schedules/leave/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  const [row] = await db.delete(leaveRequestsTable).where(eq(leaveRequestsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.sendStatus(204);
});

export default router;
