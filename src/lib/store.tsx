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

export const VERSION = "1.0.0";
export const SCHEMA = 2;

const LS_KEY = "switchboard:state";
const TXN_CAP = 140;

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

/* ---------- payload validation (survive corrupted / stale storage) ---------- */
const STATUSES = ["approved", "declined", "pending", "refunded"];

function isTxn(t: unknown): t is Txn {
  if (!t || typeof t !== "object") return false;
  const x = t as Record<string, unknown>;
  return (
    typeof x.id === "string" &&
    typeof x.created === "number" &&
    typeof x.amount === "number" &&
    typeof x.currency === "string" &&
    typeof x.last4 === "string" &&
    typeof x.name === "string" &&
    typeof x.risk === "number" &&
    STATUSES.includes(x.status as string)
  );
}

function asNumbers(arr: unknown, fallback: number[]): number[] {
  return Array.isArray(arr) && arr.length && arr.every((n) => typeof n === "number" && Number.isFinite(n))
    ? (arr as number[])
    : fallback;
}

interface Persisted {
  schema: number;
  savedAt: number;
  data: Partial<AppState>;
}

function loadState(): AppState {
  const base = seedState();
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return base;
    const p = JSON.parse(raw) as Persisted;
    if (!p || p.schema !== SCHEMA || !p.data) return base; // stale schema → reseed cleanly
    const d = p.data;
    return {
      ...base,
      env: d.env === "live" ? "live" : "test",
      running: d.running !== false,
      txns: Array.isArray(d.txns) && d.txns.length ? (d.txns.filter(isTxn).slice(0, TXN_CAP) || base.txns) : base.txns,
      series: asNumbers(d.series, base.series),
      hourly: asNumbers(d.hourly, base.hourly),
      webhooks: Array.isArray(d.webhooks) && d.webhooks.length ? d.webhooks : base.webhooks,
      keys: d.keys && typeof d.keys.secret === "string" && d.keys.secret.startsWith("sk_") ? d.keys : base.keys,
      toasts: [],
    };
  } catch {
    /* corrupted storage — fall through to seed */
  }
  return base;
}

function withTxn(s: AppState, txn: Txn): AppState {
  const txns = [txn, ...s.txns].slice(0, TXN_CAP);
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
  resetSandbox: () => void;
  toast: (kind: Toast["kind"], msg: string) => void;
  dismissToast: (id: number) => void;
}

const Ctx = createContext<Api | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState);
  const toastSeq = useRef(1);

  /* persist a bounded slice of state, stamped with the schema version */
  useEffect(() => {
    try {
      const payload: Persisted = {
        schema: SCHEMA,
        savedAt: Date.now(),
        data: {
          env: state.env,
          running: state.running,
          txns: state.txns.slice(0, 90),
          series: state.series,
          hourly: state.hourly,
          webhooks: state.webhooks.slice(0, 14),
          keys: state.keys,
        },
      };
      localStorage.setItem(LS_KEY, JSON.stringify(payload));
    } catch {
      /* storage full or unavailable — console keeps running in-memory */
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
    resetSandbox: () => {
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* noop */
      }
      setState(seedState());
      toast("info", "Sandbox reset — fresh keys issued, ledger reseeded.");
    },
    sendTestEvent: () => {
      const evt = makeWebhook("ping.test", "manual_test");
      setState((s) => ({ ...s, webhooks: [evt, ...s.webhooks].slice(0, 30) }));
      return evt;
    },
  };

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used inside <AppProvider>");
  return ctx;
}

export { money };
