import Link from "next/link";
import { Logo } from "./logo";

export function SiteHeader({ authed }: { authed: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label="Proofly home">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted sm:flex">
          <Link className="transition-colors hover:text-ink" href="/#how">
            How it works
          </Link>
          <Link className="transition-colors hover:text-ink" href="/#demo">
            Live demo
          </Link>
          <Link className="transition-colors hover:text-ink" href="/#pricing">
            Pricing
          </Link>
          <Link className="transition-colors hover:text-ink" href="/#faq">
            FAQ
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          {authed ? (
            <Link href="/app" className="btn btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost hidden sm:inline-flex">
                Sign in
              </Link>
              <Link href="/login?mode=signup" className="btn btn-primary">
                Start free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs text-sm text-muted">
            Verified customer reviews, collected on WhatsApp and shown on your website.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted">
          <Link className="hover:text-ink" href="/#pricing">
            Pricing
          </Link>
          <Link className="hover:text-ink" href="/#faq">
            FAQ
          </Link>
          <Link className="hover:text-ink" href="/r/smile-dental">
            Example review page
          </Link>
          <Link className="hover:text-ink" href="/login">
            Sign in
          </Link>
        </div>
      </div>
      <div className="mx-auto max-w-6xl border-t border-line px-5 py-5 text-xs text-muted">
        © 2026 Proofly · Reviews are never fabricated or deleted — hidden
        reviews keep a logged reason.
      </div>
    </footer>
  );
}
