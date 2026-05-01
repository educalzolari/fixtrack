function _money(v) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(Number(v) || 0);
}

function _date(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}

function _esc(v) {
  return String(v || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _statusClass(s) {
  return { "En espera": "waiting", Activo: "active", Finalizado: "done", Cancelado: "cancelled" }[s] || "waiting";
}

function _row(label, value) {
  if (!value) return "";
  return `<div class="orden-row"><span>${label}</span><strong>${_esc(value)}</strong></div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = Number(new URLSearchParams(window.location.search).get("id"));
  const content = document.getElementById("ordenContent");

  if (!id) {
    content.innerHTML = `<p class="orden-empty">Link invalido.</p>`;
    return;
  }

  const repair = await dbGetById(id);

  if (!repair) {
    content.innerHTML = `<p class="orden-empty">Orden no encontrada.</p>`;
    return;
  }

  document.title = `Orden #${repair.id} | FixTrack`;
  document.getElementById("ordenTitle").textContent = `Orden de Reparacion #${repair.id}`;
  document.getElementById("ordenDate").textContent = `Ingreso: ${_date(repair.fechaIngreso)}`;

  const balance = repair.costoAproximado - (repair.anticipo || 0);

  content.innerHTML = `
    <div class="orden-section">
      <p class="orden-section-title">Cliente</p>
      ${_row("Nombre", repair.cliente)}
      ${repair.telefono ? _row("Telefono", repair.telefono) : ""}
    </div>

    <div class="orden-section">
      <p class="orden-section-title">Dispositivo</p>
      ${_row("Tipo", repair.dispositivo)}
      ${_row("Marca / Modelo", `${repair.marca} ${repair.modelo}`)}
      ${repair.identificador ? _row("IMEI / SN", repair.identificador) : ""}
      ${repair.accesorios ? _row("Accesorios", repair.accesorios) : ""}
    </div>

    <div class="orden-section">
      <p class="orden-section-title">Problema reportado</p>
      <p class="orden-text">${_esc(repair.problema)}</p>
      ${repair.observaciones ? `<p class="orden-text orden-obs">${_esc(repair.observaciones)}</p>` : ""}
    </div>

    <div class="orden-section">
      <p class="orden-section-title">Presupuesto</p>
      ${_row("Costo estimado", _money(repair.costoAproximado))}
      ${repair.anticipo ? _row("Anticipo recibido", _money(repair.anticipo)) : ""}
      ${repair.anticipo ? _row("Saldo pendiente", _money(balance)) : ""}
      ${repair.fechaEntrega ? _row("Entrega estimada", _date(repair.fechaEntrega)) : ""}
    </div>

    <div class="orden-section orden-status-row">
      <span class="status-pill ${_statusClass(repair.estado)}">${_esc(repair.estado)}</span>
    </div>

    ${repair.cierre ? `
    <div class="orden-section">
      <p class="orden-section-title">Trabajo realizado</p>
      <p class="orden-text">${_esc(repair.cierre.solucionFinal)}</p>
      ${_row("Costo final", _money(repair.cierre.costoFinal))}
      ${_row("Fecha de cierre", _date(repair.cierre.fechaFinalizacion))}
    </div>` : ""}

    <div class="orden-footer">
      <p>Conserva esta orden como comprobante de tu reparacion.</p>
    </div>
  `;
});
