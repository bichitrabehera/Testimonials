import Link from "next/link";
import type { Metadata } from "next";
import { Clock, MessageSquareOff } from "lucide-react";
import { ReviewFlow } from "@/components/review-flow";
import { findRequestByToken, getSpaceBySlug, markRequestOpened } from "@/lib/server/queries";
import { Logo } from "@/components/logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const space = getSpaceBySlug(slug);
  return {
    title: space ? `Review ${space.name}` : "Review page",
    description: space
      ? `Share a quick, verified review of ${space.name}. It takes 20 seconds.`
      : undefined,
    robots: { index: false },
  };
}

function Notice({
  title,
  body,
  tone = "neutral",
}: {
  title: string;
  body: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-5 flex justify-center">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <div className="card p-7 text-center">
      <span
        className={
          tone === "warning"
            ? "mx-auto grid size-12 place-items-center rounded-full bg-warning/10 text-warning"
            : "mx-auto grid size-12 place-items-center rounded-full bg-surface-2 text-muted"
        }
      >
        {tone === "warning" ? <Clock size={22} /> : <MessageSquareOff size={22} />}
      </span>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{body}</p>
          <Link href="/" className="btn btn-secondary mt-5">
            Back to Proofly
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const space = getSpaceBySlug(slug);

  if (!space) {
    return (
      <Notice
        title="This review page does not exist"
        body="The link may be mistyped. Ask the business for a fresh review link."
      />
    );
  }

  const token = typeof query.t === "string" ? query.t : null;
  const request = token ? findRequestByToken(token) : null;
  const validRequest = request && request.space_id === space.id ? request : null;

  if (token && !validRequest) {
    return (
      <Notice
        title="This review link is not valid"
        body={`We could not match that link to ${space.name}. Ask them to send a fresh request.`}
        tone="warning"
      />
    );
  }

  if (validRequest && validRequest.status === "submitted") {
    return (
      <Notice
        title="You already reviewed us"
        body={`Thank you again — your review for ${space.name} has been received.`}
      />
    );
  }

  if (validRequest && validRequest.expired) {
    return (
      <Notice
        title="This link has expired"
        body="Review links stay valid for 14 days. Ask the business to send you a new one."
        tone="warning"
      />
    );
  }

  if (validRequest) markRequestOpened(validRequest.id, space.id);

  return (
    <ReviewFlow
      space={{
        name: space.name,
        slug: space.slug,
        brand_color: space.brand_color,
        category: space.category,
        logo_url: space.logo_url,
        google_review_url: space.google_review_url,
        verification_mode: space.verification_mode,
      }}
      customerName={validRequest?.name ?? null}
      token={token}
    />
  );
}
