# Design Iteration Strategy (with an LLM)

A repeatable process for collaborating on UI design when one party is a human with gut instincts
and the other is an LLM that can build fast but struggles to predict what will feel right.

---

## The core problem

LLMs converge on "reasonable-looking" rather than "emotionally right." The gap between those two
is where design lives. Generating a full screen and asking for feedback produces the worst results:
by the time the human has vague discomfort they can't articulate, both parties are anchored to
something that should be thrown away.

---

## The model: art director + craftsperson

The human is the **art director**. They provide:
- Gut reactions ("this feels too polished," "not enough weight")
- Adjective-based feedback, not spec-based ("make it feel more dangerous")
- Visual references when available (apps, objects, moods — any anchor)
- Go/no-go decisions at each gate

The LLM is the **craftsperson**. It:
- Translates adjectives into implementation decisions
- Builds the smallest useful unit, shows it, waits for feedback
- Never moves to the next component until the current one is approved
- Offers options (2–3 variants) when the design space is genuinely open

---

## The process

### Round 0 — Calibration questions (before any code)

Ask three things:
1. **Adjective axis**: pick two opposite pairs that feel relevant (e.g. "whimsical vs austere,"
   "loud vs quiet," "playful vs serious"). Ask which end the design should lean toward.
2. **Placement**: where in the existing UI does this new element live? Nail this early — it
   constrains proportions and context before any visual work starts.
3. **Reference**: one anchor, anything — an app, a game, a physical object, a feeling. Even
   "I don't have one, surprise me" is useful because it means free range.

### Round 1 — Build the hardest/most novel element first

The riskiest element is the one with the most design unknowns. Build *only* that, in isolation,
in a test file separate from the main codebase. Show a screenshot. Wait for feedback.

Do not build anything else until this is approved. If the foundation is wrong, everything
built on it is wrong.

If the design space is wide open, show 2–3 distinct variants — genuinely different directions,
not variations in border-radius.

### Round 2–N — Add elements one at a time

Each subsequent round adds one component:
- Round 2: the second-hardest novel element
- Round 3: show how they compose together
- Round 4: full-width layout with all elements in context
- Round N: integrate into the real codebase

### Screenshot-driven feedback loop

Every round ends with a screenshot. The human reacts in gut-feel terms. The LLM adjusts.
Repeat until "yes." Only then move to the next round.

---

## Feedback language

Good feedback:
- "Too cute, needs more weight"
- "The flame feels timid, make it feel like it means business"
- "This spacing is tight, it should breathe more"
- "I love A but want the glow from C"

Avoid (because it skips the why):
- "Make the border 2px instead of 1.5px"
- "Change #ffb84d to #ffc060"
- Spec-first feedback in general — unless confirming a final decision

---

## When to show options vs. one direction

Show **options** when:
- The design space is genuinely open (no strong existing aesthetic to match)
- The human said they have no reference and want to be surprised
- The design choice has a meaningful emotional fork (playful vs. serious, etc.)

Show **one direction** when:
- There is a strong existing aesthetic to match
- The human has given enough reference to be confident
- The component is secondary (spacing, labels, chips) — just make a reasonable call

---

## Files for this project

See [`HABITS-DESIGN.md`](HABITS-DESIGN.md) for the application of this process to the
Habits feature currently being built in Fizzle.
