// avenue-foolscap.jsx — Avenue 3: Foolscap
// Cream parchment, hand-drawn journal. Wobbly squiggle fuses, ink-tone tints,
// a single matchhead spark, paper grain. Slow, contemplative read.

const FS = {
  paper: '#f3ead4',
  paper2: '#ece2c2',
  ink:    '#2a2114',
  ink2:   'rgba(42,33,20,0.62)',
  ink3:   'rgba(42,33,20,0.32)',
  rule:   'rgba(42,33,20,0.16)',
  safe:   '#6a8a4a',
  warn:   '#c3863b',
  danger: '#b04030',
  done:   'rgba(42,33,20,0.28)',
  serif:  '"Newsreader", "Iowan Old Style", Georgia, serif',
  hand:   '"Caveat", "Bradley Hand", cursive',
};

const FS_TONE = { safe: FS.safe, warn: FS.warn, danger: FS.danger, overdue: FS.danger, done: FS.done };

// Wobbly hand-drawn rope: a sine path with jitter, dasharray on a separate
// segment to suggest braid texture.
function FsRope({ frac, color, done, defusing }) {
  // single squiggle with light wobble. seed varies a bit per render
  const segs = [];
  let prev = 8;
  for (let x = 0; x <= 200; x += 8) {
    const y = 8 + Math.sin(x * 0.18) * 1.4 + (Math.sin(x * 0.41) * 0.6);
    segs.push((x === 0 ? `M ${x} ${y.toFixed(2)}` : `Q ${(x - 4).toFixed(2)} ${prev.toFixed(2)} ${x} ${y.toFixed(2)}`));
    prev = y;
  }
  const w = frac * 200;
  return (
    <svg viewBox="0 0 200 16" preserveAspectRatio="none" width="100%" height="16" style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <clipPath id={`fsclip-${color.replace(/[^\w]/g,'')}-${w.toFixed(1)}`}>
          <rect x="0" y="0" width={w} height="16"/>
        </clipPath>
      </defs>
      {/* ghost (consumed portion) */}
      <path d={segs.join(' ')} stroke={FS.ink3} strokeWidth="0.8" fill="none" strokeDasharray="1 3" strokeLinecap="round"/>
      {/* live */}
      <g clipPath={`url(#fsclip-${color.replace(/[^\w]/g,'')}-${w.toFixed(1)}`}>
        <path d={segs.join(' ')} stroke={color} strokeWidth="2.4" fill="none" strokeLinecap="round" opacity={done ? .35 : .85}/>
        {/* braid texture overlaid */}
        <path d={segs.join(' ')} stroke={FS.paper} strokeWidth="1.1" fill="none" strokeDasharray="3 3" strokeLinecap="round" opacity=".55"/>
      </g>
    </svg>
  );
}

function FsMatchhead({ color, animate }) {
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      width: 0, height: 0,
    }}>
      <span style={{
        position: 'absolute', left: -3, top: -7, width: 7, height: 12,
        background: `radial-gradient(ellipse at 50% 70%, ${color} 0%, ${color} 30%, transparent 75%)`,
        borderRadius: '50% 50% 50% 50% / 65% 65% 35% 35%',
        animation: animate ? 'ember-flicker 1.1s ease-in-out infinite, ember-glow 1.4s ease-in-out infinite' : 'none',
        color, filter: `drop-shadow(0 0 3px ${color})`,
      }}/>
      {/* small spark */}
      <span style={{
        position: 'absolute', left: 0, top: -10, width: 2, height: 2, borderRadius: 2,
        background: '#fff3a8', boxShadow: '0 0 4px #fff3a8',
        animation: animate ? 'spark-fly 1.4s ease-out infinite' : 'none',
      }}/>
    </span>
  );
}

function FsRow({ task }) {
  const tone = getTone(task);
  const c = FS_TONE[tone];
  const frac = getFrac(task);
  const isDone = task.state === 'done';
  const isDefusing = task.state === 'defusing';
  const isOverdue = tone === 'overdue';
  const { defuse } = useFizz();

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '230px 1fr 110px 32px',
      gap: 18, alignItems: 'center', padding: '15px 28px',
      borderBottom: `1px solid ${FS.rule}`,
      opacity: isDone ? 0.55 : 1, transition: 'opacity .3s',
    }}>
      {/* name */}
      <div style={{
        fontFamily: FS.serif, fontSize: 16, fontWeight: 500, color: isDone ? FS.ink2 : FS.ink,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        textDecoration: isDone ? 'line-through' : 'none', textDecorationColor: FS.ink3, textDecorationThickness: '1px',
        fontStyle: isOverdue ? 'italic' : 'normal',
      }}>{task.name}</div>

      {/* rope with matchhead */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 18 }}>
        {isOverdue ? (
          <FsBoom />
        ) : (
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              <FsRope frac={frac} color={c} done={isDone} defusing={isDefusing} />
              {/* matchhead at burn-tip */}
              {!isDone && !isDefusing && frac > 0.02 && frac < 0.995 && (
                <div style={{ position: 'absolute', top: '50%', left: `${frac * 100}%`, transform: 'translateY(-50%)' }}>
                  <FsMatchhead color={c} animate />
                </div>
              )}
              {isDefusing && (
                <div style={{ position: 'absolute', top: '50%', left: `${frac * 100}%`, transform: 'translate(-50%,-50%)' }}>
                  {/* scribbled checkmark */}
                  <svg width="22" height="22" viewBox="0 0 22 22" style={{ animation: 'pop-in .3s ease-out' }}>
                    <path d="M4 11 Q6 13 8 14 Q11 15 14 9 Q17 4 18 3" stroke={FS.safe} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* time, in handwriting */}
      <div style={{
        fontFamily: FS.hand, fontSize: 20, color: isOverdue ? FS.danger : tone === 'danger' ? c : FS.ink2,
        textAlign: 'right', lineHeight: 1, transform: 'rotate(-1.5deg)',
      }}>{formatTimeLeft(task)}</div>

      {/* action — small ink calendar / check */}
      <button
        onClick={() => !isDone && defuse(task.id)}
        title={isDone ? 'Crossed out' : 'Cross it off'}
        style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'transparent', color: FS.ink2, cursor: isDone ? 'default' : 'pointer',
          border: `1.5px dashed ${isDone ? FS.safe : FS.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          transition: 'background .15s, border-color .15s',
        }}
        onMouseEnter={(e) => { if (!isDone) { e.currentTarget.style.background = 'rgba(106,138,74,0.12)'; e.currentTarget.style.borderColor = FS.safe; } }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = isDone ? FS.safe : FS.rule; }}>
        {isDone
          ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={FS.safe} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8 Q5 10 6.5 10 Q8.5 10 11 4"/></svg>
          : <CalIcon size={13} strokeWidth={1.6} />}
      </button>
    </div>
  );
}

function FsBoom() {
  // Ink-splatter "BOOM" — small starburst with hand-drawn word
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', height: 20 }}>
      <svg viewBox="0 0 200 24" preserveAspectRatio="none" width="100%" height="24" style={{ overflow: 'visible' }}>
        <g stroke={FS.danger} strokeWidth="1.4" fill="none" strokeLinecap="round">
          {/* star spikes */}
          <path d="M40 12 L52 4" /><path d="M40 12 L52 20" />
          <path d="M40 12 L56 12" /><path d="M40 12 L48 0" /><path d="M40 12 L48 24" />
          <path d="M40 12 L24 12" /><path d="M40 12 L32 0" /><path d="M40 12 L32 24" />
        </g>
        {/* splatter dots */}
        {[[16,4,1.4],[8,18,1],[60,2,1.2],[68,22,1.5],[80,8,.9]].map(([x,y,r],i)=>(
          <circle key={i} cx={x} cy={y} r={r} fill={FS.danger}/>
        ))}
        <text x="100" y="18" fontFamily={FS.hand} fontSize="22" fill={FS.danger} fontWeight="700" letterSpacing="0.04em">BOOM!</text>
      </svg>
    </div>
  );
}

function AvenueFoolscap() {
  const { tasks, setShowAdd } = useFizz();

  // Paper grain — subtle dotted noise via SVG data uri
  const grain = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='1.2' numOctaves='2' seed='5'/%3E%3CfeColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.24  0 0 0 0 0.15  0 0 0 0.08 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      width: '100%', height: '100%', background: FS.paper, color: FS.ink,
      fontFamily: FS.serif, display: 'flex', flexDirection: 'column',
      backgroundImage: grain, backgroundSize: '300px 300px', position: 'relative',
    }}>
      {/* torn-edge top accent */}
      <svg viewBox="0 0 1200 8" preserveAspectRatio="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, width: '100%', height: 6, display: 'block', opacity: .35 }}>
        <path d="M0 6 Q30 1 60 5 T120 4 T200 6 T300 3 T420 6 T540 4 T660 6 T800 4 T1000 6 T1200 5 L1200 0 L0 0Z" fill={FS.paper2}/>
      </svg>

      {/* header */}
      <div style={{ padding: '28px 28px 14px', display: 'flex', alignItems: 'flex-end', gap: 16 }}>
        <div>
          <div style={{ fontFamily: FS.hand, fontSize: 18, color: FS.ink2, transform: 'rotate(-2deg)', marginBottom: -4, marginLeft: 4 }}>
            ~ the slow fuse ~
          </div>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 700, color: FS.ink, lineHeight: 1, fontFamily: FS.serif, letterSpacing: '-0.01em' }}>
            Fizzle<span style={{ color: FS.danger, fontStyle: 'italic' }}>.</span>
          </h1>
        </div>
        <div style={{ flex: 1 }} />
        <FsChip label="+ A new worry" primary onClick={() => setShowAdd(true)} />
        <FsChip label="Sort / Filter" />
        <FsChip label="Due By" icon="cal" />
      </div>

      {/* underline rule + columns */}
      <div style={{
        display: 'grid', gridTemplateColumns: '230px 1fr 110px 32px',
        gap: 18, padding: '6px 28px 10px',
        fontFamily: FS.hand, fontSize: 16, color: FS.ink2,
        borderBottom: `2px solid ${FS.ink}`,
      }}>
        <div>Task</div><div>Fuse</div><div style={{ textAlign: 'right' }}>'til it pops</div><div></div>
      </div>

      {/* rows */}
      <div style={{ overflow: 'auto', flex: 1 }}>
        {tasks.map((t) => <FsRow key={t.id} task={t} />)}
      </div>

      {/* corner doodle */}
      <div style={{ padding: '10px 28px', borderTop: `1px dashed ${FS.rule}`, fontFamily: FS.hand, fontSize: 16, color: FS.ink2 }}>
        — kept in a journal, lit by a single match. {tasks.filter(t=>t.state!=='done').length} still smouldering.
      </div>
    </div>
  );
}

function FsChip({ label, primary, icon, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        height: 32, padding: '0 14px', borderRadius: 18,
        background: primary ? FS.ink : hover ? 'rgba(42,33,20,0.06)' : 'transparent',
        color: primary ? FS.paper : FS.ink,
        border: `1.5px solid ${FS.ink}`,
        fontFamily: FS.hand, fontSize: 17, fontWeight: 600,
        cursor: 'pointer', letterSpacing: '0.01em',
        transform: hover ? 'rotate(-0.5deg)' : 'rotate(0deg)',
        transition: 'background .12s, transform .15s',
      }}>
      {icon === 'cal' && <CalIcon size={13} strokeWidth={1.6} />}
      {label}
    </button>
  );
}

Object.assign(window, { AvenueFoolscap });
