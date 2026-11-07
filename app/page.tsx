import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  MessageCircle,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Star,
  ThumbsDown,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Stars } from "@/components/stars";
import { WidgetView } from "@/components/widget-view";
import { publicReviews, toMarketing } from "@/lib/server/queries";
import { formatInr, PLANS } from "@/lib/plans";

/** Re-render the demo wall every minute so newly approved reviews show up. */
export const revalidate = 60;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Verification is the product",
    body: "Every review is tied to a personal link, a phone OTP, or a booked order. Visitors see a “Verified customer” badge, not an anonymous claim.",
  },
  {
    icon: MessageCircle,
    title: "Collected on WhatsApp",
    body: "Send a ready-made message to each customer. They tap, pick stars, and submit in under 30 seconds — no app, no login.",
  },
  {
    icon: ThumbsDown,
    title: "Honest by design",
    body: "Negative reviews are not deletable. You can hide one with a logged reason, reply publicly, and the transparency stats stay visible.",
  },
  {
    icon: ScanLine,
    title: "One line on your site",
    body: "Paste a snippet or scan a QR code at the counter. Reviews update automatically, look native, and never slow the page down.",
  },
];

const STEPS = [
  {
    title: "Create your space",
    body: "Add your business name, logo and brand colour. You get a review link and a QR code instantly.",
  },
  {
    title: "Send requests on WhatsApp",
    body: "Add customers one by one or import a CSV. Each person gets a single-use link that expires in 14 days.",
  },
  {
    title: "Approve and embed",
    body: "Approve the reviews you like, reply to the ones you do not, then copy the embed snippet to your site.",
  },
];

const FAQ = [
  {
    q: "Can I delete a negative review?",
    a: "No. You can hide a review with a logged reason, and you can reply publicly, but the review itself is never removed. Honest reviews are the reason the badge means something.",
  },
  {
    q: "How is a review verified?",
    a: "Either the customer arrived from a single-use link you sent them, or they confirmed their phone number with an OTP that matches a customer on your list. Unverified submissions can be approved too, but they never show the badge.",
  },
  {
    q: "Do I need a developer to install the widget?",
    a: "No. Copy one script tag into your site — WordPress, Wix, Shopify, or plain HTML. The widget sizes itself and reserves its space so nothing jumps around.",
  },
  {
    q: "What does it cost?",
    a: `Free to start with up to ${PLANS.free.limits.displayedReviews} displayed reviews. Pro is ${formatInr(PLANS.pro.priceMonthly)}/month or ${formatInr(PLANS.pro.priceYearly)}/year, paid by UPI or card.`,
  },
  {
    q: "Is my customer data safe?",
    a: "We store only what a review needs: a name, an optional phone number for verification, and the review itself. Customers can ask for deletion at any time.",
  },
];

async function HeroWidget() {
  const data = publicReviews("smile-dental", 2);
  if (!data) return null;
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-surface-2/60 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-xs font-bold text-white">SD</span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">{data.space.name}</p>
            <p className="text-[11px] text-muted">smiledental.in</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <Star size={13} className="fill-amber text-amber" />
          {data.stats.avgRating.toFixed(1)}
          <span className="font-normal text-muted">· {data.stats.count} reviews</span>
        </div>
      </div>
      <div className="p-4">
        <WidgetView
          space={data.space}
          config={{ ...data.space.widget_config, branded: false, maxReviews: 2 }}
          reviews={toMarketing(data.reviews).slice(0, 2)}
          stats={data.stats}
        />
      </div>
    </div>
  );
}

async function DemoWall() {
  const data = publicReviews("smile-dental", 6);
  if (!data) return null;
  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="badge border-brand/25 bg-brand-soft text-brand-strong">
            <BadgeCheck size={12} /> Live widget
          </span>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            This is exactly what your visitors see
          </h2>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Reviews below are real submissions approved in the dashboard. Same markup renders on any
            website in under 300&nbsp;ms after the first load.
          </p>
        </div>
        <Link href="/r/smile-dental" className="btn btn-secondary">
          Try the review flow <ArrowRight size={15} />
        </Link>
      </div>
      <div className="card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-brand text-sm font-bold text-white">SD</span>
            <div>
              <p className="text-sm font-semibold">{data.space.name}</p>
              <p className="text-[11px] text-muted">
                {data.stats.verifiedPct}% of reviews verified · {data.stats.count} total
              </p>
            </div>
          </div>
          <Stars rating={data.stats.avgRating} size={16} />
        </div>
        <WidgetView
          space={data.space}
          config={{ ...data.space.widget_config, theme: "light", branded: false }}
          reviews={toMarketing(data.reviews)}
          stats={data.stats}
        />
      </div>
    </>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader authed={false} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_srgb,var(--brand)_18%,transparent),transparent)]"
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
            <div>
              <span className="badge border-line bg-surface text-muted">
                <Sparkles size={12} className="text-brand" />
                Built for Indian small businesses
              </span>
              <h1 className="mt-5 text-[2.5rem] font-semibold leading-[1.06] tracking-tight sm:text-6xl">
                Turn happy customers into your best{" "}
                <span className="text-brand">salespeople</span>.
              </h1>
              <p className="mt-5 max-w-xl text-[1.0625rem] leading-relaxed text-muted">
                Proofly collects <strong className="font-semibold text-ink">verified</strong> reviews
                from real customers over WhatsApp, lets you approve them in a dashboard, and publishes
                them on your website with one line of code.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link href="/login?mode=signup" className="btn btn-primary px-5 py-2.5 text-[0.9375rem]">
                  Start free — no card <ArrowRight size={16} />
                </Link>
                <Link href="/r/smile-dental" className="btn btn-secondary px-5 py-2.5 text-[0.9375rem]">
                  See a review page
                </Link>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[0.8125rem] text-muted">
                {[
                  "Free for 15 reviews",
                  `Pro ${formatInr(PLANS.pro.priceMonthly)}/month`,
                  "UPI & cards",
                  "No setup fee",
                ].map((item) => (
                  <li key={item} className="inline-flex items-center gap-1.5">
                    <Check size={13} className="text-brand" /> {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-[22px] bg-gradient-to-br from-brand/15 via-transparent to-amber/10 blur-xl"
              />
              <div className="relative">
                <HeroWidget />
                <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[11px] text-muted shadow-sm">
                  <span className="inline-flex items-center gap-1.5">
                    <BadgeCheck size={13} className="text-brand" /> Verified customer
                  </span>
                  <span>Single-use link · expires in 14 days</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="space-y-2.5">
                <span className="grid size-9 place-items-center rounded-lg border border-brand/20 bg-brand-soft text-brand">
                  <feature.icon size={17} />
                </span>
                <h3 className="text-[0.9375rem] font-semibold">{feature.title}</h3>
                <p className="text-[0.8125rem] leading-relaxed text-muted">{feature.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <span className="badge border-line bg-surface text-muted">Three steps</span>
          <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
            From sign-up to a live widget in one sitting
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="card p-5">
                <span className="grid size-8 place-items-center rounded-full border border-brand/25 bg-brand-soft text-sm font-semibold text-brand-strong">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-[0.9375rem] font-semibold">{step.title}</h3>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Demo */}
        <section id="demo" className="scroll-mt-20 border-y border-line bg-surface py-16">
          <div className="mx-auto max-w-6xl px-5">
            <DemoWall />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16">
          <div className="max-w-2xl">
            <span className="badge border-line bg-surface text-muted">Pricing</span>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              Flat pricing in rupees. No per-review charges.
            </h2>
            <p className="mt-2 text-sm text-muted">
              Start free, upgrade when reviews start bringing you customers. Cancel anytime.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {(["free", "pro"] as const).map((planId) => {
              const plan = PLANS[planId];
              const featured = planId === "pro";
              return (
                <div
                  key={plan.id}
                  className={
                    featured
                      ? "card relative border-brand/40 p-6 ring-1 ring-brand/20"
                      : "card p-6"
                  }
                >
                  {featured && (
                    <span className="absolute -top-3 left-6 rounded-full bg-brand px-2.5 py-1 text-[11px] font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    <p className="text-right">
                      <span className="text-2xl font-semibold tracking-tight">
                        {plan.priceMonthly === 0 ? "Free" : formatInr(plan.priceMonthly)}
                      </span>
                      {plan.priceMonthly > 0 && (
                        <span className="text-sm text-muted">/month</span>
                      )}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted">{plan.tagline}</p>
                  {featured && (
                    <p className="mt-2 text-xs text-muted">
                      or {formatInr(plan.priceYearly)}/year — two months free
                    </p>
                  )}
                  <ul className="mt-5 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check size={15} className="mt-0.5 shrink-0 text-brand" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/login?mode=signup"
                    className={featured ? "btn btn-primary mt-6 w-full" : "btn btn-secondary mt-6 w-full"}
                  >
                    {featured ? "Start with Pro" : "Start free"}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-line bg-surface py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Questions owners ask</h2>
              <p className="mt-2 text-sm text-muted">
                Still unsure? Open the demo dashboard — it is seeded with a real clinic so you can
                click everything.
              </p>
              <Link href="/login" className="btn btn-secondary mt-5">
                Open the demo dashboard
              </Link>
            </div>
            <div className="divide-y divide-line">
              {FAQ.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.9375rem] font-medium">
                    {item.q}
                    <span className="text-muted transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="relative overflow-hidden rounded-2xl bg-[#075E4E] px-6 py-12 text-center text-white sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_120%_at_50%_-20%,rgba(255,255,255,0.18),transparent)]"
            />
            <h2 className="relative text-2xl font-semibold tracking-tight sm:text-3xl">
              Your next ten customers are reading reviews right now
            </h2>
            <p className="relative mx-auto mt-2 max-w-xl text-sm text-white/80">
              Set up your space, send five WhatsApp requests today, and publish the widget this week.
            </p>
            <div className="relative mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/login?mode=signup" className="btn bg-white text-[#075E4E] hover:bg-white/90">
                Create free account <ArrowRight size={15} />
              </Link>
              <Link href="/r/smile-dental" className="btn border-white/25 text-white hover:bg-white/10">
                Leave a sample review
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
