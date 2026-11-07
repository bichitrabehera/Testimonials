import {
  BadgeCheck,
  EyeOff,
  Loader,
  MousePointerClick,
  Send,
  Star,
  TrendingUp,
} from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui";
import { requireSpace } from "@/lib/server/auth";
import { analytics } from "@/lib/server/queries";
import { formatMonth } from "@/lib/utils";

async function Content() {
  const { space } = await requireSpace();
  const data = analytics(space.id);

  const funnel = [
    { label: "Requests sent", value: data.sent, icon: Send },
    { label: "Links opened", value: data.opened, icon: MousePointerClick },
    { label: "Reviews submitted", value: data.submitted, icon: TrendingUp },
  ];
  const maxFunnel = Math.max(1, ...funnel.map((step) => step.value));
  const maxDistribution = Math.max(1, ...data.distribution.map((item) => item.count));
  const peakMonth = Math.max(1, ...data.ratingsByMonth.map((item) => item.count));

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="What gets measured here: how many requests you sent, how many people responded, and how honest the result looks."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Requests sent" value={data.sent} hint="Last 14-day links included" icon={<Send size={14} />} />
        <StatCard
          label="Response rate"
          value={`${data.responseRate}%`}
          hint={`${data.submitted} submitted of ${data.sent}`}
          icon={<TrendingUp size={14} />}
          tone="brand"
        />
        <StatCard
          label="Verified share"
          value={`${data.verifiedPct}%`}
          hint="of approved reviews"
          icon={<BadgeCheck size={14} />}
        />
        <StatCard label="Widget loads" value={data.widgetLoads} hint="all time" icon={<Loader size={14} />} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="text-sm font-semibold">Request funnel</h2>
          <p className="text-xs text-muted">Where people drop off between request and review.</p>
          <div className="mt-4 space-y-3.5">
            {funnel.map((step) => (
              <div key={step.label}>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <step.icon size={13} className="text-muted" /> {step.label}
                  </span>
                  <span className="text-muted">{step.value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.max(3, (step.value / maxFunnel) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Rating distribution</h2>
          <p className="text-xs text-muted">Approved reviews only — hidden ones stay in the count below.</p>
          <div className="mt-4 space-y-2.5">
            {data.distribution.map((item) => (
              <div key={item.rating} className="flex items-center gap-2">
                <span className="flex w-8 items-center gap-0.5 text-xs font-medium">
                  {item.rating} <Star size={10} className="fill-amber text-amber" />
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-amber/80"
                    style={{ width: `${(item.count / maxDistribution) * 100}%` }}
                  />
                </div>
                <span className="w-6 text-right text-xs text-muted">{item.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-1.5 rounded-lg bg-surface-2/70 px-3 py-2 text-[11px] text-muted">
            <EyeOff size={12} /> {data.hidden} review{data.hidden === 1 ? "" : "s"} hidden with a logged reason
          </div>
        </div>

        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Average rating and volume by month</h2>
              <p className="text-xs text-muted">Consistent volume beats one big burst.</p>
            </div>
            <span className="badge border-line bg-surface-2 text-muted">
              {data.ratingsByMonth.length} month{data.ratingsByMonth.length === 1 ? "" : "s"}
            </span>
          </div>
          {data.ratingsByMonth.length ? (
            <div className="mt-5 flex items-end gap-3 overflow-x-auto pb-1">
              {data.ratingsByMonth.map((item) => (
                <div key={item.month} className="flex min-w-14 flex-1 flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold">{item.avg.toFixed(1)}</span>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className="w-8 rounded-t-md bg-brand/80"
                      style={{ height: `${Math.max(6, (item.count / peakMonth) * 100)}%` }}
                      title={`${item.count} reviews`}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{formatMonth(`${item.month}-01`)}</span>
                  <span className="text-[10px] text-muted">{item.count} rev</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Approve your first review to see trends here.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Content;
