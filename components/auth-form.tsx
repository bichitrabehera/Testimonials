"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Lock, Mail, User } from "lucide-react";
import { demoLoginAction, loginAction, signupAction, type FormState } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const initial: FormState = {};

export function AuthForm({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [loginState, login, loginPending] = useActionState(loginAction, initial);
  const [signupState, signup, signupPending] = useActionState(signupAction, initial);

  const pending = mode === "login" ? loginPending : signupPending;
  const error = mode === "login" ? loginState.error : signupState.error;

  return (
    <div className="w-full max-w-md">
      <div className="card p-6 sm:p-7">
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-line bg-surface-2 p-1">
          {(["login", "signup"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === option ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
              )}
              aria-pressed={mode === option}
            >
              {option === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <h1 className="text-xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Start collecting reviews"}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {mode === "login"
            ? "Sign in to your dashboard."
            : "Free forever for your first 15 displayed reviews."}
        </p>

        {mode === "login" ? (
          <form action={login} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  defaultValue="demo@proofly.app"
                  className="input pl-9"
                  placeholder="you@business.com"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  defaultValue="demo1234"
                  className="input pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? <Loader2 size={15} className="animate-spin" /> : null}
              {pending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        ) : (
          <form action={signup} className="mt-6 space-y-4">
            <div>
              <label className="label" htmlFor="signup-name">
                Your name
              </label>
              <div className="relative">
                <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="signup-name"
                  name="name"
                  required
                  autoComplete="name"
                  className="input pl-9"
                  placeholder="Dr. Asha Rao"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="signup-email">
                Work email
              </label>
              <div className="relative">
                <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input pl-9"
                  placeholder="you@business.com"
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="signup-password">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="signup-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input pl-9"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>
            {error && <p className="text-sm font-medium text-danger">{error}</p>}
            <button type="submit" disabled={pending} className="btn btn-primary w-full">
              {pending ? <Loader2 size={15} className="animate-spin" /> : null}
              {pending ? "Creating account…" : "Create account"}
            </button>
            <p className="hint">
              By continuing you agree to keep reviews honest: no incentives for positive ratings and
              no deletion of negatives.
            </p>
          </form>
        )}

        <div className="my-5 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          or
          <span className="h-px flex-1 bg-line" />
        </div>

        <form action={demoLoginAction}>
          <button type="submit" className="btn btn-secondary w-full">
            Explore the demo business <ArrowRight size={15} />
          </button>
        </form>
        <p className="hint mt-2 text-center">
          Demo signs you in as Smile Dental, a seeded clinic with real-looking reviews.
        </p>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        <Link href="/" className="hover:text-ink">
          ← Back to proofly.app
        </Link>
      </p>
    </div>
  );
}
