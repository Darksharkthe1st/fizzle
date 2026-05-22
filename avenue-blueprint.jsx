// avenue-blueprint.jsx — Avenue 2: Blueprint
// Industrial schematic. Cyan-on-navy, dimension callouts, twisted-rope fuse,
// tiny bomb icon at the row end. Maximum on-the-nose metaphor, dressed as a
// technical drawing rather than a cartoon.

const BP = {
  bg: '#0a1a2a',
  ink: '#bce8ff',
  ink2: '#5b95c2',
  ink3: '#3a6e94',
  paper: '#0e2236',
  line: 'rgba(180,225,255,0.18)',
  grid: 'rgba(180,225,255,0.06)',
  safe: '#7cf2c4',
  warn: '#fbd66b',
  danger: '#ff8a85',
  done: 'rgba(180,225,255,0.25)',
  mono: '"JetBrains Mono", ui-monospace, monospace',
  sans: '"Space Grotesk", system-ui, sans-serif',
};

const BP_TONE = { safe: BP.safe, warn: BP.warn, danger: BP.danger, overdue: BP.danger, done: BP.done };

// Twisted-rope fuse rendered as SVG path with a braided sine.
function BpRope({ frac, color, animate }) {
  // 200 viewBox width; braid is two offset sines clipped to frac.
  const path1 = [];
  const path2 = [];
  for (let x = 0; x <= 200; x += 2) {
    const y1 = 6 + Math.sin(x * 0.5) * 2.5;
    const y2 = 6 - Math.sin(x * 0.5) * 2.5;
    path1.push((x === 0 ? 'M' : 'L') + x + ' ' + y1.toFixed(2));
    path2.push((x === 0 ? 'M' : 'L') + x + ' ' + y2.toFixed(2));
  }
  return (
    <svg viewBox="0 0 200 12" preserveAspectRatio="none" width="100%" height="12" style={{ display: 'block' }}>
      <defs>
        <clipPath id={`clip-${frac}-${color.replace('#','')}`}>
          <rect x="0" y="0" width={frac * 200} height="12" />
        </clipPath>
      </defs>
      {/* ghost rope (unburned region beyond fuse — empty) */}
      <path d={path1.join(' ')} stroke={BP.ink3} strokeWidth="1" fill="none" strokeDasharray="2 2" opacity=".3" />
      <path d={path2.join(' ')} stroke={BP.ink3} strokeWidth="1" fill="none" strokeDasharray="2 2" opacity=".3" />
      {/* live rope */}
      <g clipPath={`url(#clip-${frac}-${color.replace('#','')})`}>
        <path d={path1.join(' ')} stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
        <path d={path2.join(' ')} stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
        {animate && (
          <>
            <path d={path1.join(' ')} stroke={color} strokeWidth="1.7" fill="none" strokeLinecap="round" strokeDasharray="6 12" opacity=".6">
              <animate attributeName="stroke-dashoffset" from="0" to="-18" dur="1.4s" repeatCount="indefinite"/>
            </path>
          </>
        )}
      </g>
    </svg>
  );
}

function BpBomb({ tone, defusing, done, exploded }) {
  const c = BP_TONE[tone] || BP.ink;
  if (exploded) {
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
        {/* shattered bomb */}
        <g stroke={BP.danger} strokeWidth="1.2" fill="none" strokeLinecap="round">
          <path d="M4 14 L8 11" /><path d="M24 14 L20 12" /><path d="M14 4 L14 7" /><path d="M14 24 L14 21" />
          <path d="M6 6 L9 9" /><path d="M22 6 L19 9" /><path d="M22 22 L19 19" /><path d="M6 22 L9 19" />
          <circle cx="14" cy="14" r="6" strokeDasharray="2 1.5"/>
        </g>
        <text x="14" y="16" fontSize="6" fill={BP.danger} fontFamily={BP.mono} textAnchor="middle" fontWeight="700" letterSpacing=".05em">BOOM</text>
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" style={{ display: 'block' }}>
      {/* body */}
      <circle cx="14" cy="17" r="7" stroke={done ? BP.done : c} strokeWidth="1.3" fill={done ? 'transparent' : 'rgba(124,242,196,0.06)'} />
      {/* cap */}
      <rect x="11.5" y="6.5" width="5" height="3" stroke={done ? BP.done : c} strokeWidth="1.1" fill="none"/>
      {/* fuse stub */}
      <path d="M14 6.5 L14 4" stroke={done ? BP.done : c} strokeWidth="1.1" strokeLinecap="round"/>
      {/* highlight */}
      <circle cx="11" cy="15" r="1.5" fill={done ? 'transparent' : c} opacity={done ? 0 : .35}/>
      {defusing && (
        <g stroke={BP.safe} strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M5 3 L9 7" /><path d="M9 3 L5 7" />
        </g>
      )}
    </svg>
  );
}

function BpRow({ task }) {
  const tone = getTone(task);
  const c = BP_TONE[tone];
  const frac = getFrac(task);
  const isDone = task.state === 'done';
  const isDefusing = task.state === 'defusing';
  const isOverdue = tone === 'overdue';
  const { defuse } = useFizz();

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '36px 220px 1fr 100px 36px',
      gap: 16, alignItems: 'center', padding: '14px 22px',
      borderBottom: `1px dashed ${BP.line}`,
      opacity: isDone ? 0.5 : 1, transition: 'opacity .3s',
      animation: isOverdue ? 'shake-overdue 1.6s ease-in-out infinite' : 'none',
    }}>
      {/* part number */}
      <div style={{ fontFamily: BP.mono, fontSize: 10, color: BP.ink3, letterSpacing: '0.08em' }}>
        {String(task.id).toUpperCase()}-01
      </div>
      {/* name */}
      <div style={{ fontFamily: BP.sans, fontSize: 13, color: isDone ? BP.ink2 : BP.ink, fontWeight: 500, textDecoration: isDone ? 'line-through' : 'none', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</div>
      {/* rope + bomb */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* dimension tick at start */}
        <span style={{ width: 1, height: 10, background: BP.ink3, flexShrink: 0 }} />
        <div style={{ flex: 1, position: 'relative' }}>
          <BpRope frac={isOverdue ? 0 : frac} color={isDone ? BP.done : c} animate={!isDone && !isDefusing && frac > 0.02} />
          {/* ember */}
          {!isDone && !isDefusing && !isOverdue && frac > 0.02 && frac < 0.995 && (
            <div style={{
              position: 'absolute', top: '50%', left: `${frac * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 7, height: 7, borderRadius: 7,
              background: c, color: c,
              animation: 'ember-flicker 1.1s ease-in-out infinite, ember-glow 1.6s ease-in-out infinite',
              boxShadow: `0 0 4px ${c}, 0 0 9px ${c}`, pointerEvents: 'none',
            }} />
          )}
          {/* dimension label */}
          <div style={{
            position: 'absolute', top: -12, left: 0, right: 0,
            fontFamily: BP.mono, fontSize: 9.5, color: BP.ink3, letterSpacing: '0.06em',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>0</span>
            <span style={{ color: isOverdue ? BP.danger : BP.ink2 }}>
              {isOverdue ? 'DETONATED' : isDone ? 'CUT' : `${Math.round(frac * 100)}%`}
            </span>
            <span>{task.total}d</span>
          </div>
        </div>
        <span style={{ width: 1, height: 10, background: BP.ink3, flexShrink: 0, marginRight: 6 }} />
        <BpBomb tone={tone} defusing={isDefusing} done={isDone} exploded={isOverdue} />
      </div>
      {/* time */}
      <div style={{
        fontFamily: BP.mono, fontSize: 11, color: isOverdue ? BP.danger : tone === 'danger' ? c : BP.ink2,
        textAlign: 'right', letterSpacing: '0.03em', fontVariantNumeric: 'tabular-nums',
      }}>{formatTimeLeft(task)}</div>
      {/* action */}
      <button
        onClick={() => !isDone && defuse(task.id)}
        title={isDone ? 'Defused' : 'Snip wire'}
        style={{
          width: 28, height: 28, borderRadius: 4, border: `1px solid ${BP.line}`,
          background: 'transparent', color: BP.ink2, cursor: isDone ? 'default' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          transition: 'background .15s, color .15s',
        }}
        onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.background = 'rgba(124,242,196,0.08)'; e.currentTarget.style.color = BP.safe; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = BP.ink2; }}>
        {isDone
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={BP.safe} strokeWidth="1.6" strokeLinecap="round"><path d="M3 7.5L6 10.5 11 4.5"/></svg>
          : <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
              {/* scissors */}
              <circle cx="3.5" cy="9.5" r="1.5"/><circle cx="3.5" cy="4.5" r="1.5"/>
              <path d="M5 5.5 L13 9.5 M5 8.5 L13 4.5"/>
            </svg>}
      </button>
    </div>
  );
}

function AvenueBlueprint() {
  const { tasks, setShowAdd } = useFizz();
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0H0v40' fill='none' stroke='${encodeURIComponent(BP.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      width: '100%', height: '100%', background: BP.bg, color: BP.ink,
      fontFamily: BP.sans, display: 'flex', flexDirection: 'column',
      backgroundImage: gridSvg, backgroundSize: '40px 40px', position: 'relative',
    }}>
      {/* corner registration marks */}
      {[[12,12],[12,'bottom-12'],['right-12',12],['right-12','bottom-12']].map(([x,y],i)=> {
        const isRight = String(x).startsWith('right'); const isBottom = String(y).startsWith('bottom');
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" style={{ position: 'absolute', [isRight?'right':'left']: 12, [isBottom?'bottom':'top']: 12, opacity: .35 }}>
            <path d="M0 7h14M7 0v14" stroke={BP.ink2} strokeWidth=".7"/><circle cx="7" cy="7" r="3" fill="none" stroke={BP.ink2} strokeWidth=".7"/>
          </svg>
        );
      })}

      {/* title block, lower-left of a real blueprint, but we put it on top */}
      <div style={{
        padding: '24px 22px 10px', display: 'flex', alignItems: 'flex-end', gap: 18,
        borderBottom: `1px solid ${BP.line}`,
      }}>
        <div>
          <div style={{ fontFamily: BP.mono, fontSize: 10, color: BP.ink3, letterSpacing: '0.18em', marginBottom: 6 }}>
            SHEET 01 · DEADLINE SCHEMATIC · REV.B
          </div>
          <h1 style={{
            margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em',
            color: BP.ink, lineHeight: 1, fontFamily: BP.sans,
            textTransform: 'uppercase',
          }}>FIZZLE — ORDNANCE LOG</h1>
        </div>
        <div style={{ flex: 1 }} />
        <BpChip label="+ Charge" primary onClick={() => setShowAdd(true)} />
        <BpChip label="Sort / Filter" />
        <BpChip label="Due By" icon="cal" />
      </div>

      {/* table head */}
      <div style={{
        display: 'grid', gridTemplateColumns: '36px 220px 1fr 100px 36px',
        gap: 16, padding: '10px 22px', borderBottom: `1px solid ${BP.line}`,
        fontFamily: BP.mono, fontSize: 9.5, color: BP.ink3, letterSpacing: '0.18em',
      }}>
        <div>REF</div><div>OBJECTIVE</div><div>FUSE LENGTH (% REMAINING)</div><div style={{ textAlign: 'right' }}>T-MINUS</div><div></div>
      </div>

      {/* rows */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {tasks.map((t) => <BpRow key={t.id} task={t} />)}
      </div>

      {/* footer caliper */}
      <div style={{
        padding: '8px 22px', borderTop: `1px solid ${BP.line}`,
        fontFamily: BP.mono, fontSize: 10, color: BP.ink3, letterSpacing: '0.12em',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>SCALE 1:1 · {tasks.filter(t=>t.state!=='done').length} LIVE CHARGES</span>
        <span>DRAWN BY OPERATOR · NTS</span>
      </div>
    </div>
  );
}

function BpChip({ label, primary, icon, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 28, padding: '0 12px', borderRadius: 0,
        background: primary ? BP.ink : hover ? 'rgba(180,225,255,0.06)' : 'transparent',
        color: primary ? BP.bg : BP.ink,
        border: `1px solid ${primary ? BP.ink : BP.line}`,
        fontFamily: BP.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', cursor: 'pointer',
      }}>
      {icon === 'cal' && <CalIcon size={11} strokeWidth={1.4} />}
      {label}
    </button>
  );
}

Object.assign(window, { AvenueBlueprint });
