import { useEffect, useRef, useState } from "react";
import { money, pick, rnd } from "../lib/engine";
import {
  IconCode,
  IconLedger,
  IconPulse,
  IconTag,
  IconTerminal,
  LogoMark,
} from "./icons";

interface MiniTxn {
  id: number;
  name: string;
  last4: string;
  amount: number;
  ok: boolean;
}

const NAMES = ["Maya L.", "Jonas O.", "Priya S.", "Diego R.", "Amara K.", "Felix B.", "Ingrid H.", "Omar T."];
const SPARK = [14, 18, 15, 22, 19, 26, 24, 30, 27, 34, 31, 38, 35, 42];

function seedFeed(): MiniTxn[] {
  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    name: pick(NAMES),
    last4: String(Math.floor(rnd(0, 10000))).padStart(4, "0"),
    amount: Math.round(rnd(9, 380)) * 100,
    ok: Math.random() < 0.85,
  }));
}

export default function PhonePreview() {
  const [feed, setFeed] = useState<MiniTxn[]>(seedFeed);
  const [clock, setClock] = useState(() => new Date());
  const seq = useRef(10);

  useEffect(() => {
    const c = window.setInterval(() => setClock(new Date()), 1000);
    const f = window.setInterval(() => {
      setFeed((prev) =>
        [
          {
            id: seq.current++,
            name: pick(NAMES),
            last4: String(Math.floor(rnd(0, 10000))).padStart(4, "0"),
            amount: Math.round(rnd(9, 380)) * 100,
            ok: Math.random() < 0.85,
          },
          ...prev,
        ].slice(0, 4)
      );
    }, 1600);
    return () => {
      window.clearInterval(c);
      window.clearInterval(f);
    };
  }, []);

  const sparkPts = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 96},${44 - v}`).join(" ");

  return (
    <div className="relative mx-auto w-[250px]">
      {/* frame */}
      <div className="hatch rounded-[2.4rem] border border-ink-600/70 bg-ink-950 p-[9px] shadow-2xl shadow-ink-950/60 ring-1 ring-ink-700">
        <div className="relative flex h-[464px] flex-col overflow-hidden rounded-[1.85rem] bg-ink-900">
          {/* punch-hole camera */}
          <span className="absolute left-1/2 top-2 z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-ink-950 ring-2 ring-ink-800" />

          {/* status bar */}
          <div className="flex items-center justify-between px-5 pb-1 pt-2 font-mono text-[9px] font-medium text-fog">
            <span className="tabular">
              {clock.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </span>
            <span className="flex items-center gap-1.5">
              <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="currentColor">
                <path d="M1 8.5a7 7 0 0 1 10 0L6 13.5 1 8.5Z" opacity=".9" />
                <path d="M.2 6.6a9.5 9.5 0 0 1 11.6 0l-1.1 1.1a8 8 0 0 0-9.4 0L.2 6.6Z" opacity=".55" />
              </svg>
              <svg viewBox="0 0 20 10" className="h-2.5 w-4">
                <rect x="0.5" y="0.5" width="16" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="2" width="11" height="6" rx="1" fill="currentColor" />
                <rect x="17.5" y="3" width="2" height="4" rx="0.8" fill="currentColor" />
              </svg>
            </span>
          </div>

          {/* app bar */}
          <div className="flex items-center gap-2 border-b border-ink-700/80 px-3.5 py-2">
            <LogoMark className="h-6 w-6" />
            <span className="font-display text-[13px] font-bold text-white">Switchboard</span>
            <span className="ml-auto rounded-full bg-pine-600/20 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider text-pine-500">
              test
            </span>
          </div>

          {/* mini stats + sparkline */}
          <div className="grid grid-cols-[1fr_96px] gap-2 px-3.5 pt-3">
            <div className="rounded-lg border border-ink-700/80 bg-ink-850 p-2.5">
              <p className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-mute2">Settled volume</p>
              <p className="mt-0.5 font-display text-[17px] font-bold leading-none text-white">$12.4k</p>
              <p className="mt-1 font-mono text-[8px] font-semibold text-ok-600">▲ 8.2% vs prev hr</p>
            </div>
            <div className="rounded-lg border border-ink-700/80 bg-ink-850 p-2.5">
              <p className="font-mono text-[7.5px] uppercase tracking-[0.14em] text-mute2">Success</p>
              <p className="mt-0.5 font-display text-[17px] font-bold leading-none text-white">96.2%</p>
              <svg viewBox="0 0 96 44" className="mt-1 h-7 w-full" preserveAspectRatio="none">
                <polyline points={sparkPts} fill="none" stroke="var(--color-pine-500)" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* live mini feed */}
          <div className="mx-3.5 mt-2.5 flex items-center justify-between">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-mute2">
              authorization feed
            </span>
            <span className="flex items-center gap-1 font-mono text-[7.5px] text-pine-500">
              <span className="pulse-dot h-1 w-1 rounded-full bg-pine-500" /> live
            </span>
          </div>
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-hidden px-3.5 pb-2 pt-1.5">
            {feed.map((t) => (
              <li
                key={t.id}
                className="anim-feed flex items-center gap-2 rounded-lg border border-ink-700/70 bg-ink-850/80 px-2.5 py-1.5"
              >
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${t.ok ? "bg-pine-500" : "bg-bad-600"}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[10px] font-medium leading-tight text-fog">{t.name}</span>
                  <span className="block font-mono text-[7.5px] text-mute2">•••• {t.last4}</span>
                </span>
                <span className={`font-mono text-[9px] font-semibold tabular ${t.ok ? "text-pine-500" : "text-bad-600"}`}>
                  {money(t.amount)}
                </span>
              </li>
            ))}
          </ul>

          {/* mini bottom nav */}
          <div className="grid grid-cols-5 border-t border-ink-700/80 bg-ink-950/70 px-1 pb-1 pt-1.5">
            {[IconPulse, IconTerminal, IconLedger, IconCode, IconTag].map((Icon, i) => (
              <span key={i} className="flex flex-col items-center gap-0.5">
                <span
                  className={`flex h-5 w-9 items-center justify-center rounded-full ${
                    i === 0 ? "bg-pine-600/25 text-pine-500" : "text-mute2"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                </span>
              </span>
            ))}
          </div>
          {/* gesture bar */}
          <span className="mx-auto mb-1.5 h-1 w-20 rounded-full bg-fog/25" />
        </div>
      </div>

      {/* caption */}
      <p className="mt-3 text-center font-mono text-[10px] leading-relaxed text-mute2">
        <span className="text-pine-700">switchboard.apk</span> — live preview
        <br />
        offline-ready · service-worker cached
      </p>
    </div>
  );
}
