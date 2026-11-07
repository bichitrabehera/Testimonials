"use client";

import { useActionState, useState } from "react";
import {
  AlignLeft,
  BadgeCheck,
  Check,
  Copy,
  GalleryHorizontal,
  Grid2x2,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Tag,
} from "lucide-react";
import { WidgetView } from "./widget-view";
import { updateWidgetAction, type SpaceState } from "@/app/actions/space";
import type { MarketingReview, WidgetConfig } from "@/lib/types";
import { cn } from "@/lib/utils";

const LAYOUTS = [
  { id: "wall", label: "Wall", icon: Grid2x2, hint: "Masonry grid" },
  { id: "carousel", label: "Carousel", icon: GalleryHorizontal, hint: "Swipe row" },
  { id: "badge", label: "Badge", icon: BadgeCheck, hint: "Compact pill" },
  { id: "list", label: "List", icon: AlignLeft, hint: "Stacked rows" },
] as const;

const THEMES = [
  { id: "auto", label: "Auto" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
] as const;

const ACCENTS = ["#0A7C66", "#1D4ED8", "#7C3AED", "#B45309", "#0F172A"];

function Toggle({
  label,
  hint,
  checked,
  onChange,
  locked,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  locked?: boolean;
}) {
  return (
    <label className={cn("flex items-start justify-between gap-3 py-2", locked && "opacity-60")}>
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        {hint && <span className="block text-[11px] text-muted">{hint}</span>}
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={locked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]"
      />
    </label>
  );
}

export function WidgetDesigner({
  config,
  reviews,
  stats,
  space,
  origin,
  plan,
}: {
  config: WidgetConfig;
  reviews: MarketingReview[];
  stats: { avgRating: number; count: number; verifiedPct: number };
  space: { name: string; slug: string; brand_color: string; plan: string };
  origin: string;
  plan: string;
}) {
  const [draft, setDraft] = useState<WidgetConfig>(config);
  const [state, action, pending] = useActionState<SpaceState, FormData>(updateWidgetAction, {});
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [copied, setCopied] = useState(false);

  const snippet = `<div id="proofly"></div>\n<script async src="${origin}/w.js"\n  data-space="${space.slug}"\n  data-layout="${draft.layout}"\n  data-theme="${draft.theme}"\n  data-max="${draft.maxReviews}"></script>`;

  function patch(next: Partial<WidgetConfig>) {
    setDraft((current) => ({ ...current, ...next }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <form action={action} className="space-y-4">
        <input type="hidden" name="config" value={JSON.stringify(draft)} />

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Layout</h2>
          <div className="mt-2.5 grid grid-cols-2 gap-1.5">
            {LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() => patch({ layout: layout.id })}
                aria-pressed={draft.layout === layout.id}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-2.5 text-left transition-colors",
                  draft.layout === layout.id
                    ? "border-brand bg-brand-soft text-brand-strong"
                    : "border-line hover:bg-surface-2",
                )}
              >
                <layout.icon size={15} />
                <span className="text-[12px] font-medium">{layout.label}</span>
                <span className="text-[10px] opacity-70">{layout.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="card space-y-3 p-4">
          <h2 className="text-sm font-semibold">Appearance</h2>
          <div>
            <span className="label text-[11px]">Theme</span>
            <div className="grid grid-cols-3 gap-1 rounded-lg border border-line bg-surface-2 p-1">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => patch({ theme: theme.id })}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    draft.theme === theme.id ? "bg-surface text-ink shadow-sm" : "text-muted",
                  )}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="label text-[11px]">Accent</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {ACCENTS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Accent ${color}`}
                  onClick={() => patch({ accent: color })}
                  className="size-6 rounded-full border-2"
                  style={{
                    background: color,
                    borderColor: draft.accent === color ? "var(--text)" : "transparent",
                  }}
                />
              ))}
              <input
                type="color"
                aria-label="Custom accent"
                value={draft.accent}
                onChange={(event) => patch({ accent: event.target.value })}
                className="size-6 cursor-pointer rounded-full border border-line bg-transparent p-0.5"
              />
            </div>
          </div>

          <div>
            <label className="label text-[11px]" htmlFor="max-reviews">
              Reviews shown: {draft.maxReviews}
            </label>
            <input
              id="max-reviews"
              type="range"
              min={1}
              max={20}
              value={draft.maxReviews}
              onChange={(event) => patch({ maxReviews: Number(event.target.value) })}
              className="w-full accent-[var(--brand)]"
            />
          </div>

          <div>
            <label className="label text-[11px]" htmlFor="min-rating">
              Show only ratings of
            </label>
            <select
              id="min-rating"
              value={draft.minRating}
              onChange={(event) => patch({ minRating: Number(event.target.value) })}
              className="input py-1.5 text-xs"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} star{value === 1 ? "" : "s"} and above
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="card divide-y divide-line px-4 py-1">
          <Toggle
            label="Verified badge"
            hint="Shows a check on verified reviews"
            checked={draft.showVerified}
            onChange={(value) => patch({ showVerified: value })}
          />
          <Toggle
            label="Show dates"
            checked={draft.showDates}
            onChange={(value) => patch({ showDates: value })}
          />
          <Toggle
            label="Show your replies"
            checked={draft.showReplies}
            onChange={(value) => patch({ showReplies: value })}
          />
          <Toggle
            label="Structured data (SEO)"
            hint="Adds JSON-LD with aggregate rating"
            checked={draft.jsonLd}
            onChange={(value) => patch({ jsonLd: value })}
          />
          <Toggle
            label="“Powered by Proofly”"
            hint={plan === "pro" ? "Turn off to remove branding" : "Available on Pro"}
            checked={draft.branded}
            locked={plan !== "pro"}
            onChange={(value) => patch({ branded: value })}
          />
        </div>

        <div className="flex items-center gap-2">
          <button type="submit" disabled={pending} className="btn btn-primary flex-1">
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {pending ? "Saving…" : "Save design"}
          </button>
        </div>
        {state.error && <p className="text-xs font-medium text-danger">{state.error}</p>}
        {state.success && (
          <p className="text-xs font-medium text-success">{state.success}</p>
        )}
      </form>

      <div className="space-y-4">
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Live preview</h2>
            <div className="flex gap-1 rounded-lg border border-line bg-surface-2 p-1">
              <button
                type="button"
                onClick={() => setDevice("desktop")}
                className={cn(
                  "grid size-6 place-items-center rounded",
                  device === "desktop" ? "bg-surface text-ink shadow-sm" : "text-muted",
                )}
                aria-label="Desktop preview"
              >
                <Monitor size={13} />
              </button>
              <button
                type="button"
                onClick={() => setDevice("mobile")}
                className={cn(
                  "grid size-6 place-items-center rounded",
                  device === "mobile" ? "bg-surface text-ink shadow-sm" : "text-muted",
                )}
                aria-label="Mobile preview"
              >
                <Smartphone size={13} />
              </button>
            </div>
          </div>
          <div
            className="mx-auto rounded-xl border border-line bg-surface-2/50 p-3 transition-[max-width]"
            style={{ maxWidth: device === "mobile" ? 380 : "100%" }}
          >
            <WidgetView space={space} config={draft} reviews={reviews} stats={stats} />
          </div>
          {reviews.length === 0 && (
            <p className="mt-2 text-center text-xs text-muted">
              Approve a review and it will show up in this preview.
            </p>
          )}
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold">Embed code</h2>
              <p className="text-xs text-muted">Paste this where the reviews should appear.</p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <pre className="mt-2.5 overflow-x-auto rounded-lg bg-[#0f172a] p-3 text-[11px] leading-relaxed text-slate-200">
            <code>{snippet}</code>
          </pre>
          <p className="mt-2 text-[11px] text-muted">
            The script stays under 10&nbsp;KB, loads async, and reserves its height so your page
            never jumps.
          </p>
        </div>

        <div className="card divide-y divide-line px-4">
          {[
            {
              title: "WordPress",
              body: "Appearance → Widgets → Custom HTML, or add a Custom HTML block in the page editor. Paste the snippet.",
            },
            {
              title: "Wix",
              body: "Add → Embed Code → Embed HTML, paste the snippet, then resize the element.",
            },
            {
              title: "Shopify",
              body: "Online Store → Pages → Add page, switch to HTML view (</>), paste the snippet, save.",
            },
            {
              title: "Plain HTML",
              body: "Paste the snippet where you want reviews. No build step, no dependencies.",
            },
          ].map((guide) => (
            <details key={guide.title} className="group py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[13px] font-medium">
                {guide.title}
                <span className="text-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{guide.body}</p>
            </details>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-xs text-muted">
          <Tag size={13} />
          JSON-LD {draft.jsonLd ? "is" : "is not"} injected. Google may show star ratings in search
          results when it is on.
        </div>
      </div>
    </div>
  );
}
