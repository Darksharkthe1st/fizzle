// avenue-habits.jsx — Habits avenue for Fizzle
// Depends on: shared.jsx (FizzProvider, useFizz), avenue-fuze.jsx (ViewSegment, FzChip, FzIconChip)

// ── Helpers ─────────────────────────────────────────────────────────────────

function getTodayIndex() {
  return (new Date().getDay() + 6) % 7; // 0=Mon … 6=Sun
}

function getChainStates(weekLog, createdAt) {
  const todayIdx = getTodayIndex();

  // Find the start of the current Mon–Sun week (midnight local Monday).
  const now = new Date();
  const dow = now.getDay(); // 0=Sun … 6=Sat
  now.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  now.setHours(0, 0, 0, 0);
  const thisMonday = now.getTime();

  // If the habit was created this week, days before the creation day are unlit
  // (the habit simply didn't exist yet — they shouldn't show as missed/BOOM).
  const createdThisWeek = createdAt >= thisMonday;
  const createdDayIdx   = createdThisWeek ? (new Date(createdAt).getDay() + 6) % 7 : -1;

  return weekLog.map((logged, i) => {
    if (i < todayIdx) {
      if (createdThisWeek && i < createdDayIdx) return 'future'; // pre-creation: unlit
      return logged ? 'done' : 'missed';
    }
    if (i === todayIdx) return logged ? 'done' : 'today';
    return 'future';
  });
}

function getFuseClass(leftState, rightState) {
  if (leftState === 'done'   && rightState === 'done')   return 'fuse-done';
  if (leftState === 'done'   && rightState === 'today')  return 'fuse-burning';
  if (leftState === 'done'   && rightState === 'missed') return 'fuse-broken';
  if (leftState === 'missed')                            return 'fuse-burned';
  return 'fuse-unlit';
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// ── Bomb SVG atoms ───────────────────────────────────────────────────────────

function BombFuture({ label }) {
  return (
    <div className="bomb-col">
      <svg width="28" height="34" viewBox="0 0 32 38" overflow="visible">
        <circle cx="16" cy="27" r="12" fill="#1a1108" stroke="rgba(255,233,181,.22)" strokeWidth="2"/>
        <rect x="13" y="14" width="6" height="4.5" rx="1.2" fill="#1a1108" stroke="rgba(255,233,181,.14)" strokeWidth="1.5"/>
        <circle cx="11" cy="22" r="2.5" fill="rgba(255,255,255,.06)"/>
        <circle cx="12" cy="21" r="1" fill="rgba(255,255,255,.18)"/>
      </svg>
      <span className="day-lbl">{label}</span>
    </div>
  );
}

function BombToday({ label }) {
  return (
    <div className="bomb-col">
      <svg width="28" height="34" viewBox="0 0 32 38" overflow="visible">
        <circle cx="16" cy="27" r="12" fill="#1a1108" stroke="#ffe9b5" strokeWidth="2"/>
        <rect x="13" y="14" width="6" height="4.5" rx="1.2" fill="#1a1108" stroke="#ffe9b5" strokeWidth="1.8"/>
        <line x1="16" y1="8" x2="16" y2="14" stroke="rgba(255,233,181,.38)" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="16" cy="7.5" r="1.2" fill="rgba(255,233,181,.25)"/>
        <circle cx="11" cy="22" r="2.5" fill="rgba(255,255,255,.15)"/>
        <circle cx="12" cy="21" r="1" fill="rgba(255,255,255,.55)"/>
      </svg>
      <span className="day-lbl" style={{ color: 'rgba(255,233,181,.72)' }}>{label}</span>
    </div>
  );
}

function BombDone({ label, glow = false, fresh = false }) {
  const ring = glow ? '#3aa84a' : '#ffe9b5';
  return (
    <div className={`bomb-col${fresh ? ' just-lit' : ''}`}>
      <svg width="28" height="34" viewBox="0 0 32 38" overflow="visible">
        {glow && (
          <circle cx="16" cy="27" r="20" fill="#3aa84a" opacity=".1">
            <animate attributeName="r" values="16;24;16" dur="2s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values=".07;.18;.07" dur="2s" repeatCount="indefinite"/>
          </circle>
        )}
        <g className="flame-tiny">
          <path d="M16,4 C14,7 13.5,10.5 14.5,13 C15,14 16,14 16,14 C16,14 17,14 17.5,13 C18.5,10.5 18,7 16,4Z" fill="#ffd66b"/>
          <path d="M16,7 C15,9 14.5,11.5 15.5,13.5 C16,14 16,14 16,14 C16,14 16,14 16.5,13.5 C17.5,11.5 17,9 16,7Z" fill="#fff7c2"/>
        </g>
        <line x1="16" y1="9" x2="16" y2="14" stroke="#3a2a14" strokeWidth="1.8" strokeLinecap="round"/>
        <rect x="13" y="14" width="6" height="4.5" rx="1.2" fill="#1a1108" stroke="rgba(255,233,181,.3)" strokeWidth="1.2"/>
        <circle cx="16" cy="27" r="12" fill="#1a1108" stroke={ring} strokeWidth="2"/>
        <circle cx="11" cy="22" r="2.5" fill="rgba(255,255,255,.14)"/>
        <circle cx="12" cy="21" r="1" fill="rgba(255,255,255,.5)"/>
        <circle cx="24" cy="17" r="7.5" fill="#3aa84a" stroke="#ffe9b5" strokeWidth="1.8"/>
        <path d="M20.5 17 L23 19.5 L27.5 13.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span className="day-lbl" style={{ color: '#3aa84a' }}>{label}</span>
    </div>
  );
}

function BombMissed({ label, canPatch, onPatchClick }) {
  return (
    <div
      className="bomb-col"
      style={{ position: 'relative', cursor: canPatch ? 'pointer' : 'default' }}
      onClick={canPatch ? onPatchClick : undefined}
      title={canPatch ? 'Patch the chain with a spare fuse' : undefined}
    >
      <svg width="28" height="34" viewBox="0 0 32 38" overflow="visible">
        <polygon
          points="16,13 18.5,20.7 26.4,19 21,25 26.4,31 18.5,29.3 16,37 13.5,29.3 5.6,31 11,25 5.6,19 13.5,20.7"
          fill="#f0a821" stroke="#ffe9b5" strokeWidth="1.5" strokeLinejoin="round"/>
        <polygon
          points="16,17.5 17.5,22 22,21 18.5,24 20,28.5 16,25.5 12,28.5 13.5,24 10,21 14.5,22"
          fill="#fff7c2" opacity=".55"/>
        <text x="16" y="26.5" textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="800" fontSize="5.5" fill="#e53935" letterSpacing=".04em">BOOM</text>
      </svg>
      {canPatch && (
        <div style={{
          position: 'absolute', top: -5, right: -5,
          width: 15, height: 15, borderRadius: '50%',
          background: '#3aa84a', border: '1.5px solid #ffe9b5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, lineHeight: 1, pointerEvents: 'none',
        }}>🔧</div>
      )}
      <span className="day-lbl" style={{ color: '#e53935' }}>{label}</span>
    </div>
  );
}

// ── HabitChain — 7 bombs + 6 fuses ─────────────────────────────────────────

function HabitChain({ weekLog, createdAt, freshIdx = -1, canPatch = false, onPatchDay }) {
  const states = getChainStates(weekLog, createdAt);
  const allDone = states.every((s) => s === 'done');
  const elements = [];

  for (let i = 0; i < 7; i++) {
    const s = states[i];
    const lbl = DAY_LABELS[i];
    const isLast = i === 6;

    if      (s === 'done')   elements.push(<BombDone   key={`b${i}`} label={lbl} glow={allDone && isLast} fresh={i === freshIdx}/>);
    else if (s === 'today')  elements.push(<BombToday  key={`b${i}`} label={lbl}/>);
    else if (s === 'missed') elements.push(<BombMissed key={`b${i}`} label={lbl} canPatch={canPatch} onPatchClick={() => onPatchDay && onPatchDay(i)}/>);
    else                     elements.push(<BombFuture key={`b${i}`} label={lbl}/>);

    if (i < 6) {
      const fc = getFuseClass(states[i], states[i + 1]);
      elements.push(<div key={`f${i}`} className={`fuse-seg ${fc}`}/>);
    }
  }

  return <div className="chain">{elements}</div>;
}

// ── HabitCandle — taper SVG ──────────────────────────────────────────────────

function HabitCandle({ streak, logging, habitId }) {
  const big = streak >= 5;
  return (
    <div className={`taper-col${logging ? ' logging' : ''}`} id={`tap_${habitId}`}>
      <svg width="30" height="72" viewBox="1 0 30 72" overflow="visible">
        {big ? (
          <>
            <circle cx="18" cy="11" r="11" fill="#f0a821" opacity=".22">
              <animate attributeName="r" values="8;13;8" dur="1.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values=".18;.38;.18" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <g className="flicker">
              <path d="M18 1 C13 7 12 14 14.5 19 C16 22 18 23 18 23 C18 23 20 22 21.5 19 C24 14 23 7 18 1Z" fill="#ffb84d"/>
              <path d="M18 6 C15 11 14 16 16 20.5 C17 22.5 18 23 18 23 C18 23 19 22.5 20 20.5 C22 16 21 11 18 6Z" fill="#ffd66b"/>
              <path d="M18 11 C16.5 14.5 16 18 17.5 21 C18 22 18 22.5 18 22.5 C18 22.5 18 22 18.5 21 C20 18 19.5 14.5 18 11Z" fill="#fff7c2"/>
            </g>
            <line x1="18" y1="23" x2="18" y2="26" stroke="#5a4a2a" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <circle cx="18" cy="16" r="7" fill="#f0a821" opacity=".2">
              <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values=".15;.35;.15" dur="2s" repeatCount="indefinite"/>
            </circle>
            <g className="flicker-slow">
              <path d="M18 7 C15 11 14.5 15 16 18 C17 20 18 21 18 21 C18 21 19 20 20 18 C21.5 15 21 11 18 7Z" fill="#ffd66b"/>
              <path d="M18 11 C16.5 14 16.5 17 17.5 19 C18 20 18 20.5 18 20.5 C18 20.5 18 20 18.5 19 C19.5 17 19.5 14 18 11Z" fill="#fff7c2"/>
            </g>
            <line x1="18" y1="21" x2="18" y2="26" stroke="#5a4a2a" strokeWidth="1.5" strokeLinecap="round"/>
          </>
        )}
        {/* Wax body */}
        <path d="M12 26 L10.5 66 Q10.5 68 13 68 L23 68 Q25.5 68 25.5 66 L24 26Z"
          fill="#ede6d0" stroke="#ffe9b5" strokeWidth="2.5" strokeLinejoin="round"/>
        <rect x="7" y="67" width="22" height="5" rx="2.5" fill="#ffe9b5" stroke="#ffe9b5" strokeWidth="2"/>
        {/* Wax drip shadow */}
        <path d="M12.5 28 L11.5 64" stroke="rgba(0,0,0,.09)" strokeWidth="5" strokeLinecap="round"/>
        {/* Streak counter */}
        <text x="18" y={big ? 52 : 53} textAnchor="middle" fontFamily="Geist Mono" fontWeight="700" fontSize="7" fill="#1a1108" opacity=".38">WK</text>
        <text x="18" y={big ? 61 : 62} textAnchor="middle" fontFamily="Bricolage Grotesque" fontWeight="800" fontSize="11" fill="#1a1108">{streak}</text>
      </svg>
    </div>
  );
}

// ── HabitRow ─────────────────────────────────────────────────────────────────

function HabitRow({ habit }) {
  const { logHabit, spares, playSound } = useFizz();
  const FZ = useFizz().theme;
  const [logging, setLogging]           = React.useState(false);
  const [freshIdx, setFreshIdx]         = React.useState(-1);
  const [patchTarget, setPatchTarget]   = React.useState(null); // dayIndex | null
  const [showConfetti, setShowConfetti] = React.useState(false);

  const todayIdx = getTodayIndex();
  const states   = getChainStates(habit.weekLog, habit.createdAt);
  const isLogged = states[todayIdx] === 'done';
  const allDone  = states.every((s) => s === 'done');

  // Fire confetti the moment the last bomb is lit (allDone transitions false → true).
  const prevAllDone = React.useRef(allDone);
  React.useEffect(() => {
    if (allDone && !prevAllDone.current) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3200);
    }
    prevAllDone.current = allDone;
  }, [allDone]);

  const handleLogIt = () => {
    if (logging || isLogged) return;
    playSound('snip');
    setLogging(true);

    setTimeout(() => {
      logHabit(habit.id);
      setFreshIdx(todayIdx);
    }, 1300);

    setTimeout(() => {
      setLogging(false);
      setFreshIdx(-1);
    }, 1950);
  };

  const btnText     = logging ? '✦ Lighting…' : (isLogged || allDone) ? '✓ Done!' : '✓ Log it';
  const isDoneState = isLogged || allDone;

  return (
    <div className="habit-row" style={{ position: 'relative', overflow: 'visible' }}>
      {showConfetti && <ConfettiOrbit ink={FZ.ink}/>}
      <HabitCandle streak={habit.streak} logging={logging} habitId={habit.id}/>
      <div>
        <div className="habit-name" style={{ fontFamily: FZ.display }}>{habit.name}</div>
        <div className="habit-streak">wk {habit.streak} streak</div>
      </div>
      <HabitChain
        weekLog={habit.weekLog}
        createdAt={habit.createdAt}
        freshIdx={freshIdx}
        canPatch={spares > 0}
        onPatchDay={setPatchTarget}
      />
      <button
        className={`log-btn${isDoneState ? ' done-state' : ''}`}
        disabled={isDoneState || logging}
        onClick={handleLogIt}>
        {btnText}
      </button>
      {patchTarget !== null && (
        <PatchPrompt
          habit={habit}
          dayIndex={patchTarget}
          onClose={() => setPatchTarget(null)}
        />
      )}
    </div>
  );
}

// ── PatchPrompt — confirm modal for spare-fuse use ────────────────────────────

function PatchPrompt({ habit, dayIndex, onClose }) {
  const { spares, patchChain } = useFizz();
  const FZ = useFizz().theme;
  const dayName = DAY_NAMES[dayIndex];

  React.useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onClose]);

  const confirm = () => {
    patchChain(habit.id, dayIndex);
    onClose();
  };

  return ReactDOM.createPortal(
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'backdrop-in .15s ease-out',
        colorScheme: FZ.scheme,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: 380, background: FZ.paper, color: FZ.ink,
          border: `3px solid ${FZ.ink}`, borderRadius: 14,
          boxShadow: `8px 8px 0 ${FZ.ink}`,
          padding: 22, animation: 'modal-in .18s cubic-bezier(.4,1.4,.5,1)',
          fontFamily: FZ.body,
        }}>
        <div style={{
          fontFamily: FZ.display, fontWeight: 800, fontSize: 20,
          letterSpacing: '-.02em', marginBottom: 10,
        }}>
          🔧 Patch the chain?
        </div>
        <div style={{ fontSize: 14, color: FZ.ink2, lineHeight: 1.55, marginBottom: 12 }}>
          You missed <strong style={{ color: FZ.ink }}>{dayName}</strong>. Use a spare fuse
          to keep <strong style={{ color: FZ.ink }}>{habit.name}</strong>'s streak alive?
        </div>
        <div style={{
          fontFamily: FZ.mono, fontSize: 11, color: FZ.ink3,
          letterSpacing: '.04em', marginBottom: 20,
        }}>
          {spares} → {spares - 1} spare fuse{spares - 1 !== 1 ? 's' : ''} remaining
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose}
            style={{
              height: 34, padding: '0 14px', borderRadius: 17,
              background: 'transparent', color: FZ.ink2,
              border: '2px solid transparent',
              fontFamily: FZ.display, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
          <button onClick={confirm}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 16px', borderRadius: 17,
              background: '#3aa84a', color: '#fff',
              border: `2.5px solid ${FZ.ink}`,
              boxShadow: `3px 3px 0 ${FZ.ink}`,
              fontFamily: FZ.display, fontSize: 13, fontWeight: 800,
              cursor: 'pointer',
              transition: 'transform .1s, box-shadow .1s',
            }}>🔧 Patch it</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── BladeFuse SVG ─────────────────────────────────────────────────────────────

function BladeFuse({ charged }) {
  if (charged) {
    return (
      <svg className="blade-charged" width="34" height="36" viewBox="0 0 40 40">
        <rect x="2" y="0" width="36" height="22" rx="3"
          fill="rgba(58,168,74,.18)" stroke="rgba(58,168,74,.9)" strokeWidth="1.7"/>
        <rect x="9" y="4" width="22" height="14" rx="1.5" fill="rgba(0,0,0,.55)"/>
        <line x1="9" y1="11" x2="31" y2="11" stroke="rgba(58,168,74,.8)" strokeWidth="1.4"/>
        <rect x="9"  y="22" width="7" height="18" rx="1.5" fill="#8a8070" stroke="rgba(210,195,155,.55)" strokeWidth="1.1"/>
        <rect x="24" y="22" width="7" height="18" rx="1.5" fill="#8a8070" stroke="rgba(210,195,155,.55)" strokeWidth="1.1"/>
      </svg>
    );
  }
  return (
    <svg className="blade-spent" width="34" height="36" viewBox="0 0 40 40">
      <rect x="2" y="0" width="36" height="22" rx="3"
        fill="rgba(16,12,6,.7)" stroke="rgba(90,78,55,.38)" strokeWidth="1.7"/>
      <rect x="9" y="4" width="22" height="14" rx="1.5" fill="rgba(0,0,0,.65)"/>
      <line x1="9"  y1="11" x2="16" y2="11" stroke="rgba(80,60,40,.7)" strokeWidth="1.4"/>
      <line x1="24" y1="11" x2="31" y2="11" stroke="rgba(80,60,40,.7)" strokeWidth="1.4"/>
      <circle cx="20" cy="11" r="2" fill="rgba(229,57,53,.35)"/>
      <rect x="9"  y="22" width="7" height="18" rx="1.5" fill="#4a4438" stroke="rgba(90,78,55,.38)" strokeWidth="1.1"/>
      <rect x="24" y="22" width="7" height="18" rx="1.5" fill="#4a4438" stroke="rgba(90,78,55,.38)" strokeWidth="1.1"/>
    </svg>
  );
}

// ── SpareFusesBar ─────────────────────────────────────────────────────────────

function SpareFusesBar() {
  const { spares } = useFizz();
  const FZ = useFizz().theme;
  const countColor = spares === 2 ? FZ.ink : spares === 1 ? FZ.warn : FZ.ink3;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 22px',
      borderBottom: `2px solid ${FZ.rule}`,
      background: FZ.charred,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
        <BladeFuse charged={spares >= 1}/>
        <BladeFuse charged={spares >= 2}/>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: FZ.mono, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: FZ.ink3 }}>
          Spare Fuses
        </span>
        <span style={{ fontFamily: FZ.display, fontWeight: 800, fontSize: 20, letterSpacing: '-.02em', color: countColor }}>
          {spares} / 2
        </span>
        <span style={{ fontFamily: FZ.mono, fontSize: 9, color: FZ.ink3, letterSpacing: '.04em' }}>
          · earn 1 per 3 defused tasks in Fuze
        </span>
      </div>
    </div>
  );
}

// ── NewHabitModal ─────────────────────────────────────────────────────────────

function NewHabitModal() {
  const { showAddHabit, setShowAddHabit, addHabit } = useFizz();
  const FZ = useFizz().theme;
  const [name, setName] = React.useState('');
  const nameRef = React.useRef(null);

  React.useEffect(() => {
    if (showAddHabit) {
      setName('');
      setTimeout(() => nameRef.current && nameRef.current.focus(), 30);
    }
  }, [showAddHabit]);

  React.useEffect(() => {
    if (!showAddHabit) return;
    const k = (e) => { if (e.key === 'Escape') setShowAddHabit(false); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [showAddHabit, setShowAddHabit]);

  if (!showAddHabit) return null;

  const submit = () => {
    const n = name.trim();
    if (!n) return;
    addHabit(n);
    setShowAddHabit(false);
  };

  return ReactDOM.createPortal(
    <div onClick={() => setShowAddHabit(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'backdrop-in .15s ease-out', fontFamily: FZ.body,
        colorScheme: FZ.scheme,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: 440, background: FZ.paper, color: FZ.ink,
          border: `3px solid ${FZ.ink}`, borderRadius: 14,
          boxShadow: `8px 8px 0 ${FZ.ink}`,
          padding: 22, animation: 'modal-in .18s cubic-bezier(.4,1.4,.5,1)',
        }}>
        <div style={{
          fontFamily: FZ.display, fontWeight: 800, fontSize: 22,
          letterSpacing: '-.02em', marginBottom: 16,
        }}>
          🕯️ New habit
        </div>
        <div style={{
          fontFamily: FZ.mono, fontSize: 9, letterSpacing: '.12em',
          textTransform: 'uppercase', color: FZ.ink3, marginBottom: 6,
        }}>
          What do you want to do every day?
        </div>
        <input
          ref={nameRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) submit(); }}
          placeholder="e.g. Morning workout"
          style={{
            width: '100%', padding: '9px 12px',
            background: FZ.charred,
            border: `2px solid ${FZ.ink}`, borderRadius: 6,
            boxShadow: `2px 2px 0 ${FZ.ink}`, outline: 'none',
            fontFamily: FZ.body, fontSize: 14, color: FZ.ink,
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button onClick={() => setShowAddHabit(false)}
            style={{
              height: 34, padding: '0 14px', borderRadius: 17,
              background: 'transparent', color: FZ.ink2, border: '2px solid transparent',
              fontFamily: FZ.display, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Cancel</button>
          <button onClick={submit} disabled={!name.trim()}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 34, padding: '0 16px', borderRadius: 17,
              background: '#3aa84a', color: '#fff',
              border: `2.5px solid ${FZ.ink}`,
              boxShadow: `3px 3px 0 ${FZ.ink}`,
              fontFamily: FZ.display, fontSize: 13, fontWeight: 800,
              cursor: !name.trim() ? 'not-allowed' : 'pointer',
              opacity: !name.trim() ? .45 : 1,
              transition: 'transform .1s, box-shadow .1s',
            }}>✓ Add habit</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── HabitsEmptyState ──────────────────────────────────────────────────────────

function HabitsEmptyState() {
  const { setShowAddHabit } = useFizz();
  const FZ = useFizz().theme;
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: '40px 20px',
      animation: 'fade-in .3s ease-out',
    }}>
      <div style={{ animation: 'empty-bob 3s ease-in-out infinite' }}>
        <svg width="48" height="96" viewBox="1 0 30 72" overflow="visible" opacity=".55">
          <circle cx="18" cy="20" r="5" fill="#f0a821" opacity=".18"/>
          <g style={{ transformBox: 'fill-box', transformOrigin: '50% 90%', animation: 'flame-flicker 2.6s ease-in-out infinite', opacity: .5 }}>
            <path d="M18 11 C15.5 15 15 18.5 16.5 21 C17 22 18 23 18 23 C18 23 19 22 19.5 21 C21 18.5 20.5 15 18 11Z" fill="#ffd66b"/>
          </g>
          <line x1="18" y1="23" x2="18" y2="26" stroke="#5a4a2a" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 26 L10.5 66 Q10.5 68 13 68 L23 68 Q25.5 68 25.5 66 L24 26Z"
            fill="#ede6d0" stroke="rgba(255,233,181,.35)" strokeWidth="2" strokeLinejoin="round"/>
          <rect x="7" y="67" width="22" height="5" rx="2.5"
            fill="rgba(255,233,181,.3)" stroke="rgba(255,233,181,.3)" strokeWidth="2"/>
        </svg>
      </div>
      <div style={{ fontFamily: FZ.display, fontWeight: 800, fontSize: 22, letterSpacing: '-.02em' }}>
        No habits yet
      </div>
      <div style={{ fontFamily: FZ.body, fontSize: 14, color: FZ.ink2, textAlign: 'center', maxWidth: 280, lineHeight: 1.5 }}>
        Pick one thing worth doing every day and build from there.
      </div>
      <button
        onClick={() => setShowAddHabit(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          height: 36, padding: '0 18px', borderRadius: 18,
          background: '#3aa84a', color: '#fff',
          border: `2.5px solid ${FZ.ink}`,
          fontFamily: FZ.display, fontSize: 14, fontWeight: 800,
          cursor: 'pointer', boxShadow: `3px 3px 0 ${FZ.ink}`,
          transition: 'transform .1s, box-shadow .1s',
          marginTop: 6,
        }}>
        🕯️ Add your first habit
      </button>
    </div>
  );
}

// ── AvenueHabits — top-level component ────────────────────────────────────────

function AvenueHabits() {
  const { habits } = useFizz();
  const FZ = useFizz().theme;

  const dots = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14'%3E%3Ccircle cx='2' cy='2' r='0.8' fill='${encodeURIComponent(FZ.dotRgba)}'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      width: '100%', height: '100%', background: FZ.paper, color: FZ.ink,
      fontFamily: FZ.body, display: 'flex', flexDirection: 'column',
      backgroundImage: dots, backgroundSize: '14px 14px', position: 'relative',
      colorScheme: FZ.scheme,
    }}>

      <AppHeader/>

      {/* ── Spare Fuses strip ── */}
      <SpareFusesBar/>

      {/* ── Column headers (only when habits exist) ── */}
      {habits.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '52px 180px 1fr 90px',
          gap: 14, padding: '8px 22px',
          borderBottom: `2px solid ${FZ.ink}`,
          fontFamily: FZ.body, fontSize: 10.5, color: FZ.ink3,
          letterSpacing: '.12em', fontWeight: 700, textTransform: 'uppercase',
          flexShrink: 0,
        }}>
          <div>Streak</div>
          <div>Habit</div>
          <div style={{ color: FZ.ink3 }}>Mon · Tue · Wed · Thu · Fri · Sat · Sun</div>
          <div/>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        scrollbarColor: `var(--fz-ink) var(--fz-paper2)`, scrollbarWidth: 'thin',
      }}>
        {habits.length === 0
          ? <HabitsEmptyState/>
          : habits.map((h) => <HabitRow key={h.id} habit={h}/>)
        }
      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: '10px 22px', borderTop: `3px solid ${FZ.ink}`,
        fontFamily: FZ.display, fontSize: 13, color: FZ.ink, fontWeight: 600, fontStyle: 'italic',
        background: FZ.paper2, display: 'flex', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <span>{habits.length} habit{habits.length !== 1 ? 's' : ''}</span>
        <span style={{ opacity: .65 }}>log daily · chain stays lit · spare fuses patch missed days</span>
      </div>
    </div>
  );
}

Object.assign(window, { AvenueHabits, NewHabitModal });
