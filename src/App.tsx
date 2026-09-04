import { useEffect, useState, type ReactNode } from "react";
import BottomNav from "./components/BottomNav";
import Developers from "./components/Developers";
import ErrorBoundary from "./components/ErrorBoundary";
import GetAppModal, { type InstallPromptEvent } from "./components/GetAppModal";
import { IconDownload, IconPause, IconPlay, IconPlus, IconTag, IconX, LogoMark } from "./components/icons";
import Ledger from "./components/Ledger";
import Overview from "./components/Overview";
import Releases from "./components/Releases";
import Sidebar from "./components/Sidebar";
import Terminal from "./components/Terminal";
import Toasts from "./components/Toasts";
import { Modal, ModalClose, Toggle } from "./components/ui";
import { AppProvider, useApp, VERSION } from "./lib/store";
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
  releases: {
    title: "Releases",
    sub: "Every console build, tagged, checksummed, and accounted for.",
  },
};

const RELEASE_NOTES: { version: string; date: string; notes: string[] }[] = [
  {
    version: "1.0.0",
    date: "General availability",
    notes: [
      "Live authorization stream with pause/resume controls and per-window throughput charting",
      "Capture terminal with Luhn validation, brand routing, and 3-D Secure challenge flow",
      "Payment ledger with full-text search, status filters, refunds, and CSV export",
      "Developer console: revocable secret keys, quickstart snippets, webhook inspector",
      "Schema-versioned local persistence — console state survives reloads and upgrades",
      "Installable app shell — web manifest, offline service worker, signed Android APK path via Bubblewrap",
      "Android app parity — material-style bottom tab bar on phones and a live on-device preview",
      "Release bundle download — real .zip with checksum manifest and the Bubblewrap APK build kit",
      "One-click app download from the release — packs the live installable build as a ready-to-serve .zip",
      "Android project download — complete Gradle TWA that ./build-apk.sh compiles into the signed APK",
      "Error boundary, keyboard shortcuts (1–5, /, ?), and sandbox reset under Danger zone",
    ],
  },
];

/* ---------- boot sequence ---------- */
const BOOT_LINES = [
  "resolving routing table",
  "hydrating ledger from local vault",
  "verifying sandbox credentials",
  "connecting authorization stream",
];

function BootScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, BOOT_LINES.length)), 330);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="hatch flex min-h-screen flex-col items-center justify-center bg-ink-950 p-6">
      <div className="anim-rise w-full max-w-sm">
        <div className="flex items-center gap-3">
          <LogoMark className="h-10 w-10 shadow-lg shadow-pine-600/40" />
          <div>
            <p className="font-display text-xl font-bold leading-tight text-white">Switchboard</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mute2">
              payments console · v{VERSION}
            </p>
          </div>
        </div>
        <ul className="mt-6 space-y-2.5">
          {BOOT_LINES.slice(0, Math.max(step, 1)).map((line, i) => {
            const done = i < step;
            const active = i === step - 1 && step < BOOT_LINES.length;
            return (
              <li key={line} className="anim-pop flex items-center gap-2.5 font-mono text-[11.5px]">
                {done && !active ? (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-pine-600/25 text-pine-500">
                    <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12.5 9.5 18 20 6.5" />
                    </svg>
                  </span>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin text-mute2" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                )}
                <span className={done ? "text-fog" : "text-mute2"}>{line}…</span>
                {done && !active && <span className="ml-auto font-mono text-[10px] text-pine-500">ok</span>}
              </li>
            );
          })}
        </ul>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-ink-700">
          <div
            className="h-full rounded-full bg-pine-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / BOOT_LINES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function BootGate({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"show" | "fade" | "done">(() => {
    try {
      return sessionStorage.getItem("sb:booted") ? "done" : "show";
    } catch {
      return "show";
    }
  });
  useEffect(() => {
    if (phase === "done") return;
    const t1 = window.setTimeout(() => setPhase("fade"), 1750);
    const t2 = window.setTimeout(() => {
      try {
        sessionStorage.setItem("sb:booted", "1");
      } catch {
        /* noop */
      }
      setPhase("done");
    }, 2250);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (phase === "done") return <>{children}</>;
  return (
    <>
      {children}
      <div
        className={`fixed inset-0 z-[90] transition-opacity duration-500 ${
          phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      >
        <BootScreen />
      </div>
    </>
  );
}

/* ---------- header clock ---------- */
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
  const { state, setView, toggleEnv, toggleRunning, toast } = useApp();
  const [changelog, setChangelog] = useState(false);
  const [getApp, setGetApp] = useState(false);
  const [installEvt, setInstallEvt] = useState<InstallPromptEvent | null>(null);
  const [banner, setBanner] = useState(() => {
    try {
      return localStorage.getItem("sb:banner:1.0.0") !== "1";
    } catch {
      return true;
    }
  });
  const meta = META[state.view];

  /* document title follows the active view */
  useEffect(() => {
    document.title = `${meta.title} · Switchboard`;
  }, [meta.title]);

  /* global keyboard shortcuts */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const views: View[] = ["overview", "terminal", "ledger", "developers", "releases"];
      if (e.key >= "1" && e.key <= "5") {
        setView(views[Number(e.key) - 1]);
      } else if (e.key === "/") {
        e.preventDefault();
        setView("ledger");
        window.setTimeout(() => window.dispatchEvent(new CustomEvent("sb:focus-search")), 80);
      } else if (e.key === "?") {
        setChangelog(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setView]);

  /* capture the browser's install offer (PWA / Android) */
  useEffect(() => {
    const onOffer = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onOffer);
    return () => window.removeEventListener("beforeinstallprompt", onOffer);
  }, []);

  /* other views can request the Get-app modal */
  useEffect(() => {
    const onOpen = () => setGetApp(true);
    window.addEventListener("sb:open-getapp", onOpen);
    return () => window.removeEventListener("sb:open-getapp", onOpen);
  }, []);

  async function runInstall() {
    if (!installEvt) {
      setGetApp(true);
      return;
    }
    await installEvt.prompt();
    const choice = await installEvt.userChoice;
    if (choice.outcome === "accepted") {
      toast("ok", "Installed — Switchboard is on your launcher now.");
      setInstallEvt(null);
    } else {
      toast("info", "Install dismissed — reopen it any time from Get app.");
    }
  }

  function dismissBanner() {
    setBanner(false);
    try {
      localStorage.setItem("sb:banner:1.0.0", "1");
    } catch {
      /* noop */
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col pb-[64px] md:pb-0">
        {/* release banner */}
        {banner && (
          <div className="anim-feed flex items-center gap-2.5 border-b border-pine-700/40 bg-pine-600 px-4 py-2 text-white md:px-6">
            <IconTag className="h-4 w-4 shrink-0 text-pine-200" />
            <p className="min-w-0 truncate text-[12.5px] font-medium">
              <span className="font-display font-bold">Switchboard v{VERSION} is live.</span>{" "}
              <span className="hidden text-pine-200 sm:inline">Ledger CSV export, sandbox reset, and keyboard shortcuts ship in this release.</span>
            </p>
            <button
              type="button"
              onClick={() => setChangelog(true)}
              className="ml-auto shrink-0 rounded-md bg-pine-700/70 px-2.5 py-1 font-mono text-[10.5px] font-semibold transition-colors hover:bg-pine-700 active:scale-95"
            >
              Release notes
            </button>
            <button
              type="button"
              onClick={dismissBanner}
              aria-label="Dismiss release banner"
              className="shrink-0 rounded-md p-1 text-pine-200 transition-colors hover:bg-pine-700/70 hover:text-white"
            >
              <IconX className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

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
              <button
                type="button"
                onClick={() => (installEvt ? runInstall() : setGetApp(true))}
                title={installEvt ? "Install the console app" : "Get the app — install & Android APK"}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 font-mono text-[11px] font-semibold text-mute transition-all hover:border-pine-600 hover:text-pine-700 active:scale-95"
              >
                <IconDownload className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{installEvt ? "Install app" : "Get app"}</span>
              </button>
              <button
                type="button"
                onClick={() => setChangelog(true)}
                title="Release notes (press ?)"
                className="rounded-lg border border-pine-600/40 bg-pine-50 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-pine-700 transition-colors hover:bg-pine-100 active:scale-95"
              >
                v{VERSION}
              </button>
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
            {state.view === "releases" && <Releases />}
          </div>
        </main>

        <footer className="border-t border-line bg-paper px-4 py-3 md:px-6">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] text-mute2">
            <span className="font-semibold text-mute">switchboard sandbox</span>
            <span>no real funds move in this environment</span>
            <span className="hidden sm:inline">shortcuts: 1–5 views · / search · ? release notes</span>
            <button
              type="button"
              onClick={() => setGetApp(true)}
              className="underline decoration-dotted underline-offset-2 transition-colors hover:text-pine-700"
            >
              get the app · android apk
            </button>
            <span className="ml-auto">region us-east-1 · shard 04 · build {VERSION} · schema v2</span>
          </p>
        </footer>
      </div>

      <Toasts />
      <BottomNav />

      <GetAppModal
        open={getApp}
        onClose={() => setGetApp(false)}
        installEvt={installEvt}
        onInstall={runInstall}
      />

      {/* changelog */}
      <Modal open={changelog} onClose={() => setChangelog(false)} width="max-w-lg">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine-100">
              <IconTag className="h-5 w-5 text-pine-700" />
            </span>
            <ModalClose onClose={() => setChangelog(false)} />
          </div>
          <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">Release notes</h3>
          <div className="scroll-slim mt-3 max-h-[52vh] space-y-5 overflow-y-auto pr-1">
            {RELEASE_NOTES.map((r) => (
              <div key={r.version} className="relative border-l-2 border-pine-600/30 pl-4">
                <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-pine-600" />
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="rounded-md bg-ink-900 px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                    v{r.version}
                  </span>
                  <span className="font-mono text-[10.5px] uppercase tracking-wider text-mute2">{r.date}</span>
                </div>
                <ul className="mt-2.5 space-y-1.5">
                  {r.notes.map((n) => (
                    <li key={n} className="flex gap-2 text-[12.5px] leading-relaxed text-mute">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-pine-600" />
                      {n}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-3">
            <p className="font-mono text-[10.5px] text-mute2">
              console build {VERSION} · schema v{2} · state persists locally between sessions
            </p>
            <button
              type="button"
              onClick={() => {
                setChangelog(false);
                setView("releases");
              }}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-pine-600/50 bg-pine-50 px-3 py-1.5 font-mono text-[11px] font-semibold text-pine-700 transition-all hover:bg-pine-100 active:scale-95"
            >
              <IconTag className="h-3.5 w-3.5" /> Full release timeline
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BootGate>
          <Shell />
        </BootGate>
      </AppProvider>
    </ErrorBoundary>
  );
}
