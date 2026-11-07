"use client";

import { useActionState, useRef, useState } from "react";
import { FileUp, Loader2, Upload, X } from "lucide-react";
import { importCsvAction, type RequestState } from "@/app/actions/requests";

const SAMPLE = "name,phone,order_ref\nAnita Sharma,9876543210,INV-1041\nRavi Menon,9876543211,INV-1042";

export function CsvImport() {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState<RequestState, FormData>(importCsvAction, {});

  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="btn btn-secondary">
        {open ? <X size={15} /> : <FileUp size={15} />}
        {open ? "Close" : "Import CSV"}
      </button>

      {open && (
        <form action={action} className="card mt-3 space-y-3 p-4">
          <div>
            <p className="text-sm font-semibold">Import customers</p>
            <p className="text-xs text-muted">
              One row per customer: <code className="rounded bg-surface-2 px-1">name, phone, order ref</code>.
              Up to 500 rows.
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setCsv(await file.text());
            }}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-line bg-surface-2/50 px-3 py-2 text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-2.5 file:py-1.5 file:text-xs file:font-medium"
          />

          <textarea
            name="csv"
            rows={5}
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            className="input resize-none font-mono text-xs"
            placeholder={SAMPLE}
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setCsv(SAMPLE);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              Use sample rows
            </button>
            <button type="submit" disabled={pending} className="btn btn-primary">
              {pending ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
              {pending ? "Importing…" : "Import"}
            </button>
          </div>

          {state.error && <p className="text-sm font-medium text-danger">{state.error}</p>}
          {state.success && <p className="text-sm font-medium text-success">{state.success}</p>}
        </form>
      )}
    </div>
  );
}
