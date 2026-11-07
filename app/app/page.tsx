import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Circle,
  Code2,
  MessageSquareText,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageHeader, SectionHeading, StatCard, EmptyState } from "@/components/ui";
import { ReviewItem } from "@/components/review-item";
import { requireSpace } from "@/lib/server/auth";
import { getStats, listReviews } from "@/lib/server/queries";
import { PLANS } from "@/lib/plans";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

async function Content() {
  const { user, space } = await requireSpace();
  const stats = getStats(space.id);
  const latest = listReviews(space.id, { limit: 3 });
  const pro = space.plan === "pro";

  const checklist = [
    {
      done: true,
      title: "Create your business",
      body: `${space.name} is live at /r/${space.slug}`,
      href: "/app/settings",
      cta: "Edit details",
    },
    {
      done: stats.sent > 0,
      title: "Send your first review request",
      body: stats.sent > 0 ? `${stats.sent} request${stats.sent === 1 ? "" : "s"} sent so far` : "Add a customer and send on WhatsApp",
      href: "/app/requests",
      cta: "Send request",
    },
    {
      done: stats.approved > 0,
      title: "Publish reviews on your site",
      body: stats.approved > 0 ? "Copy your embed snippet from the Widget page" : "Approve a review, then copy the snippet",
      href: "/app/widget",
      cta: "Get snippet",
    },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${user.name.split(" ")[0]}`}
        description="Here is what needs your attention today."
        actions={
          <Link href="/app/requests" className="btn btn-primary">
            <Send size={15} /> Send requests
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending reviews"
          value={stats.pending}
          hint={stats.pending ? "Approve or hide them" : "All caught up"}
          icon={<MessageSquareText size={14} />}
          tone={stats.pending ? "warning" : "default"}
        />
        <StatCard
          label="Average rating"
          value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
          hint={`${stats.approved} approved review${stats.approved === 1 ? "" : "s"}`}
          icon={<Star size={14} />}
          tone="brand"
        />
        <StatCard
          label="Response rate"
          value={`${stats.responseRate}%`}
          hint={`${stats.submitted} of ${stats.sent} requests`}
          icon={<TrendingUp size={14} />}
        />
        <StatCard
          label="Verified"
          value={`${stats.verifiedPct}%`}
          hint="of approved reviews"
          icon={<BadgeCheck size={14} />}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <SectionHeading
            title="Latest reviews"
            action={
              <Link href="/app/reviews" className="text-xs font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          {latest.length ? (
            <div className="space-y-3">
              {latest.map((review) => (
                <ReviewItem key={review.id} review={review} pro={pro} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquareText size={18} />}
              title="No reviews yet"
              body="Send your first WhatsApp request. Most owners get their first review within a day."
            >
              <Link href="/app/requests" className="btn btn-primary">
                <Send size={14} /> Send a request
              </Link>
            </EmptyState>
          )}
        </div>

        <div className="space-y-5">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Setup checklist</h2>
              <span className="text-xs text-muted">{doneCount} of 3</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${(doneCount / 3) * 100}%` }}
              />
            </div>
            <ul className="mt-3.5 space-y-3">
              {checklist.map((item) => (
                <li key={item.title} className="flex items-start gap-2.5">
                  {item.done ? (
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-brand" />
                  ) : (
                    <Circle size={16} className="mt-0.5 shrink-0 text-line" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{item.title}</p>
                    <p className="text-[11px] text-muted">{item.body}</p>
                  </div>
                  {!item.done && (
                    <Link href={item.href} className="shrink-0 text-[11px] font-medium text-brand hover:underline">
                      {item.cta}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="card p-4">
            <h2 className="text-sm font-semibold">Quick actions</h2>
            <div className="mt-2.5 grid gap-1.5">
              <Link href="/app/share" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                <span className="flex items-center gap-1.5">
                  <ArrowRight size={14} className="text-muted" /> Get your QR code
                </span>
              </Link>
              <Link href="/app/widget" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                <span className="flex items-center gap-1.5">
                  <Code2 size={14} className="text-muted" /> Copy embed snippet
                </span>
              </Link>
              <Link href="/app/analytics" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                <span className="flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-muted" /> See analytics
                </span>
              </Link>
              {pro ? (
                <Link href="/app/settings" className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-surface-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-muted" /> Pro plan active
                  </span>
                </Link>
              ) : (
                <Link
                  href="/app/settings#plan"
                  className="flex items-center justify-between rounded-lg bg-brand-soft px-2 py-2 text-sm font-medium text-brand-strong"
                >
                  <span>Upgrade to remove branding</span>
                  <ArrowRight size={14} />
                </Link>
              )}
            </div>
          </div>

          {!pro && (
            <div className="rounded-xl border border-brand/25 bg-brand-soft/60 p-4">
              <p className="text-sm font-semibold text-brand-strong">
                Free plan · {PLANS.free.limits.displayedReviews} reviews displayed
              </p>
              <p className="mt-1 text-xs text-muted">
                Pro shows every review, removes Proofly branding and unlocks replies and CSV export.
              </p>
              <Link href="/app/settings#plan" className="btn btn-primary mt-3 w-full py-1.5 text-xs">
                See Pro · ₹{PLANS.pro.priceMonthly}/month
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Content;
