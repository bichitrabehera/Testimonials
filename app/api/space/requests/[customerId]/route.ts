import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/auth";
import { row } from "@/lib/server/db";
import { issueRequest } from "@/lib/server/queries";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const viewer = await getViewer();
  if (!viewer?.space) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { customerId } = await params;
  const customer = row<{ id: string; name: string; phone: string }>(
    "SELECT id, name, phone FROM customers WHERE id = ? AND space_id = ?",
    customerId,
    viewer.space.id,
  );
  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const token = issueRequest(viewer.space.id, customer.id);
  const origin = new URL(request.url).origin;
  return NextResponse.json({
    token,
    name: customer.name,
    phone: customer.phone,
    url: `${origin}/r/${viewer.space.slug}?t=${token}`,
  });
}
