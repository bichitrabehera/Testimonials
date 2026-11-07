import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { row, run } from "./db";
import { hashValue, id, nowIso, randomToken } from "./crypto";
import type { Space, User } from "../types";
import { parseSpace } from "./queries";

const COOKIE = "proofly_session";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const token = randomToken(32);
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  run(
    "INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
    hashValue(token),
    userId,
    nowIso(),
    expires.toISOString(),
  );
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", hashValue(token));
  store.delete(COOKIE);
}

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  const user = row<User>(
    `SELECT u.id, u.email, u.name, u.created_at
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
    hashValue(token),
    nowIso(),
  );
  return user ?? null;
}

export interface Viewer {
  user: User;
  space: Space | null;
}

export async function getViewer(): Promise<Viewer | null> {
  const user = await getSessionUser();
  if (!user) return null;
  const spaceRow = row<Record<string, unknown>>(
    "SELECT * FROM spaces WHERE owner_id = ? ORDER BY created_at LIMIT 1",
    user.id,
  );
  return { user, space: spaceRow ? parseSpace(spaceRow) : null };
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  return viewer;
}

export async function requireSpace(): Promise<{ user: User; space: Space }> {
  const viewer = await requireViewer();
  if (!viewer.space) redirect("/app/setup");
  return { user: viewer.user, space: viewer.space };
}

export function newSessionToken() {
  return id("ss");
}
