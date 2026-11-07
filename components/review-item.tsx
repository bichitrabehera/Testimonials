import { BadgeCheck, EyeOff, Lock, MessageSquareQuote, ThumbsUp } from "lucide-react";
import type { Review } from "@/lib/types";
import { Stars } from "./stars";
import { cn, formatDate } from "@/lib/utils";
import { moderateReviewAction, replyAction, deleteReplyAction } from "@/app/actions/reviews";

const HIDE_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "abusive", label: "Abusive language" },
  { value: "not_a_customer", label: "Not a customer" },
  { value: "other", label: "Other (logged)" },
];

const STATUS_STYLES: Record<Review["status"], string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  approved: "border-success/30 bg-success/10 text-success",
  hidden: "border-line bg-surface-2 text-muted",
};

export function ReviewItem({ review, pro }: { review: Review; pro: boolean }) {
  return (
    <article className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-full bg-surface-2 text-xs font-semibold text-muted">
            {review.reviewer_name.slice(0, 1).toUpperCase()}
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-semibold">
              {review.reviewer_name}
              {review.verified ? (
                <BadgeCheck size={14} className="text-brand" aria-label="Verified customer" />
              ) : null}
            </p>
            <p className="text-[11px] text-muted">
              {review.reviewer_role ? `${review.reviewer_role} · ` : ""}
              {formatDate(review.created_at)}
              {review.verification_method ? ` · via ${review.verification_method}` : " · unverified"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Stars rating={review.rating} size={13} />
          <span className={cn("badge border", STATUS_STYLES[review.status])}>{review.status}</span>
        </div>
      </div>

      {review.body ? (
        <p className="mt-3 text-sm leading-relaxed">{review.body}</p>
      ) : (
        <p className="mt-3 text-sm italic text-muted">Rated without a comment.</p>
      )}

      {review.private_feedback ? (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warning">
            <Lock size={11} /> Private feedback — only you see this
          </p>
          <p className="mt-1 text-sm leading-relaxed">{review.private_feedback}</p>
        </div>
      ) : null}

      {review.reply ? (
        <div className="mt-3 rounded-lg border-l-2 border-brand/50 bg-surface-2/70 px-3 py-2">
          <p className="text-[11px] font-semibold text-brand">Your reply</p>
          <p className="mt-0.5 text-sm leading-relaxed">{review.reply}</p>
          <form action={deleteReplyAction} className="mt-1.5">
            <input type="hidden" name="review_id" value={review.id} />
            <button type="submit" className="text-[11px] font-medium text-muted hover:text-danger">
              Remove reply
            </button>
          </form>
        </div>
      ) : null}

      {review.status === "hidden" && review.hidden_reason ? (
        <p className="mt-3 text-[11px] text-muted">
          Hidden from the widget · reason logged: <span className="font-medium">{review.hidden_reason.replace(/_/g, " ")}</span>
        </p>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-3">
        {review.status !== "approved" && (
          <form action={moderateReviewAction}>
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="status" value="approved" />
            <button type="submit" className="btn btn-secondary px-2.5 py-1.5 text-xs">
              <ThumbsUp size={13} /> Approve
            </button>
          </form>
        )}

        {review.status !== "hidden" && (
          <details className="group relative">
            <summary className="btn btn-secondary list-none px-2.5 py-1.5 text-xs">
              <EyeOff size={13} /> Hide
            </summary>
            <form
              action={moderateReviewAction}
              className="mt-2 space-y-2 rounded-lg border border-line bg-surface p-3"
            >
              <input type="hidden" name="review_id" value={review.id} />
              <input type="hidden" name="status" value="hidden" />
              <label className="label text-[11px]" htmlFor={`reason-${review.id}`}>
                Reason (logged, never shown publicly)
              </label>
              <select id={`reason-${review.id}`} name="reason" className="input py-1.5 text-xs" required>
                {HIDE_REASONS.map((reason) => (
                  <option key={reason.value} value={reason.value}>
                    {reason.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn btn-danger w-full py-1.5 text-xs">
                Hide review
              </button>
            </form>
          </details>
        )}

        {review.status === "hidden" && (
          <form action={moderateReviewAction}>
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="status" value="pending" />
            <button type="submit" className="btn btn-ghost px-2.5 py-1.5 text-xs">
              Move to pending
            </button>
          </form>
        )}

        {pro ? (
          <details className="ml-auto">
            <summary className="btn btn-ghost list-none px-2.5 py-1.5 text-xs">
              <MessageSquareQuote size={13} /> {review.reply ? "Edit reply" : "Reply"}
            </summary>
            <form action={replyAction} className="mt-2 space-y-2">
              <input type="hidden" name="review_id" value={review.id} />
              <textarea
                name="body"
                rows={3}
                defaultValue={review.reply ?? ""}
                className="input resize-none text-sm"
                placeholder="Thank you for the feedback…"
                required
              />
              <button type="submit" className="btn btn-primary w-full py-1.5 text-xs">
                Save reply
              </button>
            </form>
          </details>
        ) : (
          <span className="ml-auto text-[11px] text-muted">Replies need Pro</span>
        )}
      </div>
    </article>
  );
}
