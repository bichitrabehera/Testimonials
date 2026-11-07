import Link from "next/link";
import { headers } from "next/headers";
import { BellRing, Download, MessageCircle, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";
import { AddCustomer } from "@/components/add-customer";
import { CsvImport } from "@/components/csv-import";
import { SendRequestButton } from "@/components/send-request-button";
import { TemplateEditor } from "@/components/template-editor";
import { requireSpace } from "@/lib/server/auth";
import { listCustomers } from "@/lib/server/queries";
import { normalizePhone } from "@/lib/utils";

const STATUS: Record<string, { label: string; className: string }> = {
  submitted: { label: "Reviewed", className: "border-success/30 bg-success/10 text-success" },
  opened: { label: "Opened", className: "border-brand/30 bg-brand-soft text-brand-strong" },
  sent: { label: "Sent", className: "border-line bg-surface-2 text-muted" },
};

const DEFAULT_TEMPLATE =
  "Hi {name}, thanks for visiting {business}! Could you share a quick review? It takes 20 seconds: {link}";

function maskPhoneNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return `+${digits.slice(0, 2)} ${digits.slice(2, 4)}•••••${digits.slice(-3)}`;
}

async function Content() {
  const { space } = await requireSpace();
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const origin = `${protocol}://${host}`;

  const customers = listCustomers(space.id);
  const template = space.whatsapp_template || DEFAULT_TEMPLATE;
  const reviewUrl = `${origin}/r/${space.slug}`;

  const needsReminder = customers.filter((customer) => customer.needs_reminder === 1);

  return (
    <div>
      <PageHeader
        title="Requests"
        description="Every customer gets a single-use link that expires in 14 days. Send it on WhatsApp — no SMS costs."
        actions={
          <>
            <AddCustomer
              businessName={space.name}
              slug={space.slug}
              template={template}
              origin={origin}
            />
            <CsvImport />
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="text-sm font-semibold">
                Customers <span className="ml-1 text-xs font-normal text-muted">{customers.length}</span>
              </h2>
              {space.plan === "pro" ? (
                <a href="/api/space/export" className="btn btn-ghost px-2 py-1 text-[11px]">
                  <Download size={12} /> Export reviews CSV
                </a>
              ) : (
                <Link href="/app/settings#plan" className="text-[11px] font-medium text-brand hover:underline">
                  CSV export is Pro
                </Link>
              )}
            </div>

            {customers.length ? (
              <ul className="divide-y divide-line">
                {customers.map((customer) => {
                  const status = customer.request_status ?? null;
                  const badge = status ? STATUS[status] : null;
                  const phone = normalizePhone(customer.phone) || customer.phone;
                  const stale = customer.needs_reminder === 1;
                  return (
                    <li key={customer.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-[11px] font-semibold text-muted">
                        {customer.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-medium">
                          <span className="truncate">{customer.name}</span>
                          {stale && (
                            <span className="badge border-warning/30 bg-warning/10 text-warning">
                              <BellRing size={10} /> Reminder due
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted">
                          {maskPhoneNumber(phone)}
                          {customer.order_ref ? ` · ${customer.order_ref}` : ""}
                        </p>
                      </div>
                      {badge && <span className={`badge border ${badge.className}`}>{badge.label}</span>}
                      <SendRequestButton
                        customerId={customer.id}
                        customerName={customer.name}
                        phone={phone}
                        businessName={space.name}
                        template={template}
                        compact
                        label={status ? "Resend" : "Send"}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <EmptyState
                icon={<Users size={18} />}
                title="No customers yet"
                body="Add the people you served today, or import your customer list from a CSV."
              />
            )}
          </div>

          {needsReminder.length > 0 && (
            <div className="card mt-4 flex flex-wrap items-center gap-3 p-4">
              <span className="grid size-8 place-items-center rounded-lg bg-warning/10 text-warning">
                <BellRing size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {needsReminder.length} request{needsReminder.length === 1 ? "" : "s"} sent more than 3 days ago
                </p>
                <p className="text-xs text-muted">
                  A short reminder usually doubles the response rate. Resending issues a fresh link.
                </p>
              </div>
              <SendRequestButton
                customerId={needsReminder[0].id}
                customerName={needsReminder[0].name}
                phone={normalizePhone(needsReminder[0].phone) || needsReminder[0].phone}
                businessName={space.name}
                template={template}
                label={`Remind ${needsReminder[0].name.split(" ")[0]}`}
              />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <TemplateEditor
            template={template}
            businessName={space.name}
            reviewUrl={reviewUrl}
          />

          <div className="card p-4">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <MessageCircle size={14} className="text-brand" /> How sending works
            </h2>
            <ol className="mt-2.5 space-y-2 text-xs leading-relaxed text-muted">
              <li>1. We create a unique link for that customer, valid for 14 days, usable once.</li>
              <li>2. WhatsApp opens with the message already written — you press send.</li>
              <li>3. When they submit, the review appears in your Reviews inbox as pending.</li>
              <li>4. Their review is marked verified automatically.</li>
            </ol>
          </div>

          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <p className="text-xs font-semibold">Your public review link</p>
            <p className="mt-1 break-all text-xs text-muted">{reviewUrl}</p>
            <Link href="/app/share" className="mt-2 inline-block text-xs font-medium text-brand hover:underline">
              QR code and share kit →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Content;
