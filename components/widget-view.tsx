import type { CSSProperties } from "react";
import { BadgeCheck, Quote, Star } from "lucide-react";
import type { MarketingReview, WidgetConfig } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface WidgetSpace {
  name: string;
  slug: string;
  brand_color: string;
}

interface WidgetStats {
  avgRating: number;
  count: number;
  verifiedPct: number;
}

function palette(theme: WidgetConfig["theme"], accent: string) {
  if (theme === "dark") {
    return {
      bg: "#0f172a",
      card: "#16203a",
      border: "#26324f",
      text: "#e8eefc",
      muted: "#9aa9c4",
      reply: "#111a2b",
      shadow: "none",
      accent,
    };
  }
  return {
    bg: "transparent",
    card: "#ffffff",
    border: "#e7ecf3",
    text: "#0f172a",
    muted: "#64748b",
    reply: "#f8fafc",
    shadow: "0 1px 2px rgba(15,23,42,0.05), 0 10px 28px -18px rgba(15,23,42,0.25)",
    accent,
  };
}

export function WidgetStars({ rating, size = 14, color = "#F5A623" }: { rating: number; size?: number; color?: string }) {
  return (
    <span role="img" aria-label={`${rating} out of 5`} style={{ display: "inline-flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((index) => (
        <Star
          key={index}
          size={size}
          strokeWidth={2}
          style={{
            fill: index <= Math.round(rating) ? color : "transparent",
            color: index <= Math.round(rating) ? color : "#cbd5e1",
          }}
        />
      ))}
    </span>
  );
}

function ReviewCard({
  review,
  config,
  theme,
}: {
  review: MarketingReview;
  config: WidgetConfig;
  theme: ReturnType<typeof palette>;
}) {
  return (
    <figure
      style={{
        margin: 0,
        background: theme.card,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: 16,
        boxShadow: theme.shadow,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        height: "100%",
        breakInside: "avoid",
      }}
    >
      <WidgetStars rating={review.rating} color="#F5A623" />
      {review.body ? (
        <blockquote
          style={{
            margin: 0,
            fontSize: 14,
            lineHeight: 1.55,
            color: theme.text,
            display: "-webkit-box",
            WebkitLineClamp: 6,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {review.body}
        </blockquote>
      ) : null}
      <figcaption style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            display: "grid",
            placeItems: "center",
            background: `${config.accent}1a`,
            color: config.accent,
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
          aria-hidden
        >
          {review.name.slice(0, 1).toUpperCase()}
        </span>
        <span style={{ minWidth: 0 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600, color: theme.text }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{review.name}</span>
            {config.showVerified && review.verified ? (
              <BadgeCheck size={14} aria-label="Verified customer" style={{ color: config.accent, flexShrink: 0 }} />
            ) : null}
          </span>
          <span style={{ display: "block", fontSize: 11, color: theme.muted }}>
            {review.role ? `${review.role} · ` : ""}
            {config.showDates ? formatDate(review.created_at) : "Verified customer"}
          </span>
        </span>
      </figcaption>
      {config.showReplies && review.reply ? (
        <div
          style={{
            background: theme.reply,
            border: `1px solid ${theme.border}`,
            borderRadius: 10,
            padding: "8px 10px",
            fontSize: 12,
            lineHeight: 1.5,
            color: theme.muted,
          }}
        >
          <strong style={{ color: config.accent }}>Owner replied:</strong> {review.reply}
        </div>
      ) : null}
    </figure>
  );
}

export function WidgetView({
  config,
  reviews,
  stats,
}: {
  space: WidgetSpace;
  config: WidgetConfig;
  reviews: MarketingReview[];
  stats: WidgetStats;
}) {
  const theme = palette(config.theme, config.accent);
  const wrapper: CSSProperties = {
    background: theme.bg,
    color: theme.text,
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    containerType: "inline-size",
  };

  if (config.layout === "badge") {
    return (
      <div style={wrapper}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${theme.border}`,
            background: theme.card,
            borderRadius: 999,
            padding: "8px 14px",
            boxShadow: theme.shadow,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <WidgetStars rating={stats.avgRating || 5} color="#F5A623" size={13} />
          <span>
            {stats.avgRating.toFixed(1)} · {stats.count} review{stats.count === 1 ? "" : "s"}
          </span>
          {config.showVerified ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: config.accent }}>
              <BadgeCheck size={14} /> verified
            </span>
          ) : null}
        </span>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div style={wrapper}>
        <div
          style={{
            border: `1px dashed ${theme.border}`,
            borderRadius: 14,
            padding: 24,
            textAlign: "center",
            color: theme.muted,
            fontSize: 13,
          }}
        >
          Your approved reviews will appear here.
        </div>
      </div>
    );
  }

  if (config.layout === "list") {
    return (
      <div style={wrapper}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "120px 1fr",
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: 14,
                boxShadow: theme.shadow,
              }}
            >
              <div>
                <WidgetStars rating={review.rating} />
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{review.name}</div>
                {config.showVerified && review.verified ? (
                  <div style={{ fontSize: 11, color: config.accent, display: "flex", alignItems: "center", gap: 3 }}>
                    <BadgeCheck size={12} /> Verified
                  </div>
                ) : null}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.55, color: theme.text }}>
                {review.body || "Rated without a comment."}
                {config.showReplies && review.reply ? (
                  <div style={{ marginTop: 6, fontSize: 12, color: theme.muted }}>
                    <strong style={{ color: config.accent }}>Reply:</strong> {review.reply}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (config.layout === "carousel") {
    return (
      <div style={wrapper}>
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            paddingBottom: 4,
          }}
        >
          {reviews.map((review) => (
            <div key={review.id} style={{ flex: "0 0 260px", scrollSnapAlign: "start" }}>
              <ReviewCard review={review} config={config} theme={theme} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={wrapper}>
      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        }}
      >
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} config={config} theme={theme} />
        ))}
      </div>
      {config.branded ? (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 4,
            fontSize: 11,
            color: theme.muted,
          }}
        >
          <Quote size={11} /> Powered by Proofly
        </div>
      ) : null}
    </div>
  );
}
