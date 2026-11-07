import { NextResponse } from "next/server";
import { publicReviews, logEvent } from "@/lib/server/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const limitParam = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 20;

  const data = publicReviews(slug, limit);
  if (!data) {
    return NextResponse.json({ error: "Space not found" }, { status: 404 });
  }

  if (url.searchParams.get("track") !== "0") {
    logEvent(data.space.id, "widget_load");
  }

  const payload = {
    space: {
      name: data.space.name,
      slug: data.space.slug,
      logo_url: data.space.logo_url,
      brand_color: data.space.brand_color,
      category: data.space.category,
      plan: data.space.plan,
      avg_rating: data.stats.avgRating,
      count: data.stats.count,
      verified_pct: data.stats.verifiedPct,
    },
    config: {
      layout: data.space.widget_config.layout,
      theme: data.space.widget_config.theme,
      accent: data.space.widget_config.accent,
      max_reviews: data.space.widget_config.maxReviews,
      show_verified: data.space.widget_config.showVerified,
      show_dates: data.space.widget_config.showDates,
      show_replies: data.space.widget_config.showReplies,
      min_rating: data.space.widget_config.minRating,
      branded: data.space.widget_config.branded && data.space.plan !== "pro" ? true : data.space.widget_config.branded,
      truncated: data.truncated,
    },
    reviews: data.reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      body: review.body,
      name: review.reviewer_name,
      role: review.reviewer_role,
      verified: Boolean(review.verified),
      created_at: review.created_at,
      reply: review.reply,
    })),
    next_cursor: null,
  };

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
