import { useRef, useState, type FormEvent } from "react";
import {
  cardLen,
  clockTime,
  detectBrand,
  digitsOnly,
  formatCard,
  luhnValid,
  money,
  rnd,
  txnId,
  validExpiry,
  DECLINE_REASONS,
} from "../lib/engine";
import { useApp } from "../lib/store";
import type { LogEntry, Status, Txn } from "../lib/types";
import {
  BrandMark,
  IconAlert,
  IconBolt,
  IconCheck,
  IconRefund,
  IconShield,
  IconX,
} from "./icons";
import { Modal, ModalClose, SectionLabel } from "./ui";

const NETWORK: Record<string, string> = {
  visa: "visa_direct",
  mastercard: "mc_mip",
  amex: "amex_gw",
  discover: "dfs_net",
  card: "generic_route",
};

const PRESETS = ["12.00", "49.00", "129.00", "499.00"];

const TEST_CARDS: { number: string; label: string; tone: string }[] = [
  { number: "4242424242424242", label: "always approves", tone: "text-ok-600" },
  { number: "4000000000000002", label: "always declines", tone: "text-bad-600" },
  { number: "4000000000003220", label: "3-D Secure challenge", tone: "text-warn-600" },
];

function CardPreview({
  digits,
  brand,
  holder,
  exp,
  cvc,
  flipped,
}: {
  digits: string;
  brand: ReturnType<typeof detectBrand>;
  holder: string;
  exp: string;
  cvc: string;
  flipped: boolean;
}) {
  const groups = brand === "amex" ? [4, 6, 5] : [4, 4, 4, 4];
  let cursor = 0;
  const rendered = groups
    .map((len) => {
      const g = digits.slice(cursor, cursor + len);
      cursor += len;
      return g.padEnd(len, "•");
    })
    .join("  ");

  return (
    <div className="flip-scene h-[212px] w-full max-w-[390px]">
      <div className={`flip-inner relative h-full w-full ${flipped ? "flipped" : ""}`}>
        {/* front */}
        <div className="flip-face hatch absolute inset-0 overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-5 shadow-xl shadow-ink-950/30">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(520px 220px at 85% -20%, rgba(18,147,123,0.28), transparent 65%)" }}
          />
          <div className="relative flex items-start justify-between">
            <svg viewBox="0 0 42 30" className="h-8 w-11">
              <rect x="1" y="1" width="40" height="28" rx="5" fill="#d9c36a" />
              <rect x="1" y="1" width="40" height="28" rx="5" fill="url(#chipg)" opacity="0.5" />
              <path d="M1 11h12M1 19h12M29 11h12M29 19h12M13 1v28M29 1v28" stroke="#8a7432" strokeWidth="1.1" fill="none" />
              <defs>
                <linearGradient id="chipg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#8a7432" stopOpacity="0.4" />
                </linearGradient>
              </defs>
            </svg>
            <BrandMark brand={brand} className="h-7 w-[42px] drop-shadow" />
          </div>
          <p className="relative mt-7 font-mono text-[19px] font-medium tracking-[0.08em] text-white/95 md:text-[21px]">
            {rendered}
          </p>
          <div className="relative mt-6 flex items-end justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-fog/70">Card holder</p>
              <p className="truncate font-mono text-[13px] font-medium uppercase tracking-wide text-white">
                {holder || "—"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-fog/70">Expires</p>
              <p className="font-mono text-[13px] font-medium tabular text-white">{exp || "••/••"}</p>
            </div>
          </div>
        </div>
        {/* back */}
        <div className="flip-face flip-back absolute inset-0 overflow-hidden rounded-xl border border-ink-700 bg-ink-850 shadow-xl shadow-ink-950/30">
          <div className="mt-6 h-10 w-full bg-ink-950/90" />
          <div className="px-5 pt-5">
            <p className="mb-1.5 font-mono text-[8.5px] uppercase tracking-[0.16em] text-fog/70">
              Verification code
            </p>
            <div className="flex h-9 items-center justify-end rounded-md bg-white/95 px-3">
              <span className="font-mono text-[15px] font-semibold tracking-[0.3em] text-ink-900">
                {cvc ? cvc.replace(/./g, "•").slice(0, 4) : "•••"}
              </span>
            </div>
            <p className="mt-3 font-mono text-[9px] leading-relaxed text-mute2">
              Never share this code. Switchboard never stores full PANs — card data is tokenized at the edge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Terminal() {
  const { state, capture, toast } = useApp();

  const [amount, setAmount] = useState("49.00");
  const [currency, setCurrency] = useState("usd");
  const [email, setEmail] = useState("");
  const [holder, setHolder] = useState("");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"idle" | "processing" | "challenge">("idle");
  const [flipped, setFlipped] = useState(false);
  const [confirmLive, setConfirmLive] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; id?: string } | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const logSeq = useRef(1);

  const digits = digitsOnly(number);
  const brand = detectBrand(digits);
  const cvcLen = brand === "amex" ? 4 : 3;

  const clearError = (k: string) =>
    setErrors((e) => {
      if (!(k in e)) return e;
      const n = { ...e };
      delete n[k];
      return n;
    });

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const amt = parseFloat(amount);
    if (!amount || Number.isNaN(amt) || amt <= 0) e.amount = "Enter an amount above zero.";
    else if (amt > 999999) e.amount = "Single captures are capped at 999,999.00.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) e.email = "Enter a valid receipt email.";
    if (holder.trim().length < 2) e.holder = "Cardholder name is required.";
    if (digits.length !== cardLen(brand)) e.number = `Card number must be ${cardLen(brand)} digits.`;
    else if (!luhnValid(digits)) e.number = "This number fails the Luhn check.";
    if (!validExpiry(exp)) e.exp = "Use a future MM/YY.";
    if (cvc.length !== cvcLen) e.cvc = `CVC must be ${cvcLen} digits.`;
    return e;
  }

  function buildTxn(status: Status, reason?: string): Txn {
    return {
      id: txnId(),
      created: Date.now(),
      amount: Math.round(parseFloat(amount) * 100),
      currency,
      status,
      brand,
      last4: digits.slice(-4),
      name: holder.trim() || "Terminal operator",
      email: email.trim(),
      code: status === "approved" ? `A${Math.floor(rnd(100000, 999999))}` : "—",
      network: NETWORK[brand],
      risk: Math.floor(rnd(2, status === "approved" ? 40 : 90)),
      reason,
      source: "terminal",
    };
  }

  function finalize(status: Status, reason?: string, extra?: object) {
    const txn = buildTxn(status, reason);
    const cents = txn.amount;
    const res =
      status === "approved"
        ? { id: txn.id, status: "succeeded", amount: cents, currency, auth_code: txn.code, network: txn.network, risk_score: txn.risk, ...extra }
        : { id: txn.id, status: "failed", error: { type: "card_error", code: reason ?? "card_declined", message: `The card was ${reason ? reason.replace(/_/g, " ") : "declined"} by the issuer.` }, ...extra };
    setLog((l) => [
      {
        id: logSeq.current++,
        at: Date.now(),
        req: { amount: cents, currency, receipt_email: email, payment_method: { brand, last4: txn.last4, exp }, capture: true },
        res,
        ok: status === "approved",
      },
      ...l,
    ]);
    capture(txn);
    setResult(
      status === "approved"
        ? { ok: true, msg: `Captured ${money(cents, currency)} on ${brand} •••• ${txn.last4}`, id: txn.id }
        : { ok: false, msg: `Issuer declined — ${(reason ?? "card_declined").replace(/_/g, " ")}`, id: txn.id }
    );
    toast(status === "approved" ? "ok" : "bad", status === "approved" ? `Payment captured · ${txn.id.slice(0, 14)}…` : `Payment declined · ${(reason ?? "card_declined").replace(/_/g, " ")}`);
    setStage("idle");
    setCvc("");
  }

  function run() {
    setErrors({});
    setResult(null);
    setStage("processing");
    window.setTimeout(() => {
      if (digits === "4000000000000002") return finalize("declined", "card_declined");
      if (digits === "4000000000009995") return finalize("declined", "insufficient_funds");
      if (digits.endsWith("3220")) {
        setLog((l) => [
          {
            id: logSeq.current++,
            at: Date.now(),
            req: { amount: Math.round(parseFloat(amount) * 100), currency, payment_method: { brand, last4: digits.slice(-4) } },
            res: { status: "requires_action", next_action: "three_d_secure", issuer: "simulated_issuer" },
            ok: true,
          },
          ...l,
        ]);
        setStage("challenge");
        return;
      }
      if (digits === "4242424242424242" || Math.random() < 0.88) return finalize("approved");
      finalize("declined", DECLINE_REASONS[Math.floor(Math.random() * DECLINE_REASONS.length)]);
    }, 1150);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      toast("warn", "Check the highlighted fields before capturing.");
      return;
    }
    if (state.env === "live") {
      setConfirmLive(true);
      return;
    }
    run();
  }

  function resetForm() {
    setAmount("49.00");
    setEmail("");
    setHolder("");
    setNumber("");
    setExp("");
    setCvc("");
    setResult(null);
    setErrors({});
    setFlipped(false);
  }

  const inputCls = (k: string) =>
    `w-full rounded-lg border bg-card px-3 py-2.5 text-[14px] text-ink-900 outline-none transition-all placeholder:text-mute2 focus:ring-2 ${
      errors[k]
        ? "border-bad-600 focus:ring-bad-600/25"
        : "border-line focus:border-pine-600 focus:ring-pine-600/25"
    }`;

  const err = (k: string) =>
    errors[k] ? <p className="mt-1 font-mono text-[10.5px] text-bad-600">{errors[k]}</p> : null;

  return (
    <div className="grid gap-4 lg:grid-cols-[440px_1fr]">
      {/* left: preview + form */}
      <div className="space-y-4">
        <div className="flex justify-center">
          <CardPreview digits={digits} brand={brand} holder={holder} exp={exp} cvc={cvc} flipped={flipped} />
        </div>

        <section className="rounded-xl border border-line bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-[15px] font-bold text-ink-900">Capture a payment</h2>
              <p className="font-mono text-[10.5px] text-mute2">POST /v1/payments · idempotent</p>
            </div>
            {state.env === "live" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-bad-100 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wide text-bad-700">
                <IconAlert className="h-3 w-3" /> Live
              </span>
            )}
          </div>

          {result && (
            <div
              className={`anim-pop mb-4 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${
                result.ok ? "border-ok-600/30 bg-ok-100" : "border-bad-600/30 bg-bad-100"
              }`}
            >
              {result.ok ? (
                <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-ok-600" />
              ) : (
                <IconX className="mt-0.5 h-4 w-4 shrink-0 text-bad-600" />
              )}
              <div className="min-w-0">
                <p className={`text-[13px] font-medium ${result.ok ? "text-ok-700" : "text-bad-700"}`}>{result.msg}</p>
                <p className="truncate font-mono text-[10.5px] text-mute">{result.id}</p>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit} noValidate className="space-y-3.5">
            <div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[13px] text-mute2">
                    {currency === "usd" ? "$" : currency === "eur" ? "€" : "£"}
                  </span>
                  <input
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value.replace(/[^\d.]/g, ""));
                      clearError("amount");
                    }}
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label="Amount"
                    className={`${inputCls("amount")} pl-7 font-mono tabular`}
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  aria-label="Currency"
                  className="rounded-lg border border-line bg-card px-2.5 font-mono text-[12.5px] uppercase text-ink-900 outline-none transition-colors focus:border-pine-600"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
              </div>
              <div className="mt-2 flex gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setAmount(p);
                      clearError("amount");
                    }}
                    className="rounded-md border border-line bg-paper px-2.5 py-1 font-mono text-[11px] tabular text-mute transition-colors hover:border-pine-600 hover:text-pine-700 active:scale-95"
                  >
                    ${p}
                  </button>
                ))}
              </div>
              {err("amount")}
            </div>

            <div>
              <input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                type="email"
                placeholder="receipt email"
                aria-label="Receipt email"
                className={inputCls("email")}
              />
              {err("email")}
            </div>

            <div>
              <input
                value={holder}
                onChange={(e) => {
                  setHolder(e.target.value);
                  clearError("holder");
                }}
                placeholder="Cardholder name"
                aria-label="Cardholder name"
                className={inputCls("holder")}
              />
              {err("holder")}
            </div>

            <div>
              <div className="relative">
                <input
                  value={number}
                  onChange={(e) => {
                    const d = digitsOnly(e.target.value).slice(0, cardLen(detectBrand(digitsOnly(e.target.value))));
                    setNumber(formatCard(d, detectBrand(d)));
                    clearError("number");
                  }}
                  inputMode="numeric"
                  placeholder="4242 4242 4242 4242"
                  aria-label="Card number"
                  className={`${inputCls("number")} pr-14 font-mono tabular`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <BrandMark brand={brand} className="h-5.5 w-[34px] shadow-sm" />
                </span>
              </div>
              {err("number")}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  value={exp}
                  onChange={(e) => {
                    let d = digitsOnly(e.target.value).slice(0, 4);
                    if (d.length === 1 && Number(d) > 1) d = `0${d}`;
                    const out = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
                    setExp(out);
                    clearError("exp");
                  }}
                  inputMode="numeric"
                  placeholder="MM/YY"
                  aria-label="Expiry date"
                  className={`${inputCls("exp")} font-mono tabular`}
                />
                {err("exp")}
              </div>
              <div className="flex-1">
                <input
                  value={cvc}
                  onFocus={() => setFlipped(true)}
                  onBlur={() => setFlipped(false)}
                  onChange={(e) => {
                    setCvc(digitsOnly(e.target.value).slice(0, cvcLen));
                    clearError("cvc");
                  }}
                  inputMode="numeric"
                  placeholder={brand === "amex" ? "CVC (4)" : "CVC"}
                  aria-label="Security code"
                  className={`${inputCls("cvc")} font-mono tabular`}
                />
                {err("cvc")}
              </div>
            </div>

            <button
              type="submit"
              disabled={stage !== "idle"}
              className="group flex w-full items-center justify-center gap-2 rounded-lg bg-pine-600 px-4 py-3 font-display text-[14.5px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
            >
              {stage === "processing" ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                  Routing to issuer…
                </>
              ) : (
                <>
                  <IconBolt className="h-4.5 w-4.5 transition-transform group-hover:scale-110" />
                  {amount && parseFloat(amount) > 0
                    ? `Authorize ${currency === "usd" ? "$" : currency === "eur" ? "€" : "£"}${amount || "0.00"}`
                    : "Authorize payment"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full rounded-lg px-4 py-2 font-mono text-[11.5px] text-mute transition-colors hover:bg-paper hover:text-ink-900"
            >
              Reset terminal
            </button>
          </form>
        </section>
      </div>

      {/* right: session log + test cards */}
      <div className="flex min-h-0 flex-col gap-4">
        <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-sm">
          <header className="flex items-center gap-2.5 border-b border-ink-700 px-4 py-3">
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-bad-600/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-warn-600/80" />
              <span className="h-2.5 w-2.5 rounded-full bg-ok-600/80" />
            </span>
            <h2 className="font-display text-[14px] font-bold text-white">Session log</h2>
            <span className="ml-auto font-mono text-[10.5px] text-mute2">{log.length} requests</span>
            {log.length > 0 && (
              <button
                type="button"
                onClick={() => setLog([])}
                className="rounded-md px-2 py-1 font-mono text-[10.5px] text-mute2 transition-colors hover:bg-ink-800 hover:text-white"
              >
                clear
              </button>
            )}
          </header>
          <div className="scroll-dark min-h-0 flex-1 overflow-y-auto p-3">
            {log.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-1 p-6 text-center">
                <p className="font-mono text-[12px] text-fog">
                  switchboard ~ % <span className="blink text-pine-500">▍</span>
                </p>
                <p className="max-w-[260px] font-mono text-[11px] leading-relaxed text-mute2">
                  idle — requests you make from the capture form are traced here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {log.map((entry) => (
                  <li key={entry.id} className="anim-pop rounded-lg border border-ink-700 bg-ink-850/70 p-3">
                    <div className="flex items-center gap-2 font-mono text-[10.5px]">
                      <span className="text-mute2">{clockTime(entry.at)}</span>
                      <span className="text-pine-500">→ POST /v1/payments</span>
                      <span
                        className={`ml-auto rounded px-1.5 py-0.5 font-semibold ${
                          entry.ok ? "bg-ok-600/20 text-ok-100" : "bg-bad-600/25 text-bad-100"
                        }`}
                      >
                        {entry.ok ? "201 Created" : "402 Payment Required"}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <pre className="scroll-dark overflow-x-auto rounded-md bg-ink-950/70 p-2.5 font-mono text-[10.5px] leading-relaxed text-fog">
                        {JSON.stringify(entry.req, null, 2)}
                      </pre>
                      <pre
                        className={`scroll-dark overflow-x-auto rounded-md bg-ink-950/70 p-2.5 font-mono text-[10.5px] leading-relaxed ${
                          entry.ok ? "text-pine-200" : "text-bad-100"
                        }`}
                      >
                        {JSON.stringify(entry.res, null, 2)}
                      </pre>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
          <div className="mb-2.5 flex items-center gap-2">
            <IconShield className="h-4 w-4 text-pine-600" />
            <h3 className="font-display text-[13.5px] font-bold text-ink-900">Test cards</h3>
            <span className="font-mono text-[10px] text-mute2">click to fill</span>
          </div>
          <ul className="divide-y divide-line/70">
            {TEST_CARDS.map((c) => (
              <li key={c.number}>
                <button
                  type="button"
                  onClick={() => {
                    setNumber(formatCard(c.number, detectBrand(c.number)));
                    clearError("number");
                  }}
                  className="group flex w-full items-center gap-3 rounded-md px-1 py-2 text-left transition-colors hover:bg-paper"
                >
                  <span className="font-mono text-[12px] tabular text-ink-900">
                    {formatCard(c.number, detectBrand(c.number))}
                  </span>
                  <span className={`ml-auto font-mono text-[10.5px] ${c.tone}`}>{c.label}</span>
                  <span className="font-mono text-[10.5px] text-mute2 opacity-0 transition-opacity group-hover:opacity-100">
                    use →
                  </span>
                </button>
              </li>
            ))}
            <li className="px-1 py-2 font-mono text-[10.5px] leading-relaxed text-mute2">
              Any other Luhn-valid PAN routes to the simulator and approves ~88% of the time.
            </li>
          </ul>
        </section>
      </div>

      {/* 3-D Secure challenge */}
      <Modal open={stage === "challenge"} onClose={() => finalize("declined", "authentication_failed")} width="max-w-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-100">
              <IconShield className="h-5 w-5 text-warn-600" />
            </span>
            <ModalClose onClose={() => finalize("declined", "authentication_failed")} />
          </div>
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Issuer authentication</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
            The issuing bank requires 3-D Secure verification for this card before{" "}
            <span className="font-mono text-[12px] font-semibold text-ink-900">
              {money(Math.round(parseFloat(amount || "0") * 100), currency)}
            </span>{" "}
            can be captured.
          </p>
          <div className="mt-4 rounded-lg border border-line bg-paper px-3 py-2.5 font-mono text-[11px] text-mute">
            challenge: <span className="text-ink-900">sms •••• {digits.slice(-2) || "00"}</span> · issuer{" "}
            <span className="text-ink-900">simulated</span>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => finalize("declined", "authentication_failed")}
              className="flex-1 rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:bg-paper hover:text-ink-900"
            >
              Fail check
            </button>
            <button
              type="button"
              onClick={() => finalize("approved", undefined, { three_d_secure: "authenticated" })}
              className="flex-1 rounded-lg bg-pine-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px"
            >
              Approve
            </button>
          </div>
        </div>
      </Modal>

      {/* live-mode confirmation */}
      <Modal open={confirmLive} onClose={() => setConfirmLive(false)} width="max-w-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bad-100">
              <IconAlert className="h-5 w-5 text-bad-600" />
            </span>
            <ModalClose onClose={() => setConfirmLive(false)} />
          </div>
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Live capture</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
            The console is in <span className="font-semibold text-bad-700">live mode</span>. This authorization for{" "}
            <span className="font-mono text-[12px] font-semibold text-ink-900">
              {money(Math.round(parseFloat(amount || "0") * 100), currency)}
            </span>{" "}
            will be recorded against your production ledger (still simulated in this sandbox).
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmLive(false)}
              className="flex-1 rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:bg-paper hover:text-ink-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmLive(false);
                run();
              }}
              className="flex-1 rounded-lg bg-bad-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-bad-600/25 transition-all hover:bg-bad-700 active:translate-y-px"
            >
              Confirm charge
            </button>
          </div>
        </div>
      </Modal>

      {/* refund helper hint */}
      <p className="hidden items-center gap-1.5 font-mono text-[10.5px] text-mute2 lg:flex">
        <IconRefund className="h-3.5 w-3.5" /> captured payments can be refunded from the ledger
      </p>
    </div>
  );
}
