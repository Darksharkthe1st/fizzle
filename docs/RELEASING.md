# Releasing

## Table of contents
- [How to cut a release](#how-to-cut-a-release)
- [What the workflow does](#what-the-workflow-does)
- [Build artifacts](#build-artifacts)
- [electron-builder config](#electron-builder-config)
- [Auto-update flow](#auto-update-flow)
- [Local builds](#local-builds)
- [Code signing](#code-signing)
- [Troubleshooting](#troubleshooting)

---

## How to cut a release

1. Bump `version` in `package.json` (e.g. `1.0.0` → `1.1.0`)
2. Commit: `git commit -am "Bump to v1.1.0"`
3. Push: `git push origin main`
4. Tag and push the tag:
```bash
git tag v1.1.0
git push origin v1.1.0
```

GitHub Actions picks up the `v*` tag, builds all three platforms, and publishes artifacts to a new GitHub Release automatically. Watch progress at:
`https://github.com/Darksharkthe1st/fizzle/actions`

The version in `package.json` **must match** the tag (without the `v` prefix) for `electron-updater` to correctly detect the new version.

---

## What the workflow does

Defined in `.github/workflows/release.yml`.

```
push v* tag
  └─ build-linux (ubuntu-latest)        ← runs first; creates the GitHub Release
       ├─ npm install
       └─ electron-builder --publish always --linux
            └─ uploads AppImage + latest-linux.yml + blockmap

  ├─ build-windows (windows-latest)     ← waits for build-linux (needs:)
  │    ├─ npm install
  │    └─ electron-builder --publish always --win
  │         └─ uploads Setup.exe + latest.yml + blockmap
  │
  └─ build-mac (macos-latest)           ← waits for build-linux (needs:)
       ├─ npm install
       └─ electron-builder --publish always --mac
            └─ uploads .dmg (x64 + arm64) + latest-mac.yml + blockmaps
```

**Why Linux runs first:** all three jobs publish to the same GitHub Release. If they ran in parallel, two jobs might simultaneously try to create the release and get a 409 conflict, causing Windows and macOS to fail silently. Linux creates the release; Windows and macOS then upload to the existing one.

**`CSC_IDENTITY_AUTO_DISCOVERY: false`** is set on the macOS job to prevent `electron-builder` from attempting to find an Apple code signing certificate in the CI keychain.

---

## Build artifacts

After a successful release, the following files appear on the GitHub Releases page:

| File | Platform | Purpose |
|------|----------|---------|
| `Fizzle-Setup-x.x.x.exe` | Windows | NSIS installer |
| `Fizzle-Setup-x.x.x.exe.blockmap` | Windows | Delta update map |
| `latest.yml` | Windows | Update manifest read by electron-updater |
| `Fizzle-x.x.x-x64.dmg` | macOS Intel | Disk image |
| `Fizzle-x.x.x-arm64.dmg` | macOS Apple Silicon | Disk image |
| `Fizzle-x.x.x-x64.dmg.blockmap` | macOS Intel | Delta update map |
| `Fizzle-x.x.x-arm64.dmg.blockmap` | macOS Apple Silicon | Delta update map |
| `latest-mac.yml` | macOS | Update manifest |
| `Fizzle-x.x.x.AppImage` | Linux | Portable executable |
| `latest-linux.yml` | Linux | Update manifest |
| `Source code (zip/tar.gz)` | All | Auto-added by GitHub |

Users download only the installer for their platform. The `.blockmap` and `latest*.yml` files are used silently by `electron-updater` in installed copies.

---

## electron-builder config

Defined in the `"build"` field of `package.json`:

```jsonc
{
  "appId": "com.fizzle.app",       // used as bundle ID on macOS, app ID on Windows
  "productName": "Fizzle",
  "author": "Darksharkthe1st",
  "icon": "assets/icon.png",       // 512x512 PNG — auto-converted to .ico/.icns by electron-builder
  "directories": {
    "output": "dist",              // build output (local)
    "buildResources": "assets"     // where electron-builder looks for icons
  },
  "files": [                       // only these files are packaged into the app
    "main.js", "preload.js",
    "index.html",
    "shared.jsx", "avenue-fuze.jsx", "fz-settings.jsx", "app.jsx"
  ],
  "publish": {
    "provider": "github",
    "owner": "Darksharkthe1st",
    "repo": "fizzle"
  },
  "win":   { "target": "nsis" },
  "mac":   { "target": { "target": "dmg", "arch": ["x64", "arm64"] } },
  "linux": { "target": "AppImage" },
  "nsis": {
    "oneClick": false,                      // shows install wizard
    "allowToChangeInstallationDirectory": true
  }
}
```

The `files` array is important — it controls what ships inside the packaged app. If you add a new `.jsx` file that the app needs, add it here.

---

## Auto-update flow

When a user has an installed copy of Fizzle and a new version is released:

1. App starts → `autoUpdater.checkForUpdatesAndNotify()` runs (only when `app.isPackaged`)
2. `electron-updater` fetches `latest.yml` (or `latest-mac.yml` / `latest-linux.yml`) from GitHub Releases
3. If the version in `latest.yml` is newer than the running version, it downloads the update in the background (using the `.blockmap` for delta if possible)
4. A system notification appears: "Update downloaded, will install on restart"
5. On next app relaunch, the update is applied

`app.isPackaged` is `false` during `npm start`, so updates are never checked during development.

---

## Local builds

Build without publishing (for testing the installer locally):

```bash
npm run build:win     # → dist/Fizzle Setup x.x.x.exe
npm run build:mac     # → dist/Fizzle-x.x.x.dmg
npm run build:linux   # → dist/Fizzle-x.x.x.AppImage
npm run build         # → all platforms (cross-compile may fail)
```

**Note:** Windows Defender can lock files in `dist/` immediately after creation, causing rebuild failures. If `npm run build:win` fails with "file in use", either add `dist/` to Defender exclusions or move the output somewhere else temporarily.

---

## Code signing

The app is currently **unsigned**.

- **Windows:** SmartScreen shows a "Windows protected your PC" warning on first run. Users click "More info → Run anyway". This warning diminishes as more users run the app. To remove it, obtain an EV code signing certificate and set the `WIN_CSC_LINK` / `WIN_CSC_KEY_PASSWORD` environment variables in GitHub Actions secrets.
- **macOS:** Apps from unidentified developers require right-click → Open on first launch, or users must allow it in System Preferences → Security. To remove this, enroll in Apple Developer Program and configure notarization with `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` secrets.

---

## Troubleshooting

**Only Linux artifacts appear in the release:**
Race condition — Linux created the release before Windows/Mac could. The workflow is already structured with `needs: build-linux` to prevent this. If it recurs, check the Windows/macOS job logs on the Actions tab for the actual error.

**`author is missed in the package.json` warning:**
Non-fatal. `author` field exists in `package.json`. This warning appears in some electron-builder versions regardless.

**macOS build fails with signing error:**
Ensure `CSC_IDENTITY_AUTO_DISCOVERY: false` is set in the macOS job env. This is already in the workflow.

**`dist/` file locked on Windows:**
See Local builds note above. Kill any running Fizzle process first, then try building to a different output path.
