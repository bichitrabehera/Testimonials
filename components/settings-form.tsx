"use client";

import { useActionState, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Save, X } from "lucide-react";
import { updateSpaceAction, type SpaceState } from "@/app/actions/space";
import type { VerificationMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES: Array<{ id: VerificationMode; label: string; body: string }> = [
  {
    id: "otp_or_link",
    label: "Link or OTP",
    body: "Personal links verify automatically; everyone else can confirm by phone. Recommended.",
  },
  {
    id: "link_only",
    label: "Personal links only",
    body: "Strictest. Reviews count as verified only when the phone matches a customer you added.",
  },
  {
    id: "open",
    label: "Open",
    body: "Anyone can submit without verification. Reviews show without the verified badge.",
  },
];

async function resize(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const scale = Math.max(size / bitmap.width, size / bitmap.height);
  const width = bitmap.width * scale;
  const height = bitmap.height * scale;
  context.drawImage(bitmap, (size - width) / 2, (size - height) / 2, width, height);
  return canvas.toDataURL("image/png");
}

export function SettingsForm({
  space,
  plan,
}: {
  space: {
    name: string;
    slug: string;
    category: string;
    brand_color: string;
    logo_url: string | null;
    google_review_url: string | null;
    verification_mode: VerificationMode;
    auto_approve: boolean;
  };
  plan: string;
}) {
  const [state, action, pending] = useActionState<SpaceState, FormData>(updateSpaceAction, {});
  const [logo, setLogo] = useState<string | null>(space.logo_url);
  const [color, setColor] = useState(space.brand_color);
  const [mode, setMode] = useState<VerificationMode>(space.verification_mode);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <form action={action} className="card space-y-5 p-4 sm:p-5">
      <input type="hidden" name="logo_url" value={logo ?? ""} />
      <input type="hidden" name="brand_color" value={color} />
      <input type="hidden" name="verification_mode" value={mode} />

      <div>
        <span className="label">Logo</span>
        <div className="flex items-center gap-3">
          <span
            className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl text-sm font-bold text-white"
            style={{ background: color }}
          >
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logo} alt="" className="size-full object-cover" />
            ) : (
              space.name.slice(0, 2).toUpperCase()
            )}
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <ImagePlus size={13} /> Upload image
            </button>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="btn btn-ghost px-3 py-1.5 text-xs"
              >
                <X size={13} /> Remove
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  alert("Please choose an image under 2 MB.");
                  return;
                }
                setLogo(await resize(file));
              }}
            />
          </div>
        </div>
        <p className="hint mt-1.5">Square images look best. Stored as a small 128px PNG.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="business-name">
            Business name
          </label>
          <input id="business-name" name="name" defaultValue={space.name} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="business-category">
            Category
          </label>
          <input id="business-category" name="category" defaultValue={space.category} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="business-slug">
            Review link
          </label>
          <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-brand">
            <span className="pl-3 text-sm text-muted">/r/</span>
            <input
              id="business-slug"
              name="slug"
              defaultValue={space.slug}
              required
              className="w-full rounded-lg bg-transparent px-1.5 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
        <div>
          <span className="label">Brand colour</span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="size-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5"
              aria-label="Brand colour"
            />
            <span className="text-xs text-muted">{color.toUpperCase()}</span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="google-url">
            Google review link <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="google-url"
            name="google_review_url"
            defaultValue={space.google_review_url ?? ""}
            placeholder="https://g.page/r/your-business/review"
            className="input"
          />
          <p className="hint mt-1">Shown as “Also post on Google” after a customer submits.</p>
        </div>
      </div>

      <div>
        <span className="label">How reviews get verified</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMode(option.id)}
              aria-pressed={mode === option.id}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                mode === option.id ? "border-brand bg-brand-soft/50" : "border-line hover:bg-surface-2",
              )}
            >
              <span className="flex items-center justify-between text-[13px] font-semibold">
                {option.label}
                {mode === option.id && <Check size={13} className="text-brand" />}
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-muted">{option.body}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-start gap-2.5 rounded-lg border border-line bg-surface-2/50 p-3">
        <input
          type="checkbox"
          name="auto_approve"
          defaultChecked={space.auto_approve}
          disabled={plan !== "pro"}
          className="mt-0.5 size-4 accent-[var(--brand)]"
        />
        <span className="text-xs leading-relaxed">
          <span className="font-medium">Auto-approve verified 4–5 star reviews</span>
          <span className="block text-muted">
            {plan === "pro"
              ? "Everything else still waits for you."
              : "Pro feature — upgrade in the plan section below."}
          </span>
        </span>
      </label>

      {state.error && (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-success/30 bg-success/5 px-3 py-2 text-sm font-medium text-success">
          {state.success}
        </p>
      )}

      <div className="flex justify-end border-t border-line pt-4">
        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
