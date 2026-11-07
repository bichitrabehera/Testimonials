import { NextResponse } from "next/server";
import { getReview } from "@/lib/server/queries";
import { run } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const reviewId = String(payload.review_id ?? "");
  const message = String(payload.message ?? "").trim().slice(0, 1000);

  if (message.length < 3) {
    return NextResponse.json({ error: "Please write a little more." }, { status: 400 });
  }
  const review = getReview(reviewId);
  if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

  const ip = (request.headers.get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const limited = rateLimit(`feedback:${ip}`, 6, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many messages. Try again later." }, { status: 429 });
  }

  run("UPDATE reviews SET private_feedback = ? WHERE id = ?", message, reviewId);
  return NextResponse.json({ ok: true });
}
