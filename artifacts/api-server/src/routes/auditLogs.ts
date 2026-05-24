import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, auditLogsTable } from "@workspace/db";
import { getSessionFromRequest } from "../lib/session";

const router: IRouter = Router();

router.get("/audit-logs", async (req, res): Promise<void> => {
  const session = getSessionFromRequest(req);
  if (!session) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (session.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const limit = Math.min(parseInt(String(req.query.limit ?? "200"), 10), 500);
  const offset = parseInt(String(req.query.offset ?? "0"), 10);

  const rows = await db
    .select()
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

export default router;
