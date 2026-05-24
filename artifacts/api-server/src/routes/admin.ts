import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import {
  AdminLoginBody,
  AdminLoginResponse,
  GetAdminMeResponse,
  ChangePasswordBody,
} from "@workspace/api-zod";
import { SESSIONS, getSessionFromRequest } from "../lib/session";

const router: IRouter = Router();

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

router.post("/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.username, username));

  if (!admin || admin.password !== password) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  const token = generateToken();
  SESSIONS.set(token, { id: admin.id, username: admin.username, name: admin.name, role: admin.role });

  const body = AdminLoginResponse.parse({
    success: true,
    admin: { id: admin.id, username: admin.username, name: admin.name, role: admin.role },
  });

  res.json({ ...body, token });
});

router.post("/admin/logout", async (req, res): Promise<void> => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith("Bearer ")) {
    SESSIONS.delete(auth.slice(7));
  }
  res.json({ success: true });
});

router.get("/admin/me", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json(GetAdminMeResponse.parse(session));
});

router.post("/admin/change-password", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [admin] = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.id, session.id));

  if (!admin || admin.password !== parsed.data.currentPassword) {
    res.status(400).json({ error: "Current password is incorrect" });
    return;
  }

  await db
    .update(adminsTable)
    .set({ password: parsed.data.newPassword })
    .where(eq(adminsTable.id, session.id));

  res.json({ success: true });
});

export default router;
