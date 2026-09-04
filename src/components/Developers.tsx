import { useState } from "react";
import { ago, fullTime } from "../lib/engine";
import { useApp } from "../lib/store";
import {
  IconAlert,
  IconBolt,
  IconCheck,
  IconChevron,
  IconKey,
  IconRotate,
  IconSend,
  IconTrash,
} from "./icons";
import { CopyBtn, Modal, ModalClose, SectionLabel } from "./ui";

const SNIPPETS: Record<string, { label: string; code: string }> = {
  curl: {
    label: "cURL",
    code: `curl https://api.switchboard.dev/v1/payments \\
  -u "$SWITCHBOARD_SECRET_KEY": \\
  -d amount=4900 \\
  -d currency=usd \\
  -d "payment_method[brand]"=visa \\
  -d "payment_method[last4]"=4242 \\
  -d capture=true`,
  },
  node: {
    label: "Node",
    code: `import Switchboard from "@switchboard/sdk";

const sb = new Switchboard(process.env.SWITCHBOARD_SECRET_KEY);

const payment = await sb.payments.create({
  amount: 4900,
  currency: "usd",
  payment_method: { brand: "visa", last4: "4242" },
  capture: true,
});

console.log(payment.id, payment.status);`,
  },
  python: {
    label: "Python",
    code: `import switchboard, os

client = switchboard.Client(os.environ["SWITCHBOARD_SECRET_KEY"])

payment = client.payments.create(
    amount=4900,
    currency="usd",
    payment_method={"brand": "visa", "last4": "4242"},
    capture=True,
)

print(payment.id, payment.status)`,
  },
};

const TYPE_TONE: Record<string, string> = {
  "payment.captured": "text-ok-600",
  "payment.failed": "text-bad-600",
  "payment.requires_action": "text-warn-600",
  "refund.issued": "text-info-600",
  "ping.test": "text-pine-600",
  "account.key_rotated": "text-ink-900",
};

export default function Developers() {
  const { state, rotateKeys, sendTestEvent, resetSandbox, toast } = useApp();
  const [reveal, setReveal] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [tab, setTab] = useState<keyof typeof SNIPPETS>("curl");
  const [openEvt, setOpenEvt] = useState<string | null>(null);

  const sk = state.keys.secret;
  const maskedSk = `${sk.slice(0, 8)}${"•".repeat(18)}`;

  function doRotate() {
    setRotating(true);
    window.setTimeout(() => {
      rotateKeys();
      setRotating(false);
      setConfirmRotate(false);
      setReveal(false);
      toast("warn", "Secret key rotated — the previous key stops working immediately.");
    }, 900);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        {/* API keys */}
        <section className="rounded-xl border border-line bg-card shadow-sm">
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <IconKey className="h-4.5 w-4.5 text-pine-600" />
            <h2 className="font-display text-[15px] font-bold text-ink-900">API keys</h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-mute2">
              rotated {ago(state.keys.rotatedAt)}
            </span>
          </header>
          <div className="space-y-3 p-4">
            <div>
              <SectionLabel>Publishable key</SectionLabel>
              <div className="mt-1.5 flex items-center gap-1 rounded-lg border border-line bg-paper px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-900">
                  {state.keys.publishable}
                </code>
                <CopyBtn text={state.keys.publishable} />
              </div>
              <p className="mt-1.5 font-mono text-[10.5px] text-mute2">safe for browsers & mobile clients</p>
            </div>
            <div>
              <SectionLabel>Secret key</SectionLabel>
              <div className="mt-1.5 flex items-center gap-1 rounded-lg border border-warn-600/40 bg-warn-100/50 px-3 py-2">
                <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink-900">
                  {reveal ? sk : maskedSk}
                </code>
                <button
                  type="button"
                  onClick={() => setReveal((r) => !r)}
                  className="rounded-md px-2 py-1.5 font-mono text-[10.5px] font-semibold text-mute transition-colors hover:bg-warn-100 hover:text-ink-900"
                >
                  {reveal ? "hide" : "reveal"}
                </button>
                <CopyBtn text={sk} />
              </div>
              <p className="mt-1.5 font-mono text-[10.5px] text-warn-700">
                never expose in client code — carries full capture & refund authority
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmRotate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-3.5 py-2 font-mono text-[12px] font-semibold text-white transition-all hover:bg-ink-700 active:translate-y-px"
            >
              <IconRotate className="h-4 w-4" /> Rotate secret key
            </button>
          </div>
        </section>

        {/* Quickstart */}
        <section className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900 shadow-sm">
          <header className="flex items-center gap-1 border-b border-ink-700 px-3 py-2">
            <span className="mr-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mute2">
              quickstart
            </span>
            {(Object.keys(SNIPPETS) as (keyof typeof SNIPPETS)[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className={`rounded-md px-3 py-1.5 font-mono text-[11.5px] font-semibold transition-colors ${
                  tab === k ? "bg-ink-700 text-white" : "text-mute2 hover:text-white"
                }`}
              >
                {SNIPPETS[k].label}
              </button>
            ))}
            <span className="ml-auto pr-1">
              <CopyBtn text={SNIPPETS[tab].code.replace("$SWITCHBOARD_SECRET_KEY", sk)} dark />
            </span>
          </header>
          <pre className="scroll-dark max-h-72 overflow-auto p-4 font-mono text-[11.5px] leading-relaxed text-pine-200">
            {tab === "curl"
              ? SNIPPETS[tab].code.replace("$SWITCHBOARD_SECRET_KEY", sk)
              : SNIPPETS[tab].code}
          </pre>
        </section>

        {/* Limits */}
        <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
          <SectionLabel>Rate limits & routing</SectionLabel>
          <ul className="mt-2.5 space-y-2.5">
            {[
              { label: "Authorization requests", value: "100 / sec", pct: 34 },
              { label: "Refund requests", value: "25 / sec", pct: 12 },
              { label: "Webhook fan-out", value: "500 / sec", pct: 58 },
            ].map((r) => (
              <li key={r.label} className="group">
                <div className="flex items-baseline justify-between">
                  <span className="text-[12.5px] text-mute">{r.label}</span>
                  <span className="font-mono text-[11px] font-semibold tabular text-ink-900">{r.value}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    className="h-full rounded-full bg-pine-600/70 transition-all duration-700 group-hover:bg-pine-600"
                    style={{ width: `${r.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Danger zone */}
        <section className="rounded-xl border border-bad-600/30 bg-card shadow-sm">
          <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
            <IconAlert className="h-4.5 w-4.5 text-bad-600" />
            <h2 className="font-display text-[15px] font-bold text-ink-900">Danger zone</h2>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-mute2">
              schema v2 · stored locally
            </span>
          </header>
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-ink-900">Reset sandbox data</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-mute">
                Wipes the local ledger, webhook log, and credentials, then reseeds a fresh sandbox.
                This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-bad-600/50 bg-bad-100/60 px-3.5 py-2 font-mono text-[12px] font-semibold text-bad-700 transition-all hover:bg-bad-100 active:translate-y-px"
            >
              <IconTrash className="h-4 w-4" /> Reset sandbox
            </button>
          </div>
        </section>
      </div>

      {/* Webhooks */}
      <section className="flex min-h-[420px] flex-col rounded-xl border border-line bg-card shadow-sm">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <IconBolt className="h-4.5 w-4.5 text-pine-600" />
          <h2 className="font-display text-[15px] font-bold text-ink-900">Webhooks</h2>
          <span className="ml-auto flex items-center gap-1.5 font-mono text-[10.5px] text-mute2">
            <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-ok-600" /> endpoint healthy
          </span>
        </header>
        <div className="border-b border-line bg-paper/60 px-4 py-2.5">
          <div className="flex items-center gap-1">
            <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-ink-900">
              https://api.switchboard.dev/v1/events → https://acme-shop.example/hooks/pay
            </code>
            <CopyBtn text="https://acme-shop.example/hooks/pay" />
          </div>
        </div>
        <ul className="scroll-slim min-h-0 flex-1 divide-y divide-line/70 overflow-y-auto">
          {state.webhooks.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => setOpenEvt(openEvt === e.id ? null : e.id)}
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-pine-50/60"
              >
                <IconChevron
                  className={`h-3.5 w-3.5 shrink-0 text-mute2 transition-transform ${openEvt === e.id ? "rotate-180" : ""}`}
                />
                <span className={`font-mono text-[11.5px] font-semibold ${TYPE_TONE[e.type] ?? "text-ink-900"}`}>
                  {e.type}
                </span>
                <span className="ml-auto font-mono text-[10px] tabular text-mute2">{ago(e.at)}</span>
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase ${
                    e.status === "delivered" ? "bg-ok-100 text-ok-700" : "bg-warn-100 text-warn-700"
                  }`}
                >
                  {e.status} · {e.latency}ms
                </span>
              </button>
              {openEvt === e.id && (
                <div className="anim-rise px-4 pb-3">
                  <pre className="scroll-slim overflow-x-auto rounded-lg bg-ink-900 p-3 font-mono text-[10.5px] leading-relaxed text-pine-200">
                    {e.payload}
                  </pre>
                </div>
              )}
            </li>
          ))}
        </ul>
        <footer className="border-t border-line p-3">
          <button
            type="button"
            onClick={() => {
              const evt = sendTestEvent();
              toast("ok", `Test event delivered to endpoint in ${evt.latency}ms.`);
            }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-pine-600/50 bg-pine-50 px-3 py-2.5 font-mono text-[12px] font-semibold text-pine-700 transition-all hover:bg-pine-100 active:translate-y-px"
          >
            <IconSend className="h-4 w-4" /> Send test event
          </button>
        </footer>
      </section>

      {/* rotate confirm */}
      <Modal open={confirmRotate} onClose={() => !rotating && setConfirmRotate(false)} width="max-w-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-100">
              <IconAlert className="h-5 w-5 text-warn-600" />
            </span>
            <ModalClose onClose={() => !rotating && setConfirmRotate(false)} />
          </div>
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Rotate secret key?</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
            The current key <code className="rounded bg-paper px-1 py-0.5 font-mono text-[11.5px] text-ink-900">{maskedSk}</code>{" "}
            will be revoked immediately. Any servers still using it will start receiving{" "}
            <span className="font-mono text-[11.5px]">401 Unauthorized</span>.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={rotating}
              onClick={() => setConfirmRotate(false)}
              className="flex-1 rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:bg-paper hover:text-ink-900 disabled:opacity-50"
            >
              Keep current key
            </button>
            <button
              type="button"
              onClick={doRotate}
              disabled={rotating}
              className="flex-1 rounded-lg bg-warn-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-warn-600/25 transition-all hover:brightness-110 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
            >
              {rotating ? (
                <span className="inline-flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                  Rotating…
                </span>
              ) : (
                "Rotate now"
              )}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-1.5 font-mono text-[10px] text-mute2">
            <IconCheck className="h-3 w-3 text-ok-600" /> an account.key_rotated webhook fires on success
          </p>
        </div>
      </Modal>

      {/* sandbox reset confirm */}
      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} width="max-w-sm">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bad-100">
              <IconTrash className="h-5 w-5 text-bad-600" />
            </span>
            <ModalClose onClose={() => setConfirmReset(false)} />
          </div>
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Reset the sandbox?</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
            This clears every locally stored payment, webhook delivery, and API credential, then
            reseeds a fresh environment. Terminal sessions and filters start over from zero.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="flex-1 rounded-lg border border-line px-3 py-2.5 text-[13px] font-semibold text-mute transition-colors hover:bg-paper hover:text-ink-900"
            >
              Keep my data
            </button>
            <button
              type="button"
              onClick={() => {
                resetSandbox();
                setConfirmReset(false);
              }}
              className="flex-1 rounded-lg bg-bad-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-md shadow-bad-600/25 transition-all hover:brightness-110 active:translate-y-px"
            >
              Reset everything
            </button>
          </div>
        </div>
      </Modal>

      <p className="hidden font-mono text-[10.5px] text-mute2 xl:block">
        keys last rotated {fullTime(state.keys.rotatedAt)} · sandbox credentials, safe to share
      </p>
    </div>
  );
}
