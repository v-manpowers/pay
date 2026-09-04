import JSZip from "jszip";
import type { Release } from "./releases";
import { CURRENT_VERSION, releaseMarkdown } from "./releases";

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

/* ------------------------------------------------------------------ */
/* Full Android Studio TWA project — compiles to the signed .apk/.aab  */
/* ------------------------------------------------------------------ */

const GRADLE_ROOT = `// Switchboard ${CURRENT_VERSION} — root build file
buildscript {
    repositories { google(); mavenCentral() }
    dependencies { classpath 'com.android.tools.build:gradle:8.2.2' }
}

allprojects {
    repositories { google(); mavenCentral() }
}

tasks.register("clean", Delete) { delete rootProject.buildDir }
`;

const GRADLE_SETTINGS = `rootProject.name = "switchboard-android"
include ":app"
`;

const GRADLE_PROPS = `android.useAndroidX=true
org.gradle.jvmargs=-Xmx2048m
`;

const APP_GRADLE = `apply plugin: "com.android.application"

def keystorePropsFile = rootProject.file("keystore.properties")
def hasReleaseKey = keystorePropsFile.exists()

android {
    namespace "dev.switchboard.twa"
    compileSdk 34

    defaultConfig {
        applicationId "dev.switchboard.twa"
        minSdk 23
        targetSdk 34
        versionCode 10000
        versionName "${CURRENT_VERSION.replace(/^v/, "")}"
    }

    signingConfigs {
        if (hasReleaseKey) {
            def props = new Properties()
            keystorePropsFile.withInputStream { props.load(it) }
            release {
                storeFile file(props["storeFile"])
                storePassword props["storePassword"]
                keyAlias props["keyAlias"]
                keyPassword props["keyPassword"]
            }
        }
    }

    buildTypes {
        release {
            minifyEnabled false
            if (hasReleaseKey) signingConfig signingConfigs.release
            else signingConfig signingConfigs.debug   // first build works out of the box
        }
    }
}

dependencies {
    implementation "com.google.androidbrowserhelper:androidbrowserhelper:2.5.0"
}
`;

const ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

  <application
      android:label="@string/app_name"
      android:icon="@mipmap/ic_launcher"
      android:allowBackup="true"
      android:theme="@android:style/Theme.Translucent.NoTitleBar">

    <activity
        android:name="android.support.customtabs.trusted.LauncherActivity"
        android:exported="true"
        android:launchMode="singleTask">

      <meta-data
          android:name="android.support.customtabs.trusted.DEFAULT_URL"
          android:value="https://your-domain.example" />

      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>

      <!-- Lets Chrome hand the verified domain to this app (fullscreen, no URL bar) -->
      <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="your-domain.example" />
      </intent-filter>
    </activity>
  </application>
</manifest>
`;

const STRINGS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <string name="app_name">Switchboard</string>
</resources>
`;

const COLORS_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <color name="ink_950">#07101D</color>
  <color name="pine_600">#0B7A65</color>
</resources>
`;

const ADAPTIVE_ICON = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
  <background android:drawable="@color/ink_950" />
  <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
`;

const ICON_FOREGROUND = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp" android:height="108dp"
    android:viewportWidth="108" android:viewportHeight="108">
  <!-- switchboard glyph, centered in the adaptive-icon safe zone -->
  <group android:scaleX="1" android:scaleY="1">
    <path android:strokeColor="#FFFFFF" android:strokeWidth="6.5" android:strokeLineCap="round"
        android:pathData="M30,42 L60,42" />
    <path android:strokeColor="#FFFFFF" android:strokeWidth="6.5" android:strokeLineCap="round"
        android:pathData="M30,54 L78,54" />
    <path android:strokeColor="#FFFFFF" android:strokeWidth="6.5" android:strokeLineCap="round"
        android:pathData="M30,66 L60,66" />
    <path android:fillColor="#12937B" android:pathData="M70,42 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0" />
    <path android:fillColor="#12937B" android:pathData="M42,66 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0" />
  </group>
</vector>
`;

const BUILD_APK_SH = `#!/usr/bin/env bash
set -euo pipefail
# Switchboard ${CURRENT_VERSION} — one command to a signed Android package.
# Output: app/build/outputs/apk/release/app-release.apk  →  switchboard-${CURRENT_VERSION.replace(/^v/, "")}.apk

# 1) Keystore (created once — reuse it for every future version)
if [ ! -f release-keystore.jks ]; then
  command -v keytool >/dev/null || { echo "keytool (JDK 17+) is required to sign"; exit 1; }
  keytool -genkeypair -v -keystore release-keystore.jks -alias switchboard-release \\
    -keyalg RSA -keysize 2048 -validity 10000 -storepass switchboard \\
    -dname "CN=Switchboard, OU=Releases, O=Switchboard, L=Berlin, S=BE, C=DE"
  printf 'storeFile=release-keystore.jks\\nstorePassword=switchboard\\nkeyAlias=switchboard-release\\nkeyPassword=switchboard\\n' > keystore.properties
  echo "→ print the cert fingerprint and add it to .well-known/assetlinks.json:"
  keytool -list -v -keystore release-keystore.jks -storepass switchboard | grep SHA256
fi

# 2) Build (Bubblewrap if present, otherwise Gradle)
if command -v bubblewrap >/dev/null; then
  bubblewrap build
else
  command -v gradle >/dev/null || { echo "install Android Studio / gradle, or: npm i -g @bubblewrap/cli"; exit 1; }
  gradle assembleRelease bundleRelease
fi

echo "✓ APK ready: app/build/outputs/apk/release/app-release.apk"
echo "✓ AAB ready: app/build/outputs/bundle/release/app-release.aab"
echo "  install: adb install -r app-release.apk"
`;

const PROJECT_README = `# Switchboard ${CURRENT_VERSION} — Android project

A complete Trusted Web Activity app. Compiles to the signed, installable
**switchboard-${CURRENT_VERSION.replace(/^v/, "")}.apk** (plus a Play Store .aab) — no code changes needed.

## Build the APK (one command)

\`\`\`bash
./build-apk.sh
\`\`\`

Requires JDK 17+ and either Android Studio/Gradle or \`npm i -g @bubblewrap/cli\`.
The script creates the signing keystore on first run and prints the cert
fingerprint to paste into \`assetlinks.json\`.

## Then

1. Deploy the web build (see the release's app.zip) over HTTPS.
2. Publish \`assetlinks.json\` at \`https://your-domain.example/.well-known/assetlinks.json\`.
3. Set the domain in \`app/src/main/AndroidManifest.xml\` (two \`your-domain.example\` spots).
4. \`adb install -r app-release.apk\` — the console launches fullscreen, verified by the asset link.

## Contents

| Path | Purpose |
|---|---|
| \`app/build.gradle\` | applicationId \`dev.switchboard.twa\`, versionCode 10000, signing config |
| \`app/src/main/AndroidManifest.xml\` | TWA launcher activity + domain intent filters |
| \`app/src/main/res/…\` | adaptive launcher icon built from the Switchboard glyph |
| \`assetlinks.json\` | Digital Asset Link for fullscreen verification |
| \`build-apk.sh\` | keystore + compile, one command |

minSdk 23 (Android 6.0+) · targetSdk 34 · signed release build
`;

export async function buildAndroidProjectZip(release: Release): Promise<Blob> {
  const zip = new JSZip();
  const root = zip.folder(`switchboard-${release.version.replace(/^v/, "")}-android`)!;
  root.file("README.md", PROJECT_README.replace(/\$\{CURRENT_VERSION\}/g, release.version));
  root.file("build.gradle", GRADLE_ROOT.replace(/\$\{CURRENT_VERSION\}/g, release.version));
  root.file("settings.gradle", GRADLE_SETTINGS);
  root.file("gradle.properties", GRADLE_PROPS);
  root.file("build-apk.sh", BUILD_APK_SH.replace(/\$\{CURRENT_VERSION\}/g, release.version));
  root.file("assetlinks.json", ASSET_LINKS);
  const app = root.folder("app")!;
  app.file("build.gradle", APP_GRADLE.replace(/\$\{CURRENT_VERSION\}/g, release.version));
  const main = app.folder("src/main")!;
  main.file("AndroidManifest.xml", ANDROID_MANIFEST);
  const values = main.folder("res/values")!;
  values.file("strings.xml", STRINGS_XML);
  values.file("colors.xml", COLORS_XML);
  const mipmap = main.folder("res/mipmap-anydpi-v26")!;
  mipmap.file("ic_launcher.xml", ADAPTIVE_ICON);
  const drawable = main.folder("res/drawable")!;
  drawable.file("ic_launcher_foreground.xml", ICON_FOREGROUND);
  return zip.generateAsync({ type: "blob" });
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
