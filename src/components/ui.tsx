import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Status } from "../lib/types";
import { IconCheck, IconCopy, IconX } from "./icons";

/* ---------- status chip ---------- */
const STATUS_META: Record<Status, { label: string; cls: string; dot: string }> = {
  approved: { label: "Approved", cls: "bg-ok-100 text-ok-700", dot: "bg-ok-600" },
  declined: { label: "Declined", cls: "bg-bad-100 text-bad-700", dot: "bg-bad-600" },
  pending: { label: "Pending", cls: "bg-warn-100 text-warn-700", dot: "bg-warn-600" },
  refunded: { label: "Refunded", cls: "bg-info-100 text-info-600", dot: "bg-info-600" },
};

export function Chip({ status, small }: { status: Status; small?: boolean }) {
  const m = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium uppercase tracking-wide ${m.cls} ${
        small ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot} ${status === "pending" ? "animate-pulse" : ""}`} />
      {m.label}
    </span>
  );
}

/* ---------- animated number ---------- */
export function useCountUp(value: number, dur = 650): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
      else fromRef.current = to;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, dur]);
  return display;
}

/* ---------- toggle ---------- */
export function Toggle({
  on,
  onChange,
  labelOff,
  labelOn,
  danger,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  labelOff: string;
  labelOn: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="group flex items-center gap-2 rounded-lg border border-line bg-card px-2.5 py-1.5 transition-colors hover:border-mute2"
      aria-pressed={on}
    >
      <span className="relative h-4.5 w-8 rounded-full bg-line transition-colors duration-200 group-hover:bg-mute2/50"
        style={{ backgroundColor: on ? (danger ? "var(--color-bad-600)" : "var(--color-pine-600)") : undefined }}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-card shadow transition-transform duration-200 ${
            on ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="font-mono text-[11px] font-semibold tracking-wide text-ink-900">
        {on ? labelOn : labelOff}
      </span>
    </button>
  );
}

/* ---------- modal ---------- */
export function Modal({
  open,
  onClose,
  children,
  width = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/55 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`anim-pop relative w-full ${width} rounded-xl border border-line bg-card shadow-2xl`}>
        {children}
      </div>
    </div>
  );
}

/* ---------- copy button ---------- */
export function CopyBtn({ text, dark }: { text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label="Copy to clipboard"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          ta.remove();
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className={`rounded-md p-1.5 transition-all active:scale-90 ${
        dark
          ? "text-fog hover:bg-ink-700 hover:text-white"
          : "text-mute hover:bg-paper hover:text-ink-900"
      }`}
    >
      {copied ? <IconCheck className="h-4 w-4 text-ok-600" /> : <IconCopy className="h-4 w-4" />}
    </button>
  );
}

/* ---------- risk meter ---------- */
export function RiskMeter({ risk }: { risk: number }) {
  const color = risk > 75 ? "var(--color-bad-600)" : risk > 45 ? "var(--color-warn-600)" : "var(--color-ok-600)";
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-line">
        <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${risk}%`, backgroundColor: color }} />
      </span>
      <span className="font-mono text-[11px] tabular text-mute">{risk}</span>
    </span>
  );
}

/* ---------- section label ---------- */
export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-mute2">
      {children}
    </p>
  );
}

/* ---------- close icon button for modal headers ---------- */
export function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="rounded-md p-1.5 text-mute transition-colors hover:bg-paper hover:text-ink-900"
    >
      <IconX className="h-4.5 w-4.5" />
    </button>
  );
}
