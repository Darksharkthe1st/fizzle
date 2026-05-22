# Electron Layer

## Table of contents
- [main.js](#mainjs)
- [preload.js](#preloadjs)
- [IPC channels](#ipc-channels)
- [Auto-updater](#auto-updater)
- [Adding native features](#adding-native-features)

---

## main.js

```
main.js responsibilities:
  1. Register IPC handlers (must happen before createWindow)
  2. Remove the default application menu
  3. Create the BrowserWindow
  4. Check for updates (only when packaged)
```

### Window configuration

```js
new BrowserWindow({
  width: 1440, height: 900,
  minWidth: 800, minHeight: 600,
  title: 'Fizzle',
  webPreferences: {
    contextIsolation: true,   // renderer cannot access Node.js
    preload: path.join(__dirname, 'preload.js'),
  },
})
```

`contextIsolation: true` is required for the `contextBridge` in `preload.js` to work. Never disable it.

### Menu removal

```js
Menu.setApplicationMenu(null)
```

Called once before `createWindow()`. Removes the File/Edit/View/Window/Help bar entirely — no Alt-key toggle.

### Data file path

```js
path.join(app.getPath('userData'), 'fizzle-data.json')
```

`app.getPath('userData')` resolves to:
- **Windows:** `C:\Users\<name>\AppData\Roaming\fizzle`
- **macOS:** `~/Library/Application Support/fizzle`
- **Linux:** `~/.config/fizzle`

---

## preload.js

Runs in an isolated context before page scripts. Exposes two methods to the renderer via `contextBridge`:

```js
contextBridge.exposeInMainWorld('electronAPI', {
  loadData: () => ipcRenderer.sendSync('fizzle:load'),
  saveData: (data) => ipcRenderer.send('fizzle:save', data),
})
```

| Method | Transport | Returns |
|--------|-----------|---------|
| `loadData()` | `sendSync` (blocking) | Parsed JSON object or `null` |
| `saveData(data)` | `send` (fire-and-forget) | nothing |

`loadData` is synchronous because it's called at module parse time in `shared.jsx` before React mounts — there is no loading state to show while waiting for a Promise.

---

## IPC channels

### `fizzle:load` (sync)

```js
ipcMain.on('fizzle:load', (event) => {
  try {
    event.returnValue = JSON.parse(fs.readFileSync(dataPath(), 'utf8'))
  } catch {
    event.returnValue = null   // file doesn't exist yet → first run
  }
})
```

Returns the entire saved data object `{ tasks, settings }`, or `null` on first run.

### `fizzle:save` (async, fire-and-forget)

```js
ipcMain.on('fizzle:save', (_, data) => {
  fs.writeFileSync(dataPath(), JSON.stringify(data, null, 2), 'utf8')
})
```

Writes pretty-printed JSON. Called at most once per 300ms (debounced in `FizzProvider`). The file is human-readable and easy to back up.

---

## Auto-updater

```js
if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify()
```

- Only runs in the installed/packaged app, never during `npm start`
- Reads `latest.yml` from the GitHub Releases page to detect new versions
- Downloads the update in the background
- Shows a system notification when ready; applies on next relaunch
- Powered by `electron-updater` from the `electron-builder` ecosystem

No extra configuration is needed beyond the `publish` block in `package.json`.

---

## Adding native features

**Native dialog (open file, save file):**
```js
// main.js
const { dialog } = require('electron')
ipcMain.handle('fizzle:open-dialog', async () => {
  return dialog.showOpenDialog({ properties: ['openFile'] })
})

// preload.js — add to exposeInMainWorld:
openDialog: () => ipcRenderer.invoke('fizzle:open-dialog'),
```

Use `ipcMain.handle` + `ipcRenderer.invoke` (Promise-based) for async operations. Use `ipcMain.on` + `ipcRenderer.sendSync` only for the startup data load where synchronous behavior is specifically required.

**System tray:**
Add after `createWindow()` in the `whenReady` callback using `new Tray(iconPath)`.

**Multiple windows:**
Call `createWindow()` again; each window gets its own renderer but shares the same main process IPC handlers.
