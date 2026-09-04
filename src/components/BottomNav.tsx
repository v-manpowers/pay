import type { ComponentType } from "react";
import { useApp } from "../lib/store";
import type { View } from "../lib/types";
import { IconCode, IconLedger, IconPulse, IconTag, IconTerminal } from "./icons";

const TABS: { view: View; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { view: "overview", label: "Home", icon: IconPulse },
  { view: "terminal", label: "Terminal", icon: IconTerminal },
  { view: "ledger", label: "Ledger", icon: IconLedger },
  { view: "developers", label: "Dev", icon: IconCode },
  { view: "releases", label: "Releases", icon: IconTag },
];

export default function BottomNav() {
  const { state, setView } = useApp();
  return (
    <nav
      aria-label="Primary"
      className="hatch fixed inset-x-0 bottom-0 z-50 border-t border-ink-700 bg-ink-900/[0.97] pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="grid grid-cols-5">
        {TABS.map(({ view, label, icon: Icon }) => {
          const active = state.view === view;
          return (
            <button
              key={view}
              type="button"
              onClick={() => {
                setView(view);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              aria-current={active ? "page" : undefined}
              className="group flex flex-col items-center gap-0.5 pb-1.5 pt-1.5 transition-transform active:scale-95"
            >
              <span
                className={`flex h-7 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                  active ? "bg-pine-600/25 text-pine-500" : "text-fog group-hover:bg-ink-800"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span
                className={`font-mono text-[9px] transition-colors ${
                  active ? "font-semibold text-pine-500" : "text-mute2"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
