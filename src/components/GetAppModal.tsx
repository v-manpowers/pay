import { useState } from "react";
import { buildAppBundleZip, downloadBlob } from "../lib/releaseZip";
import { CURRENT_VERSION, RELEASES } from "../lib/releases";
import { useApp } from "../lib/store";
import { IconBolt, IconCode, IconDownload, IconGlobe, IconInfo, IconShield } from "./icons";
import PhonePreview from "./PhonePreview";
import { CopyBtn, Modal, ModalClose, SectionLabel } from "./ui";

export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const BUBBLEWRAP_STEPS: { cmd: string; note: string }[] = [
  {
    cmd: "npm i -g @bubblewrap/cli",
    note: "Google's TWA toolchain — builds a signed Android package from any web manifest",
  },
  {
    cmd: "bubblewrap init --manifest=https://your-domain.example/manifest.webmanifest",
    note: "generates twa-manifest.json and walks you through signing-key setup",
  },
  {
    cmd: "bubblewrap build",
    note: "outputs switchboard-signed.apk plus a Play-ready switchboard.aab",
  },
];

export default function GetAppModal({
  open,
  onClose,
  installEvt,
  onInstall,
}: {
  open: boolean;
  onClose: () => void;
  installEvt: InstallPromptEvent | null;
  onInstall: () => void;
}) {
  const { toast } = useApp();
  const [zipping, setZipping] = useState(false);

  async function downloadApp() {
    setZipping(true);
    try {
      const release = RELEASES[0];
      const blob = await buildAppBundleZip(release);
      downloadBlob(blob, `switchboard-${CURRENT_VERSION.replace(/^v/, "")}-app.zip`);
      toast("ok", "App build downloading — unzip and serve it, then install on any device.");
    } catch {
      toast("bad", "Couldn't fetch the app build from this origin.");
    } finally {
      setZipping(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} width="max-w-3xl">
      <div className="grid gap-6 p-5 md:grid-cols-[1fr_272px]">
        <div className="min-w-0">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine-100">
              <IconDownload className="h-5 w-5 text-pine-700" />
            </span>
            <ModalClose onClose={onClose} />
          </div>
        <h3 className="mt-3 font-display text-[17px] font-bold text-ink-900">
          Get Switchboard on a device
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-mute">
          The console ships as an installable app shell — offline-capable once cached — and the same
          v1.0.0 build compiles into a signed Android APK with no code fork.
        </p>

        {/* one-click app download */}
        <button
          type="button"
          onClick={downloadApp}
          disabled={zipping}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-pine-600 px-4 py-2.5 font-display text-[13.5px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
        >
          {zipping ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6">
              <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
            </svg>
          ) : (
            <IconDownload className="h-4 w-4" />
          )}
          {zipping ? "Packing the app…" : `Download the app (.zip) · ${CURRENT_VERSION}`}
        </button>

        {/* instant install */}
        <div className="mt-4 rounded-xl border border-line bg-paper/70 p-4">
          <div className="flex items-center gap-2">
            <IconBolt className="h-4 w-4 text-pine-600" />
            <SectionLabel>Instant install</SectionLabel>
          </div>
          {installEvt ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onInstall}
                className="inline-flex items-center gap-2 rounded-lg bg-pine-600 px-3.5 py-2 font-display text-[13px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-700 active:translate-y-px"
              >
                <IconDownload className="h-4 w-4" /> Install console app
              </button>
              <span className="font-mono text-[10.5px] text-mute2">
                adds the icon to your home screen / launcher
              </span>
            </div>
          ) : (
            <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-mute">
              <span className="font-semibold text-ink-900">Android Chrome:</span> ⋮ menu → “Install app” or
              “Add to Home screen” · <span className="font-semibold text-ink-900">iOS Safari:</span> Share →
              “Add to Home Screen”. The native prompt appears here automatically when the browser offers it.
            </p>
          )}
        </div>

        {/* android apk */}
        <div className="mt-3 rounded-xl border border-ink-700 bg-ink-900 p-4">
          <div className="flex items-center gap-2">
            <IconCode className="h-4 w-4 text-pine-500" />
            <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-fog">
              Android APK · TWA build
            </span>
            <span className="ml-auto font-mono text-[9.5px] uppercase tracking-wider text-mute2">
              ~6 MB signed
            </span>
          </div>
          <ol className="mt-3 space-y-2.5">
            {BUBBLEWRAP_STEPS.map((s, i) => (
              <li key={s.cmd}>
                <div className="flex items-center gap-1 rounded-lg bg-ink-950/80 py-1 pl-2.5 pr-1">
                  <span className="mr-1.5 font-mono text-[10px] font-semibold text-pine-500">{i + 1}</span>
                  <code className="scroll-dark min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-pine-200">
                    {s.cmd}
                  </code>
                  <CopyBtn text={s.cmd} dark />
                </div>
                <p className="mt-1 pl-6 font-mono text-[9.5px] text-mute2">{s.note}</p>
              </li>
            ))}
          </ol>
          <div className="mt-3 flex items-start gap-2 rounded-lg bg-ink-800/70 px-3 py-2.5">
            <IconGlobe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fog" />
            <p className="font-mono text-[10px] leading-relaxed text-fog">
              No CLI? Paste the deployed URL into{" "}
              <span className="font-semibold text-white">pwabuilder.com → Package → Android</span> and it
              emits a signed APK/AAB pair from the same manifest.
            </p>
          </div>
        </div>

          <div className="mt-3.5 flex items-start gap-2 font-mono text-[10px] leading-relaxed text-mute2">
            <IconShield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pine-600" />
            <span>
              Serve over HTTPS and publish{" "}
              <code className="rounded bg-paper px-1 py-0.5 font-mono text-[9.5px] text-ink-900">
                /.well-known/assetlinks.json
              </code>{" "}
              — already generated in dist — so the TWA verifies its domain link and runs fullscreen.
              <span className="ml-1 inline-block align-middle">
                <CopyBtn text="/.well-known/assetlinks.json" />
              </span>
            </span>
          </div>
          <p className="mt-2 flex items-start gap-2 font-mono text-[10px] leading-relaxed text-mute2">
            <IconInfo className="mt-0.5 h-3.5 w-3.5 shrink-0 text-info-600" />
            Ledger, keys, and webhook history persist in the device vault, so the installed app survives
            restarts exactly like this tab does.
          </p>
        </div>

        {/* on-device preview */}
        <div className="flex items-start justify-center rounded-xl bg-ink-950/[0.04] p-4 md:bg-transparent md:p-0 md:pt-1">
          <PhonePreview />
        </div>
      </div>
    </Modal>
  );
}
