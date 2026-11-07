"use client";

import { useState } from "react";
import { Check, Copy, Loader2, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/utils";

export function SendRequestButton({
  customerId,
  customerName,
  phone,
  businessName,
  template,
  label = "WhatsApp",
  compact = false,
}: {
  customerId: string;
  customerName: string;
  phone: string;
  businessName: string;
  template: string;
  label?: string;
  compact?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createLink() {
    const response = await fetch(`/api/space/requests/${customerId}`, { method: "POST" });
    const data = (await response.json()) as { url?: string; error?: string };
    if (!response.ok || !data.url) throw new Error(data.error ?? "Could not create the link.");
    return data.url;
  }

  async function send() {
    setError(null);
    const popup = window.open("", "_blank");
    setLoading(true);
    try {
      const url = await createLink();
      const message = template
        .replace(/\{name\}/g, customerName.split(" ")[0])
        .replace(/\{business\}/g, businessName)
        .replace(/\{link\}/g, url);
      const wa = whatsappLink(phone, message);
      if (popup) popup.location.href = wa;
      else window.location.href = wa;
    } catch (cause) {
      popup?.close();
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    setError(null);
    setLoading(true);
    try {
      const url = await createLink();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => void send()}
        disabled={loading}
        className={compact ? "btn btn-secondary px-2 py-1 text-[11px]" : "btn btn-secondary"}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
        {label}
      </button>
      <button
        type="button"
        onClick={() => void copy()}
        disabled={loading}
        className="btn btn-ghost px-2 py-1 text-[11px]"
        aria-label="Copy review link"
      >
        {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
      </button>
      {error && <span className="text-[11px] text-danger">{error}</span>}
    </div>
  );
}
