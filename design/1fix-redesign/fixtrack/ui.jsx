/* 1Fix — shared UI: icons, primitives, sidebar, topbar ---------------------- */
const { useState, useRef, useEffect } = React;

/* ── Icons (inline stroke set) ─────────────────────────────────────────── */
const P = {
  home:    'M3 11.5 12 4l9 7.5M5 10v9h5v-5h4v5h5v-9',
  plus:    'M12 5v14M5 12h14',
  list:    'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  users:   'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M22 19v-1a4 4 0 0 0-3-3.8M16 4.2A3.5 3.5 0 0 1 16 11',
  chart:   'M4 20V10M10 20V4M16 20v-7M22 20H2',
  box:     'M21 8 12 3 3 8v8l9 5 9-5V8ZM3 8l9 5 9-5M12 13v8',
  truck:   'M2 17h11V6H2v11ZM13 9h4l4 4v4h-8M7.5 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4',
  gear:    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.7 1.7 0 0 0-1.4 1Z',
  help:    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  logout:  'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  phone:   'M15.5 2h-7A1.5 1.5 0 0 0 7 3.5v17A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 15.5 2ZM11 19h2',
  tablet:  'M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2ZM11 18h2',
  laptop:  'M4 5h16v11H4zM2 19h20M9.5 19l.5-3h4l.5 3',
  console: 'M6 12h4M8 10v4M15 11h.01M18 13h.01M17.5 7h-11A4.5 4.5 0 0 0 2 11.5v.5a5 5 0 0 0 9 3h2a5 5 0 0 0 9-3v-.5A4.5 4.5 0 0 0 17.5 7Z',
  device:  'M15.5 2h-7A1.5 1.5 0 0 0 7 3.5v17A1.5 1.5 0 0 0 8.5 22h7a1.5 1.5 0 0 0 1.5-1.5v-17A1.5 1.5 0 0 0 15.5 2ZM11 19h2',
  user:    'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  clock:   'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M12 7v5l3 2',
  wrench:  'M14.7 6.3a4 4 0 0 0 5 5l-9 9a2.8 2.8 0 0 1-4-4l8-8ZM14.7 6.3 18 3l3 3-3.3 3.3',
  dollar:  'M12 2v20M17 5.5A4 4 0 0 0 13 3h-2a3.5 3.5 0 0 0 0 7h2a3.5 3.5 0 0 1 0 7h-2.5A4 4 0 0 1 7 16.5',
  check:   'M20 6 9 17l-5-5',
  play:    'M6 4l13 8-13 8z',
  arrow:   'M7 17 17 7M7 7h10v10',
  arrowR:  'M5 12h14M13 6l6 6-6 6',
  trash:   'M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6',
  search:  'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16M21 21l-4.3-4.3',
  menu:    'M3 6h18M3 12h18M3 18h18',
  x:       'M18 6 6 18M6 6l12 12',
  lock:    'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  key:     'M14 7a4 4 0 1 1-5.7 3.6L3 16v3h3l1-1h2l1-1v-2l1.3-1.3A4 4 0 0 1 14 7Z',
  calendar:'M8 2v4M16 2v4M3 9h18M5 5h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  tag:     'M9 3H4a1 1 0 0 0-1 1v5l9 9 6-6-9-9ZM7 7h.01',
  spark:   'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',
  bell:    'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  sun:     'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon:    'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
};
function Icon({ n, s = 18, sw = 1.7, style }) {
  return (
    <svg viewBox="0 0 24 24" width={s} height={s} fill="none" stroke="currentColor"
         strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={P[n] || P.box} />
    </svg>
  );
}

const fmt = (n) => '$' + (n || 0).toLocaleString('es-AR');
const initials = (name) => name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const tipoIcon = (t) => ({ phone: 'phone', tablet: 'tablet', laptop: 'laptop', console: 'console', other: 'device' }[t] || 'device');

/* ── Status pill ───────────────────────────────────────────────────────── */
function Pill({ estado }) {
  const e = FIX.ESTADOS[estado];
  return (
    <span className={`pill ${e.sc}`}><span className="dot" />{e.label}</span>
  );
}

/* ── Sidebar ───────────────────────────────────────────────────────────── */
const NAV = [
  { key: 'inicio',  label: 'Inicio',          icon: 'home' },
  { key: 'nueva',   label: 'Nueva Reparación', icon: 'plus' },
  { key: 'reparaciones', label: 'Ver Reparaciones', icon: 'list' },
  { key: 'clientes', label: 'Clientes',        icon: 'users' },
  { key: 'reportes', label: 'Reportes',        icon: 'chart' },
];
const NAV2 = [
  { key: 'inventario', label: 'Inventario',   icon: 'box' },
  { key: 'proveedores', label: 'Proveedores', icon: 'truck' },
  { key: 'config',     label: 'Configuración', icon: 'gear' },
];

function Sidebar({ route, go, jobs }) {
  const counts = {
    nueva: null,
    reparaciones: jobs.filter(j => j.estado === 'activo' || j.estado === 'en_espera').length,
  };
  const Item = ({ it }) => (
    <div className={'nav-item' + (route === it.key ? ' active' : '')} onClick={() => go(it.key)}>
      <Icon n={it.icon} />
      <span style={{ flex: 1 }}>{it.label}</span>
      {counts[it.key] ? <span className="num" style={{ fontSize: 11, color: 'var(--accent)' }}>{counts[it.key]}</span> : null}
    </div>
  );
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">1F</div>
        <div>
          <div className="brand-name">1Fix</div>
          <div className="brand-sub">Workshop OS</div>
        </div>
      </div>
      <nav className="nav">
        <div className="nav-label">Operación</div>
        {NAV.map(it => <Item key={it.key} it={it} />)}
        <div className="nav-label">Negocio</div>
        {NAV2.map(it => <Item key={it.key} it={it} />)}
      </nav>
      <div className="side-foot">
        <div className="nav-item" onClick={() => go('inicio')}><Icon n="help" /><span>Centro de Ayuda</span></div>
        <div className="nav-item danger"><Icon n="logout" /><span>Salir</span></div>
      </div>
    </aside>
  );
}

/* ── Topbar ────────────────────────────────────────────────────────────── */
function Topbar({ route, onMenu, mode, onToggleMode }) {
  const labels = {
    inicio: 'Inicio', nueva: 'Nueva Reparación', reparaciones: 'Ver Reparaciones',
    clientes: 'Clientes', reportes: 'Reportes', inventario: 'Inventario',
    proveedores: 'Proveedores', config: 'Configuración',
  };
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  return (
    <header className="topbar">
      <button className="btn-icon menu-btn" onClick={onMenu} aria-label="Menú"><Icon n="menu" /></button>
      <div className="crumb">1Fix <span style={{ opacity: .4 }}>/</span> <b>{labels[route]}</b></div>
      <div className="topbar-spacer" />
      <div className="clock"><span className="live-dot" />Taller abierto · <span className="num">{time}</span></div>
      <button className="btn-icon" onClick={onToggleMode} title={mode === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              aria-label="Cambiar tema">
        <Icon n={mode === 'dark' ? 'sun' : 'moon'} s={16} />
      </button>
    </header>
  );
}

/* ── Toasts ────────────────────────────────────────────────────────────── */
function Toasts({ items }) {
  return (
    <div className="toasts">
      {items.map(t => (
        <div className="toast" key={t.id}>
          <span className="tdot" style={{ background: t.color || 'var(--st-finalizado)' }} />
          <div><b>{t.title}</b><span>{t.body}</span></div>
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { Icon, P, fmt, initials, tipoIcon, Pill, Sidebar, Topbar, Toasts, NAV, NAV2 });
