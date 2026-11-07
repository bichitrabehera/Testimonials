import { NextResponse } from "next/server";
import { createOtp, getSpaceBySlug, logEvent } from "@/lib/server/queries";
import { hashValue, sixDigitCode } from "@/lib/server/crypto";
import { rateLimit } from "@/lib/server/rate-limit";
import { normalizePhone } from "@/lib/utils";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const space = getSpaceBySlug(String(payload.space_slug ?? ""));
  if (!space) return NextResponse.json({ error: "Space not found." }, { status: 404 });

  const phone = normalizePhone(String(payload.phone ?? ""));
  if (!phone) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  }

  const limited = rateLimit(`otp:${space.id}:${phone}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Too many codes requested. Try again in an hour." }, { status: 429 });
  }

  const code = sixDigitCode();
  createOtp(space.id, phone, hashValue(`${phone}:${code}`));
  logEvent(space.id, "otp_sent");

  // No SMS gateway is connected in this build, so the code is returned for the
  // on-screen demo hint. Wire MSG91/Twilio here to deliver it by SMS instead.
  return NextResponse.json(
    {
      ok: true,
      phone,
      delivery: "demo",
      demo_code: code,
    },
    { status: 202 },
  );
}
