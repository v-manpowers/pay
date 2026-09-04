import { useState } from "react";
import { CURRENT_VERSION, RELEASES, releaseMarkdown, type ChangeKind, type Release } from "../lib/releases";
import { buildAndroidKitZip, buildReleaseBundleZip, downloadBlob } from "../lib/releaseZip";
import { useApp } from "../lib/store";
import { IconBolt, IconCheck, IconChevron, IconCopy, IconDownload, IconTag } from "./icons";
import { CopyBtn, SectionLabel } from "./ui";

const KIND_META: Record<ChangeKind, { label: string; cls: string }> = {
  added: { label: "Added", cls: "bg-ok-100 text-ok-700" },
  improved: { label: "Improved", cls: "bg-info-100 text-info-600" },
  fixed: { label: "Fixed", cls: "bg-warn-100 text-warn-700" },
  security: { label: "Security", cls: "bg-bad-100 text-bad-700" },
  breaking: { label: "Breaking", cls: "bg-ink-900 text-white" },
};

function useNotesActions() {
  const { toast } = useApp();
  const [copied, setCopied] = useState<string | null>(null);

  async function copyNotes(r: Release) {
    try {
      await navigator.clipboard.writeText(releaseMarkdown(r));
      setCopied(r.version);
      window.setTimeout(() => setCopied(null), 1800);
      toast("ok", `Release notes for ${r.version} copied as Markdown.`);
    } catch {
      toast("bad", "Clipboard unavailable — select and copy manually.");
    }
  }

  function downloadNotes(r: Release) {
    const blob = new Blob([releaseMarkdown(r)], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `switchboard-${r.version.replace(/^v/, "")}-notes.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast("ok", `Downloading ${a.download}`);
  }

  return { copied, copyNotes, downloadNotes };
}

function DiffBar({ additions, deletions }: { additions: number; deletions: number }) {
  const total = additions + deletions;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex h-1.5 w-24 overflow-hidden rounded-full bg-line">
        <span className="h-full bg-ok-600" style={{ width: `${(additions / total) * 100}%` }} />
        <span className="h-full bg-bad-600" style={{ width: `${(deletions / total) * 100}%` }} />
      </span>
      <span className="font-mono text-[10.5px] tabular">
        <span className="font-semibold text-ok-600">+{additions.toLocaleString()}</span>
        <span className="mx-1 text-mute2">/</span>
        <span className="font-semibold text-bad-600">−{deletions.toLocaleString()}</span>
      </span>
    </span>
  );
}

function ReleaseCard({ release, index }: { release: Release; index: number }) {
  const { copied, copyNotes, downloadNotes } = useNotesActions();
  const { toast } = useApp();
  const [showAssets, setShowAssets] = useState(Boolean(release.latest));
  const [zipping, setZipping] = useState(false);
  const [zippingKit, setZippingKit] = useState(false);
  const isLatest = Boolean(release.latest);

  async function downloadBundle() {
    setZipping(true);
    try {
      const blob = await buildReleaseBundleZip(release);
      const name = `switchboard-${release.version.replace(/^v/, "")}-bundle.zip`;
      downloadBlob(blob, name);
      toast("ok", `Release bundle downloading — ${name}`);
    } catch {
      toast("bad", "Couldn't assemble the bundle in this browser.");
    } finally {
      setZipping(false);
    }
  }

  async function downloadKit(artifact: string) {
    setZippingKit(true);
    try {
      const blob = await buildAndroidKitZip(release);
      const name = `switchboard-${release.version.replace(/^v/, "")}-android-kit.zip`;
      downloadBlob(blob, name);
      toast("ok", `Build kit for ${artifact} downloading — run android/build.sh to produce it.`);
    } catch {
      toast("bad", "Couldn't assemble the build kit in this browser.");
    } finally {
      setZippingKit(false);
    }
  }

  return (
    <li className="anim-rise relative pl-8 md:pl-12" style={{ animationDelay: `${index * 70}ms` }}>
      {/* timeline node */}
      <span
        className={`absolute left-0 top-6 h-3.5 w-3.5 rounded-full border-2 md:left-1 ${
          isLatest
            ? "border-pine-500 bg-pine-500 pulse-dot"
            : release.prerelease
              ? "border-warn-600 bg-warn-100"
              : "border-mute2 bg-paper"
        }`}
      />
      <span className="absolute bottom-0 left-[6.5px] top-11 w-px bg-line md:left-[8.5px]" />

      <article
        className={`overflow-hidden rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
          isLatest ? "hatch border-ink-700 bg-ink-900" : "border-line bg-card"
        }`}
      >
        <header className={`flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 pb-3 pt-4 md:px-5 ${isLatest ? "border-b border-ink-700" : "border-b border-line"}`}>
          <h3 className={`font-display text-[22px] font-bold leading-none tabular md:text-[26px] ${isLatest ? "text-white" : "text-ink-900"}`}>
            {release.version}
          </h3>
          <span className={`font-display text-[14px] font-semibold ${isLatest ? "text-pine-500" : "text-pine-700"}`}>
            “{release.codename}”
          </span>
          <span className={`font-mono text-[11px] ${isLatest ? "text-fog" : "text-mute2"}`}>{release.displayDate}</span>
          <span className="ml-auto flex items-center gap-1.5">
            {isLatest && (
              <span className="rounded-full bg-pine-600 px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-white">
                Latest
              </span>
            )}
            {release.prerelease && (
              <span className="rounded-full border border-warn-600/50 bg-warn-100 px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-warn-700">
                Pre-release
              </span>
            )}
          </span>
        </header>

        <div className={`flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-2.5 font-mono text-[11px] ${isLatest ? "border-b border-ink-700 text-fog" : "border-b border-line text-mute"}`}>
          <span>
            <span className={isLatest ? "font-semibold text-white" : "font-semibold text-ink-900"}>{release.commits}</span> commits
          </span>
          <DiffBar additions={release.additions} deletions={release.deletions} />
          <span className="ml-auto hidden items-center gap-1.5 sm:flex">
            <IconTag className={`h-3.5 w-3.5 ${isLatest ? "text-pine-500" : "text-mute2"}`} />
            tag <span className={isLatest ? "text-pine-200" : "text-ink-900"}>release/{release.version}</span>
          </span>
        </div>

        <div className="grid gap-4 px-4 py-4 md:grid-cols-2 md:px-5">
          {release.sections.map((s) => (
            <div key={s.kind} className={s.kind === "breaking" ? "md:col-span-2" : ""}>
              <span className={`inline-block rounded px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] ${KIND_META[s.kind].cls}`}>
                {KIND_META[s.kind].label}
              </span>
              <ul className="mt-2 space-y-1.5">
                {s.items.map((item) => (
                  <li key={item} className={`flex gap-2 text-[12.5px] leading-relaxed ${isLatest ? "text-fog" : "text-mute"}`}>
                    <span className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${isLatest ? "bg-pine-500" : "bg-mute2"}`} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* assets */}
        <div className={`border-t ${isLatest ? "border-ink-700" : "border-line"}`}>
          <button
            type="button"
            onClick={() => setShowAssets((v) => !v)}
            className={`flex w-full items-center gap-2 px-4 py-2.5 font-mono text-[11px] font-semibold transition-colors md:px-5 ${
              isLatest ? "text-fog hover:bg-ink-850" : "text-mute hover:bg-paper"
            }`}
          >
            <IconChevron className={`h-3.5 w-3.5 transition-transform duration-200 ${showAssets ? "rotate-180" : ""}`} />
            Assets · {release.assets.length}
          </button>
          {showAssets && (
            <ul className={`anim-rise divide-y px-4 pb-3 md:px-5 ${isLatest ? "divide-ink-700/70" : "divide-line/70"}`}>
              {release.assets.map((a) => (
                <li key={a.name} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                  <span className="min-w-[190px]">
                    <span className={`block font-mono text-[12px] font-medium ${isLatest ? "text-white" : "text-ink-900"}`}>{a.name}</span>
                    {a.note && <span className="block font-mono text-[9.5px] text-mute2">{a.note}</span>}
                  </span>
                  <span className={`font-mono text-[10.5px] ${isLatest ? "text-mute2" : "text-mute2"}`}>{a.size}</span>
                  <code className={`min-w-0 flex-1 truncate rounded px-1.5 py-0.5 font-mono text-[10px] ${isLatest ? "bg-ink-950/60 text-fog" : "bg-paper text-mute"}`}>
                    sha256 {a.sha256.slice(0, 18)}…
                  </code>
                  <span className={isLatest ? "[&>button]:text-fog" : ""}>
                    <CopyBtn text={a.sha256} dark={isLatest} />
                  </span>
                  {a.name.endsWith(".apk") && (
                    <button
                      type="button"
                      onClick={() => downloadKit(a.name)}
                      disabled={zippingKit}
                      title="Download the Android build kit that compiles this artifact"
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] font-bold transition-all active:scale-95 disabled:opacity-60 ${
                        isLatest
                          ? "bg-pine-600/20 text-pine-500 hover:bg-pine-600/30"
                          : "bg-pine-100 text-pine-700 hover:bg-pine-200"
                      }`}
                    >
                      {zippingKit ? (
                        <svg viewBox="0 0 24 24" className="h-3 w-3 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6">
                          <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <IconDownload className="h-3 w-3" />
                      )}
                      build kit
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className={`flex flex-wrap items-center gap-2 border-t px-4 py-3 md:px-5 ${isLatest ? "border-ink-700" : "border-line"}`}>
          {isLatest && (
            <button
              type="button"
              onClick={downloadBundle}
              disabled={zipping}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pine-600 px-3 py-1.5 font-mono text-[11.5px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-500 active:scale-95 disabled:cursor-wait disabled:opacity-70"
            >
              {zipping ? (
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6">
                  <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                </svg>
              ) : (
                <IconDownload className="h-3.5 w-3.5" />
              )}
              {zipping ? "packing…" : "download bundle (.zip)"}
            </button>
          )}
          <button
            type="button"
            onClick={() => copyNotes(release)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11.5px] font-semibold transition-all active:scale-95 ${
              isLatest
                ? "bg-pine-600 text-white hover:bg-pine-500"
                : "border border-line text-mute hover:border-pine-600 hover:text-pine-700"
            }`}
          >
            {copied === release.version ? <IconCheck className="h-3.5 w-3.5" /> : <IconCopy className="h-3.5 w-3.5" />}
            {copied === release.version ? "copied" : "copy notes (.md)"}
          </button>
          <button
            type="button"
            onClick={() => downloadNotes(release)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11.5px] font-semibold transition-all active:scale-95 ${
              isLatest
                ? "border border-ink-700 text-fog hover:bg-ink-850 hover:text-white"
                : "border border-line text-mute hover:border-ink-900 hover:text-ink-900"
            }`}
          >
            <IconDownload className="h-3.5 w-3.5" /> download notes
          </button>
          {isLatest && (
            <span className="ml-auto font-mono text-[10px] text-mute2">signed · reproducible build · sbom available</span>
          )}
        </footer>
      </article>
    </li>
  );
}

export default function Releases() {
  const latest = RELEASES[0];
  const apkAsset = latest.assets.find((a) => a.name.endsWith(".apk")) ?? latest.assets[0];
  const gaCount = RELEASES.filter((r) => !r.prerelease).length;
  const { toast } = useApp();
  const [packing, setPacking] = useState(false);

  async function downloadChannelKit() {
    setPacking(true);
    try {
      const blob = await buildAndroidKitZip(latest);
      const name = `switchboard-${latest.version.replace(/^v/, "")}-android-kit.zip`;
      downloadBlob(blob, name);
      toast("ok", `Android build kit downloading — ${name}`);
    } catch {
      toast("bad", "Couldn't assemble the build kit in this browser.");
    } finally {
      setPacking(false);
    }
  }
  const totalCommits = RELEASES.reduce((a, r) => a + r.commits, 0);

  return (
    <div className="space-y-5">
      {/* cadence strip */}
      <section className="anim-rise flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-line bg-card px-5 py-4 shadow-sm">
        <div>
          <SectionLabel>Current channel</SectionLabel>
          <p className="mt-1 font-display text-[24px] font-bold leading-none text-ink-900">
            {CURRENT_VERSION} <span className="text-[15px] font-semibold text-pine-700">stable</span>
          </p>
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <SectionLabel>Releases</SectionLabel>
          <p className="mt-1 font-display text-[24px] font-bold leading-none tabular text-ink-900">
            {RELEASES.length}
            <span className="ml-1.5 text-[12px] font-medium text-mute">{gaCount} GA · {RELEASES.length - gaCount} RC</span>
          </p>
        </div>
        <div className="h-9 w-px bg-line" />
        <div>
          <SectionLabel>Commits since v0.1.0</SectionLabel>
          <p className="mt-1 font-display text-[24px] font-bold leading-none tabular text-ink-900">{totalCommits}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="pulse-dot h-2 w-2 rounded-full bg-ok-600" />
          <p className="font-mono text-[10.5px] leading-tight text-mute">
            zero-downtime deploys
            <br />
            <span className="text-mute2">cdn edge · 14 regions</span>
          </p>
        </div>
      </section>

      {/* timeline */}
      <div>
        <div className="mb-3 flex items-baseline gap-3">
          <h2 className="font-display text-[17px] font-bold text-ink-900">Release timeline</h2>
          <p className="font-mono text-[10.5px] text-mute2">newest first · semver · notes export as markdown</p>
        </div>
        <ol className="space-y-5">
          {RELEASES.map((r, i) => (
            <ReleaseCard key={r.version} release={r} index={i} />
          ))}
        </ol>
      </div>

      {/* Android channel */}
      <section className="hatch relative overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-5 shadow-sm">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(560px 240px at 90% -10%, rgba(18,147,123,0.22), transparent 65%)" }}
        />
        <div className="relative flex flex-wrap items-stretch gap-5">
          <div className="min-w-[250px] flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <IconBolt className="h-4 w-4 text-pine-500" />
              <h2 className="font-display text-[16px] font-bold text-white">Android channel</h2>
              <span className="rounded-full border border-pine-500/50 bg-pine-600/15 px-2.5 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.12em] text-pine-500">
                apk · aab
              </span>
            </div>
            <p className="mt-2 max-w-[440px] text-[12.5px] leading-relaxed text-fog">
              The APK is a signed Trusted Web Activity around this exact web shell — one codebase, one
              pipeline. Point Bubblewrap at the deployed manifest, sign with your keystore, and the same
              v{latest.version.replace(/^v/, "")} build ships to launchers and the Play Store.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                "bubblewrap init --manifest=https://your-domain.example/manifest.webmanifest",
                "bubblewrap build",
              ].map((cmd) => (
                <div key={cmd} className="flex items-center gap-1 rounded-lg bg-ink-950/80 py-1 pl-3 pr-1">
                  <code className="scroll-dark min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-[11px] text-pine-200">
                    {cmd}
                  </code>
                  <CopyBtn text={cmd} dark />
                </div>
              ))}
            </div>
            <p className="mt-2.5 font-mono text-[9.5px] text-mute2">
              no CLI? pwabuilder.com → Package → Android emits the signed pair from the same manifest
            </p>
          </div>

          <div className="flex w-full max-w-[300px] flex-col rounded-lg border border-ink-700 bg-ink-950/60 p-3.5">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mute2">current artifact</p>
            <p className="mt-1.5 font-mono text-[13px] font-semibold text-white">switchboard-{latest.version.replace(/^v/, "")}.apk</p>
            <p className="font-mono text-[10px] text-mute2">6.4 MB · minSdk 23 · targetSdk 34</p>
            <div className="mt-2.5 flex items-center gap-1.5 rounded-md bg-ink-900 px-2 py-1.5">
              <code className="min-w-0 flex-1 truncate font-mono text-[9.5px] text-fog" title={apkAsset.sha256}>
                {apkAsset.sha256}
              </code>
              <CopyBtn text={apkAsset.sha256} dark />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadChannelKit}
                disabled={packing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pine-600 px-3 py-2 font-display text-[12.5px] font-bold text-white shadow-md shadow-pine-600/25 transition-all hover:bg-pine-500 active:translate-y-px disabled:cursor-wait disabled:opacity-70"
              >
                {packing ? (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth="2.6">
                    <path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round" />
                  </svg>
                ) : (
                  <IconDownload className="h-3.5 w-3.5" />
                )}
                {packing ? "Packing…" : "Download build kit (.zip)"}
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("sb:open-getapp"))}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-700 px-3 py-2 font-display text-[12.5px] font-semibold text-fog transition-colors hover:bg-ink-850 hover:text-white active:translate-y-px"
              >
                <IconBolt className="h-3.5 w-3.5 text-pine-500" /> Get it on a device
              </button>
            </div>
          </div>
        </div>
      </section>

      <p className="pb-2 text-center font-mono text-[10.5px] text-mute2">
        {latest.version} “{latest.codename}” shipped {latest.displayDate} — checksums verify against the registry on every pull.
      </p>
    </div>
  );
}
