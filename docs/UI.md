# UI Layer

## Table of contents
- [index.html setup](#indexhtml-setup)
- [How Babel standalone works](#how-babel-standalone-works)
- [AvenueFuze layout](#avenuefuze-layout)
- [Components reference](#components-reference)
- [Animations](#animations)
- [Adding a new component](#adding-a-new-component)

---

## index.html setup

`index.html` is the entry point loaded by Electron. It has three responsibilities:

**1. Load runtime dependencies from CDN**
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js">
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js">
<script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js">
```
All three have `integrity` SRI hashes. The app requires internet on first load to fetch these (they are not bundled). After the first load Chromium caches them.

**2. Inject global CSS**
```html
<style>
  /* full-viewport root */
  html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; }
  #root { height: 100vh; display: flex; flex-direction: column; }

  /* scrollbar theming — reacts to --fz-ink / --fz-paper2 CSS vars */
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: var(--fz-paper2); border-left: 2.5px solid var(--fz-ink); }
  ::-webkit-scrollbar-thumb { background: var(--fz-ink); }

  /* shared keyframe animations */
  @keyframes ember-flicker { ... }
  @keyframes stripe-flow { ... }   /* fuse bar diagonal stripes */
  @keyframes fuse-retract { ... }  /* fuse shrinks to 0 on defuse */
  @keyframes scissor-snip { ... }  /* scissors fly in on cut */
  @keyframes confetti-burst { ... }
  @keyframes explosion-pop { ... }
  /* ...and others */
</style>
```

**3. Load JSX files in dependency order**
```html
<script type="text/babel" src="shared.jsx">
<script type="text/babel" src="avenue-fuze.jsx">
<script type="text/babel" src="fz-settings.jsx">
<script type="text/babel" src="app.jsx">          ← calls ReactDOM.createRoot
```

Order matters. Each file depends on globals set by the previous ones.

---

## How Babel standalone works

`@babel/standalone` intercepts `<script type="text/babel">` tags. For tags with a `src` attribute, it fetches the file via XMLHttpRequest, transpiles the JSX to plain JS, and evals it. This all happens synchronously during page load.

Each JSX file ends with `Object.assign(window, { ComponentA, ComponentB, ... })` which makes the exports available as globals. This is how components defined in `shared.jsx` can be used in `avenue-fuze.jsx` without any import statements.

**Implication for adding new files:** add a `<script type="text/babel" src="yourfile.jsx">` tag in `index.html` before `app.jsx`, and export globals from it with `Object.assign(window, { ... })`.

---

## AvenueFuze layout

`AvenueFuze` is a flex column filling `100%` width and height:

```
┌─────────────────────────────────────────────────────────────┐
│  FIZZLE 💣  [Burning 7] [Defused 1] [Detonated 1]  [Sort]  │  ← header toolbar
│                                              [+ Light one] ⚙ │
├──────────────┬───────────────────────────┬───────┬──────────┤
│  Task        │  Fuse →→                  │ Bomb  │ Time/Act │  ← column headers
├──────────────┼───────────────────────────┼───────┼──────────┤
│  Task name ▶ │ ████████████░░░░░░░ 🔥    │  💣   │ 12d left │  ← FzRow
│              │                           │       │  ✂ Cut   │
├──────────────┼───────────────────────────┼───────┼──────────┤
│  ...         │ ...                       │ ...   │ ...      │
│  (scrollable)                                               │
├─────────────────────────────────────────────────────────────┤
│  7 burning · 1 detonated · 1 defused      click name to edit│  ← footer
└─────────────────────────────────────────────────────────────┘
```

The task list area (`overflow: auto, flex: 1`) is the only scrollable region. The header, column headers, and footer are fixed.

### Column grid

The task grid uses a 4-column CSS grid:
```
gridTemplateColumns: '240px 1fr 76px 100px'
                      name   bar  bomb  time/action
```

This is defined in both the column header row and each `FzRow` — they must match.

---

## Components reference

### FzRow
One row per task. Manages hover state and the expand/collapse of `EditPanel`. Uses `FzFuse`, `FzBomb`, and action buttons.

The expand animation uses `@keyframes row-expand` defined in `index.html`.

### FzFuse
The animated progress bar. Width is `logScale(remaining) * 100%`. The diagonal stripe is a CSS `repeating-linear-gradient` animated with `stripe-flow`. At the burn tip (right edge of the fill), `SparkEmitter` is absolutely positioned.

States:
- **active**: stripe animates, sparks emit
- **defusing**: `fuse-retract` animation shrinks width to 0, `ScissorSnip` overlays
- **done**: static "DEFUSED" label
- **overdue** (`remaining < 0`): static "BOOM" label with char overlay

### FzBomb
SVG bomb illustration. The fuse tip glows when `remaining < 2` days. On defuse: fade-out animation + `explosion-pop` + `ConfettiOrbit`. On overdue: burst star shape replaces the round bomb.

### SparkEmitter
Pure SVG particle system. `N` circles (16 full, 8 subtle) emit from the burn tip in an upward fan. Each has randomized angle, distance, duration, and color. All use SVG `<animate>` with negative `begin` delays so the stream starts mid-flight on first paint.

Hidden when `animationLevel === 'off'`, scale ≤ 0.005, or scale ≥ 0.998.

### ScissorSnip
Overlays the fuse tip during defusing. SVG scissors animate in with `scissor-snip` keyframes.

### ConfettiOrbit
26 colored rectangles burst outward in an elliptical orbit using `confetti-burst` keyframes with per-piece `--cx`, `--cy`, `--r` CSS custom properties.

### NewTaskModal
Rendered as a React portal to `document.body`. Contains name input, notes textarea, and `DateAndDaysControl`. Submits via Enter key or the "Light fuse" button.

### DateAndDaysControl
Dual-mode date editor: numeric input + unit segment (hr/d/wk) + range slider + calendar button. The calendar button uses `input[type=date].showPicker()` — a hidden `<input>` overlays the button for proper popover anchoring.

### EditPanel
Inline expand below a row. Shows name, notes, and `DateAndDaysControl`. Also has Delete and Restore buttons.

---

## Animations

All keyframes are defined in the `<style>` block in `index.html`. Component-specific animations (like `modal-in`) are inlined via `style` props.

| Keyframe | Used by |
|----------|---------|
| `stripe-flow` | FzFuse — diagonal stripe movement |
| `fuse-retract` | FzFuse — width → 0 on defuse |
| `scissor-snip` | ScissorSnip |
| `explosion-pop` | FzBomb defuse flash |
| `bomb-fade-out` | FzBomb body fades on defuse |
| `confetti-burst` | ConfettiOrbit pieces |
| `shake-overdue` | FzRow — horizontal shake when overdue |
| `row-expand` | EditPanel slide-open |
| `modal-in` | NewTaskModal / SettingsModal enter |
| `backdrop-in` | Modal overlay fade |
| `pop-in` | ScissorSnip glow dot |
| `fade-out-soft` | ScissorSnip glow dot exit |

The `settings.animation` flag controls `SparkEmitter` particle count (`full` = 16, `subtle` = 8, `off` = hidden) and suppresses `ConfettiOrbit` when `'off'`.

---

## Adding a new component

1. Define it in `avenue-fuze.jsx` (or a new `.jsx` file)
2. If in a new file, add `Object.assign(window, { YourComponent })` at the bottom
3. If in a new file, add `<script type="text/babel" src="yourfile.jsx">` to `index.html` before `app.jsx`
4. Use `useFizz()` to access state
5. Use `FZ = useFizz().theme` to access theme colors/fonts (see [THEMING.md](THEMING.md))
