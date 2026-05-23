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

### Round 1 (current)

Three distinct directions shown in `candle-test.html`:

- **Option A — The Block**: squat rectangular body, same chunky energy as the bomb.
  Wax drips accumulate on sides with streak. Flame grows taller.
- **Option B — The Taper**: classic tall candle silhouette, slightly elegant. Flame
  intensity scales with streak. Wax drips appear on sides.
- **Option C — The Bombette**: round body (same shape as the existing bomb SVG) with
  a flame instead of a fuse. Most native to Fizzle's visual vocabulary.
  A green ✓ badge appears on the body at streak > 1 (mirrors the "defused" bomb state).

### Round 2 (pending approval of Round 1)

Build the 7-segment fuse chain in isolation. States to show:
- Unlit (future or not yet logged)
- Lit/complete (logged day, green with stripe animation)
- Today/current (orange, pulsing — "you can still log this")
- Missed (past day, not logged — charred/dark, no animation)

### Round 3 (pending)

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
