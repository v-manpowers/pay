export type View = "overview" | "terminal" | "ledger" | "developers";
export type Env = "test" | "live";
export type Status = "approved" | "declined" | "pending" | "refunded";
export type Brand = "visa" | "mastercard" | "amex" | "discover" | "card";

export interface Txn {
  id: string;
  created: number;
  amount: number; // cents
  currency: string; // usd | eur | gbp
  status: Status;
  brand: Brand;
  last4: string;
  name: string;
  email: string;
  code: string; // auth code
  network: string;
  risk: number; // 0–99
  reason?: string;
  source: "sim" | "terminal" | "api";
}

export interface WebhookEvent {
  id: string;
  type: string;
  at: number;
  latency: number; // ms
  status: "delivered" | "queued";
  payload: string;
}

export interface Keys {
  publishable: string;
  secret: string;
  rotatedAt: number;
}

export interface Toast {
  id: number;
  kind: "ok" | "warn" | "bad" | "info";
  msg: string;
}

export interface LogEntry {
  id: number;
  at: number;
  req: object;
  res: object;
  ok: boolean;
}
