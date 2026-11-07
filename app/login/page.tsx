import Link from "next/link";
import { BadgeCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { Logo } from "@/components/logo";

const POINTS = [
  { icon: ShieldCheck, text: "Verified badge on every customer review" },
  { icon: MessageCircle, text: "WhatsApp request templates, ready to send" },
  { icon: BadgeCheck, text: "Approve before anything goes public" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <aside className="relative hidden overflow-hidden bg-[#075E4E] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_0%,rgba(255,255,255,0.16),transparent)]"
        />
        <Link href="/" className="relative inline-flex items-center gap-2 text-lg font-semibold">
          <span className="grid size-8 place-items-center rounded-[10px] bg-white/15">
            <ShieldCheck size={18} />
          </span>
          Proofly
        </Link>

        <div className="relative max-w-sm">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Reviews that prove themselves.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            Collect reviews from customers you actually served. Show the badge. Stop arguing with
            anonymous one-stars.
          </p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((point) => (
              <li key={point.text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid size-7 place-items-center rounded-full bg-white/12">
                  <point.icon size={15} />
                </span>
                {point.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/55">
          ₹ pricing · UPI and cards · Built for businesses in India
        </p>
      </aside>

      <div className="flex flex-col items-center justify-center px-5 py-12">
        <div className="mb-8 lg:hidden">
          <Link href="/">
            <Logo />
          </Link>
        </div>
        <AuthForm initialMode={params.mode === "signup" ? "signup" : "login"} />
      </div>
    </div>
  );
}
