"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireViewer } from "../../lib/server/auth";
import { createSpace, getSpaceById, logAudit, slugTaken, updateSpace } from "../../lib/server/queries";
import { DEFAULT_WIDGET_CONFIG, type WidgetConfig } from "../../lib/types";
import { slugify } from "../../lib/utils";

export interface SpaceState {
  error?: string;
  success?: string;
}

const RESERVED = ["app", "api", "admin", "r", "login", "signup", "www", "help", "support", "widget"];
const HEX = /^#[0-9a-fA-F]{6}$/;

export async function createSpaceAction(_prev: SpaceState, formData: FormData): Promise<SpaceState> {
  const viewer = await requireViewer();
  if (viewer.space) redirect("/app");

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const category = String(formData.get("category") ?? "").trim().slice(0, 40) || "Business";
  const brandColor = String(formData.get("brand_color") ?? "#0A7C66");
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (name.length < 2) return { error: "Add your business name." };
  if (slug.length < 3) return { error: "Choose a link of at least 3 characters (a–z, 0–9, dash)." };
  if (RESERVED.includes(slug)) return { error: "That link is reserved. Try another one." };
  if (slugTaken(slug)) return { error: "That link is taken. Try another one." };
  if (!HEX.test(brandColor)) return { error: "Brand colour must be a hex value like #0A7C66." };

  createSpace({ ownerId: viewer.user.id, name, slug, category, brandColor });
  revalidatePath("/app", "layout");
  redirect("/app");
}

export async function updateSpaceAction(_prev: SpaceState, formData: FormData): Promise<SpaceState> {
  const viewer = await requireViewer();
  if (!viewer.space) return { error: "Create your business first." };
  const space = getSpaceById(viewer.space.id)!;

  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const category = String(formData.get("category") ?? "").trim().slice(0, 40) || "Business";
  const brandColor = String(formData.get("brand_color") ?? space.brand_color);
  const slug = slugify(String(formData.get("slug") ?? space.slug));
  const verificationMode = String(formData.get("verification_mode") ?? space.verification_mode);
  const googleUrl = String(formData.get("google_review_url") ?? "").trim();
  const logoUrl = String(formData.get("logo_url") ?? "").trim();
  const autoApprove = formData.get("auto_approve") === "on" ? 1 : 0;

  if (name.length < 2) return { error: "Add your business name." };
  if (slug.length < 3) return { error: "Link must be at least 3 characters." };
  if (RESERVED.includes(slug)) return { error: "That link is reserved. Try another one." };
  if (slugTaken(slug, space.id)) return { error: "That link is already used by another business." };
  if (!HEX.test(brandColor)) return { error: "Brand colour must be a hex value like #0A7C66." };
  if (!["link_only", "otp_or_link", "open"].includes(verificationMode)) {
    return { error: "Pick a valid verification mode." };
  }
  if (googleUrl && !/^https?:\/\//.test(googleUrl)) {
    return { error: "Google review link must start with http:// or https://." };
  }
  if (logoUrl && !/^https?:\/\//.test(logoUrl) && !logoUrl.startsWith("data:image/")) {
    return { error: "Logo must be an image URL or an uploaded file." };
  }
  if (autoApprove && space.plan !== "pro") {
    return { error: "Auto-approve is a Pro feature. Upgrade first." };
  }

  updateSpace(space.id, {
    name,
    category,
    brand_color: brandColor,
    slug,
    verification_mode: verificationMode,
    google_review_url: googleUrl || null,
    logo_url: logoUrl || null,
    auto_approve: autoApprove,
  });
  logAudit(space.id, viewer.user.id, "space_updated", space.id, null);
  revalidatePath("/app", "layout");
  return { success: "Business details saved." };
}

export async function updateWidgetAction(_prev: SpaceState, formData: FormData): Promise<SpaceState> {
  const viewer = await requireViewer();
  if (!viewer.space) return { error: "Create your business first." };
  const space = viewer.space;

  let parsed: Partial<WidgetConfig> = {};
  try {
    parsed = JSON.parse(String(formData.get("config") ?? "{}")) as Partial<WidgetConfig>;
  } catch {
    return { error: "Could not read the widget settings." };
  }

  const layouts = ["wall", "carousel", "badge", "list"];
  const themes = ["light", "dark", "auto"];
  const config: WidgetConfig = {
    ...DEFAULT_WIDGET_CONFIG,
    ...space.widget_config,
    layout: layouts.includes(parsed.layout ?? "") ? parsed.layout! : space.widget_config.layout,
    theme: themes.includes(parsed.theme ?? "") ? parsed.theme! : space.widget_config.theme,
    accent: HEX.test(parsed.accent ?? "") ? parsed.accent! : space.widget_config.accent,
    maxReviews: Math.min(50, Math.max(1, Number(parsed.maxReviews ?? space.widget_config.maxReviews) || 6)),
    showVerified: Boolean(parsed.showVerified ?? space.widget_config.showVerified),
    showDates: Boolean(parsed.showDates ?? space.widget_config.showDates),
    showReplies: Boolean(parsed.showReplies ?? space.widget_config.showReplies),
    minRating: Math.min(5, Math.max(1, Number(parsed.minRating ?? space.widget_config.minRating) || 1)),
    jsonLd: Boolean(parsed.jsonLd ?? space.widget_config.jsonLd),
    branded: space.plan === "pro" ? Boolean(parsed.branded ?? space.widget_config.branded) : true,
  };

  updateSpace(space.id, { widget_config: JSON.stringify(config) });
  revalidatePath("/app", "layout");
  return { success: "Widget design saved." };
}

export async function setPlanAction(formData: FormData) {
  const viewer = await requireViewer();
  if (!viewer.space) redirect("/app/setup");
  const plan = String(formData.get("plan") ?? "free") === "pro" ? "pro" : "free";
  updateSpace(viewer.space.id, { plan, auto_approve: plan === "pro" ? viewer.space.auto_approve : 0 });
  logAudit(viewer.space.id, viewer.user.id, "plan_changed", plan, null);
  revalidatePath("/app", "layout");
  redirect("/app/settings?plan=updated");
}
