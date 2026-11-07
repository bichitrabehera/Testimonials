import { NextResponse } from "next/server";
import { getSpaceBySlug, verifyOtp } from "@/lib/server/queries";
import { hashValue } from "@/lib/server/crypto";
import { signPayload } from "@/lib/server/secrets";
import { normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const space = getSpaceBySlug(String(payload.space_slug ?? ""));
  if (!space) return NextResponse.json({ error: "Space not found." }, { status: 404 });

  const phone = normalizePhone(String(payload.phone ?? ""));
  const code = String(payload.code ?? "").replace(/\D/g, "");
  if (!phone || code.length !== 6) {
    return NextResponse.json({ error: "Enter the 6-digit code we sent." }, { status: 400 });
  }

  const result = verifyOtp(space.id, phone, hashValue(`${phone}:${code}`));
  if (!result.ok) {
    const message =
      result.reason === "attempts"
        ? "Too many incorrect attempts. Request a new code."
        : result.reason === "expired"
          ? "That code expired. Request a new one."
          : "That code did not match. Check the SMS and try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const otpSession = signPayload({ spaceId: space.id, phone }, 30 * 60 * 1000);
  return NextResponse.json({ ok: true, otp_session: otpSession, phone });
}
