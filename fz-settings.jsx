// fz-settings.jsx — Settings modal for the Fuze avenue.
// Drives settings.palette / sound / animation in the shared context.

function SettingsModal() {
  const { showSettings, setShowSettings, settings, updateSettings, playSound } = useFizz();
  const FZ = useFizz().theme;
  const [autostart, setAutostart] = React.useState(() =>
    window.electronAPI ? window.electronAPI.getAutostart() : false
  );

  function toggleAutostart(v) {
    setAutostart(v);
    if (window.electronAPI) window.electronAPI.setAutostart(v);
  }

  React.useEffect(() => {
    if (!showSettings) return;
    const k = (e) => { if (e.key === 'Escape') setShowSettings(false); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [showSettings, setShowSettings]);

  if (!showSettings) return null;

  return ReactDOM.createPortal(
    <div onClick={() => setShowSettings(false)}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'backdrop-in .15s ease-out',
        fontFamily: FZ.body,
        colorScheme: FZ.scheme,
      }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{
          width: 500, background: FZ.paper, color: FZ.ink,
          border: `3px solid ${FZ.ink}`, borderRadius: 14,
          boxShadow: `8px 8px 0 ${FZ.ink}`,
          padding: 22, animation: 'modal-in .18s cubic-bezier(.4,1.4,.5,1)',
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{
            margin: 0, fontFamily: FZ.display, fontSize: 24, fontWeight: 800,
            letterSpacing: '-0.02em', lineHeight: 1,
          }}>⚙ Settings</h2>
          <button onClick={() => setShowSettings(false)}
            aria-label="Close"
            style={{
              border: 0, background: 'transparent', cursor: 'pointer',
              width: 32, height: 32, borderRadius: 16, color: FZ.ink2,
              fontSize: 20, lineHeight: 1,
            }}>×</button>
        </div>

        <SettingSection label="Palette" subtitle="Color scheme for the app">
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(FZ_PALETTES).map(([key, p]) => (
              <PaletteCard key={key} palette={p} paletteKey={key}
                selected={settings.palette === key}
                onClick={() => updateSettings({ palette: key })}/>
            ))}
          </div>
        </SettingSection>

        <SettingSection label="Sound" subtitle="Snip & pop when you defuse a task">
          <ToggleRow
            theme={FZ}
            value={settings.sound}
            onChange={(v) => {
              updateSettings({ sound: v });
              if (v) setTimeout(() => SOUNDS.pop(0.18), 50);
            }}
            onLabel="On" offLabel="Off"
            extra={settings.sound ? (
              <button onClick={() => { SOUNDS.snip(); setTimeout(() => SOUNDS.pop(), 250); }}
                style={{
                  marginLeft: 10, height: 28, padding: '0 10px', borderRadius: 14,
                  background: 'transparent', border: `2px solid ${FZ.ink}`, color: FZ.ink,
                  fontFamily: FZ.body, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>▶ Test</button>
            ) : null}
          />
        </SettingSection>

        <SettingSection label="Animation" subtitle="Sparks, confetti, shake">
          <SegmentRow theme={FZ}
            options={[
              { value: 'full',   label: 'Full' },
              { value: 'subtle', label: 'Subtle' },
              { value: 'off',    label: 'Off' },
            ]}
            value={settings.animation}
            onChange={(v) => updateSettings({ animation: v })}/>
        </SettingSection>

        <SettingSection label="Launch at login" subtitle="Start Fizzle when Windows boots">
          <ToggleRow theme={FZ} value={autostart} onChange={toggleAutostart} onLabel="On" offLabel="Off" />
        </SettingSection>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 22, paddingTop: 14, borderTop: `2px dashed ${FZ.rule}` }}>
          <span style={{ fontFamily: FZ.body, fontSize: 11, color: FZ.ink3, letterSpacing: '.06em' }}>
            Saved to this browser.
          </span>
          <button onClick={() => updateSettings({ palette: 'cream', sound: true, animation: 'full' })}
            style={{
              height: 32, padding: '0 14px', borderRadius: 16,
              background: 'transparent', border: `2px solid ${FZ.ink}`, color: FZ.ink,
              fontFamily: FZ.display, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>Reset to defaults</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SettingSection({ label, subtitle, children }) {
  const FZ = useFizz().theme;
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{
          fontFamily: FZ.body, fontSize: 11, fontWeight: 700, color: FZ.ink2,
          letterSpacing: '.12em', textTransform: 'uppercase',
        }}>{label}</span>
        {subtitle && <span style={{ fontFamily: FZ.body, fontSize: 12, color: FZ.ink3 }}>{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function PaletteCard({ palette, paletteKey, selected, onClick }) {
  const FZ = useFizz().theme;
  return (
    <button onClick={onClick}
      style={{
        flex: 1, padding: 0, border: `2.5px solid ${selected ? FZ.ink : FZ.rule}`,
        borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
        background: 'transparent',
        boxShadow: selected ? `3px 3px 0 ${FZ.ink}` : 'none',
        transform: selected ? 'translate(0,0)' : 'translate(3px,3px)',
        transition: 'transform .12s, box-shadow .12s',
        fontFamily: FZ.body, textAlign: 'left',
      }}>
      {/* swatch preview */}
      <div style={{
        position: 'relative', height: 56,
        background: palette.paper, borderBottom: `2.5px solid ${selected ? FZ.ink : FZ.rule}`,
      }}>
        <div style={{ position: 'absolute', top: 8, left: 8, right: 8, height: 8, background: palette.barBg, borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '55%', background: palette.accent }}/>
        </div>
        <div style={{ position: 'absolute', bottom: 8, left: 8, right: 30, height: 6, background: palette.ink, opacity: .6, borderRadius: 3 }}/>
        <div style={{ position: 'absolute', bottom: 18, left: 8, width: 28, height: 5, background: palette.ink, borderRadius: 3 }}/>
        <div style={{ position: 'absolute', top: 26, right: 8, width: 16, height: 16, borderRadius: 16, background: palette.ink, border: `1.5px solid ${palette.ink}` }}/>
      </div>
      <div style={{
        padding: '6px 10px', background: palette.paper2, color: palette.ink,
        fontFamily: FZ.display, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>{palette.name}</span>
        {selected && <span style={{ fontSize: 13 }}>✓</span>}
      </div>
    </button>
  );
}

function ToggleRow({ theme: FZ, value, onChange, onLabel = 'On', offLabel = 'Off', extra }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 0,
        background: FZ.btnBg, border: `2.5px solid ${FZ.ink}`, borderRadius: 18,
        boxShadow: `3px 3px 0 ${FZ.ink}`, padding: 2,
      }}>
        {[true, false].map((b) => (
          <button key={String(b)} onClick={() => onChange(b)}
            style={{
              height: 28, padding: '0 14px', borderRadius: 14, border: 0,
              background: value === b ? FZ.ink : 'transparent',
              color: value === b ? FZ.paper : FZ.ink,
              fontFamily: FZ.display, fontSize: 13, fontWeight: 700,
              cursor: 'pointer',
            }}>{b ? onLabel : offLabel}</button>
        ))}
      </div>
      {extra}
    </div>
  );
}

function SegmentRow({ theme: FZ, options, value, onChange }) {
  return (
    <div style={{
      display: 'inline-flex', background: FZ.btnBg,
      border: `2.5px solid ${FZ.ink}`, borderRadius: 18,
      boxShadow: `3px 3px 0 ${FZ.ink}`, padding: 2,
    }}>
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)}
          style={{
            height: 28, padding: '0 14px', borderRadius: 14, border: 0,
            background: value === o.value ? FZ.ink : 'transparent',
            color: value === o.value ? FZ.paper : FZ.ink,
            fontFamily: FZ.display, fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}>{o.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { SettingsModal });
