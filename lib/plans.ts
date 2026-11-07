import type { Plan, Space } from "./types";

export interface PlanDefinition {
  id: Plan;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  tagline: string;
  features: string[];
  limits: {
    displayedReviews: number;
    removeBranding: boolean;
    replies: boolean;
    csvExport: boolean;
    autoApprove: boolean;
  };
}

export const PLANS: Record<Plan, PlanDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Collect your first reviews and prove the value.",
    features: [
      "1 review space",
      "15 reviews displayed on your site",
      "Verified customer badges",
      "\u201cPowered by Proofly\u201d on the widget",
      "WhatsApp review requests",
    ],
    limits: {
      displayedReviews: 15,
      removeBranding: false,
      replies: false,
      csvExport: false,
      autoApprove: false,
    },
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 499,
    priceYearly: 4999,
    tagline: "Everything you need to turn happy customers into your best salespeople.",
    features: [
      "Unlimited reviews displayed",
      "Remove Proofly branding",
      "Reply to reviews publicly",
      "CSV import and export",
      "Auto-approve verified 4\u20135 star reviews",
      "Carousel, badge and list layouts",
    ],
    limits: {
      displayedReviews: 100000,
      removeBranding: true,
      replies: true,
      csvExport: true,
      autoApprove: true,
    },
  },
};

export function planLimits(space: Space) {
  return PLANS[space.plan].limits;
}

export function formatInr(value: number) {
  return `\u20b9${value.toLocaleString("en-IN")}`;
}
