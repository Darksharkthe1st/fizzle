// avenue-fuze.jsx — Fuze avenue
// Theme is read from useFizz().theme (palette swap lands here).
// Bar width uses logScale(daysRemaining); color uses getTimeColor(days) so
// urgency is a function of absolute time, not the task's total duration.
// Particle / stripe speed are derived from log scale (closer to 0 = faster).
// settings.animation gates sparks + confetti.

// ── Helpers ─────────────────────────────────────────────────────────────
// Darkened tint behind the diagonal stripes — keeps the bar legible.
function shade(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  return `rgba(${Math.round(r*.65)},${Math.round(g*.65)},${Math.round(b*.65)},0.35)`;
}

// Speed of the stripe flow + spark particles, derived from log-scale.
// scale=1 (lots of time left): leisurely 2.6s stripe, 1.5s particles.
// scale=0 (basically out of time): brisk 0.6s stripe, 0.5s particles.
function getFuseSpeed(scale) {
  return {
    stripeS: (0.6 + scale * 2.0).toFixed(2) + 's',
    particleS: 0.5 + scale * 1.0,
  };
}

// Build an input element style — used in the inline edit panel + modal.
function makeInputStyle(FZ, extra = {}) {
  return {
    width: '100%', boxSizing: 'border-box',
    fontFamily: FZ.body, fontSize: 14, color: FZ.ink,
    padding: '8px 12px', background: FZ.btnBg,
    border: `2px solid ${FZ.ink}`, borderRadius: 6,
    boxShadow: `2px 2px 0 ${FZ.ink}`,
    outline: 'none',
    ...extra,
  };
}

// ── SPARK ───────────────────────────────────────────────────────────────
// Continuous emitter. ~16 (or 8 in subtle) particles spawn at the burn-tip
// and fly outward in a fan biased upward and to the sides. Each loops at
// randomized speed with negative initial delays so the stream starts
// mid-flight on first paint.
function SparkEmitter({ color, scale, animationLevel }) {
  if (animationLevel === 'off' || scale <= 0.005 || scale >= 0.998) return null;
  const N = animationLevel === 'subtle' ? 8 : 16;
  const { particleS } = getFuseSpeed(scale);

  const particles = React.useMemo(() => {
    return Array.from({ length: N }, (_, i) => {
      const angle = -Math.PI * (0.18 + Math.random() * 0.74);
      const r = 14 + Math.random() * 18;
      const dur = particleS * (0.7 + Math.random() * 0.7);
      const delay = -dur * Math.random();
      const palette = ['#fff7c2', '#ffd66b', '#ffb84d', '#ff8a50', color];
      return {
        dx: Math.cos(angle) * r, dy: Math.sin(angle) * r,
        dur, delay, color: palette[i % palette.length],
        size: 0.7 + Math.random() * 0.7,
      };
    });
  }, [N, particleS, color]);

  const glowId = `fz-glow-${color.replace('#', '')}`;
  return (
    <svg width="64" height="56" viewBox="-32 -42 64 56"
      style={{ position: 'absolute', top: '50%', left: 0, transform: 'translate(-50%,-50%)', pointerEvents: 'none', overflow: 'visible' }}>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="#fff7c2" stopOpacity=".95"/>
          <stop offset="55%" stopColor={color}   stopOpacity=".4"/>
          <stop offset="100%" stopColor={color}  stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle r="7" fill={`url(#${glowId})`}>
        <animate attributeName="r" values="6;9;6" dur=".4s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values=".85;1;.85" dur=".4s" repeatCount="indefinite"/>
      </circle>
      <circle r="1.9" fill="#fff">
        <animate attributeName="r" values="1.4;2.4;1.4" dur=".25s" repeatCount="indefinite"/>
      </circle>
      {particles.map((p, i) => (
        <circle key={i} cx="0" cy="0" r={p.size} fill={p.color}>
          <animate attributeName="cx" from="0" to={p.dx} dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
          <animate attributeName="cy" from="0" to={p.dy} dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;1;0" keyTimes="0;0.5;1" dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
          <animate attributeName="r" values={`${p.size};${p.size * 0.4};0`} dur={`${p.dur}s`} begin={`${p.delay}s`} repeatCount="indefinite"/>
        </circle>
      ))}
    </svg>
  );
}

// ── FUSE BAR ────────────────────────────────────────────────────────────
function FzFuse({ task, height = 30 }) {
  const FZ = useFizz().theme;
  const { settings } = useFizz();
  const isDefusing = task.state === 'defusing';
  const isDone = task.state === 'done';
  const isOverdue = task.state !== 'done' && task.remaining < 0;
  const r = Math.max(0, task.remaining);
  const scale = logScale(r);
  const color = getTimeColor(r);
  const speed = getFuseSpeed(scale);
  const animLevel = settings.animation;

  if (isOverdue) {
    return (
      <div style={{
        position: 'relative', height, borderRadius: 6,
        background: FZ.charred, border: `2.5px solid ${FZ.ink}`, overflow: 'hidden',
        boxShadow: `2px 2px 0 ${FZ.ink}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 30% 50%, rgba(229,57,53,0.4), transparent 55%), radial-gradient(circle at 80% 60%, rgba(240,168,33,0.25), transparent 55%)`,
        }}/>
        <svg width="100%" height="100%" viewBox="0 0 200 30" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
          <path d="M30 4 L40 14 L36 18 L52 28" stroke="#ff6b6b" strokeWidth="1.1" fill="none"/>
          <path d="M130 0 L138 10 L134 16 L150 28" stroke="#ff6b6b" strokeWidth="1.1" fill="none"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: FZ.display, fontWeight: 800, fontSize: 14, letterSpacing: '0.18em',
          color: '#ffe6a8', textShadow: '0 0 8px rgba(229,57,53,0.8)',
        }}>BOOM</div>
      </div>
    );
  }

  if (isDone) {
    return (
      <div style={{
        position: 'relative', height, borderRadius: 6,
        background: FZ.barBg, border: `2.5px solid ${FZ.ink}`, overflow: 'hidden',
        boxShadow: `2px 2px 0 ${FZ.ink}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px',
          fontFamily: FZ.display, fontSize: 11, color: FZ.paper, letterSpacing: '0.16em', fontWeight: 700, opacity: .65,
        }}>
          <span>DEFUSED</span>
          <span style={{ color: FZ.safe, fontSize: 13 }}>✓</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'relative', height, borderRadius: 6,
      background: FZ.barBg, border: `2.5px solid ${FZ.ink}`, overflow: 'visible',
      boxShadow: `2px 2px 0 ${FZ.ink}`,
    }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: 0, bottom: 0, right: 0,
          width: `${scale * 100}%`,
          background: `repeating-linear-gradient(115deg, ${color} 0 8px, transparent 8px 14px), ${shade(color)}`,
          backgroundSize: '28px 100%, 100% 100%',
          animation: isDefusing
            ? `stripe-flow ${speed.stripeS} linear infinite, fuse-retract 600ms cubic-bezier(.55,.05,.8,.4) 300ms forwards`
            : animLevel === 'off' ? 'none' : `stripe-flow ${speed.stripeS} linear infinite`,
          transition: 'width .55s cubic-bezier(.2,.7,.3,1)',
        }}/>
      </div>

      {!isDefusing && scale > 0.02 && scale < 0.998 && (
        <div style={{ position: 'absolute', top: '50%', left: `${(1 - scale) * 100}%`, transform: 'translateY(-50%)', zIndex: 2 }}>
          <SparkEmitter color={color} scale={scale} animationLevel={animLevel}/>
        </div>
      )}

      {isDefusing && <ScissorSnip leftPct={(1 - scale) * 100} ink={FZ.ink}/>}
    </div>
  );
}

function ScissorSnip({ leftPct, ink }) {
  return (
    <div style={{
      position: 'absolute', top: '50%', left: `${leftPct}%`,
      width: 0, height: 0, transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 4,
    }}>
      <svg width="44" height="36" viewBox="-22 -18 44 36"
        style={{ position: 'absolute', top: -18, left: -22, animation: 'scissor-snip .55s cubic-bezier(.3,1.4,.5,1) forwards' }}>
        <g stroke={ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#fff">
          <circle cx="10" cy="-7" r="4"/>
          <circle cx="10" cy="7"  r="4"/>
          <path d="M7 -5 L-12 4" fill="none"/>
          <path d="M7  5 L-12 -4" fill="none"/>
          <line x1="-12" y1="-4" x2="-12" y2="4" stroke={ink} strokeWidth="2"/>
        </g>
      </svg>
      <span style={{
        position: 'absolute', top: -4, left: -4, width: 8, height: 8, borderRadius: 8,
        background: '#fff7c2', boxShadow: '0 0 12px #fff7c2',
        animation: 'pop-in .3s ease-out, fade-out-soft .3s ease-out .5s forwards',
      }}/>
    </div>
  );
}

// ── BOMB + DATE TAG ─────────────────────────────────────────────────────
function FzBomb({ task, done, defusing, exploded, noTag }) {
  const FZ = useFizz().theme;
  const { settings } = useFizz();
  const r = Math.max(0, task.remaining);
  const scale = logScale(r);
  const tipColor = getTimeColor(r);
  const showSparkOnBomb = !done && !defusing && !exploded && r > 0 && r < 2 && settings.animation !== 'off';

  return (
    <div style={{ position: 'relative', width: 56, height: 54, flexShrink: 0, overflow: 'visible' }}>
      {exploded ? (
        <svg width="56" height="54" viewBox="0 0 56 54">
          <g fill={FZ.warn} stroke={FZ.ink} strokeWidth="2" strokeLinejoin="round">
            <polygon points="28,2 31,13 42,8 36,19 50,21 38,26 50,34 36,30 42,43 31,38 28,52 25,38 14,43 20,30 6,34 18,26 6,21 18,19 14,8 25,13"/>
          </g>
          <text x="28" y="32" textAnchor="middle" fontFamily={FZ.display} fontWeight="800" fontSize="12" fill={FZ.danger} letterSpacing="0.04em">BOOM</text>
        </svg>
      ) : (
        <>
          <svg width="56" height="54" viewBox="0 0 56 54"
            style={defusing ? { animation: 'bomb-fade-out 350ms ease-in 850ms forwards' } : undefined}>
            <ellipse cx="22" cy="50" rx="14" ry="2.5" fill="rgba(0,0,0,0.18)"/>
            <circle cx="22" cy="32" r="17" fill={done ? '#888' : FZ.charred} stroke={FZ.ink} strokeWidth="2"/>
            <rect x="2" y="28" width="6" height="8" rx="1.2" fill={FZ.charred}/>
            <circle cx="15" cy="27" r="3.5" fill="rgba(255,255,255,0.32)"/>
            <circle cx="16" cy="26" r="1.2" fill="rgba(255,255,255,0.85)"/>
            {done && (
              <g>
                <circle cx="36" cy="18" r="8" fill={FZ.safe} stroke={FZ.ink} strokeWidth="2"/>
                <path d="M32 18 L35 21 L40 14" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
            )}
            {showSparkOnBomb && (
              <circle cx="22" cy="11" r="2.6" fill={tipColor}>
                <animate attributeName="r" values="1.8;3.4;1.8" dur=".45s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values=".6;1;.6" dur=".45s" repeatCount="indefinite"/>
              </circle>
            )}
          </svg>

          {defusing && (
            <svg width="76" height="74" viewBox="0 0 76 74"
              style={{
                position: 'absolute', top: -10, left: -10, pointerEvents: 'none',
                animation: 'explosion-pop 1s ease-out 850ms backwards',
              }}>
              <g fill={FZ.warn} stroke={FZ.ink} strokeWidth="2.5" strokeLinejoin="round">
                <polygon points="38,2 43,18 60,10 50,28 72,30 54,36 70,50 50,42 58,68 42,52 38,72 34,52 18,68 26,42 6,50 22,36 4,30 26,28 16,10 33,18"/>
              </g>
              <polygon points="38,16 44,28 56,26 46,36 54,46 38,38 22,46 30,36 20,26 32,28" fill="#fff7c2"/>
              <circle cx="38" cy="36" r="4" fill="#fff"/>
            </svg>
          )}

          {defusing && settings.animation !== 'off' && <ConfettiOrbit ink={FZ.ink}/>}
        </>
      )}

      {!done && !exploded && !noTag && (
        <div style={{
          position: 'absolute', top: 2, right: -10, transform: 'rotate(10deg)',
          background: FZ.btnBg, color: FZ.ink,
          border: `2px solid ${FZ.ink}`, borderRadius: 4, padding: '1px 5px',
          fontFamily: FZ.mono, fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em',
          whiteSpace: 'nowrap', boxShadow: `1.5px 1.5px 0 ${FZ.ink}`,
          opacity: defusing ? 0 : 1, transition: 'opacity .2s',
        }}>{formatDueDate(task)}</div>
      )}
    </div>
  );
}

function ConfettiOrbit({ ink }) {
  const pieces = React.useMemo(() => {
    const N = 26;
    return Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
      const rH = 55 + Math.random() * 65;
      const rV = 22 + Math.random() * 16;
      return {
        cx: Math.cos(a) * rH, cy: Math.sin(a) * rV,
        c: ['#3aa84a', '#f0a821', '#e53935', '#1d4ed8', '#fff7c2', '#9b6dff'][i % 6],
        rot: Math.random() * 720 - 360,
        dur: 0.9 + Math.random() * 0.55,
        delay: 0.9 + 0.04 * (i % 7),
        shape: i % 3,
      };
    });
  }, []);
  return (
    <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0, pointerEvents: 'none', zIndex: 6 }}>
      {pieces.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', left: -3, top: -4,
          width: p.shape === 2 ? 6 : 7, height: p.shape === 0 ? 10 : p.shape === 1 ? 7 : 6,
          background: p.c, border: `1.4px solid ${ink}`,
          borderRadius: p.shape === 1 ? 6 : 1.5,
          '--cx': `${p.cx}px`, '--cy': `${p.cy}px`, '--r': `${p.rot}deg`,
          opacity: 0,
          animation: `confetti-burst ${p.dur}s cubic-bezier(.15,.7,.3,1) ${p.delay}s forwards`,
        }}/>
      ))}
    </div>
  );
}

// ── DAYS/DATE EDITOR (shared by modal + inline edit) ───────────────────
// Single source of truth is `days` (fractional allowed). Display in
// hr / d / wk via UnitSegment. Slider max adapts to the unit. Calendar
// button opens the native date popover via input.showPicker() — the
// hidden <input type="date"> sits on top of the button (opacity 0,
// pointer-events:none) so the popover anchors against it.
function DateAndDaysControl({ days, setDays }) {
  const FZ = useFizz().theme;

  const initialUnit = days < 1 ? 'hour' : days >= 14 ? 'week' : 'day';
  const [unit, setUnit] = React.useState(initialUnit);

  const toDays = (v) => unit === 'hour' ? v / 24 : unit === 'week' ? v * 7 : v;
  const fromDays = (d) =>
    unit === 'hour' ? Math.max(1, Math.round(d * 24)) :
    unit === 'week' ? Math.max(1, Math.round(d / 7 * 10) / 10) :
    Math.max(1, Math.round(d));

  const unitValue = fromDays(days);
  const sliderMax = unit === 'hour' ? 48 : unit === 'week' ? 12 : 60;
  const setUnitValue = (v) => {
    const max = unit === 'hour' ? 720 : unit === 'week' ? 104 : 365;
    setDays(toDays(Math.max(1, Math.min(max, v))));
  };

  const dueMs = Date.now() + days * DAY_MS;
  const due = new Date(dueMs);
  const pad = (n) => String(n).padStart(2, '0');
  const dateValue = `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}`;
  const minDate = new Date().toISOString().slice(0, 10);
  const dateRef = React.useRef(null);

  const onPickDate = (e) => {
    const [y, m, d] = e.target.value.split('-').map(Number);
    if (!y) return;
    const picked = new Date(y, m - 1, d, 23, 59, 59);
    setDays(Math.max(1 / 24, (picked.getTime() - Date.now()) / DAY_MS));
  };

  const openPicker = () => {
    const el = dateRef.current; if (!el) return;
    try {
      if (typeof el.showPicker === 'function') el.showPicker();
      else el.focus();
    } catch { el.focus(); }
  };

  const dateLabel = days < 1
    ? Math.max(1, Math.round(days * 24)) + 'h from now'
    : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <input type="number" min={1} value={unitValue}
        onChange={(e) => setUnitValue(Number(e.target.value) || 1)}
        style={makeInputStyle(FZ, { width: 64, textAlign: 'center', fontFamily: FZ.mono, padding: '8px 6px' })}/>
      <UnitSegment unit={unit} onChange={setUnit}/>
      <input type="range" min={1} max={sliderMax}
        value={Math.min(sliderMax, Math.max(1, Math.round(unitValue)))}
        onChange={(e) => setUnitValue(Number(e.target.value))}
        style={{ flex: 1, minWidth: 90, accentColor: FZ.danger }}/>
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={openPicker}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            height: 36, padding: '0 10px',
            background: FZ.btnBg, color: FZ.ink,
            border: `2.5px solid ${FZ.ink}`, borderRadius: 8,
            boxShadow: `3px 3px 0 ${FZ.ink}`, cursor: 'pointer',
            fontFamily: FZ.mono, fontSize: 12, fontWeight: 700,
          }}>
          <CalIcon size={14} strokeWidth={2}/>
          <span>{dateLabel}</span>
        </button>
        <input ref={dateRef} type="date" value={dateValue} onChange={onPickDate} min={minDate}
          style={{
            position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
            opacity: 0, border: 0, padding: 0, margin: 0, pointerEvents: 'none',
          }}/>
      </div>
    </div>
  );
}

function UnitSegment({ unit, onChange }) {
  const FZ = useFizz().theme;
  const options = [{ id: 'hour', label: 'hr' }, { id: 'day', label: 'd' }, { id: 'week', label: 'wk' }];
  return (
    <div style={{
      display: 'inline-flex', background: FZ.btnBg,
      border: `2px solid ${FZ.ink}`, borderRadius: 12,
      boxShadow: `2px 2px 0 ${FZ.ink}`, padding: 1,
    }}>
      {options.map((o) => (
        <button key={o.id} onClick={() => onChange(o.id)} type="button"
          style={{
            height: 24, padding: '0 9px', border: 0, borderRadius: 10,
            background: unit === o.id ? FZ.ink : 'transparent',
            color: unit === o.id ? FZ.paper : FZ.ink,
            fontFamily: FZ.mono, fontSize: 11, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '.04em',
          }}>{o.label}</button>
      ))}
    </div>
  );
}

// ── ROW ─────────────────────────────────────────────────────────────────
function FzRow({ task }) {
  const FZ = useFizz().theme;
  const { defuse, expandedId, toggleExpand, update, remove, restore } = useFizz();
  const isDone = task.state === 'done';
  const isDefusing = task.state === 'defusing';
  const isOverdue = task.state !== 'done' && task.remaining < 0;
  const expanded = expandedId === task.id;
  const [hover, setHover] = React.useState(false);

  const setDays = (d) => update(task.id, { remaining: d, total: Math.max(task.total || d, d) });

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover && !isDone ? 'rgba(255,255,255,0.08)' : expanded ? 'rgba(255,255,255,0.12)' : 'transparent',
        backgroundBlendMode: 'overlay',
        borderBottom: `2px solid ${FZ.rule}`,
        opacity: isDone && !expanded ? 0.7 : 1, transition: 'opacity .3s, background .15s',
        animation: isOverdue ? 'shake-overdue 1.6s ease-in-out infinite' : 'none',
      }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 76px 100px',
        gap: 14, alignItems: 'center', padding: '11px 22px',
      }}>
        <button
          onClick={() => toggleExpand(task.id)}
          style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
            fontFamily: FZ.display, fontSize: 16.5, fontWeight: 700,
            color: isDone ? FZ.ink2 : FZ.ink, letterSpacing: '-0.01em',
            overflow: 'hidden',
          }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, opacity: .5, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .18s' }}>
            <path d="M3 2 L8 5.5 L3 9"/>
          </svg>
          <span style={{
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textDecoration: isDone ? 'line-through' : 'none', textDecorationThickness: '3px', textDecorationColor: FZ.safe,
          }}>{task.name}</span>
          {task.description && (
            <span title="Has notes" style={{
              flexShrink: 0, width: 6, height: 6, borderRadius: 6, background: FZ.warn, marginLeft: 2,
            }}/>
          )}
        </button>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 30 }}>
          <div style={{ flex: 1, marginRight: -3, position: 'relative', zIndex: 1 }}>
            <FzFuse task={task}/>
          </div>
        </div>

        <FzBomb task={task} done={isDone} defusing={isDefusing} exploded={isOverdue}/>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            fontFamily: FZ.display, fontSize: 15.5, fontWeight: 700,
            color: isOverdue ? FZ.danger : isDone ? FZ.ink2 : getTimeColor(task.remaining),
            letterSpacing: '-0.01em', lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {isDone ? '✓ defused' : formatTimeLeft(task)}
          </div>
          {!isDone && !isOverdue && (
            <button
              onClick={() => defuse(task.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 24, padding: '0 9px', borderRadius: 12,
                background: FZ.btnBg, color: FZ.ink,
                border: `2px solid ${FZ.ink}`, fontFamily: FZ.body, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', boxShadow: `2px 2px 0 ${FZ.ink}`,
                transition: 'transform .1s, box-shadow .1s',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'translate(1px,1px)'; e.currentTarget.style.boxShadow = `1px 1px 0 ${FZ.ink}`; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `2px 2px 0 ${FZ.ink}`; }}>
              ✂ Cut
            </button>
          )}
          {(isDone || isOverdue) && (
            <span style={{ fontFamily: FZ.body, fontSize: 11, color: FZ.ink3 }}>
              {isDone && task.defusedAt ? `defused ${formatRelative(task.defusedAt)}` :
               isOverdue ? `detonated ${formatRelative(Date.now() + task.remaining * DAY_MS)}` : ''}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '4px 22px 16px 46px', animation: 'row-expand .25s ease-out' }}>
          <EditPanel task={task} setDays={setDays}/>
        </div>
      )}
    </div>
  );
}

function EditPanel({ task, setDays }) {
  const FZ = useFizz().theme;
  const { update, remove, restore, toggleExpand } = useFizz();
  const isDone = task.state === 'done';
  const isOverdue = task.state !== 'done' && task.remaining < 0;
  const editable = !isDone;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <Field label="Name">
        <input value={task.name}
          disabled={!editable}
          onChange={(e) => update(task.id, { name: e.target.value })}
          style={{ ...makeInputStyle(FZ), opacity: editable ? 1 : 0.7 }}/>
      </Field>

      <Field label="Notes">
        <textarea value={task.description || ''}
          placeholder={editable ? "Notes, links, anything to remember…" : "(no notes)"}
          disabled={!editable}
          onChange={(e) => update(task.id, { description: e.target.value })}
          rows={2}
          style={{ ...makeInputStyle(FZ, { resize: 'vertical', minHeight: 50, lineHeight: 1.4 }), opacity: editable ? 1 : 0.7 }}/>
      </Field>

      {(task.state === 'active' || task.state === 'defusing' || isOverdue) && (
        <Field label="Detonation">
          <DateAndDaysControl days={Math.max(1 / 24, task.remaining)} setDays={setDays}/>
        </Field>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
        <button
          onClick={() => { if (confirm(`Delete "${task.name}"?`)) remove(task.id); }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 30, padding: '0 12px', borderRadius: 15,
            background: 'transparent', color: FZ.danger,
            border: `2px solid ${FZ.danger}`,
            fontFamily: FZ.body, fontSize: 12, fontWeight: 700,
            cursor: 'pointer',
          }}>🗑 Delete</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {(isDone || isOverdue) && (
            <button
              onClick={() => restore(task.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 30, padding: '0 14px', borderRadius: 15,
                background: FZ.safe, color: '#fff',
                border: `2px solid ${FZ.ink}`,
                boxShadow: `2px 2px 0 ${FZ.ink}`,
                fontFamily: FZ.display, fontSize: 13, fontWeight: 700,
                cursor: 'pointer',
              }}>🧨 {isOverdue ? 'Relight' : 'Bring back'}</button>
          )}
          <button
            onClick={() => toggleExpand(task.id)}
            style={{
              height: 30, padding: '0 12px', borderRadius: 15,
              background: 'transparent', color: FZ.ink2,
              border: `2px solid ${FZ.ink}`,
              fontFamily: FZ.body, fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}>Done editing</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  const FZ = useFizz().theme;
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block', fontFamily: FZ.body, fontSize: 10.5, fontWeight: 700,
        color: FZ.ink2, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4,
      }}>{label}</span>
      {children}
    </label>
  );
}

// ── NEW TASK MODAL ──────────────────────────────────────────────────────
function NewTaskModal() {
  const { showAdd, setShowAdd, add } = useFizz();
  const FZ = useFizz().theme;
  const [name, setName] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [days, setDays] = React.useState(7);
  const nameRef = React.useRef(null);

  React.useEffect(() => {
    if (showAdd) { setName(''); setDescription(''); setDays(7); setTimeout(() => nameRef.current && nameRef.current.focus(), 30); }
  }, [showAdd]);

  React.useEffect(() => {
    if (!showAdd) return;
    const k = (e) => { if (e.key === 'Escape') setShowAdd(false); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [showAdd, setShowAdd]);

  if (!showAdd) return null;

  const submit = () => {
    const n = name.trim(); if (!n) return;
    add({ name: n, description: description.trim(), days: Math.max(1 / 24, Number(days) || 1) });
    setShowAdd(false);
  };
  const dueLabel = new Date(Date.now() + days * DAY_MS).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return ReactDOM.createPortal(
    <div onClick={() => setShowAdd(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'backdrop-in .15s ease-out', fontFamily: FZ.body,
        colorScheme: FZ.scheme,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: 500, background: FZ.paper, color: FZ.ink,
          border: `3px solid ${FZ.ink}`, borderRadius: 14,
          boxShadow: `8px 8px 0 ${FZ.ink}`,
          padding: 22, animation: 'modal-in .18s cubic-bezier(.4,1.4,.5,1)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <FzBomb task={{ remaining: days, total: days, state: 'active' }} noTag/>
          <h2 style={{
            margin: 0, fontFamily: FZ.display, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1,
          }}>Light a new fuse</h2>
        </div>

        <Field label="Task">
          <input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)}
            placeholder="What's about to go off?"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } }}
            style={makeInputStyle(FZ)}/>
        </Field>

        <div style={{ height: 12 }}/>
        <Field label="Notes">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Links, context, anything you'll want when you pick this up again…"
            rows={3}
            style={makeInputStyle(FZ, { resize: 'vertical', lineHeight: 1.4 })}/>
        </Field>

        <div style={{ height: 12 }}/>
        <Field label={`Detonation — ${dueLabel}`}>
          <DateAndDaysControl days={days} setDays={setDays}/>
        </Field>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button onClick={() => setShowAdd(false)}
            style={{
              height: 36, padding: '0 16px', borderRadius: 18,
              background: 'transparent', color: FZ.ink2,
              border: `2px solid transparent`,
              fontFamily: FZ.display, fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 36, padding: '0 16px', borderRadius: 18,
              background: FZ.danger, color: '#fff',
              border: `2.5px solid ${FZ.ink}`,
              boxShadow: `3px 3px 0 ${FZ.ink}`,
              fontFamily: FZ.display, fontSize: 14, fontWeight: 700,
              cursor: !name.trim() ? 'not-allowed' : 'pointer',
              opacity: !name.trim() ? .5 : 1,
            }}>🧨 Light fuse</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── VIEW SEGMENT (3-way) ────────────────────────────────────────────────
function ViewSegment() {
  const { view, setView, counts } = useFizz();
  const FZ = useFizz().theme;
  const items = [
    { id: 'burning',   label: 'Burning',   count: counts.burning,   icon: '🔥' },
    { id: 'defused',   label: 'Defused',   count: counts.defused,   icon: '✓' },
    { id: 'detonated', label: 'Detonated', count: counts.detonated, icon: '💥' },
  ];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'stretch',
      background: FZ.btnBg, border: `2.5px solid ${FZ.ink}`, borderRadius: 17,
      boxShadow: `4px 4px 0 ${FZ.ink}`, padding: 2, overflow: 'hidden',
    }}>
      {items.map((it) => {
        const active = view === it.id;
        return (
          <button key={it.id} onClick={() => setView(it.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              height: 28, padding: '0 12px', borderRadius: 14, border: 0,
              background: active ? FZ.ink : 'transparent',
              color: active ? FZ.paper : FZ.ink,
              fontFamily: FZ.display, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
            <span style={{ opacity: .85 }}>{it.icon}</span>
            <span>{it.label}</span>
            <span style={{
              fontFamily: FZ.mono, fontSize: 10, fontWeight: 700,
              padding: '1px 5px', borderRadius: 8, minWidth: 14, textAlign: 'center',
              background: active ? 'rgba(255,255,255,0.18)' : FZ.rule, color: active ? FZ.paper : FZ.ink,
            }}>{it.count}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── AVENUE ──────────────────────────────────────────────────────────────
function AvenueFuze() {
  const { visibleTasks, sortMode, cycleSort, setShowAdd, setShowSettings, view, counts } = useFizz();
  const FZ = useFizz().theme;

  const dots = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='2' cy='2' r='0.8' fill='${encodeURIComponent(FZ.dotRgba)}'/%3E%3C/svg%3E")`;
  const sortLabel = { urgency: 'Urgency', date: 'Date', name: 'Name' }[sortMode];

  return (
    <div style={{
      width: '100%', height: '100%', background: FZ.paper, color: FZ.ink,
      fontFamily: FZ.body, display: 'flex', flexDirection: 'column',
      backgroundImage: dots, backgroundSize: '14px 14px', position: 'relative',
      colorScheme: FZ.scheme,
    }}>
      <div style={{ padding: '22px 22px 12px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '6px 18px 8px', borderRadius: 14,
          background: FZ.danger, color: '#fff',
          border: `2.5px solid ${FZ.ink}`, boxShadow: `4px 4px 0 ${FZ.ink}`,
          transform: 'rotate(-2deg)',
        }}>
          <span style={{ fontFamily: FZ.display, fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>FIZZLE</span>
          <FzBomb task={{ remaining: 1, total: 1, state: 'active' }} noTag/>
        </div>
        <div style={{ flex: 1 }}/>
        <ViewSegment/>
        <FzChip label={`Sort: ${sortLabel}`} onClick={cycleSort} icon="sort"/>
        <FzChip label="+ Light one" primary onClick={() => setShowAdd(true)}/>
        <FzIconChip icon="cog" title="Settings" onClick={() => setShowSettings(true)}/>
      </div>

      <div style={{
        display: 'grid', gridTemplateColumns: '240px 1fr 76px 100px',
        gap: 14, padding: '10px 22px 8px',
        borderTop: `3px solid ${FZ.ink}`, borderBottom: `3px solid ${FZ.ink}`,
        fontFamily: FZ.body, fontSize: 11, color: FZ.ink2, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase',
      }}>
        <div>Task</div>
        <div>Fuse →→</div>
        <div>Bomb</div>
        <div style={{ textAlign: 'right' }}>
          {view === 'burning' ? 'Time / Action' : view === 'defused' ? 'Defused' : 'Detonated'}
        </div>
      </div>

      <div style={{ overflow: 'auto', flex: 1, scrollbarColor: `var(--fz-ink) var(--fz-paper2)`, scrollbarWidth: 'thin' }}>
        {visibleTasks.length === 0 ? (
          <EmptyState view={view}/>
        ) : (
          visibleTasks.map((t) => <FzRow key={t.id} task={t}/>)
        )}
      </div>

      <div style={{
        padding: '10px 22px', borderTop: `3px solid ${FZ.ink}`,
        fontFamily: FZ.display, fontSize: 13, color: FZ.ink, fontWeight: 600, fontStyle: 'italic',
        background: FZ.paper2, display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{counts.burning} burning · {counts.detonated} detonated · {counts.defused} defused</span>
        <span style={{ opacity: .65 }}>click a name to edit · log-scale bar · cog ⚙ for palette + sound</span>
      </div>
    </div>
  );
}

function EmptyState({ view }) {
  const FZ = useFizz().theme;
  const copy = {
    burning:   { icon: '🌿', title: 'Nothing burning', body: 'No deadlines on the horizon. Light a new fuse to start a task.' },
    defused:   { icon: '✓',  title: 'No defused tasks yet', body: 'Cut a fuse on the Burning view and your wins will land here.' },
    detonated: { icon: '🕊', title: 'Nothing detonated', body: 'You\'ve hit every deadline so far. Keep it up.' },
  }[view];
  return (
    <div style={{
      padding: '60px 30px', textAlign: 'center', color: FZ.ink2, fontFamily: FZ.body,
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{copy.icon}</div>
      <div style={{ fontFamily: FZ.display, fontSize: 18, fontWeight: 700, color: FZ.ink, marginBottom: 4 }}>{copy.title}</div>
      <div style={{ fontSize: 13 }}>{copy.body}</div>
    </div>
  );
}

function FzChip({ label, primary, icon, onClick }) {
  const FZ = useFizz().theme;
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        height: 34, padding: '0 14px', borderRadius: 17,
        background: primary ? FZ.ink : FZ.btnBg,
        color: primary ? FZ.paper : FZ.ink,
        border: `2.5px solid ${FZ.ink}`,
        boxShadow: hover ? `2px 2px 0 ${FZ.ink}` : `4px 4px 0 ${FZ.ink}`,
        transform: hover ? 'translate(2px,2px)' : 'translate(0,0)',
        fontFamily: FZ.display, fontSize: 14, fontWeight: 700,
        cursor: 'pointer', transition: 'transform .1s, box-shadow .1s',
      }}>
      {icon === 'sort' && <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2 3.5h8M3 6h6M4 8.5h4"/></svg>}
      {label}
    </button>
  );
}

function FzIconChip({ icon, title, onClick }) {
  const FZ = useFizz().theme;
  const [hover, setHover] = React.useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 34, height: 34, borderRadius: 17,
        background: FZ.btnBg, color: FZ.ink,
        border: `2.5px solid ${FZ.ink}`,
        boxShadow: hover ? `2px 2px 0 ${FZ.ink}` : `4px 4px 0 ${FZ.ink}`,
        transform: hover ? 'translate(2px,2px)' : 'translate(0,0)',
        cursor: 'pointer', transition: 'transform .1s, box-shadow .1s',
      }}>
      {icon === 'cog' && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="8" r="2.4"/>
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3"/>
        </svg>
      )}
    </button>
  );
}

Object.assign(window, { AvenueFuze, NewTaskModal });
