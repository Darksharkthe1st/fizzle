# Theming

## Table of contents
- [Design language](#design-language)
- [The FZ object](#the-fz-object)
- [Palettes](#palettes)
- [Fixed values](#fixed-values)
- [CSS custom properties](#css-custom-properties)
- [Scrollbar](#scrollbar)
- [Adding a new palette](#adding-a-new-palette)
- [Urgency colors](#urgency-colors)

---

## Design language

Fizzle uses a bold, chunky neo-brutalist style:
- Thick borders: `2px–3px solid ${FZ.ink}`
- Offset box shadows: `2px 2px 0 ${FZ.ink}` (no blur, hard offset)
- Display font (headers, labels): Bricolage Grotesque / Schibsted Grotesk
- Body font: Schibsted Grotesk
- Mono font: Geist Mono / JetBrains Mono
- All fonts loaded from Google Fonts in `index.html`

---

## The FZ object

Components access the theme via:
```js
const FZ = useFizz().theme
```

`theme` is a merged object built by `buildFz(paletteName)` in `shared.jsx`:
```js
function buildFz(paletteName) {
  return { ...FZ_FIXED, ...(FZ_PALETTES[paletteName] || FZ_PALETTES.cream) }
}
```

### FZ property reference

| Property | Type | Description |
|----------|------|-------------|
| `FZ.paper` | color | Main background |
| `FZ.paper2` | color | Secondary background (footer, expanded rows) |
| `FZ.ink` | color | Primary text and borders |
| `FZ.ink2` | color | Secondary text |
| `FZ.ink3` | color | Tertiary / muted text |
| `FZ.rule` | color | Divider lines between rows |
| `FZ.barBg` | color | Dark background behind the fuse fill |
| `FZ.btnBg` | color | Button backgrounds |
| `FZ.dotRgba` | color | Dot grid background pattern |
| `FZ.charred` | color | Very dark — bomb body fill |
| `FZ.safe` | color | Green — defused checkmark, done tasks |
| `FZ.warn` | color | Yellow — medium urgency |
| `FZ.danger` | color | Red — high urgency, CTA buttons |
| `FZ.accent` | color | Per-palette accent (used for slider) |
| `FZ.scheme` | `'light'` \| `'dark'` | CSS `color-scheme` value |
| `FZ.display` | font stack | Headers, labels, button text |
| `FZ.body` | font stack | Body text, inputs |
| `FZ.mono` | font stack | Monospace — time values, unit labels |

---

## Palettes

Three palettes defined in `FZ_PALETTES` in `shared.jsx`:

### cream (default)
Warm off-white background, near-black ink. Classic light theme.

| Token | Value |
|-------|-------|
| `paper` | `#fff3d6` |
| `paper2` | `#ffe6a8` |
| `ink` | `#1a1108` |
| `ink2` | `#3a2a14` |
| `barBg` | `#2a1f12` |
| `btnBg` | `#fff` |
| `scheme` | `light` |

### midnight
Dark background, warm yellow-white ink. Dark theme.

| Token | Value |
|-------|-------|
| `paper` | `#14110b` |
| `paper2` | `#1f1a12` |
| `ink` | `#ffe9b5` |
| `ink2` | `rgba(255,233,181,0.78)` |
| `barBg` | `#06040b` |
| `btnBg` | `#2a2418` |
| `scheme` | `dark` |

### mono
Near-white background, near-black ink. No color except urgency indicators.

| Token | Value |
|-------|-------|
| `paper` | `#f4f4ef` |
| `paper2` | `#e7e7e0` |
| `ink` | `#0a0a0a` |
| `barBg` | `#101010` |
| `btnBg` | `#fff` |
| `scheme` | `light` |

---

## Fixed values

These are the same across all palettes (`FZ_FIXED`):

| Token | Value |
|-------|-------|
| `charred` | `#1a1108` — bomb body |
| `safe` | `#3aa84a` — green |
| `warn` | `#f0a821` — yellow |
| `danger` | `#e53935` — red |
| `blue` | `#1d4ed8` |
| `display` | Bricolage Grotesque, Schibsted Grotesk, system-ui |
| `body` | Schibsted Grotesk, system-ui |
| `mono` | Geist Mono, JetBrains Mono, ui-monospace |

---

## CSS custom properties

`FizzProvider` syncs two CSS vars to `document.documentElement` whenever the theme changes:

```js
React.useEffect(() => {
  const r = document.documentElement
  r.style.setProperty('--fz-ink',    theme.ink)
  r.style.setProperty('--fz-paper2', theme.paper2)
}, [theme])
```

These are used by the scrollbar CSS in `index.html` which cannot reference React state directly. If you add more CSS-only themed elements, add more properties here.

---

## Scrollbar

Defined in `index.html` `<style>` block:

```css
::-webkit-scrollbar { width: 10px; height: 10px; }
::-webkit-scrollbar-track {
  background: var(--fz-paper2, #ffe6a8);
  border-left: 2.5px solid var(--fz-ink, #1a1108);  /* matches row dividers */
}
::-webkit-scrollbar-thumb { background: var(--fz-ink, #1a1108); }
::-webkit-scrollbar-corner { background: var(--fz-paper2, #ffe6a8); }
```

The scrollable task list div also sets `scrollbarColor` and `scrollbarWidth` for the CSS Scrollbars spec (Chrome 121+, which all recent Electron versions support).

The fallback values in `var(--fz-paper2, #ffe6a8)` match the cream palette so the scrollbar looks correct before the first React render.

---

## Adding a new palette

1. Add an entry to `FZ_PALETTES` in `shared.jsx`:
```js
const FZ_PALETTES = {
  cream: { ... },
  midnight: { ... },
  mono: { ... },
  yourPalette: {
    name: 'Your Palette',
    paper: '#...',   paper2: '#...',
    ink: '#...',     ink2: '...',    ink3: '...',
    rule: '...',     barBg: '#...',  btnBg: '#...',
    dotRgba: '...',  accent: '#...',
    scheme: 'light' | 'dark',
  },
}
```

2. Add it to the palette picker in `fz-settings.jsx` (look for the `FZ_PALETTES` map that renders radio/button options).

---

## Urgency colors

The fuse bar and time display use `getTimeColor(daysRemaining)` — color based on absolute days, not fraction:

```
≤ 0d  →  red    (#e53935)
≤ 1d  →  red
1–3d  →  lerp red → yellow
3–7d  →  lerp yellow → green
≥ 7d  →  green  (#3aa84a)
```

This is intentional — a 1-day task is red from creation, regardless of whether it was created with 1 day or 100 days.
