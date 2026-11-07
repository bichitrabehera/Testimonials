import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { row, run } from "./db";
import { randomToken } from "./crypto";

/** Persistent local secret; set PROOFLY_SECRET in production. */
export function appSecret() {
  if (process.env.PROOFLY_SECRET) return process.env.PROOFLY_SECRET;
  const existing = row<{ value: string }>("SELECT value FROM meta WHERE key = 'secret'");
  if (existing) return existing.value;
  const value = randomToken(32);
  run("INSERT OR REPLACE INTO meta (key, value) VALUES ('secret', ?)", value);
  return value;
}

function b64(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

export function signPayload(payload: Record<string, unknown>, ttlMs: number) {
  const body = { ...payload, exp: Date.now() + ttlMs };
  const encoded = b64(JSON.stringify(body));
  const signature = createHmac("sha256", appSecret()).update(encoded).digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyPayload<T extends Record<string, unknown>>(token: string | undefined | null): T | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;
  const expected = createHmac("sha256", appSecret()).update(encoded).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as T & { exp?: number };
    if (!parsed.exp || parsed.exp < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}
