import { useEffect, useState } from "react";
import Developers from "./components/Developers";
import { IconPause, IconPlay, IconPlus } from "./components/icons";
import Ledger from "./components/Ledger";
import Overview from "./components/Overview";
import Sidebar from "./components/Sidebar";
import Terminal from "./components/Terminal";
import Toasts from "./components/Toasts";
import { Toggle } from "./components/ui";
import { AppProvider, useApp } from "./lib/store";
import type { View } from "./lib/types";

const META: Record<View, { title: string; sub: string }> = {
  overview: {
    title: "Operations overview",
    sub: "Every authorization routed through your gateway, as it happens.",
  },
  terminal: {
    title: "Capture terminal",
    sub: "Key in a card and route an authorization through the live switch.",
  },
  ledger: {
    title: "Payment ledger",
    sub: "The full payment-object record — searchable, inspectable, refundable.",
  },
  developers: {
    title: "Developer console",
    sub: "Credentials, quickstart snippets, and webhook delivery health.",
  },
};

function UtcClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return (
    <span
      className="hidden rounded-lg border border-line bg-card px-3 py-1.5 font-mono text-[12px] font-medium tabular text-ink-900 sm:block"
      title="Console time (UTC)"
    >
      {now.toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })}{" "}
      <span className="text-mute2">UTC</span>
    </span>
  );
}

function Shell() {
  const { state, setView, toggleEnv, toggleRunning } = useApp();
  const meta = META[state.view];

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* header */}
        <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <h1 className="truncate font-display text-[19px] font-bold leading-tight text-ink-900 md:text-[21px]">
                {meta.title}
              </h1>
              <p className="hidden truncate text-[12px] text-mute md:block">{meta.sub}</p>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <UtcClock />
              <Toggle
                on={state.env === "live"}
                onChange={(v) => toggleEnv(v ? "live" : "test")}
                labelOff="TEST"
                labelOn="LIVE"
                danger
              />
              <button
                type="button"
                onClick={toggleRunning}
                title={state.running ? "Pause the auth stream" : "Resume the auth stream"}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-all active:scale-95 ${
                  state.running
                    ? "border-line bg-card text-mute hover:border-warn-600 hover:text-warn-600"
                    : "border-pine-600/50 bg-pine-50 text-pine-700 hover:bg-pine-100"
                }`}
              >
                {state.running ? <IconPause className="h-3.5 w-3.5" /> : <IconPlay className="h-3.5 w-3.5" />}
                <span className="hidden lg:inline">{state.running ? "Pause stream" : "Resume stream"}</span>
              </button>
              <button
                type="button"
                onClick={() => setView("terminal")}
                className="flex items-center gap-1.5 rounded-lg bg-pine-600 px-3 py-2 font-display text-[13px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px"
              >
                <IconPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New payment</span>
              </button>
            </div>
          </div>
        </header>

        {/* view */}
        <main className="dotgrid min-w-0 flex-1">
          <div key={state.view} className="anim-rise mx-auto w-full max-w-[1400px] p-4 md:p-6">
            {state.view === "overview" && <Overview />}
            {state.view === "terminal" && <Terminal />}
            {state.view === "ledger" && <Ledger />}
            {state.view === "developers" && <Developers />}
          </div>
        </main>

        <footer className="border-t border-line bg-paper px-4 py-3 md:px-6">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-mute2">
            <span className="font-semibold text-mute">switchboard sandbox</span>
            <span>no real funds move in this environment</span>
            <span className="ml-auto">region us-east-1 · shard 04 · build 2.4.1</span>
          </p>
        </footer>
      </div>

      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
