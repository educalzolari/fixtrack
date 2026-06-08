/* 1Fix — Inicio (dashboard) ------------------------------------------------- */
function Inicio({ jobs, go }) {
  const espera = jobs.filter(j => j.estado === 'en_espera').length;
  const activos = jobs.filter(j => j.estado === 'activo').length;
  const mes = jobs.filter(j => (j.estado === 'finalizado' || j.estado === 'entregado')).length;
  const ventas = jobs.reduce((s, j) => s + j.costo, 0);
  const recientes = [...jobs].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id).slice(0, 5);

  const today = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });

  const kpis = [
    { tag: 'Trabajos en espera', num: espera, foot: 'Pendientes por iniciar', icon: 'clock', clr: 'var(--st-espera)', spark: [3, 2, 4, 1, 2, 1] },
    { tag: 'Trabajos activos', num: activos, foot: 'En proceso o revisión', icon: 'wrench', clr: 'var(--st-activo)', spark: [1, 2, 1, 3, 2, 1] },
    { tag: 'Reparaciones (mes)', num: mes, foot: '', delta: { v: '−33%', dir: 'down', note: 'vs. mes anterior' }, icon: 'spark', clr: 'var(--st-finalizado)', spark: [6, 5, 7, 4, 6, 4] },
    { tag: 'Total de ventas', num: fmt(ventas), foot: 'Ingresos brutos', icon: 'dollar', accent: true, spark: [4, 6, 5, 8, 6, 9] },
  ];

  const actions = [
    { title: 'Cargar Reparación', icon: 'plus', to: 'nueva' },
    { title: 'Ver Reparaciones', icon: 'list', to: 'reparaciones' },
    { title: 'Clientes', icon: 'users', to: 'clientes' },
    { title: 'Resumen de Mes', icon: 'chart', to: 'reportes' },
  ];

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker mono" style={{ textTransform: 'capitalize' }}>{today}</div>
        <h1 className="page-title">Hola, Eduardo 👋</h1>
        <p className="page-sub">Este es el estado de tu taller hoy. Tenés {espera + activos} trabajo{espera + activos === 1 ? '' : 's'} en curso.</p>
      </div>

      <div className="kpi-grid stagger">
        {kpis.map((k, i) => (
          <div className={'kpi' + (k.accent ? ' is-accent' : '')} key={i}>
            <span className="kpi-accent" style={{ background: k.clr || 'var(--accent)' }} />
            <div className="kpi-top">
              <span className="kpi-tag">{k.tag}</span>
              <span className="kpi-ico"><Icon n={k.icon} s={16} /></span>
            </div>
            <div className="kpi-num">{k.num}</div>
            <div className="kpi-foot">
              {k.delta && <span className={'delta ' + k.delta.dir}><Icon n="chart" s={11} sw={2.4} />{k.delta.v}</span>}
              {k.delta ? k.delta.note : k.foot}
            </div>
            <div className="spark">
              {k.spark.map((h, j) => <i key={j} className={j === k.spark.length - 1 ? 'hot' : ''} style={{ height: h * 3 + 4 }} />)}
            </div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <div className="section-title">Accesos directos <span className="ix mono">04</span></div>
      </div>
      <div className="qa-grid stagger">
        {actions.map((a, i) => (
          <button className="qa" key={i} onClick={() => go(a.to)}>
            <span className="qa-arrow"><Icon n="arrow" s={18} /></span>
            <span className="qa-ico"><Icon n={a.icon} s={21} /></span>
            <span className="qa-title">{a.title}</span>
          </button>
        ))}
      </div>

      <div className="section-head">
        <div className="section-title">Últimas reparaciones <span className="ix mono">{recientes.length} de {jobs.length}</span></div>
        <button className="btn btn-ghost btn-sm" onClick={() => go('reparaciones')}>Ver todo <Icon n="arrowR" s={15} /></button>
      </div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr><th>Nro</th><th>Cliente</th><th>Equipo</th><th>Estado</th><th style={{ textAlign: 'right' }}>Costo</th></tr>
          </thead>
          <tbody>
            {recientes.map(j => (
              <tr className="row" key={j.id} onClick={() => go('reparaciones')} style={{ cursor: 'pointer' }}>
                <td><div className="cell-nro num">#{j.id}</div><div className="cell-date">{j.fecha.split('-').reverse().join('/')}</div></td>
                <td><div className="cell-name">{j.cliente}</div></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--text-3)' }}><Icon n={tipoIcon(j.tipo)} s={17} /></span>
                    <span>{j.marca} {j.modelo}</span>
                  </div>
                </td>
                <td><Pill estado={j.estado} /></td>
                <td style={{ textAlign: 'right' }}><span className={'cell-cost num' + (j.costo === 0 ? ' zero' : '')}>{fmt(j.costo)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.Inicio = Inicio;
