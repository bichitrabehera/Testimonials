import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/auth";
import { listReviews } from "@/lib/server/queries";

function cell(value: string | number | null) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const viewer = await getViewer();
  if (!viewer?.space) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (viewer.space.plan !== "pro") {
    return NextResponse.json({ error: "CSV export is a Pro feature." }, { status: 402 });
  }

  const reviews = listReviews(viewer.space.id, { limit: 5000 });
  const header = ["id", "created_at", "rating", "status", "verified", "name", "role", "review", "reply"];
  const lines = [header.join(",")];
  for (const review of reviews) {
    lines.push(
      [
        review.id,
        review.created_at,
        review.rating,
        review.status,
        review.verified ? "yes" : "no",
        review.reviewer_name,
        review.reviewer_role ?? "",
        review.body,
        review.reply ?? "",
      ]
        .map(cell)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="proofly-${viewer.space.slug}-reviews.csv"`,
    },
  });
}
