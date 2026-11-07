"use client";

import { useActionState, useState } from "react";
import { Check, Loader2, Plus, Send, UserPlus, X } from "lucide-react";
import { addCustomerAction, type RequestState } from "@/app/actions/requests";
import { whatsappLink } from "@/lib/utils";

export function AddCustomer({
  businessName,
  slug,
  template,
  origin,
}: {
  businessName: string;
  slug: string;
  template: string;
  origin: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<RequestState, FormData>(addCustomerAction, {});

  const message =
    state.added && state.added.token
      ? template
          .replace(/\{name\}/g, state.added.name)
          .replace(/\{business\}/g, businessName)
          .replace(/\{link\}/g, `${origin}/r/${slug}?t=${state.added.token}`)
      : "";

  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="btn btn-primary">
        {open ? <X size={15} /> : <Plus size={15} />}
        {open ? "Close" : "Add customer"}
      </button>

      {open && (
        <form action={action} className="card mt-3 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <UserPlus size={15} className="text-brand" />
            <p className="text-sm font-semibold">Add a customer</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="customer-name">
                Name
              </label>
              <input id="customer-name" name="name" required className="input" placeholder="Anita Sharma" />
            </div>
            <div>
              <label className="label" htmlFor="customer-phone">
                Mobile number
              </label>
              <input
                id="customer-phone"
                name="phone"
                required
                inputMode="tel"
                className="input"
                placeholder="98765 43210"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="customer-order">
                Booking / order ref <span className="font-normal text-muted">(optional)</span>
              </label>
              <input id="customer-order" name="order_ref" className="input" placeholder="INV-1042" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" name="send_now" defaultChecked className="size-4 accent-[var(--brand)]" />
            Create a single-use review link now
          </label>

          {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-success">{state.success}</p>}

          {state.added && (
            <a
              href={whatsappLink(state.added.phone, message)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary w-full border-success/40 text-success"
            >
              <Send size={14} /> Open WhatsApp for {state.added.name.split(" ")[0]}
            </a>
          )}

          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {pending ? "Saving…" : "Save customer"}
          </button>
        </form>
      )}
    </div>
  );
}
