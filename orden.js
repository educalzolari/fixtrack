function _money(v) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(Number(v) || 0);
}
function _date(v) {
  if (!v) return "";
  const [y, m, d] = v.split("-");
  return `${d}/${m}/${y}`;
}
function _esc(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function _now() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function getTicketConfig() {
  try { return JSON.parse(localStorage.getItem("fixtrack_ticket_config") || "{}"); } catch { return {}; }
}

document.addEventListener("DOMContentLoaded", async () => {
  const params   = new URLSearchParams(window.location.search);
  const id       = Number(params.get("id"));
  const autoprint = params.get("autoprint") === "1";
  const wrap     = document.getElementById("ticketWrap");

  if (!id) { wrap.innerHTML = `<p class="tk-empty">Link inválido.</p>`; return; }

  const repair = await dbGetById(id);
  if (!repair) { wrap.innerHTML = `<p class="tk-empty">Orden no encontrada.</p>`; return; }

  const cfg = getTicketConfig();
  const tallerNombre = repair.tallerNombre || "1Fixtrack!";
  document.title = `Ticket #${repair.id} · ${tallerNombre}`;

  // Paper size class
  document.body.dataset.paper = cfg.paperSize || "80mm";

  // ── Sección: logo + encabezado ──────────────────────────
  const logoHtml = cfg.logoUrl
    ? `<img class="tk-logo" src="${_esc(cfg.logoUrl)}" alt="Logo">`
    : "";

  const subHeader = [
    cfg.sucursal  ? `Sucursal: ${_esc(cfg.sucursal)}` : "",
    cfg.domicilio ? `Domicilio: ${_esc(cfg.domicilio)}` : "",
    cfg.mostrarTelefono && cfg.telefonoTaller ? `Tel: ${_esc(cfg.telefonoTaller)}` : "",
  ].filter(Boolean).map(l => `<div>${l}</div>`).join("");

  // ── Sección: datos del servicio ─────────────────────────
  const device = [repair.dispositivo, repair.marca, repair.modelo].filter(Boolean).join(" ").toUpperCase();

  function tkField(label, value) {
    if (!value) return "";
    return `<div class="tk-field">
      <div class="tk-label">${label}:</div>
      <div class="tk-value">${_esc(String(value))}</div>
    </div>`;
  }

  // ── Sección: redes ──────────────────────────────────────
  const redesLines = cfg.mostrarRedes ? [
    cfg.instagram ? `Instagram: ${cfg.instagram}` : "",
    cfg.facebook  ? `Facebook: ${cfg.facebook}`   : "",
    cfg.tiktok    ? `TikTok: ${cfg.tiktok}`       : "",
  ].filter(Boolean) : [];

  const redesHtml = redesLines.length
    ? `<div class="tk-redes">${redesLines.map(l => `<div>${_esc(l)}</div>`).join("")}</div>`
    : "";

  // ── Sección: firma ──────────────────────────────────────
  const firmaHtml = cfg.mostrarFirma !== false
    ? `<div class="tk-firma-wrap">
        <div class="tk-firma-line"></div>
        <div class="tk-firma-label">Firma del cliente</div>
      </div>`
    : "";

  // ── Sección: términos ───────────────────────────────────
  const terminosHtml = cfg.mostrarTerminos && cfg.terminos
    ? `<div class="tk-section">
        <div class="tk-section-title">Condiciones del Servicio</div>
        <div class="tk-terminos">${_esc(cfg.terminos).replace(/\n/g, "<br>")}</div>
      </div>`
    : "";

  // ── Pie ─────────────────────────────────────────────────
  const pieTexto = cfg.pieMensaje || "Gracias por su preferencia\nVuelva pronto";

  // ── Render ──────────────────────────────────────────────
  wrap.innerHTML = `
    <div class="tk-header">
      ${logoHtml}
      <div class="tk-taller-nombre">${_esc(tallerNombre)}</div>
      ${subHeader ? `<div class="tk-subheader">${subHeader}</div>` : ""}
    </div>

    <div class="tk-service-meta">
      <div class="tk-service-no">Servicio No. ${repair.id}</div>
      <div class="tk-meta-row">Cliente - ${_esc(repair.cliente)}</div>
      <div class="tk-meta-row">Fecha y hora - ${_now()}</div>
    </div>

    <div class="tk-divider"></div>
    <div class="tk-section-title tk-section-title--center">Datos del Servicio</div>
    <div class="tk-divider"></div>

    ${tkField("Dispositivo", device)}
    ${tkField("Descripcion del problema", repair.problema)}
    ${repair.observaciones ? tkField("Observaciones", repair.observaciones) : tkField("Observaciones", "")}
    ${tkField("Accesorios", repair.accesorios || "")}
    ${tkField("Costo Aproximado", _money(repair.costoAproximado))}
    ${tkField("Anticipo", _money(repair.anticipo || 0))}
    ${repair.fechaEntrega ? tkField("Fecha Estimada de entrega", _date(repair.fechaEntrega)) : ""}

    ${terminosHtml}
    ${firmaHtml}
    ${redesHtml}

    <div class="tk-footer">
      <div class="tk-pie">${_esc(pieTexto).replace(/\n/g, "<br>")}</div>
      <div class="tk-branding">Generado con 1Fixtrack! · Gestión de talleres</div>
    </div>
  `;

  if (autoprint) {
    window.addEventListener("load", () => window.print(), { once: true });
  }
});
