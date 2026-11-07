import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, mark = true }: { className?: string; mark?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      {mark && (
        <span className="grid size-7 place-items-center rounded-[9px] bg-brand text-white shadow-sm">
          <ShieldCheck size={17} strokeWidth={2.4} />
        </span>
      )}
      <span className="text-[1.0625rem] text-ink">
        Proofly
      </span>
    </span>
  );
}
