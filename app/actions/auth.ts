"use server";

import { redirect } from "next/navigation";
import { row, run } from "../../lib/server/db";
import { hashPassword, id, nowIso, verifyPassword } from "../../lib/server/crypto";
import { createSession, destroySession, getViewer } from "../../lib/server/auth";

export interface FormState {
  error?: string;
  success?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function signupAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (name.length < 2) return { error: "Enter your name so we know who we're talking to." };
  if (!EMAIL_RE.test(email)) return { error: "That email address doesn't look right." };
  if (password.length < 8) return { error: "Use at least 8 characters for your password." };
  if (row<{ id: string }>("SELECT id FROM users WHERE email = ?", email)) {
    return { error: "An account with this email already exists. Try signing in." };
  }

  const userId = id("us");
  run(
    "INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)",
    userId,
    email,
    hashPassword(password),
    name,
    nowIso(),
  );
  await createSession(userId);
  redirect("/app/setup");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const user = row<{ id: string; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE email = ?",
    email,
  );
  if (!user || !verifyPassword(password, user.password_hash)) {
    return { error: "Email or password is incorrect." };
  }
  await createSession(user.id);
  redirect("/app");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function deleteAccountAction(formData: FormData) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation !== "DELETE") redirect("/app/settings?error=delete");

  const space = row<{ id: string }>("SELECT id FROM spaces WHERE owner_id = ?", viewer.user.id);
  if (space) {
    run("DELETE FROM replies WHERE review_id IN (SELECT id FROM reviews WHERE space_id = ?)", space.id);
    run("DELETE FROM reviews WHERE space_id = ?", space.id);
    run("DELETE FROM review_requests WHERE space_id = ?", space.id);
    run("DELETE FROM customers WHERE space_id = ?", space.id);
    run("DELETE FROM otp_codes WHERE space_id = ?", space.id);
    run("DELETE FROM events WHERE space_id = ?", space.id);
    run("DELETE FROM audit_log WHERE space_id = ?", space.id);
    run("DELETE FROM spaces WHERE id = ?", space.id);
  }
  run("DELETE FROM sessions WHERE user_id = ?", viewer.user.id);
  run("DELETE FROM users WHERE id = ?", viewer.user.id);
  await destroySession();
  redirect("/");
}

export async function demoLoginAction() {
  const demo = row<{ id: string }>("SELECT id FROM users WHERE email = ?", "demo@proofly.app");
  if (!demo) redirect("/login");
  await createSession(demo.id);
  redirect("/app");
}
