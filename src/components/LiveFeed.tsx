import { ago, clockTime, money } from "../lib/engine";
import { useApp } from "../lib/store";
import { BrandMark, IconPause, IconPlay } from "./icons";
import { Chip, SectionLabel } from "./ui";

export default function LiveFeed({ limit = 14 }: { limit?: number }) {
  const { state, toggleRunning } = useApp();
  const items = state.txns.slice(0, limit);

  return (
    <section className="flex h-full flex-col rounded-xl border border-line bg-card shadow-sm">
      <header className="flex items-center gap-2.5 border-b border-line px-4 py-3">
        <span
          className={`h-2 w-2 rounded-full ${state.running ? "pulse-dot bg-pine-500" : "bg-mute2"}`}
        />
        <h2 className="font-display text-[15px] font-bold text-ink-900">Authorization stream</h2>
        <span className="ml-auto font-mono text-[10.5px] tabular text-mute2">
          {items.length} recent
        </span>
        <button
          type="button"
          onClick={toggleRunning}
          title={state.running ? "Pause stream" : "Resume stream"}
          className="rounded-md border border-line p-1.5 text-mute transition-colors hover:border-pine-600 hover:text-pine-600 active:scale-95"
        >
          {state.running ? <IconPause className="h-3.5 w-3.5" /> : <IconPlay className="h-3.5 w-3.5" />}
        </button>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <p className="font-display text-[15px] font-semibold text-ink-900">Stream is quiet</p>
          <p className="max-w-[220px] text-[12.5px] leading-relaxed text-mute">
            Resume the auth stream or capture a payment from the terminal to see activity here.
          </p>
        </div>
      ) : (
        <ul className="scroll-slim min-h-0 flex-1 divide-y divide-line/70 overflow-y-auto">
          {items.map((t) => (
            <li key={t.id} className="anim-feed flex items-center gap-3 px-4 py-2.5">
              <span className="w-14 shrink-0 font-mono text-[10.5px] tabular text-mute2" title={ago(t.created)}>
                {clockTime(t.created)}
              </span>
              <BrandMark brand={t.brand} className="h-5 w-[30px] shrink-0 shadow-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-ink-900">{t.name}</p>
                <p className="font-mono text-[10px] text-mute2">•••• {t.last4}</p>
              </div>
              <span
                className={`shrink-0 font-mono text-[12.5px] font-semibold tabular ${
                  t.status === "declined" ? "text-bad-600 line-through decoration-bad-600/40" : "text-ink-900"
                }`}
              >
                {money(t.amount, t.currency)}
              </span>
              <span className="w-[86px] shrink-0 text-right">
                <Chip status={t.status} small />
              </span>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t border-line px-4 py-2.5">
        <SectionLabel>
          {state.running ? "routing · visa_direct · mc_mip · amex_gw" : "stream paused"}
        </SectionLabel>
      </footer>
    </section>
  );
}
