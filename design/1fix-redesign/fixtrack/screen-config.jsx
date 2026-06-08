/* 1Fix — Configuración · Apariencia ----------------------------------------- */
function ThemePreview({ cfg }) {
  const dark = cfg.theme === 'dark';
  const c = dark
    ? { bg: 'oklch(0.165 0.014 265)', side: 'oklch(0.225 0.016 265)', card: 'oklch(0.245 0.018 265)', line: 'oklch(0.45 0.018 265)' }
    : { bg: 'oklch(0.965 0.004 265)', side: '#ffffff', card: '#ffffff', line: 'oklch(0.86 0.006 265)' };
  const rad = (RADII[cfg.radius] ?? 8);
  return (
    <div className="theme-prev" style={{ background: c.bg }}>
      <div className="pv-side" style={{ background: c.side, borderRadius: rad / 1.5 + 3 }}>
        <span className="pv-acc" style={{ height: 9, borderRadius: 3, background: cfg.accent, width: '70%' }} />
        <span className="pv-dot" style={{ background: c.line }} />
        <span className="pv-dot" style={{ background: c.line, width: '80%' }} />
        <span className="pv-dot" style={{ background: c.line, width: '90%' }} />
      </div>
      <div className="pv-main">
        <span className="pv-bar" style={{ background: c.line }} />
        <div className="pv-cards">
          {[0, 1].map(i => (
            <div className="pv-c" key={i} style={{ background: c.card, border: `1px solid ${c.line}`, borderRadius: rad / 1.5 + 3 }}>
              <span className="pv-acc" style={{ width: '55%', background: i === 1 ? cfg.accent : c.line, opacity: i === 1 ? 1 : .6 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Seg({ value, options, onChange }) {
  return (
    <div className="seg">
      {options.map(o => {
        const v = typeof o === 'object' ? o.value : o;
        const l = typeof o === 'object' ? o.label : o;
        return <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>;
      })}
    </div>
  );
}

function Config({ theme, setTheme }) {
  const activeId = (THEMES.find(t => sameTheme(t.cfg, theme)) || {}).id;
  const isCustom = !activeId;

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker">Configuración / Apariencia</div>
        <h1 className="page-title">Apariencia</h1>
        <p className="page-sub">Elegí un tema y ajustá los detalles a tu gusto. Tu configuración se guarda automáticamente en este dispositivo.</p>
      </div>

      <div className="cfg-wrap">
        {/* Theme gallery */}
        <div>
          <div className="section-head" style={{ margin: '0 0 14px' }}>
            <div className="section-title">Temas <span className="ix mono">{THEMES.length}</span></div>
            {isCustom && <span className="badge-soon">Personalizado</span>}
          </div>
          <div className="theme-grid">
            {THEMES.map(t => (
              <button key={t.id} className={'theme-card' + (activeId === t.id ? ' on' : '')} onClick={() => setTheme(t.cfg)}>
                <ThemePreview cfg={t.cfg} />
                <div className="theme-meta">
                  <b>{t.name}</b>
                  <span className="theme-mode">{t.mode === 'dark' ? 'Oscuro' : 'Claro'}</span>
                  {activeId === t.id && <span className="theme-check"><Icon n="check" s={12} sw={2.6} /></span>}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fine controls */}
        <div className="form-sec" style={{ padding: '6px 24px' }}>
          <div className="cfg-rows">
            <div className="cfg-row">
              <div className="cfg-l"><b>Modo base</b><span>Fondo oscuro o claro para toda la app.</span></div>
              <div className="cfg-ctl"><Seg value={theme.theme} options={[{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]} onChange={v => setTheme({ theme: v })} /></div>
            </div>

            <div className="cfg-row">
              <div className="cfg-l"><b>Color de acento</b><span>Define botones, estados activos y resaltados.</span></div>
              <div className="cfg-ctl">
                <div className="swatches">
                  {ACCENTS.map(a => (
                    <button key={a.v} className={'sw' + (theme.accent === a.v ? ' on' : '')} title={a.name}
                            style={{ background: a.v }} onClick={() => setTheme({ accent: a.v })}>
                      {theme.accent === a.v && <Icon n="check" s={15} sw={2.8} style={{ color: a.ink }} />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="cfg-row">
              <div className="cfg-l"><b>Esquinas</b><span>Qué tan redondeados son tarjetas y botones.</span></div>
              <div className="cfg-ctl"><Seg value={theme.radius} options={['Recto', 'Suave', 'Redondo']} onChange={v => setTheme({ radius: v })} /></div>
            </div>

            <div className="cfg-row">
              <div className="cfg-l"><b>Densidad</b><span>Espaciado de tablas, tarjetas y listados.</span></div>
              <div className="cfg-ctl"><Seg value={theme.density} options={['Compacto', 'Normal', 'Amplio']} onChange={v => setTheme({ density: v })} /></div>
            </div>

            <div className="cfg-row">
              <div className="cfg-l"><b>Glow del acento</b><span>Brillo alrededor de elementos activos (solo en modo oscuro).</span></div>
              <div className="cfg-ctl">
                <button className={'swc' + (theme.glow ? ' on' : '')} role="switch" aria-checked={theme.glow} onClick={() => setTheme({ glow: !theme.glow })}><i /></button>
              </div>
            </div>

            <div className="cfg-row">
              <div className="cfg-l"><b>Números monoespaciados</b><span>Cifras tipo terminal en KPIs, precios e IDs.</span></div>
              <div className="cfg-ctl">
                <button className={'swc' + (theme.monoNum ? ' on' : '')} role="switch" aria-checked={theme.monoNum} onClick={() => setTheme({ monoNum: !theme.monoNum })}><i /></button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="hint" style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <Icon n="check" s={14} style={{ color: 'var(--st-finalizado)' }} />Cambios guardados automáticamente
          </span>
          <span style={{ flex: 1 }} />
          <button className="btn btn-ghost btn-sm" onClick={() => setTheme(THEMES[0].cfg)}><Icon n="spark" s={15} />Restablecer a Neón</button>
        </div>
      </div>
    </div>
  );
}
window.Config = Config;
