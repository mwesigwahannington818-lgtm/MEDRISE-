import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, appointmentsTable } from "@workspace/db";
import {
  CreateAppointmentBody,
  GetAppointmentParams,
  UpdateAppointmentStatusParams,
  UpdateAppointmentStatusBody,
  DeleteAppointmentParams,
  ListAppointmentsResponse,
  GetAppointmentResponse,
  UpdateAppointmentStatusResponse,
  GetAppointmentStatsResponse,
} from "@workspace/api-zod";
import {
  sendAppointmentConfirmationToPatient,
  sendAppointmentNotificationToClinic,
  sendAppointmentStatusUpdateToPatient,
} from "../lib/email";

const router: IRouter = Router();

router.get("/appointments", async (req, res): Promise<void> => {
  const appointments = await db
    .select()
    .from(appointmentsTable)
    .orderBy(appointmentsTable.createdAt);

  const mapped = appointments.map((a) => ({
    ...a,
    createdAt: a.createdAt.toISOString(),
  }));

  res.json(ListAppointmentsResponse.parse(mapped));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [appointment] = await db
    .insert(appointmentsTable)
    .values({
      patientName: parsed.data.patientName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      age: (parsed.data as { age?: number }).age ?? null,
      sex: (parsed.data as { sex?: string }).sex ?? null,
      service: parsed.data.service,
      preferredDate: parsed.data.preferredDate,
      preferredTime: parsed.data.preferredTime,
      preferredDoctor: (parsed.data as { preferredDoctor?: string }).preferredDoctor ?? null,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .returning();

  const apptDetails = {
    patientName: appointment.patientName,
    phone: appointment.phone,
    email: appointment.email,
    service: appointment.service,
    preferredDate: appointment.preferredDate,
    preferredTime: appointment.preferredTime,
    message: appointment.message,
  };

  void Promise.all([
    sendAppointmentConfirmationToPatient(apptDetails),
    sendAppointmentNotificationToClinic(apptDetails),
  ]);

  res.status(201).json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.get("/appointments/stats/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(appointmentsTable);
  const total = rows.length;
  const pending = rows.filter((r) => r.status === "pending").length;
  const confirmed = rows.filter((r) => r.status === "confirmed").length;
  const cancelled = rows.filter((r) => r.status === "cancelled").length;
  const completed = rows.filter((r) => r.status === "completed").length;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const todayCount = rows.filter((r) => r.preferredDate === todayStr).length;
  const thisWeekCount = rows.filter((r) => r.preferredDate >= weekStartStr).length;

  res.json(
    GetAppointmentStatsResponse.parse({
      total,
      pending,
      confirmed,
      cancelled,
      completed,
      todayCount,
      thisWeekCount,
    })
  );
});

router.get("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [appointment] = await db
    .select()
    .from(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id));

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.json(
    GetAppointmentResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAppointmentStatusParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateAppointmentStatusBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [appointment] = await db
    .update(appointmentsTable)
    .set({ status: body.data.status })
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  // Send patient email notification when confirmed or cancelled
  if ((body.data.status === "confirmed" || body.data.status === "cancelled") && appointment.email) {
    void sendAppointmentStatusUpdateToPatient({
      patientName: appointment.patientName,
      phone: appointment.phone,
      email: appointment.email,
      service: appointment.service,
      preferredDate: appointment.preferredDate,
      preferredTime: appointment.preferredTime,
      message: appointment.message,
      status: body.data.status,
    });
  }

  res.json(
    UpdateAppointmentStatusResponse.parse({
      ...appointment,
      createdAt: appointment.createdAt.toISOString(),
    })
  );
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAppointmentParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [appointment] = await db
    .delete(appointmentsTable)
    .where(eq(appointmentsTable.id, params.data.id))
    .returning();

  if (!appointment) {
    res.status(404).json({ error: "Appointment not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
