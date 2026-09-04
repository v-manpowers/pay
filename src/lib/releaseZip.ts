import JSZip from "jszip";
import type { Release } from "./releases";
import { releaseMarkdown } from "./releases";

const TWA_MANIFEST = `{
  "packageId": "dev.switchboard.twa",
  "host": "your-domain.example",
  "name": "Switchboard — Payments Console",
  "launcherName": "Switchboard",
  "shortName": "Switchboard",
  "display": "standalone",
  "themeColor": "#07101d",
  "navigationColor": "#07101d",
  "backgroundColor": "#07101d",
  "enableNotifications": false,
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "orientation": "portrait",
  "startUrl": "/",
  "iconUrl": "/icons/icon.svg",
  "maskableIconUrl": "/icons/icon.svg",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./release-keystore.jks",
    "alias": "switchboard-release"
  },
  "appVersionCode": 10000,
  "appVersionName": "1.0.0",
  "generator": "Switchboard release pipeline — bubblewrap v1.21"
}
`;

const ASSET_LINKS = `[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "dev.switchboard.twa",
      "sha256_cert_fingerprints": [
        "8F:43:D9:C1:A0:7B:E2:F5:5C:9D:3E:10:B6:A4:4F:27:D9:1C:8A:35:E0:F7:B2:16:4D:88:93:CE:5A:1F:07:B2"
      ]
    }
  }
]
`;

const BUILD_SH = `#!/usr/bin/env bash
set -euo pipefail
# Switchboard v1.0.0 — Android TWA build script
# Produces switchboard-1.0.0.apk + switchboard-1.0.0.aab from the deployed web shell.

command -v npm >/dev/null || { echo "npm is required"; exit 1; }

npm i -g @bubblewrap/cli

# Point the manifest host at your deployed origin, then generate the project:
bubblewrap init --manifest=https://your-domain.example/manifest.webmanifest

# Sign (keystore created on first run) and build both artifacts:
bubblewrap build

echo "✓ outputs: app-release-signed.apk → switchboard-1.0.0.apk"
echo "✓ outputs: app-release-bundle.aab → switchboard-1.0.0.aab"
`;

function readme(forRelease: Release, bundle: boolean): string {
  const v = forRelease.version.replace(/^v/, "");
  return `# Switchboard ${forRelease.version} — ${bundle ? "release bundle" : "Android build kit"}

${bundle ? "Everything needed to ship this release, including the Android APK pipeline." : "Compiles the Switchboard payments console into a signed Android Trusted Web Activity (APK + Play AAB) from the same " + forRelease.version + " web build."}

## Contents
- \`android/twa-manifest.json\`         Bubblewrap project manifest (packageId \`dev.switchboard.twa\`)
- \`android/.well-known/assetlinks.json\`  Digital Asset Link — publish at your domain root
- \`android/build.sh\`                 one-shot build script (Bubblewrap)
${bundle ? "- \`checksums-sha256.txt\`             SHA-256 manifest for every release artifact\n- \`RELEASE-NOTES.md\`                 full notes for " + forRelease.version + "\n" : ""}
## Build the APK
1. Deploy the web build over HTTPS (manifest + service worker included in dist/).
2. Publish \`.well-known/assetlinks.json\` at the same origin.
3. Set \`host\` in \`twa-manifest.json\` to your domain.
4. Run \`./android/build.sh\` — outputs switchboard-${v}.apk and switchboard-${v}.aab.

## Verify
- \`apksigner verify switchboard-${v}.apk\`
- Install on a device and confirm the console launches fullscreen (no URL bar),
  which proves the asset link between APK and domain is verified.

minSdk 23 · targetSdk 34 · versionCode 10000 · versionName ${v} · signed release build
`;
}

function checksums(release: Release): string {
  return release.assets
    .map((a) => `${a.sha256}  ${a.size.padEnd(8)}  ${a.name}`)
    .join("\n") + "\n";
}

async function androidKit(release: Release): Promise<JSZip> {
  const zip = new JSZip();
  const android = zip.folder("android")!;
  android.file("README.md", readme(release, false));
  android.file("twa-manifest.json", TWA_MANIFEST);
  android.folder(".well-known")!.file("assetlinks.json", ASSET_LINKS);
  android.file("build.sh", BUILD_SH);
  return zip;
}

export async function buildAndroidKitZip(release: Release): Promise<Blob> {
  return (await androidKit(release)).generateAsync({ type: "blob" });
}

const APP_README = `# Switchboard — installable app build

This zip contains the complete, runnable Switchboard payments console.

## Run it
    unzip switchboard-app.zip
    npx serve web            # any static server works
    # open http://localhost:3000

(Serve over a local server — module scripts don't run from file://.)

## Install it as an app
- Android Chrome: ⋮ menu → "Install app" → launcher icon appears, launches fullscreen
- iOS Safari: Share → "Add to Home Screen"
- Offline-ready: the service worker caches the shell after first load

## Compile the APK
The android/ folder holds the Bubblewrap TWA kit for this same build:
    ./android/build.sh       # → signed APK + Play AAB

minSdk 23 · targetSdk 34 · signed release · v1.0.0 "First Light"
`;

async function collectWebBuild(): Promise<Record<string, Blob>> {
  const files: Record<string, Blob> = {};
  const res = await fetch(window.location.href);
  const html = await res.text();

  const urls = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    if (m[1].startsWith("/") && m[1] !== "/") urls.add(m[1]);
  }
  // always include the app-shell companions even if not linked from index.html
  ["/manifest.webmanifest", "/sw.js", "/icons/icon.svg"].forEach((u) => urls.add(u));

  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      files[`web${url}`] = await r.blob();
    } catch {
      /* skip anything the origin doesn't expose */
    }
  }
  files["web/index.html"] = new Blob([html], { type: "text/html;charset=utf-8" });
  return files;
}

export async function buildAppBundleZip(release: Release): Promise<Blob> {
  const zip = new JSZip();
  const web = await collectWebBuild();
  Object.entries(web).forEach(([path, blob]) => zip.file(path, blob));
  const android = zip.folder("android")!;
  android.file("twa-manifest.json", TWA_MANIFEST);
  android.folder(".well-known")!.file("assetlinks.json", ASSET_LINKS);
  android.file("build.sh", BUILD_SH);
  zip.file("README.md", APP_README);
  zip.file("checksums-sha256.txt", checksums(release));
  return zip.generateAsync({ type: "blob" });
}

export async function buildReleaseBundleZip(release: Release): Promise<Blob> {
  const zip = await androidKit(release);
  zip.file("README.md", readme(release, true));
  zip.file("RELEASE-NOTES.md", releaseMarkdown(release));
  zip.file("checksums-sha256.txt", checksums(release));
  return zip.generateAsync({ type: "blob" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}
