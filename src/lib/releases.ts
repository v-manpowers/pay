export type ChangeKind = "added" | "improved" | "fixed" | "security" | "breaking";

export interface ReleaseAsset {
  name: string;
  size: string;
  sha256: string;
}

export interface Release {
  version: string;
  codename: string;
  date: string; // ISO
  displayDate: string;
  latest?: boolean;
  prerelease?: boolean;
  commits: number;
  additions: number;
  deletions: number;
  sections: { kind: ChangeKind; items: string[] }[];
  assets: ReleaseAsset[];
}

export const CURRENT_VERSION = "v1.0.0";

export const RELEASES: Release[] = [
  {
    version: "v1.0.0",
    codename: "First Light",
    date: "2026-02-12",
    displayDate: "12 Feb 2026",
    latest: true,
    commits: 148,
    additions: 6420,
    deletions: 1180,
    sections: [
      {
        kind: "added",
        items: [
          "Capture terminal with Luhn + brand validation, 3-D Secure challenge flow, and live-mode confirmation",
          "Payment ledger with full-text search, status filters, one-step refunds, and a raw-object inspector",
          "Developer console: sandbox API keys with rotation, cURL / Node / Python quickstarts, webhook delivery log",
          "Operations overview: live throughput chart, authorization feed, hourly volume, declines, network mix",
          "CSV export of the filtered ledger and clamped pagination controls",
          "Boot sequence, keyboard shortcuts (1–5, /, ?), and a once-per-session release banner",
        ],
      },
      {
        kind: "improved",
        items: [
          "Local persistence bumped to schema v2 with strict record validation and bounded ledger growth",
          "Console faults are now isolated by an error boundary with a recovery path",
          "Authorization stream backpressure handling at 40+ txns/min",
        ],
      },
      {
        kind: "fixed",
        items: [
          "Toast stack ordering under rapid capture load",
          "Pending authorizations now always resolve within two routing windows",
          "Hourly volume bars no longer drift across DST boundaries",
        ],
      },
      {
        kind: "security",
        items: [
          "Secret keys masked by default; reveal requires explicit operator action",
          "Live captures demand an explicit confirmation modal before routing",
        ],
      },
      {
        kind: "breaking",
        items: [
          "Storage schema v1 payloads migrate to v2 on first boot; unverifiable state is reseeded",
        ],
      },
    ],
    assets: [
      {
        name: "switchboard-1.0.0-dist.tar.gz",
        size: "1.9 MB",
        sha256: "8f43d9c1a07be2f55c9d3e10b6a44f27d91c8a35e0f7b2164d8893ce5a1f07b2",
      },
      {
        name: "switchboard-1.0.0-source.zip",
        size: "3.4 MB",
        sha256: "2b91e647f0c3d88a51d40ef9c277b6a13058cd94aa21e7f6b8031d4590cb66e0",
      },
    ],
  },
  {
    version: "v0.9.2-rc.1",
    codename: "Shakedown",
    date: "2026-02-05",
    displayDate: "05 Feb 2026",
    prerelease: true,
    commits: 41,
    additions: 980,
    deletions: 410,
    sections: [
      {
        kind: "improved",
        items: [
          "Release-candidate stabilization pass across ledger, terminal, and webhook paths",
          "Seed generator made deterministic behind a flag for reproducible QA runs",
        ],
      },
      {
        kind: "fixed",
        items: [
          "Race between refund webhook fan-out and ledger state commit",
          "Card preview flip no longer traps focus on touch devices",
        ],
      },
    ],
    assets: [
      {
        name: "switchboard-0.9.2-rc.1-dist.tar.gz",
        size: "1.8 MB",
        sha256: "c7d2019ab44fe63581d09c75b3f12ea68840c5d91f27be03a65d19c84ef30a11",
      },
    ],
  },
  {
    version: "v0.9.0",
    codename: "Switchroom",
    date: "2026-01-22",
    displayDate: "22 Jan 2026",
    commits: 96,
    additions: 3110,
    deletions: 640,
    sections: [
      {
        kind: "added",
        items: [
          "Developer console with publishable + secret sandbox keys and one-click rotation",
          "Quickstart snippets for cURL, Node, and Python with live key substitution",
          "Webhook delivery log with payload inspection and test-event sender",
          "Rate-limit and routing utilization meters",
        ],
      },
      {
        kind: "improved",
        items: ["Key material now rendered in monospace with masked truncation"],
      },
    ],
    assets: [
      {
        name: "switchboard-0.9.0-dist.tar.gz",
        size: "1.6 MB",
        sha256: "51aa83c0d92be77f14605cd83a91fe20bb46d7c318e05f92d4a617308c9b25dd",
      },
    ],
  },
  {
    version: "v0.8.0",
    codename: "Ledger",
    date: "2026-01-08",
    displayDate: "08 Jan 2026",
    commits: 74,
    additions: 2480,
    deletions: 390,
    sections: [
      {
        kind: "added",
        items: [
          "Payment ledger table with expandable rows and the full raw payment object",
          "Refund flow with reason codes and refund.issued webhook emission",
          "Risk scoring surfaced per authorization with inline meters",
        ],
      },
      {
        kind: "fixed",
        items: ["Search matching normalized across id, name, email, and last4"],
      },
    ],
    assets: [
      {
        name: "switchboard-0.8.0-dist.tar.gz",
        size: "1.4 MB",
        sha256: "90c4e71f3ad52b8860d19c47ea35f0b921d68aa4c70b13e5f6284d9037cbea52",
      },
    ],
  },
  {
    version: "v0.6.0",
    codename: "Terminal",
    date: "2025-12-18",
    displayDate: "18 Dec 2025",
    commits: 88,
    additions: 2950,
    deletions: 520,
    sections: [
      {
        kind: "added",
        items: [
          "Capture terminal with a flipping 3-D card preview and live brand detection",
          "Magic test cards: always-approve, always-decline, and 3-D Secure challenge",
          "Terminal-style session log tracing every request as JSON with 201/402 outcomes",
        ],
      },
      {
        kind: "improved",
        items: ["Card number grouping respects Amex 4-6-5 formatting"],
      },
    ],
    assets: [
      {
        name: "switchboard-0.6.0-dist.tar.gz",
        size: "1.2 MB",
        sha256: "e3b81d6057cf92a4b10dd8847f56c21930ab64e7d81c25f90e43d7b6158ca904",
      },
    ],
  },
  {
    version: "v0.4.0",
    codename: "Wire",
    date: "2025-12-02",
    displayDate: "02 Dec 2025",
    commits: 63,
    additions: 2140,
    deletions: 310,
    sections: [
      {
        kind: "added",
        items: [
          "Live authorization stream with pause/resume and pending-resolution simulation",
          "Throughput area chart, streaming authorization feed, and count-up stat tiles",
          "Hourly volume bars with hover tooltips and network-mix donut",
        ],
      },
    ],
    assets: [
      {
        name: "switchboard-0.4.0-dist.tar.gz",
        size: "1.0 MB",
        sha256: "77f02b9c41de88a3506f21cd9e0ab44d51837fc62b10e94d85ca30f61a27de38",
      },
    ],
  },
  {
    version: "v0.1.0",
    codename: "Groundwork",
    date: "2025-11-20",
    displayDate: "20 Nov 2025",
    commits: 22,
    additions: 1610,
    deletions: 40,
    sections: [
      {
        kind: "added",
        items: [
          "Console shell, sidebar navigation, and the ink-and-pine design system",
          "Space Grotesk / IBM Plex type pairing and monospace tabular figures",
          "localStorage persistence bootstrap and the toast notification rail",
        ],
      },
    ],
    assets: [
      {
        name: "switchboard-0.1.0-source.zip",
        size: "640 KB",
        sha256: "04d91c3ab85fe276610bd9c34e815f70a2c64813e9d07b52f418ce3306da71b9",
      },
    ],
  },
];

export function releaseMarkdown(r: Release): string {
  const lines: string[] = [
    `# Switchboard ${r.version} — ${r.codename}`,
    "",
    `Released ${r.displayDate} · ${r.commits} commits · +${r.additions.toLocaleString()} / −${r.deletions.toLocaleString()}${r.prerelease ? " · pre-release" : ""}${r.latest ? " · latest" : ""}`,
    "",
  ];
  for (const s of r.sections) {
    lines.push(`## ${s.kind.charAt(0).toUpperCase() + s.kind.slice(1)}`);
    s.items.forEach((i) => lines.push(`- ${i}`));
    lines.push("");
  }
  lines.push("## Assets");
  r.assets.forEach((a) => lines.push(`- ${a.name} (${a.size}) — sha256 \`${a.sha256}\``));
  return lines.join("\n");
}
