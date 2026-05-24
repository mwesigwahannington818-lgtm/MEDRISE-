import { db, auditLogsTable } from "@workspace/db";
import { getSessionFromRequest } from "./session";

export async function logAudit(
  req: { headers: { authorization?: string } },
  action: string,
  opts?: { entityType?: string; entityId?: number; details?: string }
) {
  const session = getSessionFromRequest(req);
  await db.insert(auditLogsTable).values({
    actorId: session?.id ?? null,
    actorName: session?.name ?? null,
    actorRole: session?.role ?? null,
    action,
    entityType: opts?.entityType ?? null,
    entityId: opts?.entityId ?? null,
    details: opts?.details ?? null,
  });
}
