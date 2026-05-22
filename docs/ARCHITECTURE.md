# Architecture

## Table of contents
- [How the app loads](#how-the-app-loads)
- [Process model](#process-model)
- [Component tree](#component-tree)
- [Key data flows](#key-data-flows)
- [What is not used](#what-is-not-used)

---

## How the app loads

Fizzle uses no bundler. React and Babel are loaded from CDN at runtime; JSX files are fetched and transpiled in the renderer by `@babel/standalone`.

```
Electron main process (main.js)
  └─ BrowserWindow loads index.html (file:// protocol)
       ├─ <script> React 18 from unpkg CDN
       ├─ <script> ReactDOM 18 from unpkg CDN
       ├─ <script> @babel/standalone from unpkg CDN
       └─ <script type="text/babel"> files (in order):
            shared.jsx        → globals on window.*
            avenue-fuze.jsx   → globals on window.*
            fz-settings.jsx   → globals on window.*
            app.jsx           → ReactDOM.createRoot(...).render(<App />)
```

Script loading order is significant. Each file uses globals exported by the previous ones (e.g., `avenue-fuze.jsx` calls `useFizz()` which is defined in `shared.jsx`). All exports are attached to `window` via `Object.assign(window, { ... })` at the bottom of each file.

The preload script runs before any page scripts and exposes `window.electronAPI` via `contextBridge` before `shared.jsx` reads it.

---

## Process model

```
Main process (Node.js)          Renderer process (Chromium)
─────────────────────           ───────────────────────────
main.js                         index.html + JSX files
  ├─ BrowserWindow               ├─ React app
  ├─ ipcMain.on('fizzle:load')   │    └─ FizzProvider
  ├─ ipcMain.on('fizzle:save')   │         └─ reads/writes via
  └─ autoUpdater                 │              window.electronAPI
                                 └─ preload.js (bridge)
                                      ├─ electronAPI.loadData()
                                      └─ electronAPI.saveData()
```

`contextIsolation: true` is enabled, so the renderer cannot access Node.js directly. All file I/O goes through the IPC bridge defined in `preload.js`.

---

## Component tree

```
<App>                          (app.jsx)
  <FizzProvider>               (shared.jsx) — all state lives here
    <AvenueFuze />             (avenue-fuze.jsx) — the entire visible UI
      <ViewSegment />          — Burning / Defused / Detonated tabs
      <FzRow />                — one row per task
        <FzFuse />             — animated fuse bar
        <FzBomb />             — bomb SVG + date tag
        <SparkEmitter />       — SVG particle animation
        <ScissorSnip />        — cut animation overlay
        <EditPanel />          — inline expand: name, notes, date editor
          <DateAndDaysControl />
          <UnitSegment />
      <EmptyState />           — shown when task list is empty
      <FzChip />               — toolbar buttons (Sort, + Light one)
      <FzIconChip />           — settings cog button
    <NewTaskModal />           (avenue-fuze.jsx) — portal to document.body
    <SettingsModal />          (fz-settings.jsx) — portal to document.body
```

---

## Key data flows

### Startup
1. `preload.js` runs → `window.electronAPI` available
2. `shared.jsx` parses → `_saved = window.electronAPI.loadData()` (sync IPC)
3. `FizzProvider` mounts → `useState(loadTasks)` and `useState(loadSettings)` read from `_saved`
4. `FizzProvider` effect → sets `--fz-ink` and `--fz-paper2` CSS variables on `<html>`
5. `AvenueFuze` renders with hydrated state

### Saving
- Any task or settings change triggers a `useEffect` in `FizzProvider`
- Debounced 300ms → `saveData(tasks, settings)` → `window.electronAPI.saveData()` → `ipcRenderer.send('fizzle:save')` → `main.js` writes `fizzle-data.json`

### Defuse animation
```
user clicks ✂ Cut
  → defuse(id) sets task.state = 'defusing'
  → FzFuse renders fuse-retract + scissor-snip animations (CSS)
  → FzBomb renders explosion-pop + confetti (CSS + ConfettiOrbit)
  → useEffect in FizzProvider sees pending defusing tasks
  → after 2200ms → state = 'done', sound plays
```

### Theme change
```
user picks palette in SettingsModal
  → updateSettings({ palette }) → settings state updates
  → theme = buildFz(palette) recomputes
  → useEffect sets --fz-ink, --fz-paper2 on document.documentElement
  → all components re-render with new FZ values
  → scrollbar CSS (in index.html) reacts to new CSS vars automatically
```

---

## What is not used

These files exist in the repo but are not loaded by `index.html` and have no effect on the running app:

| File | Origin | Notes |
|------|--------|-------|
| `design-canvas.jsx` | Claude Design | Figma-like pan/zoom canvas wrapper |
| `avenue-terminal.jsx` | Claude Design | Dark terminal design concept |
| `avenue-blueprint.jsx` | Claude Design | Schematic/blueprint design concept |
| `avenue-foolscap.jsx` | Claude Design | Cozy paper design concept |
| `avenue-boom.jsx` | Claude Design | Full cartoon design concept |
| `macos-window.jsx` | Claude Design | macOS Tahoe liquid glass window chrome |

These were the five design directions Claude explored before the "Fuze" direction was chosen. Safe to delete; kept for reference.
