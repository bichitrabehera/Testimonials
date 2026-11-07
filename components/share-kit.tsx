"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Copy, Download, ExternalLink, Link2, MessageCircle, Share2 } from "lucide-react";

export function ShareKit({
  url,
  businessName,
  template,
}: {
  url: string;
  businessName: string;
  template: string;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"url" | "message" | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: 640,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0f172a", light: "#ffffff" },
    })
      .then((data) => {
        if (!cancelled) setQr(data);
      })
      .catch(() => setQr(null));
    return () => {
      cancelled = true;
    };
  }, [url]);

  async function downloadSvg() {
    const svg = await QRCode.toString(url, { type: "svg", margin: 2, color: { dark: "#0f172a", light: "#ffffff" } });
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "proofly-qr.svg";
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function copy(text: string, kind: "url" | "message") {
    await navigator.clipboard.writeText(text);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  }

  const shareMessage = template
    .replace(/\{name\}/g, "")
    .replace(/\{business\}/g, businessName)
    .replace(/\{link\}/g, url)
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-4">
        <div className="card p-4">
          <h2 className="text-sm font-semibold">Your public review link</h2>
          <p className="text-xs text-muted">Share it on WhatsApp, Instagram bio, receipts or a QR code.</p>
          <div className="mt-2.5 flex items-center gap-1.5 rounded-lg border border-line bg-surface-2/60 px-3 py-2">
            <Link2 size={14} className="shrink-0 text-muted" />
            <span className="min-w-0 flex-1 truncate text-xs">{url}</span>
            <button
              type="button"
              onClick={() => void copy(url, "url")}
              className="btn btn-ghost px-2 py-1 text-[11px]"
            >
              {copied === "url" ? <Check size={12} className="text-success" /> : <Copy size={12} />}
              {copied === "url" ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-3 py-1.5 text-xs">
              <ExternalLink size={12} /> Open page
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary px-3 py-1.5 text-xs"
            >
              <MessageCircle size={12} /> Share on WhatsApp
            </a>
            <button
              type="button"
              onClick={() => void copy(shareMessage, "message")}
              className="btn btn-ghost px-3 py-1.5 text-xs"
            >
              <Share2 size={12} /> {copied === "message" ? "Message copied" : "Copy message"}
            </button>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-sm font-semibold">Message you can forward</h2>
          <p className="mt-2 rounded-xl rounded-tl-sm border border-line bg-[#DCF8C6] p-3 text-[13px] leading-relaxed text-[#0b2b1f]">
            {shareMessage}
          </p>
          <p className="mt-2 text-[11px] text-muted">
            Per-customer links (with the customer&apos;s name and a verified badge) come from the Requests page.
          </p>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-sm font-semibold">QR code</h2>
        <p className="text-xs text-muted">Print it for the counter, the receipt or the door.</p>
        <div className="mt-3 grid place-items-center rounded-xl border border-line bg-white p-4">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR code linking to ${url}`} width={220} height={220} className="size-[220px]" />
          ) : (
            <div className="skeleton size-[220px]" />
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <a
            href={qr ?? "#"}
            download="proofly-qr.png"
            className="btn btn-secondary flex-1 text-xs"
            aria-disabled={!qr}
          >
            <Download size={13} /> PNG
          </a>
          <button type="button" onClick={() => void downloadSvg()} className="btn btn-secondary flex-1 text-xs">
            <Download size={13} /> SVG
          </button>
        </div>
      </div>
    </div>
  );
}
