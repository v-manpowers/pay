import { useEffect, useMemo, useRef, useState } from "react";
import { ago, fullTime, money } from "../lib/engine";
import { useApp } from "../lib/store";
import type { Status, Txn } from "../lib/types";
import {
  BrandMark,
  IconChevron,
  IconCopy,
  IconDownload,
  IconRefund,
  IconSearch,
  IconTerminal,
  IconX,
} from "./icons";
import { Chip, CopyBtn, Modal, ModalClose, RiskMeter, SectionLabel } from "./ui";

const FILTERS: (Status | "all")[] = ["all", "approved", "declined", "pending", "refunded"];
const REFUND_REASONS = ["duplicate", "fraudulent", "requested_by_customer", "order_cancelled", "other"];
const PAGE_SIZE = 12;

function RefundModal({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const { refund, toast } = useApp();
  const [reason, setReason] = useState(REFUND_REASONS[2]);
  const [busy, setBusy] = useState(false);

  function confirm() {
    setBusy(true);
    window.setTimeout(() => {
      refund(txn.id);
      toast("info", `Refunded ${money(txn.amount, txn.currency)} to ${txn.brand} •••• ${txn.last4} · ${reason.replace(/_/g, " ")}`);
      onClose();
    }, 950);
  }

  return (
    <Modal open onClose={onClose} width="max-w-sm">
      <div className="p-5">
        <div className="flex items-start justify-between">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-100">
            <IconRefund className="h-5 w-5 text-info-600" />
          </span>
          <ModalClose onClose={onClose} />
        </div>
        <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Refund payment</h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
          Return <span className="font-mono text-[12.5px] font-semibold text-ink-900">{money(txn.amount, txn.currency)}</span>{" "}
          to {txn.name}'s {txn.brand} card ending {txn.last4}. This posts a <span className="font-mono text-[11.5px]">refund.issued</span>{" "}
          webhook and settles in 3–5 business days.
        </p>
        <div className="mt-4">
          <SectionLabel>Reason</SectionLabel>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {REFUND_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10.5px] transition-all active:scale-95 ${
                  reason === r
                    ? "border-info-600 bg-info-100 font-semibold text-info-600"
                    : "border-line text-mute hover:border-mute2 hover:text-ink-900"
                }`}
              >
                {r.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:bg-paper hover:text-ink-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="flex-1 rounded-lg bg-info-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-info-600/25 transition-all hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
          >
            {busy ? "Issuing refund…" : `Refund ${money(txn.amount, txn.currency)}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Row({ txn, expanded, onToggle }: { txn: Txn; expanded: boolean; onToggle: () => void }) {
  const [refunding, setRefunding] = useState(false);
  return (
    <>
      <tr
        onClick={onToggle}
        className={`cursor-pointer border-b border-line/70 transition-colors hover:bg-pine-50/60 ${
          expanded ? "bg-pine-50/80" : ""
        }`}
      >
        <td className="whitespace-nowrap py-2.5 pl-4 pr-2 font-mono text-[11px] tabular text-mute" title={fullTime(txn.created)}>
          {ago(txn.created)}
        </td>
        <td className="max-w-[150px] truncate py-2.5 pr-2 font-mono text-[11.5px] text-ink-900">{txn.id}</td>
        <td className="max-w-[160px] truncate py-2.5 pr-2">
          <p className="truncate text-[12.5px] font-medium text-ink-900">{txn.name}</p>
          <p className="truncate font-mono text-[10px] text-mute2">{txn.email}</p>
        </td>
        <td className="py-2.5 pr-2">
          <span className="flex items-center gap-2">
            <BrandMark brand={txn.brand} className="h-5 w-[30px] shadow-sm" />
            <span className="font-mono text-[11px] text-mute">•••• {txn.last4}</span>
          </span>
        </td>
        <td className="whitespace-nowrap py-2.5 pr-2 text-right font-mono text-[12.5px] font-semibold tabular text-ink-900">
          {money(txn.amount, txn.currency)}
        </td>
        <td className="hidden py-2.5 pr-2 xl:table-cell">
          <RiskMeter risk={txn.risk} />
        </td>
        <td className="py-2.5 pr-2">
          <Chip status={txn.status} small />
        </td>
        <td className="py-2.5 pr-3 text-right">
          <IconChevron
            className={`ml-auto h-4 w-4 text-mute2 transition-transform duration-200 ${expanded ? "rotate-180 text-pine-600" : ""}`}
          />
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-line/70 bg-card">
          <td colSpan={8} className="px-4 pb-4 pt-1">
            <div className="anim-rise grid gap-4 lg:grid-cols-[1fr_1fr]">
              <div>
                <SectionLabel>Authorization detail</SectionLabel>
                <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                  {[
                    ["Auth code", txn.code],
                    ["Network", txn.network],
                    ["Origin", txn.source],
                    ["Captured", fullTime(txn.created)],
                    ["Risk score", `${txn.risk} / 99`],
                    ["Decline reason", txn.reason?.replace(/_/g, " ") ?? "—"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[9.5px] uppercase tracking-wider text-mute2">{k}</dt>
                      <dd className="font-mono text-[12px] text-ink-900">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        await navigator.clipboard.writeText(txn.id);
                      } catch {
                        /* clipboard unavailable */
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 font-mono text-[11.5px] text-mute transition-colors hover:border-pine-600 hover:text-pine-700 active:scale-95"
                  >
                    <IconCopy className="h-3.5 w-3.5" /> copy id
                  </button>
                  {txn.status === "approved" && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRefunding(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 font-mono text-[11.5px] font-semibold text-white transition-all hover:bg-ink-700 active:scale-95"
                    >
                      <IconRefund className="h-3.5 w-3.5" /> refund {money(txn.amount, txn.currency)}
                    </button>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <SectionLabel>Raw object</SectionLabel>
                  <CopyBtn text={JSON.stringify(txn, null, 2)} />
                </div>
                <pre className="scroll-slim mt-2 max-h-52 overflow-auto rounded-lg bg-ink-900 p-3 font-mono text-[10.5px] leading-relaxed text-pine-200">
                  {JSON.stringify(txn, null, 2)}
                </pre>
              </div>
            </div>
          </td>
        </tr>
      )}
      {refunding && <RefundModal txn={txn} onClose={() => setRefunding(false)} />}
    </>
  );
}

const CSV_COLS = [
  "id", "created_iso", "status", "amount_minor", "currency", "brand", "last4",
  "customer", "email", "network", "auth_code", "risk_score", "decline_reason", "source",
] as const;

export default function Ledger() {
  const { state, setView, toast } = useApp();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  /* "/" shortcut focuses this field (dispatched from the shell) */
  useEffect(() => {
    function focus() {
      searchRef.current?.focus();
      searchRef.current?.select();
    }
    window.addEventListener("sb:focus-search", focus);
    return () => window.removeEventListener("sb:focus-search", focus);
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.txns.length };
    state.txns.forEach((t) => (c[t.status] = (c[t.status] ?? 0) + 1));
    return c;
  }, [state.txns]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return state.txns.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.id.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.last4.includes(q)
      );
    });
  }, [state.txns, query, filter]);

  /* pagination, clamped against the filtered set */
  useEffect(() => setPage(0), [query, filter]);
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageSafe = Math.min(page, pageCount - 1);
  const pageRows = rows.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE);

  function exportCsv() {
    if (rows.length === 0) {
      toast("warn", "Nothing to export — the current filter has no rows.");
      return;
    }
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = [
      CSV_COLS.join(","),
      ...rows.map((t) =>
        [
          t.id, new Date(t.created).toISOString(), t.status, t.amount, t.currency, t.brand,
          t.last4, t.name, t.email, t.network, t.code, t.risk, t.reason ?? "", t.source,
        ]
          .map(esc)
          .join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `switchboard-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("ok", `Exported ${rows.length} payment${rows.length === 1 ? "" : "s"} to CSV.`);
  }

  /* completely empty ledger (e.g. after a sandbox reset with the stream paused) */
  if (state.txns.length === 0) {
    return (
      <section className="anim-rise flex flex-col items-center rounded-xl border border-line bg-card px-6 py-20 text-center shadow-sm">
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-pine-50">
          <IconTerminal className="h-6 w-6 text-pine-600" />
        </span>
        <h2 className="mt-4 font-display text-[19px] font-bold text-ink-900">The ledger is empty</h2>
        <p className="mt-1.5 max-w-[360px] text-[13px] leading-relaxed text-mute">
          No payment objects on record. Resume the auth stream or key in a card from the capture
          terminal and payments will start posting here immediately.
        </p>
        <button
          type="button"
          onClick={() => setView("terminal")}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-pine-600 px-4 py-2.5 font-display text-[13.5px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px"
        >
          <IconTerminal className="h-4 w-4" /> Open capture terminal
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 md:max-w-xs">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mute2" />
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, customer, email, last4…  ( / )"
            className="w-full rounded-lg border border-line bg-card py-2.5 pl-9 pr-8 text-[13px] outline-none transition-all placeholder:text-mute2 focus:border-pine-600 focus:ring-2 focus:ring-pine-600/25"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-mute2 hover:text-ink-900"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[11px] capitalize transition-all active:scale-95 ${
                filter === f
                  ? "border-ink-900 bg-ink-900 font-semibold text-white"
                  : "border-line bg-card text-mute hover:border-mute2 hover:text-ink-900"
              }`}
            >
              {f} <span className={filter === f ? "text-fog" : "text-mute2"}>{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          title="Export the filtered rows as CSV"
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card px-3 py-2 font-mono text-[11.5px] font-semibold text-mute transition-colors hover:border-pine-600 hover:text-pine-700 active:scale-95"
        >
          <IconDownload className="h-3.5 w-3.5" /> CSV
        </button>
        <span className="ml-auto font-mono text-[11px] tabular text-mute2">
          {rows.length} of {state.txns.length} payments
        </span>
      </div>

      {/* table */}
      <section className="overflow-hidden rounded-xl border border-line bg-card shadow-sm">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-paper/70">
                {["Time", "Payment ID", "Customer", "Method", "Amount", "Risk", "Status", ""].map((h, i) => (
                  <th
                    key={h || "exp"}
                    className={`py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-mute2 ${
                      i === 0 ? "pl-4" : "pr-2"
                    } ${h === "Amount" ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((t) => (
                <Row key={t.id} txn={t} expanded={openId === t.id} onToggle={() => setOpenId(openId === t.id ? null : t.id)} />
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-paper">
              <IconSearch className="h-5 w-5 text-mute2" />
            </span>
            <p className="font-display text-[15px] font-semibold text-ink-900">No payments match</p>
            <p className="max-w-[300px] text-[12.5px] leading-relaxed text-mute">
              {query
                ? `Nothing found for “${query}”. Try a payment id, last4, or clear the filters.`
                : "This status bucket is empty — the stream will fill it soon."}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setFilter("all");
              }}
              className="mt-1 rounded-lg border border-line px-3.5 py-2 font-mono text-[11.5px] font-semibold text-ink-900 transition-colors hover:border-pine-600 hover:text-pine-700 active:scale-95"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 border-t border-line bg-paper/60 px-4 py-2.5">
            <span className="font-mono text-[10.5px] tabular text-mute2">
              showing {pageSafe * PAGE_SIZE + 1}–{Math.min(rows.length, (pageSafe + 1) * PAGE_SIZE)} of {rows.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={pageSafe === 0}
                className="rounded-md border border-line bg-card px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-900 transition-all hover:border-pine-600 hover:text-pine-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-900"
              >
                ← Prev
              </button>
              <span className="rounded-md px-2 py-1.5 font-mono text-[10.5px] tabular text-mute">
                page {pageSafe + 1} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={pageSafe >= pageCount - 1}
                className="rounded-md border border-line bg-card px-2.5 py-1.5 font-mono text-[11px] font-semibold text-ink-900 transition-all hover:border-pine-600 hover:text-pine-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink-900"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
