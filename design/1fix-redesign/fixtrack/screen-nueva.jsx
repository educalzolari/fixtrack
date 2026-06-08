/* 1Fix — Nueva Reparación (form) -------------------------------------------- */
function PatternLock({ value, onChange }) {
  const ref = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const pts = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) pts.push({ i: r * 3 + c, x: 22 + c * 78, y: 22 + r * 78 });

  const pos = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    return { cx: cx * (200 / rect.width), cy: cy * (200 / rect.height) };
  };
  const nearest = (cx, cy) => pts.find(p => Math.hypot(p.x - cx, p.y - cy) < 26);
  const start = (e) => { e.preventDefault(); onChange([]); setDrawing(true); add(e); };
  const add = (e) => {
    if (e.type === 'pointermove' && !drawing) return;
    const { cx, cy } = pos(e);
    const p = nearest(cx, cy);
    if (p && !value.includes(p.i)) onChange([...value, p.i]);
  };
  const end = () => setDrawing(false);

  const path = value.map(i => pts[i]).map((p, k) => (k === 0 ? `M${p.x} ${p.y}` : `L${p.x} ${p.y}`)).join(' ');
  return (
    <div className="pattern" ref={ref}
         onPointerDown={start} onPointerMove={add} onPointerUp={end} onPointerLeave={end}>
      <svg viewBox="0 0 200 200">
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".85" />
      </svg>
      {pts.map(p => (
        <span key={p.i} className={'pdot' + (value.includes(p.i) ? ' hit' : '')}
              style={{ left: p.x, top: p.y }} />
      ))}
    </div>
  );
}

function NuevaReparacion({ onSubmit, go }) {
  const empty = { cliente: '', tipo: '', marca: '', modelo: '', imei: '', pin: '', servicio: '', costo: '' };
  const [f, setF] = useState(empty);
  const [pat, setPat] = useState([]);
  const [touched, setTouched] = useState(false);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));

  const req = ['cliente', 'tipo', 'marca', 'servicio'];
  const missing = (k) => touched && req.includes(k) && !f[k];

  const submit = () => {
    setTouched(true);
    if (req.some(k => !f[k])) return;
    onSubmit({
      cliente: f.cliente, tipo: f.tipo, marca: f.marca, modelo: f.modelo,
      imei: f.imei, servicio: f.servicio, costo: Number(f.costo) || 0,
    });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker">Operación / Carga</div>
        <h1 className="page-title">Formulario de carga</h1>
        <p className="page-sub">Registrá los datos del cliente, el dispositivo y el trabajo a realizar.</p>
      </div>

      <div className="form-grid stagger">
        {/* Cliente */}
        <div className="form-sec">
          <div className="form-sec-head">
            <span className="form-sec-ico"><Icon n="user" s={18} /></span>
            <span className="form-sec-t">Cliente</span>
            <span className="form-sec-n">01 / 03</span>
          </div>
          <div className="fields">
            <div className="field col-8">
              <label className="lbl">Cliente</label>
              <select className={'sel' + (missing('cliente') ? ' invalid' : '')} value={f.cliente} onChange={e => set('cliente', e.target.value)}>
                <option value="">Seleccionar cliente…</option>
                {FIX.CLIENTES.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
              </select>
              {missing('cliente') && <span className="hint" style={{ color: 'oklch(0.7 0.18 22)' }}>Elegí un cliente para continuar.</span>}
            </div>
            <div className="field col-4" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" style={{ width: '100%' }}><Icon n="plus" s={16} />Nuevo cliente</button>
            </div>
          </div>
        </div>

        {/* Equipo */}
        <div className="form-sec">
          <div className="form-sec-head">
            <span className="form-sec-ico"><Icon n="device" s={18} /></span>
            <span className="form-sec-t">Datos del equipo</span>
            <span className="form-sec-n">02 / 03</span>
          </div>
          <div className="fields">
            <div className="field col-12">
              <label className="lbl">Tipo de dispositivo</label>
              <div className="chips">
                {FIX.TIPOS.map(t => (
                  <button key={t.key} className={'chip' + (f.tipo === t.key ? ' on' : '')} onClick={() => set('tipo', t.key)}>
                    <Icon n={tipoIcon(t.key)} s={17} />{t.label}
                  </button>
                ))}
              </div>
              {missing('tipo') && <span className="hint" style={{ color: 'oklch(0.7 0.18 22)' }}>Seleccioná el tipo de equipo.</span>}
            </div>
            <div className="field col-4">
              <label className="lbl">Marca</label>
              <select className={'sel' + (missing('marca') ? ' invalid' : '')} value={f.marca} onChange={e => set('marca', e.target.value)}>
                <option value="">Seleccionar…</option>
                {FIX.MARCAS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="field col-4">
              <label className="lbl">Modelo</label>
              <input className="inp" placeholder="A54, G22, 11 Pro…" value={f.modelo} onChange={e => set('modelo', e.target.value)} />
            </div>
            <div className="field col-4">
              <label className="lbl">IMEI / Serie <span className="opt">opcional</span></label>
              <input className="inp" placeholder="N° de serie o IMEI" value={f.imei} onChange={e => set('imei', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Acceso + trabajo */}
        <div className="form-sec">
          <div className="form-sec-head">
            <span className="form-sec-ico"><Icon n="wrench" s={18} /></span>
            <span className="form-sec-t">Acceso y trabajo</span>
            <span className="form-sec-n">03 / 03</span>
          </div>
          <div className="fields">
            <div className="field col-4">
              <label className="lbl"><Icon n="key" s={14} />Contraseña / PIN <span className="opt">opcional</span></label>
              <input className="inp" placeholder="PIN o clave" value={f.pin} onChange={e => set('pin', e.target.value)} />
              <span className="hint">Necesario para probar el equipo tras la reparación.</span>
            </div>
            <div className="field col-8">
              <label className="lbl">Problema reportado</label>
              <textarea className={'inp' + (missing('servicio') ? ' invalid' : '')} placeholder="Describí la falla: pantalla astillada, no carga, se moja…"
                        value={f.servicio} onChange={e => set('servicio', e.target.value)} />
            </div>
            <div className="field col-4">
              <label className="lbl"><Icon n="lock" s={14} />Patrón de desbloqueo <span className="opt">opcional</span></label>
              <PatternLock value={pat} onChange={setPat} />
              <span className="hint">{pat.length ? `Patrón: ${pat.map(i => i + 1).join('–')}` : 'Dibujá el recorrido si el equipo usa patrón.'}</span>
            </div>
            <div className="field col-4">
              <label className="lbl"><Icon n="dollar" s={14} />Presupuesto estimado <span className="opt">opcional</span></label>
              <input className="inp num" inputMode="numeric" placeholder="$ 0" value={f.costo}
                     onChange={e => set('costo', e.target.value.replace(/\D/g, ''))} />
              <span className="hint">{f.costo ? fmt(Number(f.costo)) : 'Se puede definir más adelante.'}</span>
            </div>
          </div>
        </div>

        <div className="form-bar">
          <span className="note"><b style={{ color: 'var(--text-2)' }}>{req.filter(k => f[k]).length}/{req.length}</b> campos requeridos completos</span>
          <span className="sp" />
          <button className="btn btn-soft" onClick={() => { setF(empty); setPat([]); setTouched(false); }}>Limpiar</button>
          <button className="btn btn-accent" onClick={submit}><Icon n="check" s={17} />Guardar reparación</button>
        </div>
      </div>
    </div>
  );
}
window.NuevaReparacion = NuevaReparacion;
