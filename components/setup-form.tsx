"use client";

import { useActionState, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { createSpaceAction, type SpaceState } from "@/app/actions/space";
import { slugify } from "@/lib/utils";

const CATEGORIES = [
  "Dental clinic",
  "Salon & spa",
  "Tutoring",
  "Repair shop",
  "Restaurant",
  "Retail store",
  "Gym & fitness",
  "Other",
];

const COLORS = ["#0A7C66", "#1D4ED8", "#B91C1C", "#7C3AED", "#D97706", "#0F172A"];

export function SetupForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState<SpaceState, FormData>(createSpaceAction, {});
  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [color, setColor] = useState(COLORS[0]);

  return (
    <form action={action} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="name">
            Business name
          </label>
          <input
            id="name"
            name="name"
            required
            className="input"
            placeholder="Smile Dental"
            value={businessName}
            onChange={(event) => {
              setBusinessName(event.target.value);
              if (!slugEdited) setSlug(slugify(event.target.value));
            }}
          />
        </div>

        <div>
          <label className="label" htmlFor="category">
            Category
          </label>
          <select id="category" name="category" className="input" defaultValue="Dental clinic">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <p className="hint mt-1">Shown on your review page. You can change it later.</p>
        </div>

        <div>
          <label className="label" htmlFor="slug">
            Review link
          </label>
          <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-brand">
            <span className="pl-3 text-sm text-muted">/r/</span>
            <input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(slugify(event.target.value));
              }}
              className="w-full rounded-lg bg-transparent px-1.5 py-2.5 text-sm outline-none"
              placeholder="smile-dental"
            />
          </div>
          <p className="hint mt-1">Lowercase letters, numbers and dashes.</p>
        </div>

        <div className="sm:col-span-2">
          <span className="label">Brand colour</span>
          <div className="flex flex-wrap items-center gap-2">
            {COLORS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setColor(option)}
                aria-label={`Use colour ${option}`}
                aria-pressed={color === option}
                className="size-8 rounded-full border-2 transition-transform hover:scale-105"
                style={{
                  background: option,
                  borderColor: color === option ? "var(--text)" : "transparent",
                }}
              />
            ))}
            <input
              type="color"
              aria-label="Custom brand colour"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="size-8 cursor-pointer rounded-full border border-line bg-transparent p-0.5"
            />
            <span className="text-xs text-muted">{color.toUpperCase()}</span>
          </div>
          <input type="hidden" name="brand_color" value={color} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          Signed in as <span className="font-medium text-ink">{name}</span>
        </p>
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 size={15} className="animate-spin" /> : null}
          {pending ? "Creating…" : "Create business"}
          {!pending && <ArrowRight size={15} />}
        </button>
      </div>
    </form>
  );
}
