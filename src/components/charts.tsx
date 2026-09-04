import { useId, useState } from "react";
import { moneyShort } from "../lib/engine";

/* ---------- live area chart ---------- */
export function AreaChart({
  data,
  stroke = "var(--color-pine-600)",
  className = "",
}: {
  data: number[];
  stroke?: string;
  className?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const w = 640;
  const h = 190;
  const pad = 10;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * w,
    h - pad - ((v - min) / range) * (h - pad * 3),
  ]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${d} L${w},${h} L0,${h} Z`;
  const last = pts[pts.length - 1];
  const gridYs = [0.25, 0.5, 0.75].map((f) => h - pad - f * (h - pad * 3));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={`block w-full ${className}`}>
      <defs>
        <linearGradient id={`g${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {gridYs.map((y) => (
        <line key={y} x1="0" x2={w} y1={y} y2={y} stroke="var(--color-line)" strokeWidth="1" strokeDasharray="3 5" />
      ))}
      <path d={area} fill={`url(#g${gid})`} />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.4" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="4" fill={stroke} className="pulse-dot" />
    </svg>
  );
}

/* ---------- hourly bars ---------- */
export function HourBars({ data }: { data: number[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data);
  const now = new Date().getHours();
  return (
    <div className="flex h-40 items-end gap-1.5">
      {data.map((v, i) => {
        const isNow = i === data.length - 1;
        return (
          <div
            key={i}
            className="group relative flex h-full flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {hover === i && (
              <span className="anim-pop absolute -top-7 z-10 whitespace-nowrap rounded-md bg-ink-900 px-2 py-1 font-mono text-[10.5px] font-medium text-white shadow-lg">
                {moneyShort(v)}
              </span>
            )}
            <div
              className={`w-full rounded-t-[3px] transition-all duration-500 ${
                isNow ? "bg-pine-600" : "bg-ink-900/12 group-hover:bg-ink-900/25"
              }`}
              style={{ height: `${Math.max(4, (v / max) * 100)}%` }}
            />
            <span
              className={`mt-1.5 font-mono text-[9px] tabular ${
                isNow ? "font-semibold text-pine-700" : "text-mute2"
              }`}
            >
              {isNow ? "now" : `${(now - (data.length - 1 - i) + 24) % 24}h`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- donut ---------- */
export function Donut({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string;
}) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 44;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <div className="relative h-32 w-32 shrink-0">
        <svg viewBox="0 0 110 110" className="h-full w-full -rotate-90">
          <circle cx="55" cy="55" r={R} fill="none" stroke="var(--color-line)" strokeWidth="13" />
          {segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.label}
                cx="55"
                cy="55"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="13"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-offset}
                className="transition-all duration-700"
              />
            );
            offset += len;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold text-ink-900 tabular">{centerValue}</span>
          <span className="font-mono text-[9.5px] uppercase tracking-wider text-mute2">{centerLabel}</span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: s.color }} />
            <span className="truncate text-mute">{s.label}</span>
            <span className="ml-auto font-mono text-[11.5px] font-semibold tabular text-ink-900">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
