# Habits Feature — Design Document

Status: **Design phase (Round 1 — candle options in review)**

---

## Feature overview

A recurring habit tracker integrated into Fizzle. Habits live in their own tab (alongside
Burning / Defused / Detonated). Each habit row shows:

1. **A candle** (left side) — represents the streak. Burns hotter and taller as consecutive
   weeks are completed.
2. **A 7-segment fuse chain** — one segment per day of the week. Segments light up as you
   log each day. A complete chain fires a chain-reaction animation and confetti.
3. **A name and action button** — habit name + "Log it" to check off today.

---

## Design decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Iteration strategy | Art director + craftsperson (see `DESIGN-ITERATION.md`) | Prevents LLM anchoring on wrong direction |
| Candle aesthetic | **Whimsical** (not austere) | Matches existing app personality; logo is warm and playful |
| Spare Fuses placement | **Inside the Habits tab**, prominent | Top toolbar is already noisy with chips; Spare Fuses are a core habit mechanic, not a global setting |
| Visual reference | None — should feel native to Fizzle with a fun twist | No outside reference; build from existing visual vocabulary |
| Candle streak scale | Flame grows taller + brighter with streak; wax drips accumulate | Intuitive: a "hotter" candle = you've been at this a while |

---

## The Spare Fuses system

**What they are:** "streak freeze" equivalents, named Spare Fuses in Fizzle's vocabulary.
The action of using one is called "Patch the chain."

**Earning:** every 3 defused deadline tasks (in the Fuze avenue) = +1 Spare Fuse.

**Cap:** maximum 2 Spare Fuses at any time.

**Weekly drain:** at week reset, lose 1 Spare Fuse regardless of balance. This prevents
hoarding and keeps the system earning-based.

**Exception:** if the user already spent a spare during the current week, do NOT drain
another one at reset. They already paid the cost. The drain is about preventing idle
accumulation, not punishing active users.

**Spending:** explicit, not automatic. When the week ends with a gap, show a prompt:
> "You missed Tuesday. Patch the chain? (2 → 1 spares remaining)"
The user confirms, the gap animates shut with a spark, confetti fires, streak holds.
This intentional moment preserves the feeling of earned progress.

**Starting balance:** 1 Spare Fuse on first use (grace period, feels fair).

**Full mechanic table:**

| Situation | Result |
|---|---|
| 3 deadline tasks defused | +1 Spare Fuse (if < 2) |
| Week resets, user has spares, did NOT spend any this week | −1 Spare Fuse |
| Week resets, user spent a spare this week | No additional drain |
| User has 0 spares, week resets | No change |
| User confirms "Patch the chain" | −1 Spare Fuse, missed day filled, streak holds |

---

## Candle — design rounds

### Round 1 (✅ locked)

**Choice: Option B — The Taper.** Classic tall candle silhouette. Flame intensity and
wax drip accumulation scale with streak. Tilt animation at 50° when lighting a bomb.
File: `candle-test.html`

### Round 2 (✅ locked)

**7-segment fuse chain.** File: `chain-test.html`

Locked visual decisions:

| State | Bomb | Fuse |
|---|---|---|
| Future | Dim ring, no shine, no wick | Dark (barBg), dim border |
| Today (unlit) | Full ink border, cold wick stub, dim tip | Orange animated stripe → today |
| Done | Flame on wick (absolute coords, `transform-box:fill-box`), ✓ badge | Green animated stripe |
| Missed | 6-pt BOOM star, inner star, "BOOM" in danger red | Red dashed |
| Burned (after missed) | — | Charred dark, dim border |

Key implementation notes:
- Flame paths use **absolute SVG coordinates** (tip `16,4` → base `16,14`), no `translate` wrapper. CSS animation and SVG `transform` attribute do not compose — CSS wins and drops the translate.
- `transform-box: fill-box; transform-origin: 50% 100%` anchors flicker rotation at the flame base.
- Charred wick stub: `<line x1="16" y1="9" x2="16" y2="14" stroke="#3a2a14" .../>` before the mount rect.
- Stripe animation: `stripe-flow 1.6s` (done/green), `stripe-flow 0.9s` (burning/orange).

### Round 3 (✅ locked)

**Composed HabitRow + SparesFuse counter + Patch visualization.** File: `habit-row-test.html`

Locked decisions:

| Element | Decision |
|---|---|
| Spare Fuse token shape | **Blade fuse** (automotive style) — upright, body + two metal prongs |
| Spare Fuse counter | Two blade fuse SVGs side-by-side; charged = green glow + intact wire; spent = dark body + broken wire + scorch dot |
| Patch the chain visual | Blade fuse bridge sits above BOOM bomb, prongs plant on fuse segments each side; chain goes green through it; BOOM fades but stays visible underneath; "+1!" badge floats above body |
| Habit row grid | `52px (taper) | 160px (name+streak) | 1fr (chain) | 90px (button)` |
| Log button states | Default ink border → "✦ Lighting…" disabled during tilt → "✓ Done!" in safe green |
| Streak label | "wk N streak" in mono below habit name |

### Round 4 (current)

Compose candle + fuse chain into a full `HabitRow`. Show alongside a placeholder for the
Spare Fuses counter.

### Round 4 (pending)

Full `AvenueHabits` layout: tab header, Spare Fuses counter, empty state, rows.

---

## Data schema

Habits extend the existing task schema (same fields), minus `remaining`/`total` (no deadline),
plus habit-specific fields:

```js
{
  // — Inherited from task schema —
  id:          string,      // uuid
  name:        string,
  description: string,      // notes

  // — Habit-specific —
  streak:      number,      // consecutive weeks fully completed (not days — weeks)
  weekLog:     bool[7],     // [Mon, Tue, Wed, Thu, Fri, Sat, Sun] — current week
  createdAt:   number,      // timestamp ms
  lastResetAt: number,      // timestamp ms of last week boundary reset
}
```

No `state` field (habits don't defuse or detonate in the same sense).
No `remaining`, `total`, or `defusedAt` fields.

**Week boundary:** resets at midnight Sunday → Monday (configurable in a future version;
for MVP, hardcoded to Mon start).

---

## Naming conventions

| Concept | Display name | Copy / microcopy |
|---|---|---|
| Streak freeze / replacement | Spare Fuse(s) | "You have 2 spare fuses" |
| Using a spare | Patch the chain | "Patch the chain? (2 → 1 spares remaining)" |
| Completing all 7 | (no special name) | Chain fires → confetti |
| Missing a day | (no special name) | Segment goes dark/charred |
| Weekly reset | (internal) | "(confetti or sad BOOM) · streak updated" |

---

## Implementation plan (post-design-phase)

1. **`avenue-habits.jsx`** — new file, exports `AvenueHabits`, `HabitRow`, `HabitCandle`,
   `HabitChain`, `SparesFuseCounter`, `NewHabitModal`
2. **`shared.jsx`** — add `habits` state, `addHabit`, `logHabit`, `patchChain`,
   `spendSpare`, `weekReset` actions to `FizzProvider`; add `spares` to saved data
3. **`app.jsx`** — add "Habits" tab to top-level navigation (alongside Fuze)
4. **`index.html`** — add `<script type="text/babel" src="avenue-habits.jsx">` before `app.jsx`

Week-reset logic runs on app startup: compare `lastResetAt` to current date, if a new
Monday has passed, process the reset (update streaks, drain spares, etc.).
