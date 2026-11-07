import Link from "next/link";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/logo";
import { BottomNav, SideNav } from "@/components/app-nav";
import { logoutAction } from "@/app/actions/auth";
import { getViewer } from "@/lib/server/auth";
import { PLANS } from "@/lib/plans";
import { initials } from "@/lib/utils";

async function SpaceBlock() {
  const viewer = await getViewer();
  if (!viewer) return <div className="h-16" />;
  const { user, space } = viewer;
  return (
    <div className="border-b border-line px-3 py-3">
      <div className="flex items-center gap-2.5 rounded-lg px-1 py-1">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-[11px] font-bold text-white">
          {space ? initials(space.name) : initials(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{space?.name ?? "Set up your business"}</p>
          <p className="truncate text-[11px] text-muted">{space?.category ?? "No space yet"}</p>
        </div>
        {space && (
          <span
            className={
              space.plan === "pro"
                ? "badge border-brand/25 bg-brand-soft text-brand-strong"
                : "badge border-line bg-surface-2 text-muted"
            }
          >
            {PLANS[space.plan].name}
          </span>
        )}
      </div>
    </div>
  );
}

async function UserBlock() {
  const viewer = await getViewer();
  if (!viewer) return null;
  return (
    <div className="border-t border-line p-3">
      <div className="flex items-center gap-2.5 px-1">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-2 text-[10px] font-semibold text-muted">
          {initials(viewer.user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">{viewer.user.name}</p>
          <p className="truncate text-[11px] text-muted">{viewer.user.email}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Sign out"
            className="grid size-7 place-items-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            <LogOut size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <div className="px-4 py-4">
          <Link href="/" aria-label="Proofly home">
            <Logo />
          </Link>
        </div>
        <SpaceBlock />
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <SideNav />
        </div>
        <UserBlock />
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/app" aria-label="Dashboard home">
            <Logo />
          </Link>
          <MobileHeaderBadge />
        </header>
        <main className="flex-1 px-4 pb-24 pt-5 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
        <BottomNav />
      </div>
    </div>
  );
}

async function MobileHeaderBadge() {
  const viewer = await getViewer();
  if (!viewer?.space) return null;
  return (
    <span className="badge border-brand/25 bg-brand-soft text-brand-strong">
      {PLANS[viewer.space.plan].name}
    </span>
  );
}
