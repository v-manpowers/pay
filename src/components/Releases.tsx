import { useState } from "react";
import { CURRENT_VERSION, RELEASES, releaseMarkdown, type ChangeKind, type Release } from "../lib/releases";
import { useApp } from "../lib/store";
import { IconCheck, IconChevron, IconCopy, IconDownload, IconTag } from "./icons";
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
  const [showAssets, setShowAssets] = useState(Boolean(release.latest));
  const isLatest = Boolean(release.latest);

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
                  <span className={`font-mono text-[12px] font-medium ${isLatest ? "text-white" : "text-ink-900"}`}>{a.name}</span>
                  <span className={`font-mono text-[10.5px] ${isLatest ? "text-mute2" : "text-mute2"}`}>{a.size}</span>
                  <code className={`min-w-0 flex-1 truncate rounded px-1.5 py-0.5 font-mono text-[10px] ${isLatest ? "bg-ink-950/60 text-fog" : "bg-paper text-mute"}`}>
                    sha256 {a.sha256.slice(0, 18)}…
                  </code>
                  <span className={isLatest ? "[&>button]:text-fog" : ""}>
                    <CopyBtn text={a.sha256} dark={isLatest} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className={`flex flex-wrap items-center gap-2 border-t px-4 py-3 md:px-5 ${isLatest ? "border-ink-700" : "border-line"}`}>
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
  const gaCount = RELEASES.filter((r) => !r.prerelease).length;
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

      <p className="pb-2 text-center font-mono text-[10.5px] text-mute2">
        {latest.version} “{latest.codename}” shipped {latest.displayDate} — checksums verify against the registry on every pull.
      </p>
    </div>
  );
}
