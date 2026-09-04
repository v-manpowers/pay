import { useMemo } from "react";
import { ago, moneyShort } from "../lib/engine";
import { useApp } from "../lib/store";
import { AreaChart, Donut, HourBars } from "./charts";
import { IconArrowDownRight, IconArrowUpRight } from "./icons";
import LiveFeed from "./LiveFeed";
import { Chip, RiskMeter, SectionLabel, useCountUp } from "./ui";

function StatTile({
  label,
  value,
  format,
  delta,
  invert,
}: {
  label: string;
  value: number;
  format: (v: number) => string;
  delta: number;
  invert?: boolean;
}) {
  const animated = useCountUp(value);
  const up = delta >= 0;
  const good = invert ? !up : up;
  return (
    <div className="group rounded-xl border border-line bg-card p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-mute2/60 hover:shadow-md">
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-2 font-display text-[26px] font-bold leading-none tabular text-ink-900">
        {format(animated)}
      </p>
      <p
        className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10.5px] font-semibold tabular ${
          good ? "bg-ok-100 text-ok-700" : "bg-bad-100 text-bad-700"
        }`}
      >
        {up ? <IconArrowUpRight className="h-3 w-3" /> : <IconArrowDownRight className="h-3 w-3" />}
        {Math.abs(delta).toFixed(1)}%
        <span className="font-normal text-mute">vs prev hr</span>
      </p>
    </div>
  );
}

export default function Overview() {
  const { state } = useApp();

  const stats = useMemo(() => {
    const settled = state.txns.filter((t) => t.status === "approved" || t.status === "refunded");
    const approved = state.txns.filter((t) => t.status === "approved");
    const declined = state.txns.filter((t) => t.status === "declined");
    const volume = settled.reduce((a, t) => a + t.amount, 0);
    const successRate =
      approved.length + declined.length === 0
        ? 100
        : (approved.length / (approved.length + declined.length)) * 100;
    const avgTicket = approved.length ? volume / Math.max(1, settled.length) : 0;
    const recent = state.series.slice(-8).reduce((a, b) => a + b, 0);
    const prev = state.series.slice(-16, -8).reduce((a, b) => a + b, 0) || 1;
    const delta = ((recent - prev) / prev) * 100;
    return { volume, successRate, avgTicket, auths: state.txns.length, delta, declined };
  }, [state.txns, state.series]);

  const brandMix = useMemo(() => {
    const count = { visa: 0, mastercard: 0, amex: 0, discover: 0, card: 0 } as Record<string, number>;
    state.txns.forEach((t) => (count[t.brand] = (count[t.brand] ?? 0) + 1));
    return [
      { label: "Visa Direct", value: count.visa, color: "#1a34b8" },
      { label: "Mastercard MIP", value: count.mastercard, color: "#f79e1b" },
      { label: "Amex GW", value: count.amex, color: "#2e77bc" },
      { label: "Discover Net", value: count.discover, color: "#f48120" },
      { label: "Other routes", value: count.card, color: "#8ba0b3" },
    ].filter((s) => s.value > 0);
  }, [state.txns]);

  const currentWin = state.series[state.series.length - 1];

  return (
    <div className="space-y-4">
      {/* stat tiles */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatTile
          label="Settled volume"
          value={stats.volume}
          format={(v) => moneyShort(v)}
          delta={stats.delta}
        />
        <StatTile
          label="Success rate"
          value={stats.successRate}
          format={(v) => `${v.toFixed(1)}%`}
          delta={stats.delta * 0.3 + 1.2}
        />
        <StatTile
          label="Avg ticket"
          value={stats.avgTicket}
          format={(v) => moneyShort(v)}
          delta={-stats.delta * 0.4 + 0.8}
        />
        <StatTile label="Authorizations" value={stats.auths} format={(v) => Math.round(v).toString()} delta={stats.delta * 0.9} />
      </div>

      {/* throughput + feed */}
      <div className="grid gap-3 xl:grid-cols-[1fr_400px]">
        <section className="rounded-xl border border-line bg-card shadow-sm">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-line px-4 py-3">
            <div>
              <h2 className="font-display text-[15px] font-bold text-ink-900">Gateway throughput</h2>
              <p className="font-mono text-[10.5px] text-mute2">settled $ per routing window · 36 windows</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-display text-lg font-bold tabular leading-none text-pine-700">
                ${currentWin}
              </p>
              <p className="font-mono text-[9.5px] uppercase tracking-wider text-mute2">current window</p>
            </div>
          </header>
          <div className="p-3 pb-1">
            <AreaChart data={state.series} className="h-[210px]" />
          </div>
          <footer className="flex items-center justify-between px-4 pb-3 pt-1">
            <span className="font-mono text-[10px] text-mute2">−90s</span>
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-mute2">
              <span className={`h-1.5 w-1.5 rounded-full ${state.running ? "pulse-dot bg-pine-500" : "bg-mute2"}`} />
              {state.running ? "live" : "paused"}
            </span>
            <span className="font-mono text-[10px] text-mute2">now</span>
          </footer>
        </section>

        <div className="max-h-[430px] min-h-[360px] xl:max-h-none">
          <LiveFeed limit={9} />
        </div>
      </div>

      {/* bottom row */}
      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[15px] font-bold text-ink-900">Volume by hour</h2>
            <SectionLabel>trailing 12h</SectionLabel>
          </div>
          <HourBars data={state.hourly} />
        </section>

        <section className="rounded-xl border border-line bg-card shadow-sm">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-[15px] font-bold text-ink-900">Recent declines</h2>
            <Chip status="declined" small />
          </header>
          {stats.declined.length === 0 ? (
            <p className="p-6 text-center text-[12.5px] text-mute">No declines on record — clean run.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {stats.declined.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-medium text-ink-900">{t.name}</p>
                    <p className="font-mono text-[10.5px] text-bad-600">{t.reason?.replace(/_/g, " ")}</p>
                  </div>
                  <RiskMeter risk={t.risk} />
                  <span className="w-14 text-right font-mono text-[10.5px] tabular text-mute2">{ago(t.created)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-[15px] font-bold text-ink-900">Network mix</h2>
            <SectionLabel>by auth count</SectionLabel>
          </div>
          <Donut segments={brandMix} centerValue={String(state.txns.length)} centerLabel="auths" />
        </section>
      </div>
    </div>
  );
}
