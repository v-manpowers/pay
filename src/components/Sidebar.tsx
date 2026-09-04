import type { ComponentType } from "react";
import { useApp } from "../lib/store";
import type { View } from "../lib/types";
import {
  IconBolt,
  IconCode,
  IconLedger,
  IconPulse,
  IconTag,
  IconTerminal,
  LogoMark,
} from "./icons";

const NAV: { view: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { view: "overview", label: "Overview", icon: IconPulse },
  { view: "terminal", label: "Terminal", icon: IconTerminal },
  { view: "ledger", label: "Ledger", icon: IconLedger },
  { view: "developers", label: "Developers", icon: IconCode },
  { view: "releases", label: "Releases", icon: IconTag },
];

export default function Sidebar() {
  const { state, setView } = useApp();
  const todayCount = state.txns.length;

  return (
    <aside className="hatch sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-ink-700/60 bg-ink-900 text-fog md:w-60">
      {/* brand */}
      <div className="flex items-center gap-3 px-3 py-5 md:px-5">
        <LogoMark className="h-8 w-8 shrink-0 shadow-lg shadow-pine-600/30" />
        <div className="hidden min-w-0 md:block">
          <p className="font-display text-[17px] font-bold leading-tight text-white">Switchboard</p>
          <p className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-mute2">
            Payments console
          </p>
        </div>
      </div>

      {/* nav */}
      <nav className="mt-2 flex-1 space-y-1 px-2 md:px-3">
        {NAV.map(({ view, label, icon: Icon }) => {
          const active = state.view === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => setView(view)}
              title={label}
              className={`group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-all duration-150 md:px-3 ${
                active
                  ? "bg-ink-800 text-white"
                  : "text-fog hover:bg-ink-850 hover:text-white active:translate-y-px"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-pine-500 transition-opacity ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
              <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-pine-500" : ""}`} />
              <span className="hidden flex-1 text-[13.5px] font-medium md:block">{label}</span>
              {view === "ledger" && (
                <span className="hidden rounded-full bg-ink-700 px-2 py-0.5 font-mono text-[10px] tabular text-fog md:block">
                  {todayCount}
                </span>
              )}
              {view === "overview" && state.running && (
                <span className="pulse-dot hidden h-1.5 w-1.5 rounded-full bg-pine-500 md:block" />
              )}
            </button>
          );
        })}
      </nav>

      {/* stream status */}
      <div className="mx-2 mb-3 hidden rounded-lg border border-ink-700/70 bg-ink-850/70 p-3 md:mx-3 md:block">
        <div className="flex items-center gap-2">
          <IconBolt className={`h-3.5 w-3.5 ${state.running ? "text-pine-500" : "text-mute2"}`} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-fog">
            Auth stream
          </span>
        </div>
        <p className="mt-1.5 font-mono text-[10.5px] leading-relaxed text-mute2">
          {state.running ? (
            <>
              listening on <span className="text-pine-500">us-east-1</span>
              <span className="blink text-pine-500">▍</span>
            </>
          ) : (
            "stream paused by operator"
          )}
        </p>
      </div>

      {/* system status */}
      <div className="border-t border-ink-700/60 px-3 py-4 md:px-5">
        <div className="flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-ok-600" />
          <span className="hidden text-[12px] font-medium text-fog md:block">All systems operational</span>
        </div>
        <p className="mt-1.5 hidden font-mono text-[10px] text-mute2 md:block">
          api v2.4.1 · uptime 99.99% · 42ms
        </p>
      </div>
    </aside>
  );
}
