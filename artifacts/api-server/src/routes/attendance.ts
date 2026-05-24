import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, attendanceTable, adminsTable } from "@workspace/db";
import {
  RecordAttendanceBody,
  UpdateAttendanceParams,
  UpdateAttendanceBody,
  DeleteAttendanceParams,
  ListAttendanceResponse,
  RecordAttendanceResponse,
  UpdateAttendanceResponse,
  GetAttendanceStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapRecord(r: typeof attendanceTable.$inferSelect & { staffName?: string | null; staffRole?: string | null; staffTitle?: string | null }) {
  return {
    id: r.id,
    staffId: r.staffId,
    staffName: r.staffName ?? null,
    staffRole: r.staffRole ?? null,
    staffTitle: r.staffTitle ?? null,
    date: r.date,
    shift: r.shift,
    status: r.status,
    checkIn: r.checkIn ?? null,
    checkOut: r.checkOut ?? null,
    notes: r.notes ?? null,
    recordedBy: r.recordedBy ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

router.get("/attendance", async (req, res): Promise<void> => {
  const { date, staffId, month } = req.query;

  const rows = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      staffName: adminsTable.name,
      staffRole: adminsTable.role,
      staffTitle: adminsTable.title,
      date: attendanceTable.date,
      shift: attendanceTable.shift,
      status: attendanceTable.status,
      checkIn: attendanceTable.checkIn,
      checkOut: attendanceTable.checkOut,
      notes: attendanceTable.notes,
      recordedBy: attendanceTable.recordedBy,
      createdAt: attendanceTable.createdAt,
      updatedAt: attendanceTable.updatedAt,
    })
    .from(attendanceTable)
    .leftJoin(adminsTable, eq(attendanceTable.staffId, adminsTable.id))
    .where(
      date ? eq(attendanceTable.date, date as string) :
      staffId ? eq(attendanceTable.staffId, parseInt(staffId as string, 10)) :
      month ? and(
        gte(attendanceTable.date, `${month}-01`),
        lte(attendanceTable.date, `${month}-31`)
      ) : undefined
    )
    .orderBy(attendanceTable.date, adminsTable.name);

  res.json(ListAttendanceResponse.parse(rows.map(r => mapRecord(r as typeof attendanceTable.$inferSelect & { staffName: string | null; staffRole: string | null; staffTitle: string | null }))));
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = RecordAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { staffId, date, shift, status, checkIn, checkOut, notes } = parsed.data;

  // Upsert: if record exists for same staff+date, update it
  const existing = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.staffId, staffId), eq(attendanceTable.date, date)));

  let record;
  if (existing.length > 0) {
    const [updated] = await db
      .update(attendanceTable)
      .set({ shift: shift ?? "day", status, checkIn: checkIn ?? null, checkOut: checkOut ?? null, notes: notes ?? null, updatedAt: new Date() })
      .where(eq(attendanceTable.id, existing[0].id))
      .returning();
    record = updated;
  } else {
    const [inserted] = await db
      .insert(attendanceTable)
      .values({ staffId, date, shift: shift ?? "day", status, checkIn: checkIn ?? null, checkOut: checkOut ?? null, notes: notes ?? null })
      .returning();
    record = inserted;
  }

  // Fetch with staff name
  const [withStaff] = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      staffName: adminsTable.name,
      staffRole: adminsTable.role,
      staffTitle: adminsTable.title,
      date: attendanceTable.date,
      shift: attendanceTable.shift,
      status: attendanceTable.status,
      checkIn: attendanceTable.checkIn,
      checkOut: attendanceTable.checkOut,
      notes: attendanceTable.notes,
      recordedBy: attendanceTable.recordedBy,
      createdAt: attendanceTable.createdAt,
      updatedAt: attendanceTable.updatedAt,
    })
    .from(attendanceTable)
    .leftJoin(adminsTable, eq(attendanceTable.staffId, adminsTable.id))
    .where(eq(attendanceTable.id, record.id));

  res.json(RecordAttendanceResponse.parse(mapRecord(withStaff as typeof attendanceTable.$inferSelect & { staffName: string | null; staffRole: string | null; staffTitle: string | null })));
});

router.get("/attendance/stats/summary", async (req, res): Promise<void> => {
  const month = typeof req.query.month === "string" ? req.query.month : new Date().toISOString().slice(0, 7);

  const rows = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      staffName: adminsTable.name,
      staffRole: adminsTable.role,
      date: attendanceTable.date,
      status: attendanceTable.status,
    })
    .from(attendanceTable)
    .leftJoin(adminsTable, eq(attendanceTable.staffId, adminsTable.id))
    .where(and(
      gte(attendanceTable.date, `${month}-01`),
      lte(attendanceTable.date, `${month}-31`)
    ));

  const staffMap: Record<number, { staffId: number; staffName: string; staffRole: string; present: number; absent: number; late: number; leave: number; off: number }> = {};

  for (const row of rows) {
    if (!staffMap[row.staffId]) {
      staffMap[row.staffId] = { staffId: row.staffId, staffName: row.staffName ?? "Unknown", staffRole: row.staffRole ?? "staff", present: 0, absent: 0, late: 0, leave: 0, off: 0 };
    }
    const s = row.status as "present" | "absent" | "late" | "leave" | "off";
    if (s === "present" || s === "absent" || s === "late" || s === "leave" || s === "off") {
      staffMap[row.staffId][s]++;
    }
  }

  const staffSummary = Object.values(staffMap);
  const totals = staffSummary.reduce((acc, s) => {
    acc.present += s.present;
    acc.absent += s.absent;
    acc.late += s.late;
    acc.leave += s.leave;
    acc.off += s.off;
    return acc;
  }, { present: 0, absent: 0, late: 0, leave: 0, off: 0 });

  res.json(GetAttendanceStatsResponse.parse({
    totalDays: rows.length,
    totalPresent: totals.present,
    totalAbsent: totals.absent,
    totalLate: totals.late,
    totalLeave: totals.leave,
    totalOff: totals.off,
    staffSummary,
  }));
});

router.patch("/attendance/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAttendanceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = UpdateAttendanceBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [record] = await db
    .update(attendanceTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!record) { res.status(404).json({ error: "Record not found" }); return; }

  const [withStaff] = await db
    .select({
      id: attendanceTable.id,
      staffId: attendanceTable.staffId,
      staffName: adminsTable.name,
      staffRole: adminsTable.role,
      staffTitle: adminsTable.title,
      date: attendanceTable.date,
      shift: attendanceTable.shift,
      status: attendanceTable.status,
      checkIn: attendanceTable.checkIn,
      checkOut: attendanceTable.checkOut,
      notes: attendanceTable.notes,
      recordedBy: attendanceTable.recordedBy,
      createdAt: attendanceTable.createdAt,
      updatedAt: attendanceTable.updatedAt,
    })
    .from(attendanceTable)
    .leftJoin(adminsTable, eq(attendanceTable.staffId, adminsTable.id))
    .where(eq(attendanceTable.id, record.id));

  res.json(UpdateAttendanceResponse.parse(mapRecord(withStaff as typeof attendanceTable.$inferSelect & { staffName: string | null; staffRole: string | null; staffTitle: string | null })));
});

router.delete("/attendance/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAttendanceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [deleted] = await db
    .delete(attendanceTable)
    .where(eq(attendanceTable.id, params.data.id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Record not found" }); return; }
  res.sendStatus(204);
});

export default router;
