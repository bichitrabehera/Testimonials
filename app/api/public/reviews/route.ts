import { NextResponse } from "next/server";
import {
  createReview,
  findCustomerByPhone,
  findRequestByToken,
  getSpaceBySlug,
  markRequestSubmitted,
  logAudit,
  logEvent,
} from "@/lib/server/queries";
import { verifyPayload } from "@/lib/server/secrets";
import { rateLimit } from "@/lib/server/rate-limit";
import { hashValue } from "@/lib/server/crypto";

function clean(input: unknown, max: number) {
  return String(input ?? "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function POST(request: Request) {
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const slug = String(payload.space_slug ?? "");
  const space = getSpaceBySlug(slug);
  if (!space) return NextResponse.json({ error: "Space not found." }, { status: 404 });

  const ip = (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "local")
    .split(",")[0]
    .trim();
  const limited = rateLimit(`review:${space.id}:${ip}`, 8, 10 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many submissions from this device. Please try again later." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter ?? 60) } },
    );
  }

  const rating = Number(payload.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Choose a rating between 1 and 5 stars." }, { status: 400 });
  }
  const name = clean(payload.name, 60);
  if (name.length < 1) {
    return NextResponse.json({ error: "Please add your name." }, { status: 400 });
  }
  if (payload.consent !== true) {
    return NextResponse.json(
      { error: "Please tick the consent box so we can show your review." },
      { status: 400 },
    );
  }

  const reviewBody = clean(payload.body, 500);
  const role = clean(payload.role, 60) || null;
  const token = typeof payload.token === "string" && payload.token ? payload.token : null;
  const otpSession = typeof payload.otp_session === "string" ? payload.otp_session : null;

  let verified = false;
  let method: string | null = null;
  let requestId: string | null = null;

  if (token) {
    const reviewRequest = findRequestByToken(token);
    if (!reviewRequest || reviewRequest.space_id !== space.id) {
      return NextResponse.json({ error: "This review link is not valid." }, { status: 400 });
    }
    if (reviewRequest.status === "submitted") {
      return NextResponse.json(
        { error: "This link has already been used. Thank you for the review!" },
        { status: 409 },
      );
    }
    if (new Date(reviewRequest.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "This review link has expired." }, { status: 410 });
    }
    verified = true;
    method = "link";
    requestId = reviewRequest.id;
  } else if (otpSession) {
    const session = verifyPayload<{ spaceId?: string; phone?: string }>(otpSession);
    if (!session?.spaceId || session.spaceId !== space.id || !session.phone) {
      return NextResponse.json({ error: "Your verification expired. Please verify again." }, { status: 400 });
    }
    if (space.verification_mode === "link_only" && !findCustomerByPhone(space.id, hashValue(session.phone))) {
      return NextResponse.json(
        { error: "We could not find that number on the customer list. Ask the business for your personal review link." },
        { status: 403 },
      );
    }
    verified = true;
    method = "otp";
  } else if (space.verification_mode === "link_only") {
    return NextResponse.json(
      { error: "This business asks reviewers to confirm their phone number." },
      { status: 403 },
    );
  }

  const { reviewId, autoApprove } = createReview({
    spaceId: space.id,
    rating,
    body: reviewBody,
    name,
    role,
    verified,
    method,
    requestId,
    ipHash: hashValue(ip),
    autoApprove: space.auto_approve === 1,
  });

  if (requestId) markRequestSubmitted(requestId, space.id);
  logEvent(space.id, "review_submitted", reviewId);
  logAudit(space.id, null, "review_submitted", reviewId, { verified, method });

  return NextResponse.json(
    {
      id: reviewId,
      status: autoApprove ? "approved" : "pending",
      verified,
    },
    { status: 201 },
  );
}
