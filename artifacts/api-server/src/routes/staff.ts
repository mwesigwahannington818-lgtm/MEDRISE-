import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import {
  ListStaffResponse,
  CreateStaffBody,
  UpdateStaffParams,
  UpdateStaffBody,
  DeleteStaffParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function mapStaff(a: typeof adminsTable.$inferSelect) {
  return {
    id: a.id,
    username: a.username,
    name: a.name,
    role: a.role,
    title: a.title ?? null,
    phone: a.phone ?? null,
    email: a.email ?? null,
  };
}

router.get("/staff", async (req, res): Promise<void> => {
  const rows = await db.select().from(adminsTable).orderBy(adminsTable.name);
  res.json(ListStaffResponse.parse(rows.map(mapStaff)));
});

router.post("/staff", async (req, res): Promise<void> => {
  const parsed = CreateStaffBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, parsed.data.username));

  if (existing.length > 0) {
    res.status(409).json({ error: "Username already exists" });
    return;
  }

  const [staff] = await db
    .insert(adminsTable)
    .values({
      username: parsed.data.username,
      password: parsed.data.password,
      name: parsed.data.name,
      role: parsed.data.role,
      title: parsed.data.title ?? null,
      phone: parsed.data.phone ?? null,
      email: parsed.data.email ?? null,
    })
    .returning();

  res.status(201).json(mapStaff(staff));
});

router.patch("/staff/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateStaffParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateStaffBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof adminsTable.$inferInsert> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if (body.data.password !== undefined) updateData.password = body.data.password;
  if (body.data.role !== undefined) updateData.role = body.data.role;
  if (body.data.title !== undefined) updateData.title = body.data.title;
  if (body.data.phone !== undefined) updateData.phone = body.data.phone;
  if (body.data.email !== undefined) updateData.email = body.data.email;

  const [staff] = await db
    .update(adminsTable)
    .set(updateData)
    .where(eq(adminsTable.id, params.data.id))
    .returning();

  if (!staff) {
    res.status(404).json({ error: "Staff not found" });
    return;
  }

  res.json(mapStaff(staff));
});

router.delete("/staff/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteStaffParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(adminsTable)
    .where(eq(adminsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Staff not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
