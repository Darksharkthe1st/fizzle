# Persistence

## Table of contents
- [Data file](#data-file)
- [Load path](#load-path)
- [Save path](#save-path)
- [First run](#first-run)
- [Schema](#schema)
- [Resetting data](#resetting-data)

---

## Data file

All user data is stored in a single JSON file:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\fizzle\fizzle-data.json` |
| macOS | `~/Library/Application Support/fizzle/fizzle-data.json` |
| Linux | `~/.config/fizzle/fizzle-data.json` |

The file is pretty-printed (`JSON.stringify(data, null, 2)`) so it's human-readable and easy to inspect or back up manually.

---

## Load path

Data is loaded **once at module parse time** in `shared.jsx`, before React mounts:

```js
const _saved = (() => {
  try { return window.electronAPI?.loadData() || {}; } catch { return {}; }
})()
```

`window.electronAPI.loadData()` calls `ipcRenderer.sendSync('fizzle:load')` which triggers `ipcMain.on('fizzle:load')` in `main.js`. This is synchronous — the renderer blocks until `main.js` returns `event.returnValue`.

Main process handler:
```js
ipcMain.on('fizzle:load', (event) => {
  try {
    event.returnValue = JSON.parse(fs.readFileSync(dataPath(), 'utf8'))
  } catch {
    event.returnValue = null   // file missing → first run
  }
})
```

The loaded object is cached in `_saved`. `loadTasks()` and `loadSettings()` read from `_saved` — the IPC call only happens once per app launch.

### Defusing normalization on load

Tasks interrupted mid-animation are normalized back to `active`:
```js
return saved.tasks.map((t) =>
  t.state === 'defusing' ? { ...t, state: 'active', defusedAt: null } : t
)
```

---

## Save path

Saves are triggered by a single `useEffect` in `FizzProvider` that watches both `tasks` and `settings`:

```js
React.useEffect(() => {
  const t = setTimeout(() => saveData(tasks, settings), 300)
  return () => clearTimeout(t)
}, [tasks, settings])
```

The 300ms debounce coalesces rapid changes (e.g., slider drags) into a single write. `saveData` calls `window.electronAPI.saveData({ tasks, settings })` which fires `ipcRenderer.send('fizzle:save', data)` — fire-and-forget, no response needed.

Main process handler:
```js
ipcMain.on('fizzle:save', (_, data) => {
  fs.writeFileSync(dataPath(), JSON.stringify(data, null, 2), 'utf8')
})
```

---

## First run

When `fizzle-data.json` does not exist:
- `loadData()` returns `null`
- `_saved` is `{}`
- `loadTasks()` returns `INITIAL_TASKS` (currently `[]` — empty array)
- `loadSettings()` returns `DEFAULT_SETTINGS`
- On first interaction (e.g. adding a task), the file is created automatically

---

## Schema

```jsonc
{
  "tasks": [
    {
      "id": "n1716123456789",
      "name": "Ship the landing page",
      "description": "Waiting on copy from marketing",
      "total": 7,
      "remaining": 4.5,
      "state": "active",
      "defusedAt": null
    }
  ],
  "settings": {
    "palette": "midnight",
    "sound": true,
    "animation": "full"
  }
}
```

The schema is unversioned. New fields added to `DEFAULT_SETTINGS` are safe because settings are merged over defaults. New task fields are also safe because they're only read where explicitly accessed.

---

## Resetting data

**Via the app:** Settings modal has a Reset button which calls `reset()` → sets tasks to `INITIAL_TASKS` (empty array). Settings are unaffected.

**Manually:** Delete or edit `fizzle-data.json` at the path above while the app is closed. The app recreates the file on next save.
