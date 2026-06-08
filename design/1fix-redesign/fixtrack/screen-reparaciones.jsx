/* 1Fix — Ver Reparaciones (list) -------------------------------------------- */
function Reparaciones({ jobs, advance, remove, go }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('todos');

  const filtered = jobs.filter(j => {
    const m = (j.cliente + ' ' + j.marca + ' ' + j.modelo + ' ' + j.servicio + ' ' + j.id)
      .toLowerCase().includes(q.toLowerCase());
    const f = filter === 'todos' || j.estado === filter;
    return m && f;
  });

  // group by estado, in pipeline order
  const groups = FIX.ORDER
    .map(est => ({ est, rows: filtered.filter(j => j.estado === est) }))
    .filter(g => g.rows.length);

  const advanceLabel = { en_espera: 'play', activo: 'check', finalizado: 'check' };
  const advanceClass = { en_espera: 'go', activo: 'ok', finalizado: 'ok' };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-kicker">Operación / Trabajos</div>
        <h1 className="page-title">Listado de trabajos</h1>
        <p className="page-sub">Seleccioná una reparación para avanzar su estado en el flujo o eliminarla.</p>
      </div>

      <div className="toolbar" style={{ marginBottom: 18 }}>
        <div className="search">
          <Icon n="search" s={17} />
          <input className="inp" placeholder="Buscar por cliente, equipo o nro…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="filter-sel">
          <select className="sel" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {FIX.ORDER.map(e => <option key={e} value={e}>{FIX.ESTADOS[e].label}</option>)}
          </select>
        </div>
        <button className="btn btn-accent" onClick={() => go('nueva')}><Icon n="plus" s={17} />Nueva</button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 130 }}>Nro / Fecha</th>
              <th>Cliente</th>
              <th>Servicio</th>
              <th style={{ width: 150 }}>Estado</th>
              <th style={{ width: 110, textAlign: 'right' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr><td colSpan={5}>
                <div className="empty" style={{ padding: '50px 20px' }}>
                  <div className="empty-ico"><Icon n="search" s={28} /></div>
                  <h3>Sin resultados</h3>
                  <p>No hay trabajos que coincidan con tu búsqueda.</p>
                </div>
              </td></tr>
            )}
            {groups.map(g => (
              <React.Fragment key={g.est}>
                <tr className="grp">
                  <td colSpan={5}>
                    <div className="grp-head">
                      <Pill estado={g.est} />
                      <span className={'grp-count num ' + FIX.ESTADOS[g.est].sc}>{g.rows.length}</span>
                    </div>
                  </td>
                </tr>
                {g.rows.map(j => {
                  const e = FIX.ESTADOS[j.estado];
                  return (
                    <tr className="row" key={j.id}>
                      <td><div className="cell-nro num">#{j.id}</div><div className="cell-date">{j.fecha.split('-').reverse().join('/')}</div></td>
                      <td>
                        <div className="cell-name">{j.cliente}</div>
                        <div className="cell-dim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Icon n={tipoIcon(j.tipo)} s={13} />{j.marca} {j.modelo}
                        </div>
                      </td>
                      <td>
                        <div className="cell-svc">{j.servicio}</div>
                        <div className="cell-imei">{j.imei ? 'IMEI ' + j.imei : 'Sin detalle adicional'}</div>
                      </td>
                      <td><Pill estado={j.estado} /></td>
                      <td>
                        <div className="row-actions">
                          {e.next && (
                            <button className={'btn-icon ' + advanceClass[j.estado]} title={'Pasar a ' + FIX.ESTADOS[e.next].label}
                                    onClick={() => advance(j.id)}>
                              <Icon n={advanceLabel[j.estado]} s={16} />
                            </button>
                          )}
                          <button className="btn-icon del" title="Eliminar" onClick={() => remove(j.id)}><Icon n="trash" s={16} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
window.Reparaciones = Reparaciones;
