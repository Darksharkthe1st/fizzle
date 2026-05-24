// avenue-boom.jsx — Avenue 4: Boom!
// Full cartoon. Bright cream paper, chunky type, fat black bombs at the row
// end, fuse that visibly shortens as the deadline closes in. Comic-book
// starburst on detonation. Loudest, most playful direction.

const BM = {
  paper:  '#fff3d6',
  paper2: '#ffe6a8',
  ink:    '#1a1108',
  ink2:   '#3a2a14',
  rule:   'rgba(26,17,8,0.14)',
  safe:   '#2a8e3a',
  warn:   '#e89a1f',
  danger: '#e53935',
  blue:   '#1d4ed8',
  done:   'rgba(26,17,8,0.32)',
  display:'"Bricolage Grotesque", "Schibsted Grotesk", system-ui, sans-serif',
  body:   '"Schibsted Grotesk", system-ui, sans-serif',
};

const BM_TONE = { safe: BM.safe, warn: BM.warn, danger: BM.danger, overdue: BM.danger, done: BM.done };

// Fat cartoon bomb. State: idle | defusing | exploded.
function BmBomb({ tone, done, defusing, exploded, urgency }) {
  if (exploded) {
    return (
      <div style={{ position: 'relative', width: 64, height: 56, flexShrink: 0 }}>
        <svg width="64" height="56" viewBox="0 0 64 56">
          {/* starburst */}
          <g fill={BM.warn} stroke={BM.ink} strokeWidth="2" strokeLinejoin="round">
            <polygon points="32,2 36,14 48,8 42,20 56,22 44,28 56,36 42,32 48,46 36,40 32,54 28,40 16,46 22,32 8,36 20,28 8,22 22,20 16,8 28,14"/>
          </g>
          <text x="32" y="34" textAnchor="middle" fontFamily={BM.display} fontWeight="800" fontSize="14" fill={BM.danger} letterSpacing="0.04em">BOOM</text>
        </svg>
      </div>
    );
  }
  const c = BM_TONE[urgency] || BM.ink;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" viewBox="0 0 56 56">
        {/* shadow */}
        <ellipse cx="28" cy="50" rx="18" ry="3" fill="rgba(0,0,0,0.18)"/>
        {/* body */}
        <circle cx="28" cy="32" r="19" fill={done ? '#888' : BM.ink} stroke={BM.ink} strokeWidth="2"/>
        {/* cap */}
        <rect x="23" y="11" width="10" height="6" rx="1" fill={done ? '#888' : BM.ink} stroke={BM.ink} strokeWidth="2"/>
        {/* fuse stub coming out the top, twists slightly */}
        <path d="M28 11 Q26 7 30 4" stroke={done ? '#888' : BM.ink2} strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        {/* highlight */}
        <circle cx="21" cy="27" r="4" fill="rgba(255,255,255,0.32)"/>
        <circle cx="22" cy="26" r="1.4" fill="rgba(255,255,255,0.85)"/>
        {/* defusing X across the fuse */}
        {defusing && (
          <g stroke={BM.safe} strokeWidth="3.2" strokeLinecap="round">
            <path d="M22 2 L34 10"/><path d="M34 2 L22 10"/>
          </g>
        )}
        {/* done checkmark badge */}
        {done && (
          <g>
            <circle cx="42" cy="18" r="9" fill={BM.safe} stroke={BM.ink} strokeWidth="2"/>
            <path d="M38 18 L41 21 L46 15" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        )}
      </svg>
      {/* ember sparkle (only when urgency is danger and active) */}
      {!done && !defusing && urgency === 'danger' && (
        <span style={{
          position: 'absolute', top: -2, left: 30, width: 8, height: 8, borderRadius: 8,
          background: BM.danger, color: BM.danger,
          animation: 'ember-flicker .8s ease-in-out infinite, ember-glow 1s ease-in-out infinite',
          boxShadow: `0 0 6px ${BM.danger}, 0 0 12px ${BM.warn}`,
        }}/>
      )}
    </div>
  );
}

// Chunky cartoon rope. Drawn as a thick stroke with a darker outline, plus
// short cross-hatches to suggest twist. Anchored at the right (next to bomb),
// shrinks from the LEFT as time burns — i.e., the lit tip travels right
// toward the bomb.
function BmFuse({ frac, tone, done, defusing }) {
  const c = BM_TONE[tone] || BM.ink;
  // 200 unit viewBox. Fuse extends from x = (1-frac)*200 to x = 200.
  const start = (1 - frac) * 200;
  return (
    <svg viewBox="0 0 200 18" preserveAspectRatio="none" width="100%" height="18" style={{ display: 'block', overflow: 'visible' }}>
      {/* ghost (consumed) */}
      <line x1="0" y1="9" x2={start} y2="9" stroke={BM.ink} strokeWidth="2" strokeDasharray="2 4" strokeLinecap="round" opacity=".25"/>
      {/* outline */}
      <line x1={start} y1="9" x2="200" y2="9" stroke={BM.ink} strokeWidth="8" strokeLinecap="round"/>
      {/* fill */}
      <line x1={start} y1="9" x2="200" y2="9" stroke={done ? '#bdbdbd' : c} strokeWidth="5" strokeLinecap="round"/>
      {/* twist hatches */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = start + 6 + i * 14;
        if (x > 198) return null;
        return <line key={i} x1={x} y1="6" x2={x + 4} y2="12" stroke={BM.ink} strokeWidth="1.4" strokeLinecap="round" opacity=".55"/>;
      })}
      {/* defusing snip */}
      {defusing && (
        <g stroke={BM.ink} strokeWidth="2.4" strokeLinecap="round">
          <line x1={start - 4} y1="3" x2={start + 4} y2="15"/>
          <line x1={start + 4} y1="3" x2={start - 4} y2="15"/>
        </g>
      )}
    </svg>
  );
}

function BmRow({ task, idx }) {
  const tone = getTone(task);
  const c = BM_TONE[tone];
  const frac = getFrac(task);
  const isDone = task.state === 'done';
  const isDefusing = task.state === 'defusing';
  const isOverdue = tone === 'overdue';
  const { defuse } = useFizz();
  const [hover, setHover] = React.useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 72px 110px',
        gap: 14, alignItems: 'center', padding: '12px 22px',
        background: hover && !isDone ? 'rgba(255,255,255,0.5)' : 'transparent',
        borderBottom: `2px solid ${BM.rule}`,
        opacity: isDone ? 0.6 : 1, transition: 'opacity .3s, background .15s',
        animation: isOverdue ? 'shake-overdue 1.6s ease-in-out infinite' : 'none',
      }}>
      {/* name */}
      <div style={{
        fontFamily: BM.display, fontSize: 17, fontWeight: 700, color: isDone ? BM.done : BM.ink,
        letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isDone ? 'line-through' : 'none', textDecorationThickness: '3px', textDecorationColor: BM.safe,
      }}>{task.name}</div>

      {/* fuse */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 24 }}>
        <BmFuse frac={isOverdue ? 0 : frac} tone={tone} done={isDone} defusing={isDefusing}/>
        {/* ember at the lit tip (left edge of the remaining fuse) */}
        {!isDone && !isDefusing && !isOverdue && frac > 0.01 && frac < 0.998 && (
          <span style={{
            position: 'absolute', top: '50%', left: `${(1 - frac) * 100}%`, transform: 'translate(-50%,-50%)',
            width: 14, height: 14, borderRadius: 14,
            background: `radial-gradient(circle at 35% 35%, #fff8c2, ${c} 55%, ${BM.danger} 100%)`,
            color: c, pointerEvents: 'none',
            animation: 'ember-flicker .7s ease-in-out infinite, ember-glow .9s ease-in-out infinite',
            boxShadow: `0 0 8px ${c}, 0 0 14px ${BM.warn}`,
          }}/>
        )}
      </div>

      {/* bomb */}
      <BmBomb tone={tone} done={isDone} defusing={isDefusing} exploded={isOverdue} urgency={tone}/>

      {/* time + cut button */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <div style={{
          fontFamily: BM.display, fontSize: 16, fontWeight: 700,
          color: isOverdue ? BM.danger : tone === 'danger' ? BM.danger : tone === 'warn' ? BM.warn : isDone ? BM.done : BM.ink,
          letterSpacing: '-0.01em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        }}>{formatTimeLeft(task)}</div>
        <button
          onClick={() => !isDone && defuse(task.id)}
          disabled={isDone}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 24, padding: '0 9px', borderRadius: 12,
            background: isDone ? BM.safe : '#fff', color: isDone ? '#fff' : BM.ink,
            border: `2px solid ${BM.ink}`, fontFamily: BM.body, fontSize: 12, fontWeight: 700,
            cursor: isDone ? 'default' : 'pointer', boxShadow: isDone ? 'none' : `2px 2px 0 ${BM.ink}`,
            transition: 'transform .1s, box-shadow .1s',
          }}
          onMouseDown={(e) => { if (!isDone) { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${BM.ink}`; } }}
          onMouseUp={(e) => { if (!isDone) { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `2px 2px 0 ${BM.ink}`; } }}>
          {isDone ? '✓ Defused' : '✂ Cut'}
        </button>
      </div>
    </div>
  );
}

function AvenueBoom() {
  const { tasks, setShowAdd } = useFizz();

  // halftone dots — subtle comic paper texture
  const dots = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='2' cy='2' r='0.8' fill='${encodeURIComponent('rgba(26,17,8,0.10)')}'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      width: '100%', height: '100%', background: BM.paper, color: BM.ink,
      fontFamily: BM.body, display: 'flex', flexDirection: 'column',
      backgroundImage: dots, backgroundSize: '14px 14px', position: 'relative',
    }}>
      {/* header — sticker-like masthead */}
      <div style={{ padding: '22px 22px 12px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px 8px', borderRadius: 14,
          background: BM.danger, color: '#fff',
          border: `2.5px solid ${BM.ink}`, boxShadow: `4px 4px 0 ${BM.ink}`,
          transform: 'rotate(-2deg)',
        }}>
          <span style={{ fontFamily: BM.display, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
            FIZZLE!
          </span>
          <BmBomb tone="danger" urgency="danger"/>
        </div>
        <div style={{ flex: 1 }} />
        <BmChip label="+ Light one" primary onClick={() => setShowAdd(true)}/>
        <BmChip label="Sort"/>
        <BmChip label="Due By" icon="cal"/>
      </div>

      {/* column header */}
      <div style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 72px 110px',
        gap: 14, padding: '10px 22px 8px', borderTop: `3px solid ${BM.ink}`, borderBottom: `3px solid ${BM.ink}`,
        fontFamily: BM.body, fontSize: 11, color: BM.ink2, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
      }}>
        <div>Task</div><div>Fuse →</div><div>Bomb</div><div style={{ textAlign: 'right' }}>Time / Action</div>
      </div>

      {/* rows */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {tasks.map((t, i) => <BmRow key={t.id} task={t} idx={i}/>)}
      </div>

      {/* footer caption — comic dialog */}
      <div style={{
        padding: '10px 22px', borderTop: `3px solid ${BM.ink}`,
        fontFamily: BM.display, fontSize: 13, color: BM.ink, fontWeight: 600, fontStyle: 'italic',
        background: BM.paper2, display: 'flex', justifyContent: 'space-between',
      }}>
        <span>Tick. Tick. Tick. {tasks.filter(t=>t.state!=='done').length} live!</span>
        <span style={{ opacity: .6 }}>— don't drop the matches.</span>
      </div>
    </div>
  );
}

function BmChip({ label, primary, icon, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 34, padding: '0 14px', borderRadius: 17,
        background: primary ? BM.ink : '#fff',
        color: primary ? BM.paper : BM.ink,
        border: `2.5px solid ${BM.ink}`,
        boxShadow: hover ? `2px 2px 0 ${BM.ink}` : `4px 4px 0 ${BM.ink}`,
        transform: hover ? 'translate(2px,2px)' : 'translate(0,0)',
        fontFamily: BM.display, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', transition: 'transform .1s, box-shadow .1s',
      }}>
      {icon === 'cal' && <CalIcon size={13} strokeWidth={2}/>}
      {label}
    </button>
  );
}

Object.assign(window, { AvenueBoom });
