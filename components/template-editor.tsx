"use client";

import { useActionState, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { updateTemplateAction, type RequestState } from "@/app/actions/requests";

const FALLBACK =
  "Hi {name}, thanks for visiting {business}! Could you share a quick review? It takes 20 seconds: {link}";

export function TemplateEditor({
  template,
  businessName,
  reviewUrl,
}: {
  template: string;
  businessName: string;
  reviewUrl: string;
}) {
  const [value, setValue] = useState(template || FALLBACK);
  const [state, action, pending] = useActionState<RequestState, FormData>(updateTemplateAction, {});

  const preview = value
    .replace(/\{name\}/g, "Anita")
    .replace(/\{business\}/g, businessName)
    .replace(/\{link\}/g, reviewUrl);

  return (
    <form action={action} className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">WhatsApp message template</h2>
          <p className="text-xs text-muted">
            Use <code className="rounded bg-surface-2 px-1">{"{name}"}</code>,{" "}
            <code className="rounded bg-surface-2 px-1">{"{business}"}</code> and{" "}
            <code className="rounded bg-surface-2 px-1">{"{link}"}</code>.
          </p>
        </div>
        <button type="submit" disabled={pending} className="btn btn-secondary px-3 py-1.5 text-xs">
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
        </button>
      </div>

      <textarea
        name="template"
        value={value}
        onChange={(event) => setValue(event.target.value.slice(0, 500))}
        rows={3}
        className="input mt-3 resize-none text-sm"
      />

      <div className="mt-3 rounded-xl rounded-tl-sm border border-line bg-[#DCF8C6] p-3 text-[13px] leading-relaxed text-[#0b2b1f]">
        {preview}
      </div>

      {state.error && <p className="mt-2 text-xs font-medium text-danger">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs font-medium text-success">{state.success}</p>}
    </form>
  );
}
