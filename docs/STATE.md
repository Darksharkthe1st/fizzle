# State Management

## Table of contents
- [FizzProvider](#fizzprovider)
- [Task model](#task-model)
- [Task states](#task-states)
- [Settings model](#settings-model)
- [useFizz hook](#usefizz-hook)
- [Context value reference](#context-value-reference)
- [Key computations](#key-computations)
- [Adding a new setting](#adding-a-new-setting)
- [Adding a new task field](#adding-a-new-task-field)

---

## FizzProvider

Defined in `shared.jsx`. Wraps the entire app in `app.jsx`:

```jsx
<FizzProvider>
  <AvenueFuze />
  <NewTaskModal />
  <SettingsModal />
</FizzProvider>
```

All state lives here. Components read it with `useFizz()`. There is no Redux, Zustand, or other state library.

---

## Task model

```js
{
  id:          string,   // unique — 'a'-'j' for seeds, 'n' + Date.now() for new tasks
  name:        string,   // display name
  description: string,   // notes, shown in the expanded EditPanel
  total:       number,   // days at creation (used for nothing currently — kept for future % calc)
  remaining:   number,   // days until due; can be negative (overdue); fractional (hours)
  state:       string,   // see Task states below
  defusedAt:   number | null,  // timestamp ms, set when defuse() is called
}
```

`remaining` is the single source of truth for urgency. It is not ticked down automatically — it represents days from now and is stored as a fixed value set by the user. Overdue is a derived condition (`remaining < 0`), not a stored state.

---

## Task states

| `state` value | Meaning | How entered | How exited |
|---------------|---------|-------------|------------|
| `'active'`    | Normal burning task | `add()`, `restore()`, or loaded from file | `defuse()` → defusing, or `remaining < 0` → overdue (computed) |
| `'defusing'`  | Cut animation playing | `defuse()` called | After 2200ms → `'done'` automatically |
| `'done'`      | Defused/completed | 2200ms after defusing | `restore()` → active |
| `'overdue'`   | **Not a real state value** | Computed: `state !== 'done' && remaining < 0` | Never stored; fix by editing `remaining` |

When loading from file, any task with `state === 'defusing'` is normalized back to `'active'` (the animation can't replay).

---

## Settings model

```js
{
  palette:   'cream' | 'midnight' | 'mono',  // color scheme
  sound:     boolean,                         // enable/disable sound effects
  animation: 'full' | 'subtle' | 'off',      // spark/confetti detail level
}
```

Defaults are `{ palette: 'cream', sound: true, animation: 'full' }`. Merged over defaults on load so adding a new key with a default is backwards-compatible.

---

## useFizz hook

```js
const {
  // Task data
  tasks,          // full task array (all states)
  visibleTasks,   // filtered + sorted for current view
  counts,         // { burning, defused, detonated }

  // View / sort
  view, setView,        // 'burning' | 'defused' | 'detonated'
  sortMode, cycleSort,  // 'urgency' | 'date' | 'name' — cycles on click

  // Expand (inline edit panel)
  expandedId, toggleExpand,

  // Modals
  showAdd, setShowAdd,
  showSettings, setShowSettings,

  // Task mutations
  defuse,   // (id) → start cut animation
  add,      // ({ name, description, days }) → prepend new task
  restore,  // (id) → done/overdue back to active
  update,   // (id, patch) → merge patch into task
  remove,   // (id) → delete task
  reset,    // () → wipe and reload INITIAL_TASKS (empty array)

  // Settings
  settings, updateSettings,  // updateSettings({ palette: 'midnight' })

  // Derived
  theme,      // FZ object — see THEMING.md
  playSound,  // (name: 'snip' | 'pop' | 'boom') → plays if sound enabled
  now,        // increments every 1s — used to force re-renders for live timers
} = useFizz()
```

---

## Context value reference

### `counts`
```js
{
  burning:   tasks where (active or defusing) and remaining >= 0,
  defused:   tasks where state === 'done',
  detonated: tasks where state !== 'done' and remaining < 0,
}
```

### `visibleTasks`
Filtered to the current `view`, then sorted by `sortMode`:
- `urgency`: active tasks first, sorted by `remaining` ascending (most urgent first)
- `date`: sorted by `remaining` ascending
- `name`: alphabetical

### `now`
A counter that increments every second via `setInterval`. Components that need live countdowns can include `now` in their render (or just let `FizzProvider` re-render them on the tick). `FzFuse` and `FzBomb` derive their colors/sizes from `task.remaining` which is static — they rely on the parent re-rendering to stay current.

---

## Key computations

### logScale (fuse bar width)

`logScale(daysRemaining)` in `shared.jsx` maps days → [0, 1] using piecewise-linear anchors:

| Days | Scale |
|------|-------|
| 0 | 0.000 |
| 1 | 0.125 |
| 7 | 0.250 |
| 30 | 0.500 |
| 60 | 0.667 |
| 90 | 0.750 |
| 180 | 0.850 |
| 365 | 0.950 |
| ∞ | → 1.0 |

This makes short deadlines visually distinct even when they're all "close".

### getTimeColor (fuse bar color)

Color based on absolute days remaining, not fraction of total:
- ≤ 1d → red (`#e53935`)
- 1–3d → lerp red → yellow
- 3–7d → lerp yellow → green
- ≥ 7d → green (`#3aa84a`)

---

## Adding a new setting

1. Add the key + default to `DEFAULT_SETTINGS` in `shared.jsx`
2. Add a control in `fz-settings.jsx`
3. Call `updateSettings({ yourKey: value })` from the control
4. Read it via `useFizz().settings.yourKey` wherever needed

No migration needed — the merge `{ ...DEFAULT_SETTINGS, ...saved }` handles existing saves.

---

## Adding a new task field

1. Add it to the object in `add()` in `FizzProvider`
2. Add it to `INITIAL_TASKS` entries if relevant
3. Surface it in `EditPanel` in `avenue-fuze.jsx` via `update(task.id, { yourField: value })`
4. The persistence layer saves the whole task array as-is — no schema changes needed
