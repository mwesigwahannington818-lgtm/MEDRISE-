import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, patientsTable } from "@workspace/db";
import {
  CreatePatientBody,
  GetPatientParams,
  UpdatePatientParams,
  UpdatePatientBody,
  DeletePatientParams,
  ListPatientsResponse,
  GetPatientResponse,
  UpdatePatientResponse,
  GetPatientStatsResponse,
} from "@workspace/api-zod";
import { logAudit } from "../lib/audit";

const router: IRouter = Router();

function mapPatient(p: typeof patientsTable.$inferSelect) {
  return {
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

router.get("/patients", async (req, res): Promise<void> => {
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";

  const rows = search
    ? await db
        .select()
        .from(patientsTable)
        .where(
          or(
            ilike(patientsTable.fullName, `%${search}%`),
            ilike(patientsTable.phone, `%${search}%`),
            ilike(patientsTable.email, `%${search}%`)
          )
        )
        .orderBy(patientsTable.fullName)
    : await db.select().from(patientsTable).orderBy(patientsTable.fullName);

  res.json(ListPatientsResponse.parse(rows.map(mapPatient)));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .insert(patientsTable)
    .values({
      fullName: parsed.data.fullName,
      phone: parsed.data.phone,
      email: parsed.data.email ?? null,
      dateOfBirth: parsed.data.dateOfBirth ?? null,
      age: parsed.data.age ?? null,
      gender: parsed.data.gender ?? null,
      address: parsed.data.address ?? null,
      bloodType: parsed.data.bloodType ?? null,
      allergies: parsed.data.allergies ?? null,
      medicalNotes: parsed.data.medicalNotes ?? null,
      nextOfKinName: parsed.data.nextOfKinName ?? null,
      nextOfKinPhone: parsed.data.nextOfKinPhone ?? null,
      nextOfKinRelationship: parsed.data.nextOfKinRelationship ?? null,
      insuranceName: parsed.data.insuranceName ?? null,
      insurancePolicyNumber: parsed.data.insurancePolicyNumber ?? null,
    })
    .returning();

  logAudit(req, "create_patient", { entityType: "patient", entityId: patient.id, details: patient.fullName }).catch(() => {});
  res.status(201).json(GetPatientResponse.parse(mapPatient(patient)));
});

router.get("/patients/stats/summary", async (req, res): Promise<void> => {
  const rows = await db.select().from(patientsTable);
  const now = new Date();

  const todayStr = now.toISOString().slice(0, 10);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);

  res.json(
    GetPatientStatsResponse.parse({
      total: rows.length,
      today: rows.filter((r) => r.createdAt.toISOString().slice(0, 10) === todayStr).length,
      thisWeek: rows.filter((r) => r.createdAt.toISOString().slice(0, 10) >= weekStartStr).length,
      thisMonth: rows.filter((r) => r.createdAt.toISOString().slice(0, 10) >= monthStart).length,
    })
  );
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetPatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(GetPatientResponse.parse(mapPatient(patient)));
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdatePatientBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [patient] = await db
    .update(patientsTable)
    .set({ ...body.data, updatedAt: new Date() })
    .where(eq(patientsTable.id, params.data.id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  logAudit(req, "update_patient", { entityType: "patient", entityId: patient.id, details: patient.fullName }).catch(() => {});
  res.json(UpdatePatientResponse.parse(mapPatient(patient)));
});

router.delete("/patients/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePatientParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [patient] = await db
    .delete(patientsTable)
    .where(eq(patientsTable.id, params.data.id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  logAudit(req, "delete_patient", { entityType: "patient", entityId: patient.id, details: patient.fullName }).catch(() => {});
  res.sendStatus(204);
});

export default router;
