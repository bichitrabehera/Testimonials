import { headers } from "next/headers";
import Link from "next/link";
import { Code2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { WidgetDesigner } from "@/components/widget-designer";
import { requireSpace } from "@/lib/server/auth";
import { publicReviews, toMarketing } from "@/lib/server/queries";

async function Content() {
  const { space } = await requireSpace();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const data = publicReviews(space.slug, 50);
  const reviews = data ? toMarketing(data.reviews) : [];

  return (
    <div>
      <PageHeader
        title="Widget"
        description="Design it, preview it, paste one snippet. Reviews update on their own every minute."
        actions={
          <Link href={`/r/${space.slug}`} target="_blank" className="btn btn-secondary">
            <ExternalLink size={14} /> View review page
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-xs text-muted">
        <Code2 size={14} className="text-brand" />
        Showing {reviews.length} approved review{reviews.length === 1 ? "" : "s"} from{" "}
        {data?.stats.count ?? 0} total.
        {space.plan === "free" && (
          <span className="badge border-warning/30 bg-warning/10 text-warning">
            Free plan displays the latest 15
          </span>
        )}
        {!reviews.length && (
          <Link href="/app/reviews" className="font-medium text-brand hover:underline">
            Approve a review first →
          </Link>
        )}
      </div>

      <WidgetDesigner
        config={space.widget_config}
        reviews={reviews}
        stats={data?.stats ?? { avgRating: 0, count: 0, verifiedPct: 0 }}
        space={{
          name: space.name,
          slug: space.slug,
          brand_color: space.brand_color,
          plan: space.plan,
        }}
        origin={origin}
        plan={space.plan}
      />
    </div>
  );
}

export default Content;
