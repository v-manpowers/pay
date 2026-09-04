import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Env, Keys, Toast, Txn, View, WebhookEvent } from "./types";
import {
  freshKeys,
  makeTxn,
  makeWebhook,
  money,
  rnd,
  seedHourly,
  seedSeries,
  seedTxns,
  seedWebhooks,
} from "./engine";

export interface AppState {
  env: Env;
  running: boolean;
  view: View;
  txns: Txn[];
  series: number[];
  hourly: number[];
  webhooks: WebhookEvent[];
  keys: Keys;
  toasts: Toast[];
}

const LS_KEY = "switchboard:v1";

function seedState(): AppState {
  return {
    env: "test",
    running: true,
    view: "overview",
    txns: seedTxns(),
    series: seedSeries(),
    hourly: seedHourly(),
    webhooks: seedWebhooks(),
    keys: freshKeys(),
    toasts: [],
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<AppState>;
      const base = seedState();
      return {
        ...base,
        env: p.env ?? "test",
        running: p.running ?? true,
        txns: Array.isArray(p.txns) && p.txns.length ? p.txns : base.txns,
        series: Array.isArray(p.series) && p.series.length ? p.series : base.series,
        hourly: Array.isArray(p.hourly) && p.hourly.length ? p.hourly : base.hourly,
        webhooks: Array.isArray(p.webhooks) && p.webhooks.length ? p.webhooks : base.webhooks,
        keys: p.keys && p.keys.secret ? p.keys : base.keys,
        toasts: [],
      };
    }
  } catch {
    /* corrupted storage — fall through to seed */
  }
  return seedState();
}

function withTxn(s: AppState, txn: Txn): AppState {
  const txns = [txn, ...s.txns].slice(0, 140);
  const win = txn.status === "declined" ? Math.round(rnd(30, 140)) : Math.max(4, Math.round(txn.amount / 100));
  const series = [...s.series.slice(1), win];
  const hourly = [...s.hourly];
  if (txn.status !== "declined") hourly[hourly.length - 1] += txn.amount;
  const type =
    txn.status === "declined"
      ? "payment.failed"
      : txn.status === "pending"
        ? "payment.requires_action"
        : "payment.captured";
  const webhooks = [makeWebhook(type, txn.id), ...s.webhooks].slice(0, 30);
  return { ...s, txns, series, hourly, webhooks };
}

interface Api {
  state: AppState;
  setView: (v: View) => void;
  toggleEnv: (env: Env) => void;
  toggleRunning: () => void;
  capture: (txn: Txn) => void;
  refund: (id: string) => void;
  rotateKeys: () => void;
  sendTestEvent: () => WebhookEvent;
  toast: (kind: Toast["kind"], msg: string) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const toastSeq = useRef(1);

  /* persist a slice of state */
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_KEY,
        JSON.stringify({
          env: state.env,
          running: state.running,
          txns: state.txns.slice(0, 70),
          series: state.series,
          hourly: state.hourly,
          webhooks: state.webhooks.slice(0, 14),
          keys: state.keys,
        })
      );
    } catch {
      /* storage unavailable */
    }
  }, [state.env, state.running, state.txns, state.series, state.hourly, state.webhooks, state.keys]);

  /* live stream tick */
  useEffect(() => {
    if (!state.running) return;
    const t = window.setInterval(() => {
      setState((s) => {
        let next = withTxn(s, makeTxn("sim"));
        if (Math.random() < 0.28) {
          const p = next.txns.find((x) => x.status === "pending");
          if (p) {
            next = {
              ...next,
              txns: next.txns.map((x) =>
                x.id === p.id
                  ? { ...x, status: "approved" as const, code: `A${Math.floor(rnd(100000, 999999))}` }
                  : x
              ),
              webhooks: [makeWebhook("payment.captured", p.id), ...next.webhooks].slice(0, 30),
            };
          }
        }
        return next;
      });
    }, 2600);
    return () => window.clearInterval(t);
  }, [state.running]);

  const toast = useCallback((kind: Toast["kind"], msg: string) => {
    const id = toastSeq.current++;
    setState((s) => ({ ...s, toasts: [...s.toasts.slice(-3), { id, kind, msg }] }));
    window.setTimeout(() => {
      setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 4200);
  }, []);

  const api: Api = {
    state,
    toast,
    dismissToast: (id) => setState((s) => ({ ...s, toasts: s.toasts.filter((t) => t.id !== id) })),
    setView: (view) => setState((s) => ({ ...s, view })),
    toggleEnv: (env) => {
      setState((s) => ({ ...s, env }));
      toast(
        env === "live" ? "warn" : "info",
        env === "live"
          ? "Live mode armed — captures now require explicit confirmation."
          : "Back in test mode. No real money moves here."
      );
    },
    toggleRunning: () => {
      setState((s) => {
        const running = !s.running;
        return { ...s, running };
      });
    },
    capture: (txn) => setState((s) => withTxn(s, txn)),
    refund: (id) =>
      setState((s) => {
        const target = s.txns.find((t) => t.id === id);
        if (!target) return s;
        return {
          ...s,
          txns: s.txns.map((t) => (t.id === id ? { ...t, status: "refunded" as const } : t)),
          webhooks: [makeWebhook("refund.issued", id), ...s.webhooks].slice(0, 30),
        };
      }),
    rotateKeys: () =>
      setState((s) => ({
        ...s,
        keys: freshKeys(),
        webhooks: [makeWebhook("account.key_rotated", "acct_1Nq4"), ...s.webhooks].slice(0, 30),
      })),
    sendTestEvent: () => {
      const evt = makeWebhook("ping.test", "evt_test");
      setState((s) => ({ ...s, webhooks: [evt, ...s.webhooks].slice(0, 30) }));
      return evt;
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): Api {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export function txnSummary(t: Txn): string {
  return `${money(t.amount, t.currency)} · ${t.brand} ·••• ${t.last4}`;
}
