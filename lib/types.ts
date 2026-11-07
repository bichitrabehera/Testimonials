export type Plan = "free" | "pro";
export type ReviewStatus = "pending" | "approved" | "hidden";
export type VerificationMode = "link_only" | "otp_or_link" | "open";
export type WidgetLayout = "wall" | "carousel" | "badge" | "list";
export type WidgetTheme = "light" | "dark" | "auto";

export interface WidgetConfig {
  layout: WidgetLayout;
  theme: WidgetTheme;
  accent: string;
  maxReviews: number;
  showVerified: boolean;
  showDates: boolean;
  showReplies: boolean;
  minRating: number;
  jsonLd: boolean;
  branded: boolean;
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfig = {
  layout: "wall",
  theme: "auto",
  accent: "#0A7C66",
  maxReviews: 6,
  showVerified: true,
  showDates: true,
  showReplies: true,
  minRating: 1,
  jsonLd: false,
  branded: true,
};

export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface Space {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  brand_color: string;
  category: string;
  plan: Plan;
  verification_mode: VerificationMode;
  widget_config: WidgetConfig;
  google_review_url: string | null;
  auto_approve: 0 | 1;
  whatsapp_template: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  space_id: string;
  request_id: string | null;
  rating: number;
  body: string;
  reviewer_name: string;
  reviewer_role: string | null;
  photo_url: string | null;
  verified: 0 | 1;
  verification_method: string | null;
  status: ReviewStatus;
  hidden_reason: string | null;
  consent_display: 0 | 1;
  ip_hash: string | null;
  created_at: string;
  approved_at: string | null;
  reply: string | null;
  private_feedback: string | null;
}

export interface MarketingReview {
  id: string;
  rating: number;
  body: string;
  name: string;
  role: string | null;
  verified: boolean;
  created_at: string;
  reply: string | null;
}

export interface Customer {
  id: string;
  space_id: string;
  name: string;
  phone: string;
  order_ref: string | null;
  created_at: string;
}
