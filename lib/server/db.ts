import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { hashPassword, id, nowIso } from "./crypto";

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS spaces (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  brand_color TEXT NOT NULL DEFAULT '#0A7C66',
  category TEXT NOT NULL DEFAULT 'Business',
  plan TEXT NOT NULL DEFAULT 'free',
  verification_mode TEXT NOT NULL DEFAULT 'otp_or_link',
  widget_config TEXT NOT NULL DEFAULT '{}',
  google_review_url TEXT,
  auto_approve INTEGER NOT NULL DEFAULT 0,
  whatsapp_template TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_hash TEXT NOT NULL,
  order_ref TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_customers_space ON customers(space_id);

CREATE TABLE IF NOT EXISTS review_requests (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL DEFAULT 'whatsapp',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  opened_at TEXT,
  submitted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_requests_space ON review_requests(space_id);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  request_id TEXT,
  rating INTEGER NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  reviewer_name TEXT NOT NULL,
  reviewer_role TEXT,
  photo_url TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  verification_method TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  hidden_reason TEXT,
  consent_display INTEGER NOT NULL DEFAULT 1,
  ip_hash TEXT,
  created_at TEXT NOT NULL,
  approved_at TEXT,
  private_feedback TEXT
);
CREATE INDEX IF NOT EXISTS idx_reviews_space_status ON reviews(space_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_space_created ON reviews(space_id, created_at);

CREATE TABLE IF NOT EXISTS replies (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL UNIQUE,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_ref TEXT,
  current_period_end TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  actor_id TEXT,
  action TEXT NOT NULL,
  target TEXT,
  meta TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  space_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  space_id TEXT NOT NULL,
  type TEXT NOT NULL,
  ref TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_space_type ON events(space_id, type);
`;

declare global {
  var __prooflyDb: DatabaseSync | undefined;
}

function open() {
  const dir = path.join(process.cwd(), "data");
  fs.mkdirSync(dir, { recursive: true });
  const database = new DatabaseSync(path.join(dir, "proofly.db"));
  database.exec(SCHEMA);
  migrate(database);
  seed(database);
  return database;
}

export function db() {
  if (!globalThis.__prooflyDb) globalThis.__prooflyDb = open();
  return globalThis.__prooflyDb;
}

export function rows<T>(sql: string, ...params: unknown[]): T[] {
  return db().prepare(sql).all(...(params as never[])) as unknown as T[];
}

export function row<T>(sql: string, ...params: unknown[]): T | undefined {
  return db().prepare(sql).get(...(params as never[])) as unknown as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db().prepare(sql).run(...(params as never[]));
}

function ensureColumn(database: DatabaseSync, table: string, column: string, definition: string) {
  const columns = database.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((entry) => entry.name === column)) {
    database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

function migrate(database: DatabaseSync) {
  ensureColumn(database, "reviews", "private_feedback", "TEXT");
}

/** Demo data so the landing page and a first-time visitor see a working product. */
function seed(database: DatabaseSync) {
  const existing = database.prepare("SELECT COUNT(*) AS n FROM users").get() as { n: number };
  if (existing.n > 0) return;

  const now = nowIso();
  const ownerId = id("us");
  const spaceId = id("sp");

  database
    .prepare("INSERT INTO users (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)")
    .run(ownerId, "demo@proofly.app", hashPassword("demo1234"), "Dr. Rao", now);

  database
    .prepare(
      `INSERT INTO spaces (id, owner_id, name, slug, logo_url, brand_color, category, plan,
         verification_mode, widget_config, google_review_url, auto_approve, whatsapp_template, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      spaceId,
      ownerId,
      "Smile Dental",
      "smile-dental",
      null,
      "#0A7C66",
      "Dental clinic",
      "pro",
      "otp_or_link",
      JSON.stringify({
        layout: "wall",
        theme: "light",
        accent: "#0A7C66",
        maxReviews: 6,
        showVerified: true,
        showDates: true,
        showReplies: true,
        minRating: 1,
        jsonLd: false,
        branded: true,
      }),
      "https://g.page/r/smile-dental/review",
      0,
      "Hi {name}, thanks for visiting {business}! Could you share a quick review? It takes 20 seconds: {link}",
      now,
    );

  const reviews: Array<[number, string, string, string | null, number, string, string, string | null]> = [
    [5, "Painless root canal and the doctor explained every step. Booked on WhatsApp and was out in 40 minutes.", "Anita Sharma", "Kothrud", 1, "approved", "2026-10-28T09:12:00.000Z", "Thank you Anita! Glad the visit was comfortable."],
    [4, "Very good treatment and honest pricing. The waiting room got crowded in the evening, so keep that in mind.", "Ravi Menon", null, 1, "approved", "2026-10-24T15:40:00.000Z", null],
    [5, "My daughter was terrified of dentists. The team let her hold the mirror and she left smiling. Deeply grateful.", "Meera Iyer", "Parent", 1, "approved", "2026-10-19T11:05:00.000Z", null],
    [5, "Got a same-day crown. Zero pain and they followed up the next morning to check on me.", "Farhan Qureshi", null, 0, "approved", "2026-10-14T07:25:00.000Z", null],
    [4, "Clean clinic, staff is polite. Only thing is parking on the main road is difficult.", "Divya Nair", null, 1, "approved", "2026-10-08T13:30:00.000Z", null],
    [5, "Been going here for three years. Never pushed an unnecessary treatment, which I cannot say about others.", "Karthik Rao", null, 1, "approved", "2026-10-02T17:02:00.000Z", "That means a lot, Karthik. See you at the next checkup!"],
    [5, "Quick scaling and polishing before my wedding. Teeth look fantastic.", "Sneha Patil", "Bride-to-be", 1, "pending", "2026-11-05T10:18:00.000Z", null],
    [3, "Treatment was fine but I waited 35 minutes past my appointment time without anyone telling me why.", "Anonymous", null, 0, "pending", "2026-11-06T16:45:00.000Z", null],
  ];

  for (const [rating, body, name, role, verified, status, createdAt, reply] of reviews) {
    const reviewId = id("rv");
    database
      .prepare(
        `INSERT INTO reviews (id, space_id, rating, body, reviewer_name, reviewer_role, verified,
           verification_method, status, consent_display, created_at, approved_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      )
      .run(
        reviewId,
        spaceId,
        rating,
        body,
        name,
        role,
        verified,
        verified ? "link" : null,
        status,
        createdAt,
        status === "approved" ? createdAt : null,
      );
    if (reply) {
      database
        .prepare("INSERT INTO replies (id, review_id, body, created_at) VALUES (?, ?, ?, ?)")
        .run(id("rp"), reviewId, reply, createdAt);
    }
  }

  const customers: Array<[string, string, string | null, string]> = [
    ["Anita Sharma", "+919812345670", "INV-1041", "submitted"],
    ["Ravi Menon", "+919812345671", "INV-1042", "submitted"],
    ["Sneha Patil", "+919812345672", "INV-1055", "submitted"],
    ["Vikram Desai", "+919812345673", "INV-1061", "opened"],
    ["Priya Kulkarni", "+919812345674", "INV-1062", "sent"],
    ["Arjun Shetty", "+919812345675", "INV-1063", "sent"],
  ];

  for (const [name, phone, orderRef, status] of customers) {
    const customerId = id("cu");
    database
      .prepare(
        "INSERT INTO customers (id, space_id, name, phone, phone_hash, order_ref, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(customerId, spaceId, name, phone, `seed-${customerId}`, orderRef, now);
    const sentAt = new Date(Date.now() - 3 * 86400000).toISOString();
    database
      .prepare(
        `INSERT INTO review_requests (id, space_id, customer_id, token_hash, channel, status, sent_at, expires_at, opened_at, submitted_at)
         VALUES (?, ?, ?, ?, 'whatsapp', ?, ?, ?, ?, ?)`,
      )
      .run(
        id("rq"),
        spaceId,
        customerId,
        `seed-${customerId}`,
        status,
        sentAt,
        new Date(Date.now() + 11 * 86400000).toISOString(),
        status === "sent" ? null : sentAt,
        status === "submitted" ? sentAt : null,
      );
  }

  for (const [type, count] of [["request_sent", 6], ["request_opened", 4], ["widget_load", 128]] as const) {
    for (let i = 0; i < count; i++) {
      database
        .prepare("INSERT INTO events (id, space_id, type, created_at) VALUES (?, ?, ?, ?)")
        .run(id("ev"), spaceId, type, new Date(Date.now() - i * 3600000).toISOString());
    }
  }
}
