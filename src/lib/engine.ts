import type { Brand, Keys, Status, Txn, WebhookEvent } from "./types";

/* ---------------- random helpers ---------------- */
export const rnd = (a: number, b: number) => a + Math.random() * (b - a);
export const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

const ALPH = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const token = (n: number) =>
  Array.from({ length: n }, () => ALPH[Math.floor(Math.random() * ALPH.length)]).join("");
export const txnId = () => `pay_${token(14)}`;
export const evtId = () => `evt_${token(12)}`;
export const keyId = (prefix: string) => `${prefix}_${token(24)}`;

/* ---------------- card utilities ---------------- */
export const digitsOnly = (s: string) => s.replace(/\D/g, "");

export function luhnValid(digits: string): boolean {
  if (digits.length < 12) return false;
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

export function detectBrand(d: string): Brand {
  if (/^3[47]/.test(d)) return "amex";
  if (/^4/.test(d)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(d)) return "mastercard";
  if (/^(6011|65|64[4-9])/.test(d)) return "discover";
  return "card";
}

export function formatCard(d: string, brand: Brand): string {
  if (brand === "amex")
    return [d.slice(0, 4), d.slice(4, 10), d.slice(10, 15)].filter(Boolean).join(" ");
  return d.replace(/(.{4})/g, "$1 ").trim();
}

export function cardLen(brand: Brand): number {
  return brand === "amex" ? 15 : 16;
}

export function validExpiry(exp: string): boolean {
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return false;
  const [m, y] = exp.split("/").map(Number);
  const now = new Date();
  const cy = now.getFullYear() % 100;
  const cm = now.getMonth() + 1;
  return y > cy || (y === cy && m >= cm);
}

/* ---------------- formatting ---------------- */
export const money = (cents: number, currency = "usd") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(cents / 100);

export const moneyShort = (cents: number) => {
  const v = cents / 100;
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${v.toFixed(0)}`;
};

export const ago = (t: number) => {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
};

export const clockTime = (t: number) =>
  new Date(t).toLocaleTimeString("en-GB", { hour12: false });

export const fullTime = (t: number) =>
  new Date(t).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

/* ---------------- generators ---------------- */
const FIRST = [
  "Maya", "Jonas", "Priya", "Diego", "Amara", "Felix", "Ingrid", "Omar",
  "Sofia", "Kenji", "Lena", "Marcus", "Talia", "Henrik", "Zara", "Callum",
  "Anika", "Ruben", "Celine", "Dmitri", "Naomi", "Oscar", "Yusra", "Viktor",
];
const LAST = [
  "Lindqvist", "Okafor", "Marchetti", "Silva", "Tanaka", "Berg", "Moreau",
  "Petrov", "Haugen", "Reyes", "Novak", "Kimura", "Donovan", "Fischer",
  "Almeida", "Kowalski", "Iversen", "Duarte", "Sato", "Whitfield", "Mbeki",
  "Larsson", "Ortega", "Nilsen",
];
const DOMAINS = ["gmail.com", "outlook.com", "proton.me", "icloud.com", "fastmail.com", "hey.com"];
const CURRENCIES = ["usd", "usd", "usd", "usd", "eur", "gbp"];
const NETWORKS: Record<Brand, string> = {
  visa: "visa_direct",
  mastercard: "mc_mip",
  amex: "amex_gw",
  discover: "dfs_net",
  card: "generic_route",
};
export const DECLINE_REASONS = [
  "insufficient_funds",
  "do_not_honor",
  "expired_card",
  "suspected_fraud",
  "incorrect_cvc",
  "card_declined",
];

export function makeTxn(source: Txn["source"], now = Date.now()): Txn {
  const brand = pick(["visa", "visa", "visa", "mastercard", "mastercard", "amex", "discover"] as Brand[]);
  const first = pick(FIRST);
  const last = pick(LAST);
  let amount = Math.round(900 + Math.pow(Math.random(), 2.4) * 38000);
  if (Math.random() < 0.06) amount *= Math.round(rnd(4, 12));
  const roll = Math.random();
  const status: Status = roll < 0.085 ? "declined" : roll < 0.15 ? "pending" : "approved";
  return {
    id: txnId(),
    created: now,
    amount,
    currency: pick(CURRENCIES),
    status,
    brand,
    last4: String(Math.floor(rnd(0, 10000))).padStart(4, "0"),
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@${pick(DOMAINS)}`,
    code: status === "approved" ? `A${Math.floor(rnd(100000, 999999))}` : "—",
    network: NETWORKS[brand],
    risk: Math.floor(rnd(1, status === "declined" ? 97 : 68)),
    reason: status === "declined" ? pick(DECLINE_REASONS) : undefined,
    source,
  };
}

export function seedTxns(n = 34): Txn[] {
  const now = Date.now();
  return Array.from({ length: n }, () =>
    makeTxn("sim", now - Math.floor(Math.pow(Math.random(), 1.4) * 12 * 3600_000))
  ).sort((a, b) => b.created - a.created);
}

export function seedSeries(n = 36): number[] {
  return Array.from({ length: n }, (_, i) =>
    Math.max(60, Math.round(620 + Math.sin(i / 4.2) * 260 + Math.sin(i / 1.7) * 120 + rnd(-140, 200)))
  );
}

export function seedHourly(): number[] {
  return Array.from({ length: 12 }, (_, i) => Math.round(rnd(260, 880) * (1 + i / 8) * 100));
}

export function makeWebhook(type: string, ref: string): WebhookEvent {
  return {
    id: evtId(),
    type,
    at: Date.now(),
    latency: Math.floor(rnd(38, 260)),
    status: Math.random() < 0.9 ? "delivered" : "queued",
    payload: JSON.stringify(
      { id: ref, type, livemode: false, created: Math.floor(Date.now() / 1000) },
      null,
      2
    ),
  };
}

export function freshKeys(): Keys {
  return { publishable: keyId("pk_test"), secret: keyId("sk_test"), rotatedAt: Date.now() };
}

export function seedWebhooks(): WebhookEvent[] {
  const types = [
    "payment.captured",
    "payment.captured",
    "payment.failed",
    "refund.issued",
    "payment.requires_action",
    "payment.captured",
  ];
  return types.map((t, i) => ({
    ...makeWebhook(t, txnId()),
    at: Date.now() - (i + 1) * Math.floor(rnd(4, 18)) * 60_000,
  }));
}
