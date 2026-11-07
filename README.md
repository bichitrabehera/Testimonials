# Proofly — Verified Review Collector

A working MVP of the product described in `../prd.md`, `../specs.md`, `../architecture.md`
and `../uiux.md`: small businesses collect **verified** customer reviews over WhatsApp,
approve them in a dashboard, and publish them on their website with one line of code.

```bash
npm install
npm run dev      # http://localhost:3000
```

No environment variables, no external services. The database is a local SQLite file
(`data/proofly.db`) created and seeded on first run with a demo business, **Smile Dental**
(link: `/r/smile-dental`).

Demo owner account: `demo@proofly.app` / `demo1234` (or press **Explore the demo business**
on `/login`). The demo space is on the Pro plan so every feature is visible; new sign-ups
start on Free.

## What is implemented

| Area | Route | Notes |
|---|---|---|
| Landing page | `/` | Hero with live widget, features, how-it-works, demo wall, pricing, FAQ, CTA |
| Auth | `/login` | Email + password (scrypt hashes, httpOnly session cookies), sign-up, sign-out |
| Onboarding | `/app/setup` | Create the space (name, category, slug, brand colour) → dashboard |
| Dashboard home | `/app` | Pending average, response rate, verified %, setup checklist, latest reviews |
| Moderation | `/app/reviews` | Tabs, rating/verified filters, approve, approve-all, hide with a logged reason, replies (Pro) |
| Requests | `/app/requests` | Customers, add manually, CSV import, per-customer single-use links, WhatsApp send, reminder detection, template editor with preview |
| Widget designer | `/app/widget` | Wall / Carousel / Badge / List, light-dark-auto, accent, limits, toggles, live preview, embed snippet + install guides |
| Share | `/app/share` | Review link, QR code (PNG/SVG download), forwardable message |
| Analytics | `/app/analytics` | Requests → opened → submitted funnel, rating distribution, monthly volume, hidden-review count, widget loads |
| Settings | `/app/settings` | Business profile, logo upload, verification mode, auto-approve, plan, audit log, data deletion |
| Reviewer flow | `/r/{slug}` | Mobile-first: stars → details → consent → OTP (optional) → thank-you, private feedback for 1–3 stars, “Also post on Google” |
| Public API | `/api/public/*` | Space feed (CDN-cacheable), review submission, OTP send/verify, private feedback |
| Embeddable widget | `/w.js` | Vanilla script, shadow DOM, < 13 KB unminified, textContent only, no dependencies, skeleton with reserved height |

## Verification logic

A review is `verified` when it arrives through a single-use personal link, or when the
reviewer confirms a phone number by OTP. The business chooses the policy in Settings:

- **Link or OTP** (default) — personal links verify automatically; anyone else may verify by phone or submit unverified.
- **Personal links only** — OTP verifies only if the number matches a customer you added.
- **Open** — no verification; reviews never carry the badge.

Review links are random 128-bit tokens stored only as SHA-256 hashes, single use, and expire
after 14 days. Hidden reviews keep a logged reason and are never deleted; the audit log
records every approval, hide and reply.

## Architecture in this repo

- Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide icons, `qrcode`.
- Storage: `node:sqlite` (`lib/server/db.ts`). Tables mirror `architecture.md` §3
  (`users`, `sessions`, `spaces`, `customers`, `review_requests`, `reviews`, `replies`,
  `subscriptions`, `audit_log`, `otp_codes`, `events`).
- Server logic: `lib/server/queries.ts` (reads), `app/actions/*` (mutations), `lib/server/auth.ts`
  (sessions), `lib/server/secrets.ts` (HMAC-signed OTP sessions), `lib/server/rate-limit.ts`.
- `proxy.ts` redirects unauthenticated `/app` and `/api/space` requests.

## Deliberate stubs (wire these before launch)

1. **OTP delivery** — no SMS gateway is connected. `/api/public/otp/send` returns the code and
   the review page shows it as a “Demo mode” hint. Replace that with MSG91/Twilio.
2. **Payments** — Razorpay is not connected. Plan changes on `/app/settings` apply directly
   instead of going through Razorpay Subscriptions; a `subscriptions` table is ready for it.
3. **Email** — no transactional email. Notifications are in-dashboard instead of Resend.
4. **Storage** — the logo is stored as a 128 px data URL in SQLite rather than object storage.
5. **Verification-matching** — order-ID matching is not implemented; phone OTP covers it.

## Notes

- `cacheComponents` / `partialPrefetching` were left **off** in `next.config.ts`. With them on,
  the dynamic shell streamed by a page that calls `cookies()` did not get activated by the
  client, so pages appeared to hang on their skeletons. Every dashboard route is explicitly
  dynamic (`force-dynamic`), so there is no static shell to gain.
- `next dev` prints an `ExperimentalWarning: SQLite` line; that is Node's built-in driver, not an error.

## Checks

```bash
npx tsc --noEmit     # type check
npx eslint .         # lint
npm run build        # production build
```
