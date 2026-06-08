/* 1Fix — Clientes + placeholders -------------------------------------------- */
function Clientes({ jobs, go }) {
  const [q, setQ] = useState('');
  const list = FIX.CLIENTES
    .map(c => ({
      ...c,
      jobs: jobs.filter(j => j.cliente === c.nombre).length,
      gasto: jobs.filter(j => j.cliente === c.nombre).reduce((s, j) => s + j.costo, 0),
    }))
    .filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.jobs - a.jobs || a.nombre.localeCompare(b.nombre));

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker">Negocio / Personas</div>
        <h1 className="page-title">Clientes</h1>
        <p className="page-sub">{FIX.CLIENTES.length} clientes registrados en tu taller.</p>
      </div>
      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div className="search">
          <Icon n="search" s={17} />
          <input className="inp" placeholder="Buscar cliente…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <button className="btn btn-accent"><Icon n="plus" s={17} />Nuevo cliente</button>
      </div>
      <div className="client-grid stagger">
        {list.map(c => (
          <div className="client" key={c.nombre}>
            <div className="avatar">{initials(c.nombre)}</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="client-name">{c.nombre}</div>
              <div className="client-meta">{c.tel}</div>
            </div>
            <div className="client-stat">
              <b className="num">{c.jobs}</b>
              <span>Trabajos</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.Clientes = Clientes;

function Placeholder({ route, go }) {
  const meta = {
    reportes:    { t: 'Reportes', icon: 'chart', d: 'Métricas de ingresos, tiempos de reparación y ranking de fallas más comunes.' },
    inventario:  { t: 'Inventario', icon: 'box', d: 'Stock de repuestos, módulos y baterías con alertas de mínimos.' },
    proveedores: { t: 'Proveedores', icon: 'truck', d: 'Contactos, listas de precios y órdenes de compra de repuestos.' },
    config:      { t: 'Configuración', icon: 'gear', d: 'Datos del taller, usuarios, estados personalizados y plantillas de ticket.' },
  }[route] || { t: 'Sección', icon: 'box', d: '' };
  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker">{meta.t}</div>
        <h1 className="page-title">{meta.t}</h1>
      </div>
      <div className="empty panel" style={{ borderStyle: 'dashed' }}>
        <div className="empty-ico"><Icon n={meta.icon} s={30} /></div>
        <span className="badge-soon">Próximamente</span>
        <h3>{meta.t} en construcción</h3>
        <p style={{ maxWidth: '42ch' }}>{meta.d}</p>
        <button className="btn btn-ghost btn-sm" onClick={() => go('inicio')} style={{ marginTop: 6 }}><Icon n="home" s={15} />Volver al inicio</button>
      </div>
    </div>
  );
}
window.Placeholder = Placeholder;
