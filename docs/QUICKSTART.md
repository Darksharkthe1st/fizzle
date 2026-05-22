# Fizzle — Documentation Index

Fizzle is a deadline tracker built with Electron + React (via Babel standalone, no bundler). Each task is a bomb with a burning fuse that shrinks as the deadline approaches.

## File map

| File | Purpose |
|------|---------|
| `main.js` | Electron main process — window, IPC, auto-updater |
| `preload.js` | Context bridge — exposes `window.electronAPI` to renderer |
| `index.html` | HTML shell — loads React/Babel from CDN, injects keyframes and scrollbar CSS |
| `shared.jsx` | All shared state, helpers, theme palettes, persistence, `FizzProvider` |
| `avenue-fuze.jsx` | The entire app UI — every visible component lives here |
| `fz-settings.jsx` | Settings modal (palette, sound, animation) |
| `app.jsx` | React root — composes `FizzProvider`, `AvenueFuze`, modals |
| `assets/icon.png` | 512×512 app icon (padded, used by electron-builder for all platforms) |
| `package.json` | npm scripts + electron-builder config |
| `.github/workflows/release.yml` | CI release pipeline |

**Unused files** (kept for reference, not loaded by the app):
`design-canvas.jsx`, `avenue-terminal.jsx`, `avenue-blueprint.jsx`, `avenue-foolscap.jsx`, `avenue-boom.jsx`, `macos-window.jsx`

---

## Route by job

| I want to… | Read |
|------------|------|
| Understand the overall architecture and data flow | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Work on the task list UI, components, or animations | [UI.md](UI.md) |
| Add or change a setting, modify task state/logic | [STATE.md](STATE.md) |
| Change colors, fonts, or the scrollbar | [THEMING.md](THEMING.md) |
| Change how data is saved or loaded | [PERSISTENCE.md](PERSISTENCE.md) |
| Add native OS features (menus, dialogs, tray) | [ELECTRON.md](ELECTRON.md) |
| Cut a release, fix CI, or understand build artifacts | [RELEASING.md](RELEASING.md) |
