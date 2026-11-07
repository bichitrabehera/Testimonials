import Link from "next/link";
import { CheckCheck, MessageSquareText, Star } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";
import { ReviewItem } from "@/components/review-item";
import { requireSpace } from "@/lib/server/auth";
import { countReviews, listReviews } from "@/lib/server/queries";
import { approveAllPendingAction } from "@/app/actions/reviews";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "hidden", label: "Hidden" },
];

async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { space } = await requireSpace();
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "all";
  const ratingParam = Number(params.rating);
  const rating = Number.isInteger(ratingParam) && ratingParam >= 1 && ratingParam <= 5 ? ratingParam : undefined;
  const verified = params.verified === "1" ? true : params.verified === "0" ? false : undefined;

  const reviews = listReviews(space.id, { status, rating, verified, limit: 100 });
  const counts = {
    all: countReviews(space.id),
    pending: countReviews(space.id, "pending"),
    approved: countReviews(space.id, "approved"),
    hidden: countReviews(space.id, "hidden"),
  };
  const pro = space.plan === "pro";

  function filterHref(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams();
    const base: Record<string, string | undefined> = {
      status: status === "all" ? undefined : status,
      rating: rating ? String(rating) : undefined,
      verified: params.verified as string | undefined,
      ...patch,
    };
    for (const [key, value] of Object.entries(base)) if (value) next.set(key, value);
    const query = next.toString();
    return `/app/reviews${query ? `?${query}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="Approve what you want shown. Hiding a review keeps a logged reason — nothing is deleted."
        actions={
          counts.pending > 0 ? (
            <form action={approveAllPendingAction}>
              <button type="submit" className="btn btn-primary">
                <CheckCheck size={15} /> Approve all {counts.pending}
              </button>
            </form>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-line bg-surface p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.key}
              href={`/app/reviews${tab.key === "all" ? "" : `?status=${tab.key}`}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                status === tab.key ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[10px] text-muted">
                {counts[tab.key as keyof typeof counts]}
              </span>
            </Link>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {[5, 4, 3, 2, 1].map((value) => (
            <Link
              key={value}
              href={filterHref({ rating: rating === value ? undefined : String(value) })}
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium",
                rating === value
                  ? "border-amber/40 bg-amber/10 text-ink"
                  : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              {value} <Star size={10} className="fill-amber text-amber" />
            </Link>
          ))}
          <Link
            href={filterHref({ verified: verified ? undefined : "1" })}
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-medium",
              verified ? "border-brand/40 bg-brand-soft text-brand-strong" : "border-line bg-surface text-muted hover:text-ink",
            )}
          >
            Verified only
          </Link>
        </div>
      </div>

      {reviews.length ? (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} pro={pro} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<MessageSquareText size={18} />}
          title="Nothing here yet"
          body={
            status === "pending"
              ? "New reviews land here for approval. Send a request to get the first one."
              : "No reviews match these filters."
          }
        >
          <Link href="/app/requests" className="btn btn-primary">
            Send a request
          </Link>
          {status !== "all" && (
            <Link href="/app/reviews" className="btn btn-secondary">
              Clear filters
            </Link>
          )}
        </EmptyState>
      )}
    </div>
  );
}

export default Content;
