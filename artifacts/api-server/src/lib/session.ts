export interface SessionData {
  id: number;
  username: string;
  name: string;
  role: string | null;
}

export const SESSIONS: Map<string, SessionData> = new Map();

export function getSessionFromRequest(req: { headers: { authorization?: string } }): SessionData | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return SESSIONS.get(auth.slice(7)) ?? null;
}
