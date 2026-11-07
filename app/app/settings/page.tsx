import Link from "next/link";
import { AlertTriangle, Check, Download, Info, ShieldAlert, Trash2 } from "lucide-react";
import { PageHeader, SectionHeading } from "@/components/ui";
import { SettingsForm } from "@/components/settings-form";
import { requireSpace } from "@/lib/server/auth";
import { listAudit } from "@/lib/server/queries";
import { setPlanAction } from "@/app/actions/space";
import { deleteAccountAction } from "@/app/actions/auth";
import { formatInr, PLANS } from "@/lib/plans";
import { cn, formatDate } from "@/lib/utils";

async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { space } = await requireSpace();
  const params = await searchParams;
  const audit = listAudit(space.id, 8);
  const plan = PLANS[space.plan];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Business details, verification policy, plan and your data."
        actions={
          <Link href={`/r/${space.slug}`} target="_blank" className="btn btn-secondary">
            Open review page
          </Link>
        }
      />

      {params.plan === "updated" && (
        <p className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm font-medium text-success">
          Plan updated.
        </p>
      )}
      {params.error === "delete" && (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm font-medium text-danger">
          Type DELETE in capitals to confirm account deletion.
        </p>
      )}

      <section>
        <SectionHeading title="Business profile" />
        <SettingsForm
          space={{
            name: space.name,
            slug: space.slug,
            category: space.category,
            brand_color: space.brand_color,
            logo_url: space.logo_url,
            google_review_url: space.google_review_url,
            verification_mode: space.verification_mode,
            auto_approve: space.auto_approve === 1,
          }}
          plan={space.plan}
        />
      </section>

      <section id="plan" className="scroll-mt-20">
        <SectionHeading title="Plan and billing" />
        <div className="card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold">
                {plan.name} plan
                <span className="badge border-brand/25 bg-brand-soft text-brand-strong">Active</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {space.plan === "pro"
                  ? "Unlimited displayed reviews, replies, CSV export and no branding."
                  : `Latest ${plan.limits.displayedReviews} approved reviews are displayed on your site.`}
              </p>
            </div>
            {space.plan === "pro" ? (
              <form action={setPlanAction}>
                <input type="hidden" name="plan" value="free" />
                <button type="submit" className="btn btn-secondary text-xs">
                  Downgrade to Free
                </button>
              </form>
            ) : (
              <form action={setPlanAction}>
                <input type="hidden" name="plan" value="pro" />
                <button type="submit" className="btn btn-primary text-xs">
                  Activate Pro · {formatInr(PLANS.pro.priceMonthly)}/mo
                </button>
              </form>
            )}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(["free", "pro"] as const).map((planId) => {
              const definition = PLANS[planId];
              const active = space.plan === planId;
              return (
                <div
                  key={planId}
                  className={cn(
                    "rounded-xl border p-4",
                    active ? "border-brand bg-brand-soft/40" : "border-line bg-surface",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{definition.name}</p>
                    <p className="text-sm font-semibold">
                      {definition.priceMonthly === 0 ? "Free" : `${formatInr(definition.priceMonthly)}/mo`}
                    </p>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {definition.features.slice(0, 4).map((feature) => (
                      <li key={feature} className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted">
                        <Check size={12} className="mt-0.5 shrink-0 text-brand" /> {feature}
                      </li>
                    ))}
                  </ul>
                  {active && <p className="mt-2 text-[11px] font-medium text-brand-strong">Current plan</p>}
                </div>
              );
            })}
          </div>

          <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-surface-2/70 px-3 py-2 text-[11px] leading-relaxed text-muted">
            <Info size={12} className="mt-0.5 shrink-0" />
            Razorpay is not connected in this build, so plan changes here are applied directly for
            testing. Wire Razorpay Subscriptions to collect UPI and card payments before launch.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="/api/space/export"
              className={cn("btn btn-secondary text-xs", space.plan !== "pro" && "pointer-events-none opacity-50")}
            >
              <Download size={13} /> Export reviews CSV
            </a>
            <span className="text-[11px] text-muted">
              {space.plan === "pro" ? "Available on your plan." : "Pro feature."}
            </span>
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Data and privacy" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="card p-4">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <ShieldAlert size={14} className="text-brand" /> What we store
            </h3>
            <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-muted">
              <li>Reviewer name, optional service label, rating and text.</li>
              <li>Customer phone numbers, only to match a verified review and to send WhatsApp links.</li>
              <li>Hashed IP addresses for abuse prevention — never shown anywhere.</li>
              <li>An audit log of every approve, hide and reply, with the reason.</li>
            </ul>
            <p className="mt-2 text-[11px] text-muted">
              Customers can ask you to delete their review at any time; delete it from the Reviews
              page and it is removed from the database.
            </p>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold">Recent moderation log</h3>
            {audit.length ? (
              <ul className="mt-2 divide-y divide-line">
                {audit.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 py-1.5 text-[11px]">
                    <span className="font-medium">{entry.action.replace(/_/g, " ")}</span>
                    <span className="text-muted">{formatDate(entry.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">Nothing logged yet.</p>
            )}
          </div>
        </div>
      </section>

      <section>
        <SectionHeading title="Danger zone" />
        <div className="card border-danger/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-danger">
                <AlertTriangle size={14} /> Delete this account
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted">
                Removes your business, customers, requests, reviews and replies permanently. Export
                anything you need first — there is no undo.
              </p>
            </div>
            <details>
              <summary className="btn btn-danger list-none text-xs">
                <Trash2 size={13} /> Delete account
              </summary>
              <form action={deleteAccountAction} className="mt-2 space-y-2">
                <label className="label text-[11px]" htmlFor="confirm">
                  Type DELETE to confirm
                </label>
                <input id="confirm" name="confirm" className="input py-1.5 text-xs" placeholder="DELETE" />
                <button type="submit" className="btn btn-danger w-full text-xs">
                  Permanently delete
                </button>
              </form>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Content;
