import "server-only";
import { row, rows, run } from "./db";
import { hashValue, id, nowIso } from "./crypto";
import {
  DEFAULT_WIDGET_CONFIG,
  type Customer,
  type MarketingReview,
  type Review,
  type Space,
  type WidgetConfig,
} from "../types";

function str(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

export function parseSpace(record: Record<string, unknown>): Space {
  let config: WidgetConfig = { ...DEFAULT_WIDGET_CONFIG };
  try {
    const parsed = JSON.parse(str(record.widget_config, "{}"));
    config = { ...config, ...parsed };
  } catch {
    /* keep defaults */
  }
  return {
    id: str(record.id),
    owner_id: str(record.owner_id),
    name: str(record.name),
    slug: str(record.slug),
    logo_url: (record.logo_url as string | null) ?? null,
    brand_color: str(record.brand_color, "#0A7C66"),
    category: str(record.category, "Business"),
    plan: record.plan === "pro" ? "pro" : "free",
    verification_mode:
      record.verification_mode === "link_only"
        ? "link_only"
        : record.verification_mode === "open"
          ? "open"
          : "otp_or_link",
    widget_config: config,
    google_review_url: (record.google_review_url as string | null) ?? null,
    auto_approve: (record.auto_approve as 0 | 1) ?? 0,
    whatsapp_template: (record.whatsapp_template as string | null) ?? null,
    created_at: str(record.created_at),
  };
}

export function parseReview(record: Record<string, unknown>): Review {
  return {
    id: str(record.id),
    space_id: str(record.space_id),
    request_id: (record.request_id as string | null) ?? null,
    rating: Number(record.rating ?? 0),
    body: str(record.body),
    reviewer_name: str(record.reviewer_name),
    reviewer_role: (record.reviewer_role as string | null) ?? null,
    photo_url: (record.photo_url as string | null) ?? null,
    verified: (record.verified ? 1 : 0) as 0 | 1,
    verification_method: (record.verification_method as string | null) ?? null,
    status: (record.status as Review["status"]) ?? "pending",
    hidden_reason: (record.hidden_reason as string | null) ?? null,
    consent_display: (record.consent_display ? 1 : 0) as 0 | 1,
    ip_hash: (record.ip_hash as string | null) ?? null,
    created_at: str(record.created_at),
    approved_at: (record.approved_at as string | null) ?? null,
    reply: (record.reply as string | null) ?? null,
    private_feedback: (record.private_feedback as string | null) ?? null,
  };
}

const REVIEW_SELECT = `SELECT r.*, rp.body AS reply FROM reviews r
  LEFT JOIN replies rp ON rp.review_id = r.id`;

/* ---------------------------------- spaces --------------------------------- */

export function getSpaceBySlug(slug: string): Space | null {
  const record = row<Record<string, unknown>>("SELECT * FROM spaces WHERE slug = ?", slug);
  return record ? parseSpace(record) : null;
}

export function getSpaceById(spaceId: string): Space | null {
  const record = row<Record<string, unknown>>("SELECT * FROM spaces WHERE id = ?", spaceId);
  return record ? parseSpace(record) : null;
}

export function slugTaken(slug: string, exceptSpaceId?: string) {
  const record = row<{ id: string }>("SELECT id FROM spaces WHERE slug = ?", slug);
  return Boolean(record && record.id !== exceptSpaceId);
}

export function createSpace(input: {
  ownerId: string;
  name: string;
  slug: string;
  category: string;
  brandColor: string;
  logoUrl?: string | null;
}): Space {
  const spaceId = id("sp");
  run(
    `INSERT INTO spaces (id, owner_id, name, slug, logo_url, brand_color, category, plan,
       verification_mode, widget_config, whatsapp_template, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'free', 'otp_or_link', ?, ?, ?)`,
    spaceId,
    input.ownerId,
    input.name,
    input.slug,
    input.logoUrl ?? null,
    input.brandColor,
    input.category,
    JSON.stringify(DEFAULT_WIDGET_CONFIG),
    "Hi {name}, thanks for visiting {business}! Could you share a quick review? It takes 20 seconds: {link}",
    nowIso(),
  );
  return getSpaceById(spaceId)!;
}

export function updateSpace(spaceId: string, patch: Record<string, unknown>) {
  const allowed = [
    "name",
    "slug",
    "logo_url",
    "brand_color",
    "category",
    "plan",
    "verification_mode",
    "widget_config",
    "google_review_url",
    "auto_approve",
    "whatsapp_template",
  ];
  const entries = Object.entries(patch).filter(([key]) => allowed.includes(key));
  if (!entries.length) return;
  const assignments = entries.map(([key]) => `${key} = ?`).join(", ");
  run(`UPDATE spaces SET ${assignments} WHERE id = ?`, ...entries.map(([, value]) => value), spaceId);
}

/* --------------------------------- reviews --------------------------------- */

export function listReviews(
  spaceId: string,
  options: { status?: string; rating?: number; verified?: boolean; limit?: number; offset?: number } = {},
): Review[] {
  const clauses = ["r.space_id = ?"];
  const params: unknown[] = [spaceId];
  if (options.status && options.status !== "all") {
    clauses.push("r.status = ?");
    params.push(options.status);
  }
  if (options.rating) {
    clauses.push("r.rating = ?");
    params.push(options.rating);
  }
  if (typeof options.verified === "boolean") {
    clauses.push("r.verified = ?");
    params.push(options.verified ? 1 : 0);
  }
  const limit = options.limit ?? 100;
  params.push(limit, options.offset ?? 0);
  const records = rows<Record<string, unknown>>(
    `${REVIEW_SELECT} WHERE ${clauses.join(" AND ")} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
  );
  return records.map(parseReview);
}

export function getReview(reviewId: string): Review | null {
  const record = row<Record<string, unknown>>(`${REVIEW_SELECT} WHERE r.id = ?`, reviewId);
  return record ? parseReview(record) : null;
}

export function countReviews(spaceId: string, status?: string) {
  const record = status
    ? row<{ n: number }>("SELECT COUNT(*) AS n FROM reviews WHERE space_id = ? AND status = ?", spaceId, status)
    : row<{ n: number }>("SELECT COUNT(*) AS n FROM reviews WHERE space_id = ?", spaceId);
  return record?.n ?? 0;
}

export function setReviewStatus(
  spaceId: string,
  reviewId: string,
  status: "approved" | "hidden" | "pending",
  reason: string | null,
  actorId: string,
) {
  const review = getReview(reviewId);
  if (!review || review.space_id !== spaceId) return false;
  run(
    "UPDATE reviews SET status = ?, hidden_reason = ?, approved_at = ? WHERE id = ?",
    status,
    status === "hidden" ? reason : null,
    status === "approved" ? nowIso() : null,
    reviewId,
  );
  logAudit(spaceId, actorId, status, reviewId, reason ? { reason } : null);
  return true;
}

export function saveReply(reviewId: string, body: string) {
  const existing = row<{ id: string }>("SELECT id FROM replies WHERE review_id = ?", reviewId);
  if (existing) {
    run("UPDATE replies SET body = ?, created_at = ? WHERE id = ?", body, nowIso(), existing.id);
  } else {
    run("INSERT INTO replies (id, review_id, body, created_at) VALUES (?, ?, ?, ?)", id("rp"), reviewId, body, nowIso());
  }
}

export function deleteReply(reviewId: string) {
  run("DELETE FROM replies WHERE review_id = ?", reviewId);
}

export function createReview(input: {
  spaceId: string;
  rating: number;
  body: string;
  name: string;
  role?: string | null;
  photoUrl?: string | null;
  verified: boolean;
  method?: string | null;
  requestId?: string | null;
  ipHash?: string | null;
  autoApprove?: boolean;
}) {
  const reviewId = id("rv");
  const autoApprove = Boolean(input.autoApprove && input.verified && input.rating >= 4);
  run(
    `INSERT INTO reviews (id, space_id, request_id, rating, body, reviewer_name, reviewer_role, photo_url,
       verified, verification_method, status, consent_display, ip_hash, created_at, approved_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
    reviewId,
    input.spaceId,
    input.requestId ?? null,
    input.rating,
    input.body,
    input.name,
    input.role ?? null,
    input.photoUrl ?? null,
    input.verified ? 1 : 0,
    input.method ?? null,
    autoApprove ? "approved" : "pending",
    input.ipHash ?? null,
    nowIso(),
    autoApprove ? nowIso() : null,
  );
  return { reviewId, autoApprove };
}

/** Public widget feed: approved reviews only, respecting the free plan display cap. */
export function publicReviews(slug: string, limit: number) {
  const space = getSpaceBySlug(slug);
  if (!space) return null;
  const cap = space.plan === "pro" ? 500 : 15;
  const take = Math.min(limit, cap);
  const records = rows<Record<string, unknown>>(
    `${REVIEW_SELECT} WHERE r.space_id = ? AND r.status = 'approved' AND r.rating >= ?
     ORDER BY r.created_at DESC LIMIT ?`,
    space.id,
    space.widget_config.minRating ?? 1,
    take,
  );
  const all = rows<{ rating: number; verified: number }>(
    "SELECT rating, verified FROM reviews WHERE space_id = ? AND status = 'approved'",
    space.id,
  );
  const averageRating = all.length ? all.reduce((sum, item) => sum + item.rating, 0) / all.length : 0;
  const verifiedCount = all.filter((item) => item.verified === 1).length;
  return {
    space,
    reviews: records.map(parseReview),
    stats: {
      count: all.length,
      shown: Math.min(all.length, take),
      avgRating: Math.round(averageRating * 10) / 10,
      verifiedPct: all.length ? Math.round((verifiedCount / all.length) * 100) : 0,
    },
    truncated: all.length > take,
  };
}

export function toMarketing(reviews: Review[]): MarketingReview[] {
  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    body: review.body,
    name: review.reviewer_name,
    role: review.reviewer_role,
    verified: Boolean(review.verified),
    created_at: review.created_at,
    reply: review.reply,
  }));
}

/* ---------------------------------- stats ---------------------------------- */

export function getStats(spaceId: string) {
  const pending = countReviews(spaceId, "pending");
  const approved = rows<{ rating: number; verified: number }>(
    "SELECT rating, verified FROM reviews WHERE space_id = ? AND status = 'approved'",
    spaceId,
  );
  const avgRating = approved.length
    ? Math.round((approved.reduce((sum, item) => sum + item.rating, 0) / approved.length) * 10) / 10
    : 0;
  const verifiedPct = approved.length
    ? Math.round((approved.filter((item) => item.verified === 1).length / approved.length) * 100)
    : 0;
  const requestTotals = row<{ sent: number; opened: number; submitted: number }>(
    `SELECT COUNT(*) AS sent,
            SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS opened,
            SUM(CASE WHEN submitted_at IS NOT NULL THEN 1 ELSE 0 END) AS submitted
     FROM review_requests WHERE space_id = ?`,
    spaceId,
  );
  const sent = requestTotals?.sent ?? 0;
  const submitted = requestTotals?.submitted ?? 0;
  const opened = requestTotals?.opened ?? 0;
  const totalReviews = countReviews(spaceId);
  return {
    pending,
    approved: approved.length,
    totalReviews,
    avgRating,
    verifiedPct,
    sent,
    opened,
    submitted,
    responseRate: sent ? Math.round((submitted / sent) * 100) : 0,
  };
}

export function analytics(spaceId: string) {
  const stats = getStats(spaceId);
  const ratingsByMonth = rows<{ month: string; avg: number; count: number }>(
    `SELECT substr(created_at, 1, 7) AS month, AVG(rating) AS avg, COUNT(*) AS count
     FROM reviews WHERE space_id = ? AND status = 'approved'
     GROUP BY month ORDER BY month ASC`,
    spaceId,
  );
  const widgetLoads = row<{ n: number }>(
    "SELECT COUNT(*) AS n FROM events WHERE space_id = ? AND type = 'widget_load'",
    spaceId,
  );
  const distribution = rows<{ rating: number; n: number }>(
    `SELECT rating, COUNT(*) AS n FROM reviews WHERE space_id = ? AND status = 'approved' GROUP BY rating`,
    spaceId,
  );
  const hidden = countReviews(spaceId, "hidden");
  return {
    ...stats,
    widgetLoads: widgetLoads?.n ?? 0,
    hidden,
    ratingsByMonth: ratingsByMonth.map((item) => ({
      month: item.month,
      avg: Math.round(Number(item.avg) * 10) / 10,
      count: Number(item.count),
    })),
    distribution: [5, 4, 3, 2, 1].map((rating) => ({
      rating,
      count: distribution.find((item) => item.rating === rating)?.n ?? 0,
    })),
  };
}

/* -------------------------------- customers -------------------------------- */

export function listCustomers(spaceId: string) {
  return rows<
    Customer & {
      request_status: string | null;
      request_sent_at: string | null;
      request_id: string | null;
      needs_reminder: number;
    }
  >(
    `SELECT c.*, rq.status AS request_status, rq.sent_at AS request_sent_at, rq.id AS request_id,
       CASE WHEN rq.sent_at IS NOT NULL AND rq.status != 'submitted'
         AND (julianday('now') - julianday(rq.sent_at)) > 3 THEN 1 ELSE 0 END AS needs_reminder
     FROM customers c
     LEFT JOIN review_requests rq ON rq.customer_id = c.id
     WHERE c.space_id = ?
     ORDER BY c.created_at DESC`,
    spaceId,
  );
}

export function createCustomer(
  spaceId: string,
  input: { name: string; phone: string; orderRef?: string | null },
): Customer {
  const customerId = id("cu");
  run(
    "INSERT INTO customers (id, space_id, name, phone, phone_hash, order_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    customerId,
    spaceId,
    input.name,
    input.phone,
    hashValue(input.phone),
    input.orderRef ?? null,
    nowIso(),
  );
  return {
    id: customerId,
    space_id: spaceId,
    name: input.name,
    phone: input.phone,
    order_ref: input.orderRef ?? null,
    created_at: nowIso(),
  };
}

/** Creates (or rotates) the single-use review link token for a customer. */
export function issueRequest(spaceId: string, customerId: string, channel = "whatsapp") {
  const token = id("tk") + id("tk");
  const expiresAt = new Date(Date.now() + 14 * 86400000).toISOString();
  const existing = row<{ id: string }>(
    "SELECT id FROM review_requests WHERE customer_id = ? AND status != 'submitted'",
    customerId,
  );
  if (existing) {
    run(
      "UPDATE review_requests SET token_hash = ?, status = 'sent', sent_at = ?, expires_at = ?, channel = ?, opened_at = NULL WHERE id = ?",
      hashValue(token),
      nowIso(),
      expiresAt,
      channel,
      existing.id,
    );
  } else {
    run(
      `INSERT INTO review_requests (id, space_id, customer_id, token_hash, channel, status, sent_at, expires_at)
       VALUES (?, ?, ?, ?, ?, 'sent', ?, ?)`,
      id("rq"),
      spaceId,
      customerId,
      hashValue(token),
      channel,
      nowIso(),
      expiresAt,
    );
  }
  logEvent(spaceId, "request_sent");
  return token;
}

export function findRequestByToken(token: string) {
  const record = row<{
    id: string;
    space_id: string;
    customer_id: string;
    status: string;
    expires_at: string;
    opened_at: string | null;
    name: string;
    phone: string;
    order_ref: string | null;
    expired: number;
  }>(
    `SELECT rq.*, c.name, c.phone, c.order_ref,
       CASE WHEN julianday(rq.expires_at) < julianday('now') THEN 1 ELSE 0 END AS expired
     FROM review_requests rq JOIN customers c ON c.id = rq.customer_id
     WHERE rq.token_hash = ?`,
    hashValue(token),
  );
  return record ?? null;
}

export function markRequestOpened(requestId: string, spaceId: string) {
  const record = row<{ opened_at: string | null; status: string }>(
    "SELECT opened_at, status FROM review_requests WHERE id = ?",
    requestId,
  );
  if (!record) return;
  if (!record.opened_at) {
    run("UPDATE review_requests SET opened_at = ? WHERE id = ?", nowIso(), requestId);
    logEvent(spaceId, "request_opened");
  }
  if (record.status === "sent") run("UPDATE review_requests SET status = 'opened' WHERE id = ?", requestId);
}

export function markRequestSubmitted(requestId: string, spaceId: string) {
  run("UPDATE review_requests SET status = 'submitted', submitted_at = ? WHERE id = ?", nowIso(), requestId);
  logEvent(spaceId, "request_submitted");
}

export function findCustomerByPhone(spaceId: string, phoneHash: string) {
  return row<Customer>("SELECT * FROM customers WHERE space_id = ? AND phone_hash = ?", spaceId, phoneHash) ?? null;
}

export function hasRecentReview(spaceId: string, phoneHash: string, days = 90) {
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();
  const record = row<{ n: number }>(
    `SELECT COUNT(*) AS n FROM reviews rv
     JOIN review_requests rq ON rq.id = rv.request_id
     JOIN customers c ON c.id = rq.customer_id
     WHERE rv.space_id = ? AND c.phone_hash = ? AND rv.created_at > ?`,
    spaceId,
    phoneHash,
    cutoff,
  );
  return (record?.n ?? 0) > 0;
}

/* ----------------------------------- OTP ----------------------------------- */

export function createOtp(spaceId: string, phone: string, codeHash: string) {
  run(
    `INSERT INTO otp_codes (id, phone, space_id, code_hash, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id("ot"),
    phone,
    spaceId,
    codeHash,
    nowIso(),
    new Date(Date.now() + 10 * 60000).toISOString(),
  );
}

export function verifyOtp(spaceId: string, phone: string, codeHash: string) {
  const record = row<{ id: string; attempts: number }>(
    `SELECT id, attempts FROM otp_codes
     WHERE phone = ? AND space_id = ? AND consumed = 0 AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`,
    phone,
    spaceId,
    nowIso(),
  );
  if (!record) return { ok: false as const, reason: "expired" as const };
  if (record.attempts >= 5) return { ok: false as const, reason: "attempts" as const };
  const match = row<{ id: string }>("SELECT id FROM otp_codes WHERE id = ? AND code_hash = ?", record.id, codeHash);
  if (!match) {
    run("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?", record.id);
    return { ok: false as const, reason: "mismatch" as const };
  }
  run("UPDATE otp_codes SET consumed = 1 WHERE id = ?", record.id);
  return { ok: true as const };
}

/* ------------------------------- events/audit ------------------------------- */

export function logEvent(spaceId: string, type: string, ref?: string | null) {
  run("INSERT INTO events (id, space_id, type, ref, created_at) VALUES (?, ?, ?, ?, ?)", id("ev"), spaceId, type, ref ?? null, nowIso());
}

export function logAudit(spaceId: string, actorId: string | null, action: string, target: string | null, meta: unknown) {
  run(
    "INSERT INTO audit_log (id, space_id, actor_id, action, target, meta, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    id("al"),
    spaceId,
    actorId,
    action,
    target,
    meta ? JSON.stringify(meta) : null,
    nowIso(),
  );
}

export function listAudit(spaceId: string, limit = 20) {
  return rows<{ id: string; action: string; target: string | null; meta: string | null; created_at: string }>(
    "SELECT * FROM audit_log WHERE space_id = ? ORDER BY created_at DESC LIMIT ?",
    spaceId,
    limit,
  );
}
