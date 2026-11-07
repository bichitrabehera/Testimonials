"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ExternalLink, Loader2, Lock, Star } from "lucide-react";
import type { VerificationMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FlowSpace {
  name: string;
  slug: string;
  brand_color: string;
  category: string;
  logo_url: string | null;
  google_review_url: string | null;
  verification_mode: VerificationMode;
}

type Step = "rating" | "details" | "verify" | "done";

const STAR_LABELS = ["", "Not great", "Could be better", "Okay", "Good", "Excellent"];

export function ReviewFlow({
  space,
  customerName,
  token,
}: {
  space: FlowSpace;
  customerName: string | null;
  token: string | null;
}) {
  const [step, setStep] = useState<Step>("rating");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [name, setName] = useState(customerName ?? "");
  const [role, setRole] = useState("");
  const [consent, setConsent] = useState(true);

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; verified: boolean; status: string } | null>(null);

  const [feedback, setFeedback] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);

  const accent = space.brand_color || "#0A7C66";

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function pick(next: number) {
    setRating(next);
    setHover(0);
    setTimeout(() => setStep("details"), 220);
  }

  async function submit(useOtpSession?: string | null) {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/public/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          space_slug: space.slug,
          token: token ?? undefined,
          otp_session: useOtpSession ?? undefined,
          rating,
          body,
          name,
          role,
          consent,
        }),
      });
      const data = (await response.json()) as { error?: string; id?: string; verified?: boolean; status?: string };
      if (!response.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult({ id: data.id!, verified: Boolean(data.verified), status: data.status ?? "pending" });
      setStep("done");
    } catch {
      setError("We could not reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function sendCode() {
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/public/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_slug: space.slug, phone }),
      });
      const data = (await response.json()) as { error?: string; demo_code?: string; phone?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not send the code.");
        return;
      }
      setCodeSent(true);
      if (data.phone) setPhone(data.phone);
      setDemoCode(data.demo_code ?? null);
    } catch {
      setError("Could not send the code. Try again.");
    } finally {
      setSending(false);
    }
  }

  async function verifyCode() {
    setVerifying(true);
    setError(null);
    try {
      const response = await fetch("/api/public/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ space_slug: space.slug, phone, code }),
      });
      const data = (await response.json()) as { error?: string; otp_session?: string };
      if (!response.ok || !data.otp_session) {
        setError(data.error ?? "That code did not match.");
        return;
      }
      await submit(data.otp_session);
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function sendFeedback() {
    if (!result) return;
    setFeedbackSending(true);
    try {
      await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: result.id, message: feedback }),
      });
      setFeedbackSent(true);
    } finally {
      setFeedbackSending(false);
    }
  }

  const needsOtpStep = !token && space.verification_mode !== "open";
  const stepNumber = step === "rating" ? 1 : step === "details" ? 2 : needsOtpStep ? 3 : 2;
  const totalSteps = needsOtpStep ? 3 : 2;

  return (
    <div className="min-h-dvh px-4 py-6 sm:py-10" style={{ background: `${accent}0d` }}>
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-ink">
          {space.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={space.logo_url} alt="" className="size-8 rounded-lg object-cover" />
          ) : (
            <span
              className="grid size-8 place-items-center rounded-lg text-xs font-bold text-white"
              style={{ background: accent }}
            >
              {space.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          {space.name}
        </div>

        <div className="card overflow-hidden" style={{ borderRadius: 18 }}>
          {step !== "done" && (
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => (
                  <span
                    key={index}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: index + 1 === stepNumber ? 22 : 10,
                      background: index + 1 <= stepNumber ? accent : "var(--border)",
                    }}
                  />
                ))}
              </div>
              <span className="text-xs text-muted">
                {stepNumber} of {totalSteps}
              </span>
            </div>
          )}

          <div className="p-5 sm:p-6">
            {step === "rating" && (
              <div className="text-center">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  How was your visit{customerName ? `, ${customerName.split(" ")[0]}` : ""}?
                </h1>
                <p className="mt-1.5 text-sm text-muted">
                  Tap a star. It takes about 20 seconds.
                </p>
                <div
                  className="mt-7 flex items-center justify-center gap-1.5"
                  onMouseLeave={() => setHover(0)}
                >
                  {[1, 2, 3, 4, 5].map((value) => {
                    const active = value <= (hover || rating);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => pick(value)}
                        onMouseEnter={() => setHover(value)}
                        aria-label={`${value} star${value === 1 ? "" : "s"} — ${STAR_LABELS[value]}`}
                        className="grid size-14 place-items-center rounded-xl transition-transform hover:scale-105 active:scale-95"
                      >
                        <Star
                          size={38}
                          strokeWidth={1.6}
                          className={cn("transition-colors", active ? "fill-amber text-amber" : "text-line")}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 h-5 text-sm font-medium" style={{ color: accent }}>
                  {STAR_LABELS[hover || rating]}
                </p>
                <p className="mt-8 text-xs text-muted">
                  Your review is public and the business cannot delete it.
                </p>
              </div>
            )}

            {step === "details" && (
              <div>
                <button
                  type="button"
                  onClick={() => setStep("rating")}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
                >
                  <ArrowLeft size={13} /> Change rating
                </button>
                <h1 className="text-lg font-semibold tracking-tight">
                  Tell others what it was like
                </h1>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={12}
                        className={value <= rating ? "fill-amber text-amber" : "text-line"}
                      />
                    ))}
                  </span>
                  <span>{STAR_LABELS[rating]}</span>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <label className="label" htmlFor="review-body">
                      Your review <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <textarea
                      id="review-body"
                      value={body}
                      onChange={(event) => setBody(event.target.value.slice(0, 500))}
                      rows={4}
                      className="input resize-none"
                      placeholder="What went well? What could be better?"
                    />
                    <p className="hint mt-1 text-right">{body.length}/500</p>
                  </div>

                  <div>
                    <label className="label" htmlFor="review-name">
                      Your name
                    </label>
                    <input
                      id="review-name"
                      value={name}
                      onChange={(event) => setName(event.target.value.slice(0, 60))}
                      className="input"
                      placeholder="Anita Sharma"
                    />
                    <p className="hint mt-1">Shown publicly with your review.</p>
                  </div>

                  <div>
                    <label className="label" htmlFor="review-role">
                      Treatment or service <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input
                      id="review-role"
                      value={role}
                      onChange={(event) => setRole(event.target.value.slice(0, 60))}
                      className="input"
                      placeholder="Root canal"
                    />
                  </div>

                  <label className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/60 p-3 text-xs leading-relaxed">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                      className="mt-0.5 size-4 accent-[var(--brand)]"
                    />
                    <span>
                      I agree that my name, rating and review may be shown publicly on{" "}
                      {space.name}&apos;s website.
                    </span>
                  </label>

                  {error && (
                    <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    disabled={submitting || name.trim().length < 1 || !consent}
                    onClick={() => {
                      if (needsOtpStep) {
                        setStep("verify");
                        setError(null);
                      } else {
                        void submit();
                      }
                    }}
                    className="btn w-full text-white"
                    style={{ background: accent }}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
                    {submitting ? "Submitting…" : needsOtpStep ? "Continue" : "Submit review"}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                </div>
              </div>
            )}

            {step === "verify" && (
              <div>
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-ink"
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className="grid size-9 place-items-center rounded-full"
                    style={{ background: `${accent}1a`, color: accent }}
                  >
                    <Lock size={16} />
                  </span>
                  <div>
                    <h1 className="text-lg font-semibold tracking-tight">Confirm it&apos;s you</h1>
                    <p className="text-xs text-muted">
                      Verified reviews carry a badge customers trust.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="label" htmlFor="otp-phone">
                      Mobile number
                    </label>
                    <input
                      id="otp-phone"
                      inputMode="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="input"
                      placeholder="98765 43210"
                      disabled={codeSent}
                    />
                  </div>

                  {codeSent && (
                    <div>
                      <label className="label" htmlFor="otp-code">
                        6-digit code
                      </label>
                      <input
                        id="otp-code"
                        inputMode="numeric"
                        value={code}
                        onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="input tracking-[0.3em]"
                        placeholder="••••••"
                        maxLength={6}
                        autoFocus
                      />
                      {demoCode && (
                        <p className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
                          Demo mode — no SMS was sent. Your code is{" "}
                          <strong className="font-semibold">{demoCode}</strong>.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setCodeSent(false);
                          setCode("");
                          setDemoCode(null);
                        }}
                        className="mt-2 text-xs font-medium text-muted hover:text-ink"
                      >
                        Use a different number
                      </button>
                    </div>
                  )}

                  {error && (
                    <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
                      {error}
                    </p>
                  )}

                  {codeSent ? (
                    <button
                      type="button"
                      onClick={() => void verifyCode()}
                      disabled={verifying || code.length !== 6}
                      className="btn w-full text-white"
                      style={{ background: accent }}
                    >
                      {verifying ? <Loader2 size={16} className="animate-spin" /> : <BadgeCheck size={16} />}
                      {verifying ? "Verifying…" : "Verify and submit"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void sendCode()}
                      disabled={sending || phone.replace(/\D/g, "").length < 10}
                      className="btn w-full text-white"
                      style={{ background: accent }}
                    >
                      {sending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
                      {sending ? "Sending…" : "Send code"}
                    </button>
                  )}

                  {space.verification_mode === "otp_or_link" && (
                    <button
                      type="button"
                      onClick={() => void submit()}
                      disabled={submitting}
                      className="w-full text-center text-xs font-medium text-muted underline-offset-2 hover:text-ink hover:underline"
                    >
                      Skip verification and submit without the badge
                    </button>
                  )}
                </div>
              </div>
            )}

            {step === "done" && result && (
              <div className="text-center">
                <span
                  className="mx-auto grid size-14 place-items-center rounded-full"
                  style={{ background: `${accent}1a`, color: accent }}
                >
                  <Check size={26} strokeWidth={3} />
                </span>
                <h1 className="mt-4 text-xl font-semibold tracking-tight">Thank you!</h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  {result.status === "approved"
                    ? `Your review is live on ${space.name}.`
                    : `Your review is with ${space.name}. It will appear once they approve it.`}
                </p>
                {result.verified && (
                  <p
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{ background: `${accent}14`, color: accent }}
                  >
                    <BadgeCheck size={13} /> Verified customer
                  </p>
                )}

                {space.google_review_url && (
                  <a
                    href={space.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary mt-6 w-full"
                  >
                    Also post this on Google <ExternalLink size={14} />
                  </a>
                )}

                {rating <= 3 && !feedbackSent && (
                  <div className="mt-6 rounded-xl border border-line bg-surface-2/60 p-4 text-left">
                    <p className="text-sm font-semibold">Want to tell the owner privately?</p>
                    <p className="mt-1 text-xs text-muted">
                      This is sent only to {space.name}, in addition to your public review.
                    </p>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value.slice(0, 1000))}
                      rows={3}
                      className="input mt-2.5 resize-none"
                      placeholder="What could they do better?"
                    />
                    <button
                      type="button"
                      onClick={() => void sendFeedback()}
                      disabled={feedbackSending || feedback.trim().length < 3}
                      className="btn btn-secondary mt-2 w-full"
                    >
                      {feedbackSending ? <Loader2 size={14} className="animate-spin" /> : null}
                      Send privately
                    </button>
                  </div>
                )}
                {feedbackSent && (
                  <p className="mt-6 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
                    Sent. Only the business can see your private note.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted">
          Reviewed by a real customer · {space.name} cannot delete or edit this review.
          <br />
          Powered by Proofly
        </p>
      </div>
    </div>
  );
}
