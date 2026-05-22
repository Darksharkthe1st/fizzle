// avenue-terminal.jsx — Avenue 1: Terminal
// Abstract dark. Hairline rules, monospace timing, diagonal stripe fuse with a
// glowing ember at the burn-tip. Closest to the user's original sketch — but
// tightened: real type scale, semantic color tokens, hover affordances.

const TERM = {
  bg: '#0b0c0e',
  panel: '#101216',
  panel2: '#161a20',
  line: 'rgba(255,255,255,0.07)',
  text: 'rgba(255,255,255,0.92)',
  text2: 'rgba(255,255,255,0.55)',
  text3: 'rgba(255,255,255,0.35)',
  safe: '#4ade80',
  warn: '#facc15',
  danger: '#f87171',
  done: 'rgba(255,255,255,0.22)',
  font: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
  mono: '"Geist Mono", "SF Mono", ui-monospace, monospace',
};

const TERM_TONE = {
  safe:    TERM.safe,
  warn:    TERM.warn,
  danger:  TERM.danger,
  overdue: TERM.danger,
  done:    TERM.done,
};

function TermFuse({ task }) {
  const tone = getTone(task);
  const frac = getFrac(task);
  const c = TERM_TONE[tone];
  const isDefusing = task.state === 'defusing';
  const isDone = task.state === 'done';
  const isOverdue = tone === 'overdue';

  // Stripes encoded once, recolored via currentColor. 8px stripe / 6px gap, 28° slant.
  const stripeBg = (color, alpha = 1) =>
    `repeating-linear-gradient(115deg, ${color} 0 8px, transparent 8px 14px)`;

  if (isOverdue) {
    return (
      <div style={{
        position: 'relative', height: 22, borderRadius: 4,
        background: TERM.panel2, border: `1px solid ${TERM.line}`, overflow: 'hidden',
        animation: 'shake-overdue 1.6s ease-in-out infinite',
      }}>
        {/* charred bar */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(248,113,113,0.18), transparent 50%), radial-gradient(circle at 75% 50%, rgba(0,0,0,0.7), transparent 60%)`,
        }} />
        {/* cracks */}
        <svg width="100%" height="100%" viewBox="0 0 200 22" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, opacity: .6 }}>
          <path d="M30 4 L40 12 L36 16 L50 22" stroke="#ff5050" strokeWidth=".7" fill="none"/>
          <path d="M120 0 L128 8 L124 14 L138 22" stroke="#ff5050" strokeWidth=".7" fill="none"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: TERM.mono, fontSize: 11, letterSpacing: '0.18em', color: '#ff7a7a', fontWeight: 700,
          textShadow: '0 0 8px rgba(255,80,80,0.55)',
        }}>BOOM</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', height: 22, borderRadius: 4,
      background: TERM.panel2, border: `1px solid ${TERM.line}`, overflow: 'hidden',
    }}>
      {/* fuse fill — left-anchored stripe, shrinks as time burns */}
      <div style={{
        position: 'absolute', top: 0, bottom: 0, left: 0,
        width: `${frac * 100}%`,
        background: stripeBg(c),
        backgroundSize: '28px 100%',
        animation: !isDone ? 'stripe-flow 1.6s linear infinite' : 'none',
        transition: 'width .6s cubic-bezier(.2,.7,.3,1), opacity .4s',
        opacity: isDefusing ? 0.35 : 1,
        filter: isDone ? 'grayscale(1) brightness(0.6)' : 'none',
      }} />
      {/* ember at the burn-tip (right edge of fill) */}
      {!isDone && !isDefusing && frac > 0.02 && frac < 0.995 && (
        <div style={{
          position: 'absolute', top: '50%', left: `${frac * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: 8, height: 8, borderRadius: 8,
          background: c, color: c,
          animation: 'ember-flicker 1.1s ease-in-out infinite, ember-glow 1.6s ease-in-out infinite',
          boxShadow: `0 0 6px ${c}, 0 0 12px ${c}`,
        }} />
      )}
      {/* snip mark when defusing */}
      {isDefusing && (
        <div style={{
          position: 'absolute', top: '50%', left: `${frac * 100}%`, transform: 'translate(-50%,-50%)',
          fontFamily: TERM.mono, fontSize: 14, color: TERM.text, animation: 'pop-in .25s ease-out',
        }}>✕</div>
      )}
      {isDone && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: 8,
          fontFamily: TERM.mono, fontSize: 11, color: TERM.text3, letterSpacing: '0.12em',
        }}>DEFUSED</div>
      )}
    </div>
  );
}

function TermRow({ task }) {
  const tone = getTone(task);
  const c = TERM_TONE[tone];
  const isDone = task.state === 'done';
  const { defuse } = useFizz();
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr 92px 36px',
      gap: 18, alignItems: 'center', padding: '10px 22px',
      borderBottom: `1px solid ${TERM.line}`,
      opacity: isDone ? 0.55 : 1, transition: 'opacity .3s',
    }}>
      <div style={{
        fontFamily: TERM.font, fontSize: 13.5, color: isDone ? TERM.text2 : TERM.text,
        fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isDone ? 'line-through' : 'none',
        textDecorationColor: TERM.text3,
      }}>{task.name}</div>
      <TermFuse task={task} />
      <div style={{
        fontFamily: TERM.mono, fontSize: 11.5, color: tone === 'overdue' ? '#ff8a8a' : tone === 'danger' ? c : TERM.text2,
        textAlign: 'right', letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums',
      }}>{formatTimeLeft(task)}</div>
      <button
        onClick={() => !isDone && defuse(task.id)}
        title={isDone ? 'Defused' : 'Defuse task'}
        style={{
          width: 28, height: 28, borderRadius: 6, border: `1px solid ${TERM.line}`,
          background: 'transparent', color: TERM.text2, cursor: isDone ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background .15s, color .15s, border-color .15s', padding: 0,
        }}
        onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.background = 'rgba(74,222,128,0.1)'; e.currentTarget.style.color = TERM.safe; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = TERM.text2; e.currentTarget.style.borderColor = TERM.line; }}>
        {isDone
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={TERM.safe} strokeWidth="1.8" strokeLinecap="round"><path d="M3 7.5L6 10.5 11 4.5"/></svg>
          : <CalIcon size={13} />}
      </button>
    </div>
  );
}

function AvenueTerminal() {
  const { tasks, setShowAdd } = useFizz();
  return (
    <div style={{
      width: '100%', height: '100%', background: TERM.bg, color: TERM.text,
      fontFamily: TERM.font, display: 'flex', flexDirection: 'column',
    }}>
      {/* window chrome */}
      <div style={{
        height: 36, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px',
        borderBottom: `1px solid ${TERM.line}`, background: '#08090b', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <span style={{ width: 11, height: 11, borderRadius: 11, background: '#ff5f57' }} />
          <span style={{ width: 11, height: 11, borderRadius: 11, background: '#febc2e' }} />
          <span style={{ width: 11, height: 11, borderRadius: 11, background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: TERM.mono, fontSize: 11, color: TERM.text3 }}>fizzle</div>
        <div style={{ width: 52 }} />
      </div>

      {/* app header */}
      <div style={{
        padding: '22px 22px 14px', display: 'flex', alignItems: 'baseline', gap: 14,
      }}>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
          color: TERM.text, lineHeight: 1,
        }}>
          Fizzle<span style={{ color: TERM.danger }}>.</span>
        </h1>
        <span style={{ fontFamily: TERM.mono, fontSize: 11, color: TERM.text3, letterSpacing: '0.08em' }}>
          {tasks.filter((t) => t.state !== 'done').length} ACTIVE
        </span>
        <div style={{ flex: 1 }} />
        <ChipButton label="+ New task" onClick={() => setShowAdd(true)} primary />
        <ChipButton label="Sort / Filter" icon="sort" />
        <ChipButton label="Due By" icon="cal" />
      </div>

      {/* column header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '220px 1fr 92px 36px',
        gap: 18, padding: '8px 22px', borderTop: `1px solid ${TERM.line}`, borderBottom: `1px solid ${TERM.line}`,
        fontFamily: TERM.mono, fontSize: 10.5, color: TERM.text3, letterSpacing: '0.14em',
      }}>
        <div>TASK</div>
        <div>FUSE</div>
        <div style={{ textAlign: 'right' }}>REMAINING</div>
        <div></div>
      </div>

      {/* rows */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {tasks.map((t) => <TermRow key={t.id} task={t} />)}
      </div>
    </div>
  );
}

function ChipButton({ label, icon, primary, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 28, padding: '0 12px', borderRadius: 7,
        background: primary ? '#fff' : hover ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: primary ? '#0a0a0a' : TERM.text2,
        border: `1px solid ${primary ? '#fff' : TERM.line}`,
        fontFamily: TERM.font, fontSize: 12, fontWeight: 500,
        cursor: 'pointer', transition: 'background .15s, color .15s',
      }}>
      {icon === 'sort' && <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h7M3 5.5h5M4 8h3"/></svg>}
      {icon === 'cal' && <CalIcon size={11} strokeWidth={1.6} />}
      {label}
    </button>
  );
}

Object.assign(window, { AvenueTerminal });
