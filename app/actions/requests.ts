"use server";

import { revalidatePath } from "next/cache";
import { requireSpace } from "../../lib/server/auth";
import { createCustomer, issueRequest, updateSpace } from "../../lib/server/queries";
import { normalizePhone } from "../../lib/utils";

export interface RequestState {
  error?: string;
  success?: string;
  added?: { name: string; phone: string; token: string };
  count?: number;
}

export async function addCustomerAction(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const { space } = await requireSpace();
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const orderRef = String(formData.get("order_ref") ?? "").trim().slice(0, 40) || null;
  const sendNow = formData.get("send_now") !== null;

  if (name.length < 2) return { error: "Add the customer's name." };
  if (!phone) return { error: "Enter a valid 10-digit mobile number." };

  const customer = createCustomer(space.id, { name, phone, orderRef });
  let token = "";
  if (sendNow) token = issueRequest(space.id, customer.id);

  revalidatePath("/app", "layout");
  return {
    success: sendNow ? `${name} added and a review link is ready to send.` : `${name} added.`,
    added: sendNow ? { name, phone, token } : undefined,
  };
}

export async function importCsvAction(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const { space } = await requireSpace();
  const raw = String(formData.get("csv") ?? "");
  if (!raw.trim()) return { error: "Paste rows or choose a CSV file first." };

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let imported = 0;
  let skipped = 0;
  for (const line of lines.slice(0, 500)) {
    const cells = line.split(",").map((cell) => cell.trim().replace(/^"|"$/g, ""));
    if (!cells.length) continue;
    if (/^(name|full name|customer)$/i.test(cells[0])) continue;
    const name = cells[0] ?? "";
    const phone = normalizePhone(cells[1] ?? "");
    if (!name || !phone) {
      skipped += 1;
      continue;
    }
    createCustomer(space.id, { name, phone, orderRef: cells[2] || null });
    imported += 1;
  }

  revalidatePath("/app", "layout");
  if (!imported) {
    return { error: `No usable rows found (${skipped} skipped). Use the format: name, phone, order ref.` };
  }
  return {
    success: `Imported ${imported} customer${imported === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}.`,
    count: imported,
  };
}

export async function updateTemplateAction(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const { space } = await requireSpace();
  const template = String(formData.get("template") ?? "").trim().slice(0, 500);
  if (!template.includes("{link}")) {
    return { error: "Keep {link} in the template so the review link is included." };
  }
  updateSpace(space.id, { whatsapp_template: template });
  revalidatePath("/app", "layout");
  return { success: "Message template saved." };
}
