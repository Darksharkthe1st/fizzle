// shared.jsx — Fizzle shared state, helpers, theme, and sound.

const DAY_MS = 86400000;

// ── Initial data ────────────────────────────────────────────────────────
const INITIAL_TASKS = [
  { id: 'a', name: 'Implement onboarding flow',  total: 28, remaining: 21,   state: 'active',
    description: 'Hand-off from product on Tues. Slack thread: #onboarding-v2. Three screens, plus a tutorial overlay on first launch.' },
  { id: 'b', name: 'Q3 launch retrospective',    total: 10, remaining:  5,   state: 'active',
    description: 'Pull engagement metrics from Mixpanel. Notion doc → /retros/q3.' },
  { id: 'c', name: 'Migrate auth to OAuth 2.0',  total: 21, remaining: 12,   state: 'active', description: '' },
  { id: 'd', name: 'Develop password reset',     total: 14, remaining:  1,   state: 'active',
    description: 'Backend is ready. Need to wire up the email template — see Figma frame 412.' },
  { id: 'e', name: 'Review PR #482',             total:  2, remaining: 0.18, state: 'active',
    description: 'https://github.com/org/repo/pull/482 — Jamie\'s refactor of the queue worker. Be thorough; touches the scheduler.' },
  { id: 'f', name: 'Annual security audit',      total: 90, remaining: 42,   state: 'active', description: '' },
  { id: 'g', name: 'Draft pricing page copy',    total:  5, remaining:  2,   state: 'active',
    description: 'Three tiers. Loop in marketing for tone.' },
  { id: 'h', name: 'Update API docs',            total:  7, remaining: -2,   state: 'overdue',
    description: 'Should have shipped with v3.2. Embarrassing.' },
  { id: 'i', name: 'Schedule team offsite',      total: 14, remaining:  9,   state: 'active', description: '' },
  { id: 'j', name: 'File expense reports',       total:  5, remaining:  3,   state: 'done',
    defusedAt: Date.now() - 2 * DAY_MS,
    description: 'Receipts in the Drive folder.' },
];

// ── Tone (kept for legacy avenues; Fuze now drives off log scale) ───────
function getTone(t) {
  if (t.state === 'done') return 'done';
  if (t.state === 'overdue' || t.remaining < 0) return 'overdue';
  const frac = t.remaining / t.total;
  if (frac >= 0.45) return 'safe';
  if (frac >= 0.18) return 'warn';
  return 'danger';
}

function getFrac(t) {
  return Math.max(0, Math.min(1, t.remaining / t.total));
}

// ── Log scaling for the Fuze bar ────────────────────────────────────────
// Piecewise-linear through the user's anchors. Sub-day stays linear so the
// final hour gets visible bar; beyond 365 days asymptotes to ~1 so a 5-year
// deadline doesn't look identical to a 1-year one.
//   0d → 0
//   1d → 0.125 (1/8)
//   7d → 0.25  (1/4)
//  30d → 0.5
//  60d → 0.667
//  90d → 0.75
// 180d → 0.85
// 365d → 0.95
//  ∞   → 1
const LOG_ANCHORS = [
  [0, 0], [1, 0.125], [7, 0.25], [30, 0.5], [60, 0.667],
  [90, 0.75], [180, 0.85], [365, 0.95],
];

function logScale(daysRemaining) {
  if (daysRemaining <= 0) return 0;
  if (daysRemaining >= 365) {
    const yrs = (daysRemaining - 365) / 365;
    return 0.95 + 0.05 * (1 - Math.pow(0.5, yrs));
  }
  for (let i = 0; i < LOG_ANCHORS.length - 1; i++) {
    const [x1, y1] = LOG_ANCHORS[i];
    const [x2, y2] = LOG_ANCHORS[i + 1];
    if (daysRemaining <= x2) {
      const t = (daysRemaining - x1) / (x2 - x1);
      return y1 + t * (y2 - y1);
    }
  }
  return 0.95;
}

// ── Color: smooth red → yellow → green from a 0..1 scale ────────────────
function lerpColor(a, b, t) {
  const parse = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const lerp = (x, y) => Math.round(x + (y - x) * t);
  const hex = (v) => v.toString(16).padStart(2, '0');
  return '#' + hex(lerp(r1, r2)) + hex(lerp(g1, g2)) + hex(lerp(b1, b2));
}

const COLOR_RED    = '#e53935';
const COLOR_ORANGE = '#f0681f';
const COLOR_YELLOW = '#f0a821';
const COLOR_LIME   = '#94c83e';
const COLOR_GREEN  = '#3aa84a';

function getBarColor(scale) {
  // Anchors: 0 red · 0.18 orange · 0.35 yellow · 0.6 lime · 1 green
  if (scale <= 0.18) return lerpColor(COLOR_RED,    COLOR_ORANGE, scale / 0.18);
  if (scale <= 0.35) return lerpColor(COLOR_ORANGE, COLOR_YELLOW, (scale - 0.18) / 0.17);
  if (scale <= 0.60) return lerpColor(COLOR_YELLOW, COLOR_LIME,   (scale - 0.35) / 0.25);
  return lerpColor(COLOR_LIME, COLOR_GREEN, Math.min(1, (scale - 0.60) / 0.40));
}

// ── Time-based color — for tasks where urgency is what matters ──────────
// Color depends on absolute days remaining, not the task's total duration,
// so a 1-day task is red from the moment it's created. Anchors:
//   ≤ 1d : red
//   3d   : yellow
//   ≥ 7d : green
// Smooth lerp between.
function getTimeColor(daysRemaining) {
  if (daysRemaining <= 0) return COLOR_RED;
  if (daysRemaining <= 1) return COLOR_RED;
  if (daysRemaining >= 7) return COLOR_GREEN;
  if (daysRemaining < 3)  return lerpColor(COLOR_RED,    COLOR_YELLOW, (daysRemaining - 1) / 2);
  return                         lerpColor(COLOR_YELLOW, COLOR_GREEN,  (daysRemaining - 3) / 4);
}

// ── Formatters ──────────────────────────────────────────────────────────
function formatTimeLeft(t) {
  const r = t.remaining;
  if (r < 0) {
    const ab = Math.abs(r);
    if (ab < 1) return Math.round(ab * 24) + 'h overdue';
    return Math.round(ab) + 'd overdue';
  }
  if (r < 1) return Math.max(1, Math.round(r * 24)) + 'h left';
  if (r < 14) return Math.round(r) + 'd left';
  if (r < 60) return Math.round(r / 7) + 'w left';
  return Math.round(r / 30) + 'mo left';
}

function formatDueDate(t) {
  const due = new Date(Date.now() + t.remaining * DAY_MS);
  return due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRelative(timestampMs) {
  if (!timestampMs) return '';
  const dt = Date.now() - timestampMs;
  const abs = Math.abs(dt);
  if (abs < DAY_MS) {
    const hrs = Math.round(abs / 3600000);
    if (hrs < 1) return 'just now';
    return hrs + 'h ' + (dt < 0 ? 'from now' : 'ago');
  }
  const days = Math.round(abs / DAY_MS);
  if (days < 14) return days + 'd ' + (dt < 0 ? 'from now' : 'ago');
  return Math.round(days / 7) + 'w ' + (dt < 0 ? 'from now' : 'ago');
}

// ── Sort ────────────────────────────────────────────────────────────────
function sortTasks(tasks, mode) {
  const ts = [...tasks];
  if (mode === 'date') return ts.sort((a, b) => a.remaining - b.remaining);
  if (mode === 'name') return ts.sort((a, b) => a.name.localeCompare(b.name));
  return ts.sort((a, b) => {
    const ad = a.state === 'done' ? 1 : 0;
    const bd = b.state === 'done' ? 1 : 0;
    if (ad !== bd) return ad - bd;
    return a.remaining - b.remaining;
  });
}

// ── Theme palettes ──────────────────────────────────────────────────────
// Fixed brand colors and type — same across palettes.
const FZ_FIXED = {
  charred: '#1a1108',
  safe:    COLOR_GREEN,
  warn:    COLOR_YELLOW,
  danger:  COLOR_RED,
  blue:    '#1d4ed8',
  done:    '#9b9282',
  display: '"Bricolage Grotesque", "Schibsted Grotesk", system-ui, sans-serif',
  body:    '"Schibsted Grotesk", system-ui, sans-serif',
  mono:    '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
};

// Palettes — paper / paper2 / ink / ink2 / ink3 / rule / barBg / dot / btnBg.
const FZ_PALETTES = {
  cream: {
    name: 'Cream',
    paper:   '#fff3d6', paper2: '#ffe6a8',
    ink:     '#1a1108', ink2:   '#3a2a14', ink3: 'rgba(26,17,8,0.55)',
    rule:    'rgba(26,17,8,0.14)',
    barBg:   '#2a1f12',
    btnBg:   '#fff',
    dotRgba: 'rgba(26,17,8,0.10)',
    accent:  '#e53935',
    scheme:  'light',
  },
  midnight: {
    name: 'Midnight',
    paper:   '#14110b', paper2: '#1f1a12',
    ink:     '#ffe9b5', ink2:   'rgba(255,233,181,0.78)', ink3: 'rgba(255,233,181,0.42)',
    rule:    'rgba(255,233,181,0.16)',
    barBg:   '#06040b',
    btnBg:   '#2a2418',
    dotRgba: 'rgba(255,233,181,0.07)',
    accent:  '#ff7a45',
    scheme:  'dark',
  },
  mono: {
    name: 'Mono',
    paper:   '#f4f4ef', paper2: '#e7e7e0',
    ink:     '#0a0a0a', ink2:   '#3a3a3a', ink3: 'rgba(10,10,10,0.55)',
    rule:    'rgba(10,10,10,0.14)',
    barBg:   '#101010',
    btnBg:   '#fff',
    dotRgba: 'rgba(10,10,10,0.08)',
    accent:  '#0a0a0a',
    scheme:  'light',
  },
};

function buildFz(paletteName) {
  return { ...FZ_FIXED, ...(FZ_PALETTES[paletteName] || FZ_PALETTES.cream) };
}

// ── Sound (procedural via Web Audio — no asset deps) ─────────────────────
let _audioCtx = null;
function _ctx() {
  if (!_audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    _audioCtx = new AC();
  }
  if (_audioCtx.state === 'suspended') _audioCtx.resume().catch(() => {});
  return _audioCtx;
}

const SOUNDS = {
  snip: (vol = 0.18) => {
    const ctx = _ctx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.06);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.1);
  },
  pop: (vol = 0.22) => {
    const ctx = _ctx(); if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g).connect(ctx.destination);
    osc.start(now); osc.stop(now + 0.22);
  },
  boom: (vol = 0.32) => {
    const ctx = _ctx(); if (!ctx) return;
    const now = ctx.currentTime;
    // Filtered noise burst + low tonal thump.
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.45, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const t = i / data.length;
      data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 4.5);
    }
    const noise = ctx.createBufferSource(); noise.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 280;
    const ng = ctx.createGain(); ng.gain.setValueAtTime(vol, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    noise.connect(filt).connect(ng).connect(ctx.destination);
    const tone = ctx.createOscillator(); tone.type = 'triangle';
    tone.frequency.setValueAtTime(90, now);
    tone.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    const tg = ctx.createGain(); tg.gain.setValueAtTime(vol * 1.0, now); tg.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    tone.connect(tg).connect(ctx.destination);
    noise.start(now); tone.start(now);
    tone.stop(now + 0.55);
  },
};

// ── Persistence ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS = { palette: 'cream', sound: true, animation: 'full' };

// Read the saved file once at startup (synchronous IPC so it's ready before
// React renders). Falls back to an empty object if the file doesn't exist yet.
const _saved = (() => {
  try { return window.electronAPI?.loadData() || {}; } catch { return {}; }
})();

function loadSettings() {
  if (_saved.settings) return { ...DEFAULT_SETTINGS, ..._saved.settings };
  return DEFAULT_SETTINGS;
}

function loadTasks() {
  if (_saved.tasks) {
    return _saved.tasks.map((t) =>
      t.state === 'defusing' ? { ...t, state: 'active', defusedAt: null } : t
    );
  }
  return INITIAL_TASKS;
}

function saveData(tasks, settings) {
  try { window.electronAPI?.saveData({ tasks, settings }); } catch {}
}

// ── Context ─────────────────────────────────────────────────────────────
const FizzCtx = React.createContext(null);

function FizzProvider({ children }) {
  const [tasks, setTasks] = React.useState(loadTasks);
  const [now, setNow] = React.useState(0);
  const [expandedId, setExpandedId] = React.useState(null);
  const [showAdd, setShowAdd] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const [sortMode, setSortMode] = React.useState('urgency');
  const [view, setView] = React.useState('burning'); // 'burning'|'defused'|'detonated'
  const [settings, setSettings] = React.useState(loadSettings);

  // Persist tasks + settings together, debounced to avoid hammering the disk.
  React.useEffect(() => {
    const t = setTimeout(() => saveData(tasks, settings), 300);
    return () => clearTimeout(t);
  }, [tasks, settings]);

  const theme = React.useMemo(() => buildFz(settings.palette), [settings.palette]);

  // Sync CSS custom properties so scrollbar and other CSS-only theming stays in sync.
  React.useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--fz-ink',    theme.ink);
    r.style.setProperty('--fz-paper2', theme.paper2);
  }, [theme]);

  const playSound = React.useCallback((name) => {
    if (!settings.sound) return;
    const fn = SOUNDS[name]; if (fn) fn();
  }, [settings.sound]);

  // 1s tick for animations / time-based displays.
  React.useEffect(() => {
    const id = setInterval(() => setNow((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const defuse = React.useCallback((id) => {
    playSound('snip');
    setTasks((ts) => ts.map((t) =>
      t.id === id && t.state !== 'done'
        ? { ...t, state: 'defusing', defusedAt: Date.now() }
        : t));
  }, [playSound]);

  // 'defusing' → 'done' after 2.2s (matches the row's animation window).
  React.useEffect(() => {
    const pending = tasks.filter((t) => t.state === 'defusing');
    if (!pending.length) return;
    const id = setTimeout(() => {
      playSound('pop');
      setTasks((ts) => ts.map((t) => t.state === 'defusing' ? { ...t, state: 'done' } : t));
    }, 2200);
    return () => clearTimeout(id);
  }, [tasks, playSound]);

  const reset = React.useCallback(() => setTasks(INITIAL_TASKS), []);

  const add = React.useCallback((fields) => setTasks((ts) => [
    {
      id: 'n' + Date.now(),
      name: fields.name,
      total: fields.days,
      remaining: fields.days,
      state: 'active',
      description: fields.description || '',
    },
    ...ts,
  ]), []);

  const restore = React.useCallback((id) => setTasks((ts) =>
    ts.map((t) => t.id === id ? { ...t, state: 'active', defusedAt: null } : t)), []);

  const update = React.useCallback((id, patch) => setTasks((ts) =>
    ts.map((t) => t.id === id ? { ...t, ...patch } : t)), []);

  const remove = React.useCallback((id) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    setExpandedId((cur) => (cur === id ? null : cur));
  }, []);

  const toggleExpand = React.useCallback((id) =>
    setExpandedId((cur) => (cur === id ? null : id)), []);

  const cycleSort = React.useCallback(() =>
    setSortMode((m) => m === 'urgency' ? 'date' : m === 'date' ? 'name' : 'urgency'), []);

  const updateSettings = React.useCallback((patch) =>
    setSettings((s) => ({ ...s, ...patch })), []);

  // Counts & filtered views.
  const counts = React.useMemo(() => ({
    burning: tasks.filter((t) => (t.state === 'active' || t.state === 'defusing') && t.remaining >= 0).length,
    defused: tasks.filter((t) => t.state === 'done').length,
    detonated: tasks.filter((t) => t.state !== 'done' && t.remaining < 0).length,
  }), [tasks]);

  // For Fuze: filter to the active view, then sort. Other avenues still
  // see the full list via `tasks`.
  const visibleTasks = React.useMemo(() => {
    let pool;
    if (view === 'defused') pool = tasks.filter((t) => t.state === 'done');
    else if (view === 'detonated') pool = tasks.filter((t) => t.state !== 'done' && t.remaining < 0);
    else pool = tasks.filter((t) => (t.state === 'active' || t.state === 'defusing') && t.remaining >= 0);
    return sortTasks(pool, sortMode);
  }, [tasks, view, sortMode]);

  const value = React.useMemo(() => ({
    tasks, visibleTasks, counts,
    view, setView,
    sortMode, cycleSort,
    now, expandedId, toggleExpand,
    showAdd, setShowAdd,
    showSettings, setShowSettings,
    settings, updateSettings,
    theme, playSound,
    defuse, add, restore, reset, update, remove,
  }), [tasks, visibleTasks, counts, view, sortMode, cycleSort, now, expandedId, toggleExpand,
       showAdd, showSettings, settings, updateSettings, theme, playSound,
       defuse, add, restore, reset, update, remove]);

  return <FizzCtx.Provider value={value}>{children}</FizzCtx.Provider>;
}

function useFizz() { return React.useContext(FizzCtx); }

// ── Shared icon ─────────────────────────────────────────────────────────
function CalIcon({ size = 14, color = 'currentColor', strokeWidth = 1.5 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <rect x="2" y="3.5" width="12" height="11" rx="1.5" />
      <path d="M2 7h12M5 2v3M11 2v3" />
    </svg>
  );
}

Object.assign(window, {
  INITIAL_TASKS, DAY_MS,
  getTone, getFrac, formatTimeLeft, formatDueDate, formatRelative, sortTasks,
  logScale, lerpColor, getBarColor, getTimeColor,
  FZ_PALETTES, FZ_FIXED, buildFz, SOUNDS,
  FizzProvider, useFizz, CalIcon,
});
