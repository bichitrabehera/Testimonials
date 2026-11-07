"use server";

import { revalidatePath } from "next/cache";
import { requireSpace } from "../../lib/server/auth";
import { deleteReply, getReview, listReviews, logAudit, saveReply, setReviewStatus } from "../../lib/server/queries";

function refresh() {
  revalidatePath("/app", "layout");
}

export async function moderateReviewAction(formData: FormData) {
  const { user, space } = await requireSpace();
  const reviewId = String(formData.get("review_id") ?? "");
  const status = String(formData.get("status") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!["approved", "hidden", "pending"].includes(status)) return;
  if (status === "hidden" && !reason) return;

  setReviewStatus(space.id, reviewId, status as "approved" | "hidden" | "pending", reason, user.id);
  refresh();
}

export async function approveAllPendingAction() {
  const { user, space } = await requireSpace();
  const pending = listReviews(space.id, { status: "pending", limit: 500 });
  for (const review of pending) {
    setReviewStatus(space.id, review.id, "approved", null, user.id);
  }
  refresh();
}

export async function bulkApproveAction(formData: FormData) {
  const { user, space } = await requireSpace();
  const ids = formData.getAll("review_id").map(String);
  for (const reviewId of ids) {
    const review = getReview(reviewId);
    if (review && review.space_id === space.id) {
      setReviewStatus(space.id, reviewId, "approved", null, user.id);
    }
  }
  refresh();
}

export async function replyAction(formData: FormData) {
  const { user, space } = await requireSpace();
  if (space.plan !== "pro") return;
  const reviewId = String(formData.get("review_id") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 500);
  const review = getReview(reviewId);
  if (!review || review.space_id !== space.id || body.length < 2) return;
  saveReply(reviewId, body);
  logAudit(space.id, user.id, "reply_saved", reviewId, null);
  refresh();
}

export async function deleteReplyAction(formData: FormData) {
  const { space } = await requireSpace();
  const reviewId = String(formData.get("review_id") ?? "");
  const review = getReview(reviewId);
  if (!review || review.space_id !== space.id) return;
  deleteReply(reviewId);
  refresh();
}
