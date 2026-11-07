import { redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, Circle, MessageSquare, QrCode, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { SetupForm } from "@/components/setup-form";
import { requireViewer } from "@/lib/server/auth";

const NEXT_STEPS = [
  { icon: MessageSquare, title: "Send your first request", body: "Add a customer and send the WhatsApp message." },
  { icon: QrCode, title: "Print your QR code", body: "Put it at the counter so walk-ins can scan and review." },
  { icon: Sparkles, title: "Publish the widget", body: "One script tag on your site and reviews go live." },
];

async function Content() {
  const viewer = await requireViewer();
  if (viewer.space) redirect("/app");
  const firstName = viewer.user.name.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description="Two minutes of setup, then you can start collecting verified reviews."
      />
      <SetupForm name={viewer.user.name} />

      <div className="mt-6 space-y-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">What happens next</p>
        {NEXT_STEPS.map((step) => (
          <div key={step.title} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <step.icon size={15} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs text-muted">{step.body}</p>
            </div>
            {step.title === "Send your first request" ? (
              <ArrowRight size={15} className="mt-1 text-muted" />
            ) : step.title === "Print your QR code" ? (
              <Circle size={14} className="mt-1 text-line" />
            ) : (
              <CheckCircle2 size={14} className="mt-1 text-line" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Content;
