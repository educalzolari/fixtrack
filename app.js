if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

let movimientos = [];

const _now = new Date();
const today = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

const $ = (selector) => document.querySelector(selector);

const form = $("#repairForm");
const tableBody = $("#repairsTable");
const dashboardTable = $("#dashboardTable");
const searchInput = $("#searchInput");
const statusFilter = $("#statusFilter");
const lastTicket = $("#lastTicket");
const currentDate = $("#currentDate");
const waitingCount = $("#waitingCount");
const collectCount = $("#collectCount");
const monthCount = $("#monthCount");
const salesTotal = $("#salesTotal");
const monthDelta = $("#monthDelta");
// menuToggle removed — handled by shell.js
const patternCanvas = $("#patternCanvas");
const patternImageInput = $("#patronImagen");
const patternSequenceInput = $("#patronSecuencia");
const clearPatternButton = $("#clearPattern");
const editForm = $("#editRepairForm");
const editSummary = $("#editSummary");
const editTitle = $("#editTitle");
const savedPatternPreview = $("#savedPatternPreview");
const expensesTable = $("#expensesTable");
const expensesGrandTotal = $("#expensesGrandTotal");
const repairIncomeTotal = $("#repairIncomeTotal");
const profitTotal = $("#profitTotal");
const gastosJsonInput = $("#gastosJson");
const expenseModal = $("#expenseModal");
const expenseForm = $("#expenseForm");
const openExpenseModalButton = $("#openExpenseModal");
const closeExpenseModalButton = $("#closeExpenseModal");
const cancelExpenseModalButton = $("#cancelExpenseModal");
const expenseUnitPrice = $("#expenseUnitPrice");
const expenseQuantity = $("#expenseQuantity");
const expenseTotal = $("#expenseTotal");
const finishModal = $("#finishModal");
const finishForm = $("#finishForm");
const openFinishModalButton = $("#openFinishModal");
const closeFinishModalButton = $("#closeFinishModal");
const cancelFinishModalButton = $("#cancelFinishModal");
const finishInitialCost = $("#finishInitialCost");
const finishExpenses = $("#finishExpenses");
const finishFinalCost = $("#finishFinalCost");
const finishProfit = $("#finishProfit");
const finishSolution = $("#finishSolution");

let repairs = [];
let editingExpenses = [];

function normalizeStatus(status) {
  if (status === "En revision" || status === "En reparacion" || status === "Listo para cobrar") return "Activo";
  if (status === "Cancelado") return "Cancelado";
  return status || "En espera";
}

function normalizeExpenses(expenses) {
  if (!Array.isArray(expenses)) return [];

  return expenses.map((expense, index) => {
    const montoUnitario = Number(expense.montoUnitario || 0);
    const cantidad = Number(expense.cantidad || 0);
    return {
      id: Number(expense.id || Date.now() + index),
      concepto: expense.concepto || "",
      montoUnitario,
      cantidad,
      total: Number(expense.total || montoUnitario * cantidad),
    };
  });
}

function normalizeClosure(cierre) {
  if (!cierre) return null;

  return {
    costoInicial: Number(cierre.costoInicial || 0),
    gastos: Number(cierre.gastos || 0),
    costoFinal: Number(cierre.costoFinal || 0),
    solucionFinal: cierre.solucionFinal || "",
    ganancia: Number(cierre.ganancia || 0),
    fechaFinalizacion: cierre.fechaFinalizacion || "",
  };
}

function normalizeRepair(repair) {
  return {
    id: repair.id,
    cliente: repair.cliente || "",
    dispositivo: repair.dispositivo || repair.tipoDispositivo || "Celular",
    marca: repair.marca || "",
    modelo: repair.modelo || "",
    identificador: repair.identificador || repair.imei || "",
    passwordDispositivo: repair.passwordDispositivo || "",
    patronImagen: repair.patronImagen || "",
    patronSecuencia: repair.patronSecuencia || "",
    gastos: normalizeExpenses(repair.gastos),
    accesorios: repair.accesorios || "",
    costoAproximado: Number(repair.costoAproximado ?? repair.precio ?? 0),
    anticipo: Number(repair.anticipo || 0),
    fechaEntrega: repair.fechaEntrega || repair.fecha || "",
    estado: normalizeStatus(repair.estado),
    cierre: normalizeClosure(repair.cierre),
    problema: repair.problema || repair.detalle || repair.tipo || "",
    observaciones: repair.observaciones || "",
    fechaIngreso: repair.fechaIngreso || repair.fecha || today,
    telefono: repair.telefono || "",
  };
}


function formatMoney(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function expensesTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.total || 0), 0);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateDate() {
  if (currentDate) {
    const now = new Date();
    const fecha = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(now);
    currentDate.textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
  }
}

function updateDashboardStatus() {
  const el = $("#dashboardStatus");
  if (!el) return;
  const activos    = repairs.filter(r => r.estado === "Activo").length;
  const pendientes = repairs.filter(r => r.estado === "En espera").length;
  const listos     = repairs.filter(r => r.estado === "Finalizado").length;

  let msg = `Este es el estado de tu taller hoy. Tenés <strong>${activos}</strong> trabajo${activos !== 1 ? "s" : ""} activo${activos !== 1 ? "s" : ""} y <strong>${pendientes}</strong> pendiente${pendientes !== 1 ? "s" : ""}.`;
  if (listos > 0) {
    msg += ` Además tenés <strong>${listos}</strong> trabajo${listos !== 1 ? "s" : ""} listo${listos !== 1 ? "s" : ""} para entregar.`;
  }
  el.innerHTML = msg;
}

function getStatusClass(status) {
  if (status === "Activo")     return "sc-activo";
  if (status === "Finalizado") return "sc-finalizado";
  if (status === "Entregado")  return "sc-entregado";
  if (status === "Cancelado")  return "sc-cancelado";
  return "sc-espera";
}

function repairDeviceLabel(repair) {
  return `${repair.marca} ${repair.modelo}`.trim();
}

function truncateText(value, maxLength = 34) {
  const text = String(value || "").trim();
  if (!text) return "-";
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

function serviceTitle(repair) {
  return truncateText(repair.problema || "Servicio sin detallar", 36).toUpperCase();
}

function serviceDetail(repair) {
  return truncateText(repair.observaciones || repair.accesorios || repair.identificador || "Sin detalle adicional", 42);
}

function renderStats() {
  if (!waitingCount || !collectCount || !monthCount || !salesTotal || !monthDelta) return;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonth = repairs.filter((repair) => {
    const date = new Date(`${repair.fechaIngreso || repair.fechaEntrega}T00:00:00`);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const previousMonth = repairs.filter((repair) => {
    const date = new Date(`${repair.fechaIngreso || repair.fechaEntrega}T00:00:00`);
    const previous = new Date(currentYear, currentMonth - 1, 1);
    return date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear();
  });

  waitingCount.textContent = repairs.filter((repair) => repair.estado === "En espera").length;
  collectCount.textContent = repairs.filter((repair) => repair.estado === "Activo").length;
  monthCount.textContent = thisMonth.length;
  salesTotal.textContent = formatMoney(
    repairs
      .filter((r) => r.estado === "Entregado" && r.fechaEntregaReal && (() => {
        const d = new Date(`${r.fechaEntregaReal}T00:00:00`);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })())
      .reduce((sum, r) => sum + (r.cierre?.costoFinal || Number(r.costoAproximado || 0)), 0)
  );

  const delta = previousMonth.length
    ? Math.round(((thisMonth.length - previousMonth.length) / previousMonth.length) * 100)
    : thisMonth.length
      ? 100
      : 0;
  monthDelta.textContent = `${delta >= 0 ? "+" : ""}${delta}%`;
  monthDelta.className = delta >= 0 ? "delta up" : "delta down";

  // Sparkline bars — últimos 6 meses
  function last6MonthCounts(filterFn) {
    const result = [];
    const n = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(n.getFullYear(), n.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
      result.push(filterFn(key));
    }
    return result;
  }

  function renderSpark(id, values) {
    const el = document.getElementById(id);
    if (!el) return;
    const max = Math.max(...values, 1);
    const last = values.length - 1;
    el.innerHTML = values.map((v, i) => {
      const h = v === 0 ? 3 : Math.max(8, Math.round(v / max * 26));
      return `<i class="${i === last ? "hot" : ""}" style="height:${h}px"></i>`;
    }).join("");
  }

  // Card 3: reparaciones finalizadas por mes (últimos 6 meses)
  renderSpark("sparkMonth", last6MonthCounts(ym =>
    repairs.filter(r => (r.fechaIngreso||"").startsWith(ym) && (r.estado === "Finalizado" || r.estado === "Cancelado")).length
  ));

  // Card 4: ventas por mes — misma fuente que salesTotal (reparaciones entregadas, costoFinal)
  renderSpark("sparkSales", last6MonthCounts(ym =>
    repairs
      .filter(r => r.estado === "Entregado" && (r.fechaEntregaReal||"").startsWith(ym))
      .reduce((s, r) => s + (r.cierre?.costoFinal || Number(r.costoAproximado || 0)), 0)
  ));
}

function renderDashboardTable() {
  if (!dashboardTable) return;

  const latest = repairs.slice(0, 5);
  if (!latest.length) {
    dashboardTable.innerHTML = `<tr class="empty-row"><td colspan="5">No hay reparaciones para mostrar.</td></tr>`;
    return;
  }

  dashboardTable.innerHTML = latest
    .map(
      (repair) => `
        <tr class="clickable-row" data-edit-id="${repair.id}">
          <td class="cell-nro">#${repair.id}</td>
          <td>${escapeHtml(repair.cliente)}</td>
          <td>${escapeHtml(repairDeviceLabel(repair))}</td>
          <td><span class="pill ${getStatusClass(repair.estado)}">${escapeHtml(repair.estado)}</span></td>
          <td>${formatMoney(repair.costoAproximado)}</td>
        </tr>
      `
    )
    .join("");
}

const GROUP_ORDER = ["Activo", "En espera", "Finalizado", "Entregado", "Cancelado"];
const GROUP_LABELS = {
  "Activo":     "En reparacion",
  "En espera":  "Pendientes de inicio",
  "Finalizado": "Terminados — pendiente de retiro",
  "Entregado":  "Entregados al cliente",
  "Cancelado":  "Cancelados",
};

const LOCKED_STATES = ["Finalizado", "Entregado"];

function repairRow(repair) {
  const locked = LOCKED_STATES.includes(repair.estado);

  const entregaBtn = repair.estado === "Finalizado"
    ? `<button class="btn-icon deliver deliver-icon" data-id="${repair.id}" title="Marcar como entregado">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </button>`
    : "";
  const activarBtn = repair.estado === "En espera"
    ? `<button class="btn-icon ok activar-icon" data-id="${repair.id}" title="Pasar a Activo">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </button>`
    : "";
  const finalizarBtn = repair.estado === "Activo"
    ? `<button class="btn-icon ok finalizar-icon" data-id="${repair.id}" title="Finalizar reparación">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </button>`
    : "";
  return `
    <tr class="clickable-row" data-edit-id="${repair.id}">
      <td>
        <div class="cell-stack id-stack">
          <span class="cell-nro">#${repair.id}</span>
          <span class="cell-date">${formatDate(repair.fechaIngreso)}</span>
        </div>
      </td>
      <td>
        <div class="cell-stack">
          <strong>${escapeHtml(repair.cliente)}</strong>
          <span>${escapeHtml(repairDeviceLabel(repair))}</span>
        </div>
      </td>
      <td>
        <div class="cell-stack service-stack">
          <strong>${escapeHtml(serviceTitle(repair))}</strong>
          <span>${escapeHtml(serviceDetail(repair))}</span>
          ${(repair.cierre?.costoFinal || repair.costoAproximado) ? `<span class="cell-price">${formatMoney(repair.cierre?.costoFinal || repair.costoAproximado)}</span>` : ""}
        </div>
      </td>
      <td class="row-actions">
        <div class="row-actions-inner">
          ${activarBtn}${finalizarBtn}${entregaBtn}
          <button class="btn-icon del delete-icon" data-id="${repair.id}" title="Eliminar">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>`;
}

function groupHeaderRow(estado, count) {
  const sc = getStatusClass(estado);
  return `<tr class="grp">
    <td colspan="5">
      <span class="grp-head">
        <span class="pill ${sc}">${escapeHtml(estado)}</span>
        <span class="grp-count">${count}</span>
      </span>
    </td>
  </tr>`;
}

function renderTable() {
  if (!tableBody) return;

  const query  = searchInput  ? searchInput.value.trim().toLowerCase() : "";
  const status = statusFilter ? statusFilter.value : "todos";

  const filtered = repairs.filter((repair) => {
    const text = `${repair.cliente} ${repair.dispositivo} ${repair.marca} ${repair.modelo} ${repair.identificador}`.toLowerCase();
    return (!query || text.includes(query)) && (status === "todos" || repair.estado === status);
  });

  if (!filtered.length) {
    tableBody.innerHTML = `<tr class="empty-row"><td colspan="5">No hay reparaciones para mostrar.</td></tr>`;
    return;
  }

  const sorted = [...filtered].sort((a, b) => {
    const gi = (r) => GROUP_ORDER.indexOf(r.estado === "En espera" ? "En espera" : r.estado);
    if (gi(a) !== gi(b)) return gi(a) - gi(b);
    return (b.fechaIngreso || "").localeCompare(a.fechaIngreso || "");
  });

  if (status !== "todos") {
    tableBody.innerHTML = sorted.map(repairRow).join("");
    return;
  }

  let html = "";
  let currentGroup = null;
  sorted.forEach((repair) => {
    const g = repair.estado;
    if (g !== currentGroup) {
      const count = sorted.filter((r) => r.estado === g).length;
      html += groupHeaderRow(g, count);
      currentGroup = g;
    }
    html += repairRow(repair);
  });
  tableBody.innerHTML = html;
}

function renderLastTicket() {
  if (!lastTicket) return;

  const latest = repairs[0];
  if (!latest) {
    lastTicket.className = "empty-ticket";
    lastTicket.textContent = "Todavia no hay reparaciones cargadas.";
    return;
  }

  lastTicket.className = "ticket";
  lastTicket.innerHTML = `
    <strong>#${latest.id} - ${escapeHtml(latest.cliente)}</strong>
    <span>${escapeHtml(repairDeviceLabel(latest))}</span><br />
    <span>${escapeHtml(latest.identificador || "Sin IMEI/ESN/SN")}</span><br />
    <span class="status-pill ${getStatusClass(latest.estado)}">${escapeHtml(latest.estado)}</span>
    <p>${escapeHtml(latest.problema || "Sin descripcion del problema.")}</p>
    <p>${escapeHtml(latest.observaciones || "Sin observaciones adicionales.")}</p>
    ${latest.patronImagen ? `<img class="ticket-pattern" src="${latest.patronImagen}" alt="Patron de desbloqueo guardado" />` : ""}
    <b>${formatMoney(latest.costoAproximado)} - Anticipo ${formatMoney(latest.anticipo)}</b>
  `;
}

function renderAll() {
  renderStats();
  renderDashboardTable();
  renderTable();
  renderLastTicket();
  updateDashboardStatus();
}

function createRepair(formData) {
  const maxId = repairs.reduce((max, repair) => Math.max(max, Number(repair.id) || 0), 1000);
  return {
    id: maxId + 1,
    cliente: formData.get("cliente").trim(),
    dispositivo: formData.get("dispositivo"),
    marca: formData.get("marca").trim(),
    modelo: formData.get("modelo").trim(),
    identificador: formData.get("identificador").trim(),
    passwordDispositivo: formData.get("passwordDispositivo").trim(),
    patronImagen: formData.get("patronImagen"),
    patronSecuencia: formData.get("patronSecuencia"),
    gastos: [],
    accesorios: formData.get("accesorios").trim(),
    costoAproximado: Number(formData.get("costoAproximado") || 0),
    anticipo: Number(formData.get("anticipo") || 0),
    fechaEntrega: formData.get("fechaEntrega"),
    estado: "En espera",
    cierre: null,
    telefono: (formData.get("telefono") || "").trim(),
    problema: formData.get("problema").trim(),
    observaciones: formData.get("observaciones").trim(),
    fechaIngreso: today,
  };
}

function getRepairFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id"));
  return repairs.find((repair) => Number(repair.id) === id);
}

function fillFormFromRepair(targetForm, repair) {
  Object.entries(repair).forEach(([key, value]) => {
    const field = targetForm.elements[key];
    if (field) field.value = value ?? "";
  });
}

function formToRepair(formData, existing = {}) {
  return {
    ...existing,
    id: Number(formData.get("id") || existing.id),
    cliente: formData.get("cliente").trim(),
    dispositivo: formData.get("dispositivo"),
    marca: formData.get("marca").trim(),
    modelo: formData.get("modelo").trim(),
    identificador: formData.get("identificador").trim(),
    passwordDispositivo: formData.get("passwordDispositivo").trim(),
    patronImagen: formData.get("patronImagen"),
    patronSecuencia: formData.get("patronSecuencia"),
    gastos: parseExpensesJson(formData.get("gastosJson")),
    accesorios: formData.get("accesorios").trim(),
    costoAproximado: Number(formData.get("costoAproximado") || 0),
    anticipo: Number(formData.get("anticipo") || 0),
    fechaEntrega: formData.get("fechaEntrega"),
    estado: formData.get("estado"),
    cierre: ["Finalizado", "Entregado"].includes(formData.get("estado")) ? (existing.cierre || null) : null,
    problema: formData.get("problema").trim(),
    observaciones: formData.get("observaciones").trim(),
    fechaIngreso: formData.get("fechaIngreso") || existing.fechaIngreso || today,
    telefono: (formData.get("telefono") || "").trim(),
  };
}

function parseExpensesJson(value) {
  if (!value) return [];

  try {
    return normalizeExpenses(JSON.parse(value));
  } catch {
    return [];
  }
}

function syncExpensesInput() {
  if (gastosJsonInput) gastosJsonInput.value = JSON.stringify(editingExpenses);
}

function getEditRepairPreview() {
  const repair = getRepairFromUrl();
  if (!repair) return null;

  return {
    ...repair,
    costoAproximado: Number(editForm?.elements.costoAproximado?.value || repair.costoAproximado || 0),
    passwordDispositivo: editForm?.elements.passwordDispositivo?.value || repair.passwordDispositivo || "",
    gastos: editingExpenses,
  };
}

function renderExpensesTable(repair) {
  if (!expensesTable) return;

  const totalGastos = expensesTotal(editingExpenses);
  const costoReparacion = Number(repair?.cierre?.costoFinal || repair?.costoAproximado || 0);

  if (repairIncomeTotal) repairIncomeTotal.textContent = formatMoney(costoReparacion);
  if (expensesGrandTotal) expensesGrandTotal.textContent = formatMoney(totalGastos);
  if (profitTotal) {
    const profit = costoReparacion - totalGastos;
    profitTotal.textContent = formatMoney(profit);
    profitTotal.classList.toggle("negative", profit < 0);
  }

  syncExpensesInput();

  if (!editingExpenses.length) {
    expensesTable.innerHTML = `<tr class="empty-row"><td colspan="5">Todavia no hay gastos registrados.</td></tr>`;
    return;
  }

  expensesTable.innerHTML = editingExpenses
    .map(
      (expense) => `
        <tr>
          <td>${escapeHtml(expense.concepto)}</td>
          <td>${formatMoney(expense.montoUnitario)}</td>
          <td>${escapeHtml(expense.cantidad)}</td>
          <td><strong>${formatMoney(expense.total)}</strong></td>
          <td><button class="danger-button small-button" type="button" data-delete-expense="${expense.id}">Borrar</button></td>
        </tr>
      `
    )
    .join("");
}

function updateExpenseTotalPreview() {
  const totalEl = $("#expenseTotal");
  const qty = Number($("#expenseQuantity")?.value || 0);
  const price = expenseMode === "inv"
    ? Number($("#expInvPrice")?.value || 0)
    : Number($("#expenseUnitPrice")?.value || 0);
  if (totalEl) totalEl.value = formatMoney(price * qty);
}

let expenseMode = "free"; // "free" | "inv"

function openExpenseModal() {
  if (!expenseModal || !expenseForm) return;
  expenseForm.reset();
  if (expenseQuantity) expenseQuantity.value = 1;

  // reset al modo libre
  expenseMode = "free";
  const btnFree = $("#expTypeFree");
  const btnInv  = $("#expTypeInv");
  const freeFields = $("#expFreeFields");
  const invFields  = $("#expInvFields");
  if (btnFree)   { btnFree.classList.add("active");    btnInv.classList.remove("active"); }
  if (freeFields) freeFields.style.display = "";
  if (invFields)  invFields.style.display  = "none";

  // popular select de inventario
  const sel = $("#expInvSelect");
  if (sel) {
    sel.innerHTML = `<option value="">Seleccionar…</option>`;
    inventario
      .filter((i) => i.stock > 0)
      .forEach((i) => {
        const opt = document.createElement("option");
        opt.value = i.id;
        opt.dataset.precio = i.precioCosto;
        opt.dataset.nombre = i.nombre;
        opt.textContent = `${i.nombre} — stock: ${i.stock}`;
        sel.appendChild(opt);
      });
  }

  updateExpenseTotalPreview();
  expenseModal.classList.add("open");
  expenseModal.setAttribute("aria-hidden", "false");
}

function closeExpenseModal() {
  if (!expenseModal) return;
  expenseModal.classList.remove("open");
  expenseModal.setAttribute("aria-hidden", "true");
}

function getFinalCostValue() {
  return Number(finishFinalCost?.value || 0);
}

function updateFinishProfit() {
  if (!finishProfit) return;
  const totalGastos = expensesTotal(editingExpenses);
  finishProfit.value = formatMoney(getFinalCostValue() - totalGastos);
}

function openFinishModal() {
  if (!finishModal || !finishForm) return;
  const repair = getEditRepairPreview();
  if (!repair) return;

  const totalGastos = expensesTotal(editingExpenses);
  finishForm.reset();
  if (finishInitialCost) finishInitialCost.value = formatMoney(repair.costoAproximado);
  if (finishExpenses) finishExpenses.value = formatMoney(totalGastos);
  if (finishFinalCost) finishFinalCost.value = repair.cierre?.costoFinal || "";
  if (finishSolution) finishSolution.value = repair.cierre?.solucionFinal || "";
  updateFinishProfit();
  finishModal.classList.add("open");
  finishModal.setAttribute("aria-hidden", "false");
}

function closeFinishModal() {
  if (!finishModal) return;
  finishModal.classList.remove("open");
  finishModal.setAttribute("aria-hidden", "true");
}

function renderEditSummary(repair) {
  if (!editSummary) return;

  if (!repair) {
    editSummary.className = "empty-ticket";
    editSummary.textContent = "No se encontro la reparacion.";
    return;
  }

  editSummary.className = "ticket";
  editSummary.innerHTML = `
    <strong>#${repair.id} - ${escapeHtml(repair.cliente)}</strong>
    <span>${escapeHtml(repairDeviceLabel(repair))}</span><br />
    <span class="pill ${getStatusClass(repair.estado)}">${escapeHtml(repair.estado)}</span>
    <div class="secret-block">
      <span>Contrasena</span>
      <b>${escapeHtml(repair.passwordDispositivo || "Sin contrasena cargada")}</b>
    </div>
    <div class="secret-block">
      <span>Gastos</span>
      <b>${formatMoney(expensesTotal(repair.gastos || []))}</b>
    </div>
    ${repair.patronImagen ? `<img class="ticket-pattern" src="${repair.patronImagen}" alt="Patron de desbloqueo guardado" />` : ""}
    <p>${escapeHtml(repair.problema || "Sin descripcion del problema.")}</p>
  `;
}

function renderSavedPatternPreview(image) {
  if (!savedPatternPreview) return;

  if (!image) {
    savedPatternPreview.innerHTML = `<span>No hay patron guardado.</span>`;
    return;
  }

  savedPatternPreview.innerHTML = `
    <span>Patron guardado</span>
    <img src="${image}" alt="Patron de desbloqueo guardado" />
  `;
}

async function setupEditForm() {
  if (!editForm) return;

  const params = new URLSearchParams(window.location.search);
  const editId = Number(params.get("id"));
  if (!editId) {
    editForm.innerHTML = `<div class="empty-ticket wide">No se encontró la reparación seleccionada.</div>`;
    renderEditSummary(null);
    return;
  }

  // Cargar directo desde DB para tener siempre los datos más frescos (fotos, etc.)
  const fresh = await dbLoadOne(editId);
  let repair = fresh || getRepairFromUrl();
  if (!repair) {
    editForm.innerHTML = `<div class="empty-ticket wide">No se encontró la reparación seleccionada.</div>`;
    renderEditSummary(null);
    return;
  }

  // Sincronizar el array local con los datos frescos
  const idx = repairs.findIndex(r => Number(r.id) === Number(repair.id));
  if (idx !== -1) repairs[idx] = repair;

  console.log("[fotos] repair.fotos al abrir edición:", JSON.stringify(repair.fotos));

  fillFormFromRepair(editForm, repair);
  editingExpenses = [...(repair.gastos || [])];
  if (editTitle) editTitle.innerHTML = `<strong>#${repair.id}</strong> &mdash; ${escapeHtml(repair.marca)} ${escapeHtml(repair.modelo)}`;

  const enableEditButton = $("#enableEditButton");
  const saveEditButton   = $("#saveEditButton");

  if (LOCKED_STATES.includes(repair.estado)) {
    if (openFinishModalButton) openFinishModalButton.style.display = "none";
    if (saveEditButton) saveEditButton.style.display = "none";
    if (enableEditButton) enableEditButton.style.display = "";

    const fields = editForm.querySelectorAll("input, select, textarea, button[data-delete-expense], #openExpenseModalButton");
    fields.forEach(f => f.disabled = true);

    if (enableEditButton) {
      enableEditButton.addEventListener("click", () => {
        fields.forEach(f => f.disabled = false);
        if (saveEditButton) saveEditButton.style.display = "";
        enableEditButton.style.display = "none";
      });
    }
  }
  renderEditSummary(repair);
  renderSavedPatternPreview(repair.patronImagen);
  renderExpensesTable(repair);
  let fotosEdit = setupFotosEdit(repair);

  if (editForm.elements.costoAproximado) {
    editForm.elements.costoAproximado.addEventListener("input", () => {
      renderExpensesTable(getEditRepairPreview());
    });
  }

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncExpensesInput();
    const updatedRepair = formToRepair(new FormData(editForm), repair);

    // si se está cancelando, preguntar por reposición de stock
    if (updatedRepair.estado === "Cancelado" && repair.estado !== "Cancelado") {
      await restoreStockForExpenses(editingExpenses);
      await dbDeleteMovimientosByReparacion(repair.id);
      movimientos = movimientos.filter(m => m.reparacionId !== repair.id);
    }

    const sections = ["recepcion", "reparacion", "entrega"];
    const currentFotos = { recepcion: [], reparacion: [], entrega: [] };

    if (fotosEdit) {
      for (const sec of sections) {
        const mgr = fotosEdit[sec];
        if (!mgr) { currentFotos[sec] = updatedRepair.fotos?.[sec] || []; continue; }
        const newUrls = mgr.getFiles().length
          ? await dbUploadFotos(repair.id, mgr.getFiles())
          : [];
        currentFotos[sec] = [...mgr.getSavedUrls(), ...newUrls];
      }
    } else {
      sections.forEach((s) => { currentFotos[s] = updatedRepair.fotos?.[s] || []; });
    }

    updatedRepair.fotos = currentFotos;
    await dbUpsert(updatedRepair);
    await dbUpdateFotos(updatedRepair.id, currentFotos);

    if (updatedRepair.estado !== "Cancelado") {
      const antMov = await dbSyncAnticipoMovimiento(updatedRepair);
      movimientos = movimientos.filter(m => !(m.reparacionId === updatedRepair.id && m.categoria === "Anticipo"));
      if (antMov) movimientos = [antMov, ...movimientos];
    }

    repairs = repairs.map((item) => (Number(item.id) === Number(updatedRepair.id) ? updatedRepair : item));
    window.location.href = "reparaciones.html";
  });

  const requestPatternButton = $("#requestPatternButton");
  if (requestPatternButton) {
    requestPatternButton.addEventListener("click", () => {
      const current = getRepairFromUrl();
      if (!current?.telefono) {
        alert("Esta reparacion no tiene numero de WhatsApp cargado.");
        return;
      }
      sendWhatsAppPattern(current);
    });
  }

  const notifyClientButton = $("#notifyClientButton");
  if (notifyClientButton) {
    notifyClientButton.addEventListener("click", () => {
      const current = getRepairFromUrl();
      if (!current?.telefono) {
        alert("Esta reparacion no tiene numero de WhatsApp cargado.");
        return;
      }
      sendWhatsAppStatus(current);
    });
  }
}

async function restoreStockForExpenses(expenses) {
  const invExpenses = expenses.filter((e) => e.inventarioId);
  for (const e of invExpenses) {
    const item = inventario.find((i) => i.id === e.inventarioId);
    if (!item) continue;
    const reponer = confirm(`¿Reponer ${e.cantidad} unidad(es) de "${item.nombre}" al stock?\n\nStock actual: ${item.stock}`);
    if (reponer) {
      item.stock += e.cantidad;
      await dbUpsertItem(item);
    }
  }
}

async function syncGastosMovimientoLocal(repair) {
  if (!repair?.id) return;
  const repairWithExpenses = { ...repair, gastos: editingExpenses };
  const saved = await dbSyncGastosMovimientos(repairWithExpenses);
  movimientos = movimientos.filter(m => !(m.reparacionId === repair.id && m.categoria === "Gasto de reparación"));
  movimientos = [...saved, ...movimientos];
}

function setupExpenses() {
  if (!expensesTable && !expenseModal) return;

  if (openExpenseModalButton) openExpenseModalButton.addEventListener("click", openExpenseModal);
  if (closeExpenseModalButton) closeExpenseModalButton.addEventListener("click", closeExpenseModal);
  if (cancelExpenseModalButton) cancelExpenseModalButton.addEventListener("click", closeExpenseModal);
  if (expenseQuantity) expenseQuantity.addEventListener("input", updateExpenseTotalPreview);

  // toggle libre / inventario
  $("#expTypeFree")?.addEventListener("click", () => {
    expenseMode = "free";
    $("#expTypeFree").classList.add("active");
    $("#expTypeInv").classList.remove("active");
    $("#expFreeFields").style.display = "";
    $("#expInvFields").style.display  = "none";
    updateExpenseTotalPreview();
  });

  $("#expTypeInv")?.addEventListener("click", () => {
    expenseMode = "inv";
    $("#expTypeInv").classList.add("active");
    $("#expTypeFree").classList.remove("active");
    $("#expFreeFields").style.display = "none";
    $("#expInvFields").style.display  = "";
    updateExpenseTotalPreview();
  });

  // al elegir ítem del inventario, precargar precio
  $("#expInvSelect")?.addEventListener("change", () => {
    const sel = $("#expInvSelect");
    const opt = sel.selectedOptions[0];
    const priceInput = $("#expInvPrice");
    if (opt?.dataset.precio && priceInput) {
      priceInput.value = opt.dataset.precio;
    } else if (priceInput) {
      priceInput.value = "";
    }
    updateExpenseTotalPreview();
  });

  $("#expInvPrice")?.addEventListener("input", updateExpenseTotalPreview);
  $("#expenseUnitPrice")?.addEventListener("input", updateExpenseTotalPreview);

  if (expenseModal) {
    expenseModal.addEventListener("click", (event) => {
      if (event.target === expenseModal) closeExpenseModal();
    });
  }

  if (expenseForm) {
    expenseForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const cantidad = Number($("#expenseQuantity")?.value || 0);

      if (expenseMode === "inv") {
        const sel = $("#expInvSelect");
        const invId = Number(sel?.value);
        const opt = sel?.selectedOptions[0];
        if (!invId || !opt) { alert("Seleccioná un ítem del inventario."); return; }

        const item = inventario.find((i) => i.id === invId);
        if (!item) return;
        if (cantidad > item.stock) {
          alert(`Stock insuficiente. Tenés ${item.stock} unidad(es) de "${item.nombre}".`);
          return;
        }

        const montoUnitario = Number($("#expInvPrice")?.value || item.precioCosto);

        editingExpenses = [...editingExpenses, {
          id: Date.now(),
          fecha: today,
          concepto: item.nombre,
          montoUnitario,
          cantidad,
          total: montoUnitario * cantidad,
          inventarioId: item.id,
        }];

        // descontar stock inmediatamente
        item.stock -= cantidad;
        await dbUpsertItem(item);

      } else {
        const concepto = $("#expConcepto")?.value.trim();
        const montoUnitario = Number($("#expenseUnitPrice")?.value || 0);
        if (!concepto) { alert("Ingresá el concepto del gasto."); return; }

        editingExpenses = [...editingExpenses, {
          id: Date.now(),
          fecha: today,
          concepto,
          montoUnitario,
          cantidad,
          total: montoUnitario * cantidad,
        }];
      }

      const repair = getEditRepairPreview();
      renderExpensesTable(repair);
      renderEditSummary(repair);
      await syncGastosMovimientoLocal(repair);
      closeExpenseModal();
    });
  }

  if (expensesTable) {
    expensesTable.addEventListener("click", async (event) => {
      const button = event.target.closest("[data-delete-expense]");
      if (!button) return;
      const id = Number(button.dataset.deleteExpense);
      const expense = editingExpenses.find((e) => Number(e.id) === id);

      if (expense?.inventarioId) {
        const item = inventario.find((i) => i.id === expense.inventarioId);
        if (item) {
          const reponer = confirm(`¿Reponer ${expense.cantidad} unidad(es) de "${item.nombre}" al stock?\n\nStock actual: ${item.stock}`);
          if (reponer) {
            item.stock += expense.cantidad;
            await dbUpsertItem(item);
          }
        }
      }

      editingExpenses = editingExpenses.filter((e) => Number(e.id) !== id);
      const repair = getEditRepairPreview();
      renderExpensesTable(repair);
      renderEditSummary(repair);
      await syncGastosMovimientoLocal(repair);
    });
  }
}

function setupFinishFlow() {
  if (!finishModal && !finishForm) return;

  if (openFinishModalButton) openFinishModalButton.addEventListener("click", openFinishModal);
  if (closeFinishModalButton) closeFinishModalButton.addEventListener("click", closeFinishModal);
  if (cancelFinishModalButton) cancelFinishModalButton.addEventListener("click", closeFinishModal);
  if (finishFinalCost) finishFinalCost.addEventListener("input", updateFinishProfit);

  if (finishModal) {
    finishModal.addEventListener("click", (event) => {
      if (event.target === finishModal) closeFinishModal();
    });
  }

  if (finishForm) {
    finishForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const repair = getRepairFromUrl();
      if (!repair) return;

      syncExpensesInput();
      const baseRepair = formToRepair(new FormData(editForm), repair);
      const totalGastos = expensesTotal(editingExpenses);
      const costoFinal = getFinalCostValue();
      const finalizedRepair = {
        ...baseRepair,
        estado: "Finalizado",
        cierre: {
          costoInicial: Number(baseRepair.costoAproximado || 0),
          gastos: totalGastos,
          costoFinal,
          solucionFinal: finishSolution.value.trim(),
          ganancia: costoFinal - totalGastos,
          fechaFinalizacion: today,
        },
      };

      await dbUpsert(finalizedRepair);
      repairs = repairs.map((item) => (Number(item.id) === Number(finalizedRepair.id) ? finalizedRepair : item));

      closeFinishModal();

      if (finalizedRepair.telefono) {
        const notifyModal = $("#notifyModal");
        if (notifyModal) {
          notifyModal.classList.add("open");
          notifyModal.setAttribute("aria-hidden", "false");
          const redirect = () => { window.location.href = "reparaciones.html"; };
          $("#notifyYes").onclick = () => { sendWhatsAppFinished(finalizedRepair); redirect(); };
          $("#notifyNo").onclick = redirect;
        } else {
          window.location.href = "reparaciones.html";
        }
      } else {
        window.location.href = "reparaciones.html";
      }
    });
  }
}

function setupPatternCanvas() {
  if (!patternCanvas || !patternImageInput || !patternSequenceInput) return;

  const context = patternCanvas.getContext("2d");
  const size = patternCanvas.width;
  const gap = size / 4;
  const nodes = Array.from({ length: 9 }, (_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    return {
      id: index + 1,
      x: gap * (column + 1),
      y: gap * (row + 1),
    };
  });

  let selected = [];
  let drawing = false;
  let pointer = null;

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawBackground() {
    context.clearRect(0, 0, size, size);
    context.fillStyle = cssVar("--bg-2") || "#1e1e1e";
    context.fillRect(0, 0, size, size);
  }

  function drawPattern() {
    drawBackground();
    const accent = cssVar("--accent") || "#84cc16";
    const line2  = cssVar("--line-2") || "#333";
    const text3  = cssVar("--text-3") || "#666";
    const accentInk = cssVar("--accent-ink") || "#1a1a1a";

    if (selected.length) {
      context.beginPath();
      selected.forEach((node, index) => {
        if (index === 0) context.moveTo(node.x, node.y);
        else context.lineTo(node.x, node.y);
      });

      if (drawing && pointer) {
        context.lineTo(pointer.x, pointer.y);
      }

      context.strokeStyle = accent;
      context.lineWidth = 8;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.globalAlpha = 0.7;
      context.stroke();
      context.globalAlpha = 1;
    }

    nodes.forEach((node) => {
      const order = selected.findIndex((item) => item.id === node.id);
      const isSelected = order !== -1;
      context.beginPath();
      context.arc(node.x, node.y, 18, 0, Math.PI * 2);
      context.fillStyle = isSelected ? accent : (cssVar("--bg-1") || "#141414");
      context.fill();
      context.lineWidth = isSelected ? 0 : 2;
      context.strokeStyle = line2;
      if (!isSelected) context.stroke();

      if (isSelected) {
        context.font = "bold 13px 'Space Grotesk', sans-serif";
        context.fillStyle = accentInk;
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(String(order + 1), node.x, node.y);
      } else {
        context.beginPath();
        context.arc(node.x, node.y, 4, 0, Math.PI * 2);
        context.fillStyle = text3;
        context.fill();
      }
    });
  }

  function getPointerPosition(event) {
    const rect = patternCanvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * size,
      y: ((event.clientY - rect.top) / rect.height) * size,
    };
  }

  function addNodeAt(point) {
    const node = nodes.find((item) => {
      const distance = Math.hypot(item.x - point.x, item.y - point.y);
      return distance <= 28 && !selected.some((selectedNode) => selectedNode.id === item.id);
    });

    if (node) selected.push(node);
  }

  function savePatternImage() {
    if (!selected.length) {
      patternImageInput.value = "";
      patternSequenceInput.value = "";
      return;
    }

    pointer = null;
    drawPattern();
    patternImageInput.value = patternCanvas.toDataURL("image/png");
    patternSequenceInput.value = selected.map((node) => node.id).join("-");
    renderSavedPatternPreview(patternImageInput.value);
  }

  function startDrawing(event) {
    event.preventDefault();
    selected = [];
    drawing = true;
    pointer = getPointerPosition(event);
    addNodeAt(pointer);
    drawPattern();
  }

  function moveDrawing(event) {
    if (!drawing) return;
    event.preventDefault();
    pointer = getPointerPosition(event);
    addNodeAt(pointer);
    drawPattern();
  }

  function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    savePatternImage();
  }

  function clearPattern() {
    selected = [];
    drawing = false;
    pointer = null;
    patternImageInput.value = "";
    patternSequenceInput.value = "";
    renderSavedPatternPreview("");
    drawPattern();
  }

  patternCanvas.addEventListener("pointerdown", startDrawing);
  patternCanvas.addEventListener("pointermove", moveDrawing);
  patternCanvas.addEventListener("pointerup", stopDrawing);
  patternCanvas.addEventListener("pointerleave", stopDrawing);
  patternCanvas.addEventListener("pointercancel", stopDrawing);

  if (clearPatternButton) clearPatternButton.addEventListener("click", () => {
    if (!selected.length || confirm("¿Borrar el patron dibujado?")) clearPattern();
  });
  if (form) form.addEventListener("reset", () => { console.log("[form] reset disparado"); window.setTimeout(clearPattern, 0); });

  drawPattern();
}

function formatPhoneForWhatsApp(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "54" + digits.slice(1);
  if (digits.length === 10) return "54" + digits;
  return digits;
}

function sendWhatsAppFinished(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  const costoFinal = repair.cierre?.costoFinal || repair.costoAproximado || 0;
  const anticipo = repair.anticipo || 0;
  const saldo = costoFinal - anticipo;
  const precioLines = [
    `Costo total: ${formatMoney(costoFinal)}`,
    ...(anticipo > 0 ? [`Anticipo: ${formatMoney(anticipo)}`, `Saldo a pagar: ${formatMoney(saldo)}`] : []),
  ];
  const lines = [
    `*1Fixtrack!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Tu equipo esta listo para retirar.`,
    ``,
    `Orden: #${repair.id}`,
    `Equipo: ${repair.marca} ${repair.modelo}`,
    ``,
    ...precioLines,
    ``,
    `Podes ver el detalle aca:`,
    orderUrl,
    ``,
    `Te esperamos!`,
  ].join("\n");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
}

function sendWhatsAppStatus(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  const lines = [
    `*1Fixtrack!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Actualizacion de tu equipo:`,
    ``,
    `Orden: #${repair.id}`,
    `Equipo: ${repair.marca} ${repair.modelo}`,
    `Estado: ${repair.estado}`,
    ``,
    `Podes ver tu orden aca:`,
    orderUrl,
    ``,
    `Cualquier consulta, escribinos.`,
  ].join("\n");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
}

function sendWhatsAppPattern(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const patronUrl = `${window.location.origin}/patron.html?id=${repair.id}`;
  const lines = [
    `*1Fixtrack!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Para avanzar con la reparación de tu ${repair.marca} ${repair.modelo}, necesitamos el código de desbloqueo del equipo.`,
    ``,
    `Podés completarlo desde este enlace (solo tarda un momento):`,
    patronUrl,
    ``,
    `¡Muchas gracias!`,
  ].join("\n");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
}

function sendWhatsAppOrder(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  const lines = [
    `*1Fixtrack!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Tu equipo fue recibido en 1Fixtrack!.`,
    ``,
    `Orden: #${repair.id}`,
    `Equipo: ${repair.marca} ${repair.modelo}`,
    ``,
    `Podes ver y descargar tu orden aca:`,
    orderUrl,
    ``,
    `Te avisamos cuando tengamos novedades.`,
  ].join("\n");
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(lines)}`, "_blank");
}

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const sel = $("#clienteSelect");
    if (sel) {
      if (!sel.value) { alert("Seleccioná un cliente o elegí '+ Nuevo cliente'."); return; }

      if (sel.value === "__nuevo__") {
        const nombre = ($("#nuevoNombre")?.value || "").trim();
        if (!nombre) { alert("El nombre del cliente es obligatorio."); return; }
        const saved = await dbInsertCliente({
          nombre,
          telefono: ($("#nuevoTelefono")?.value || "").trim(),
          correo:   ($("#nuevoCorreo")?.value  || "").trim(),
          direccion:($("#nuevoDireccion")?.value || "").trim(),
        });
        if (!saved) { alert("No se pudo guardar el cliente. Revisá la conexión."); return; }
        $("#hiddenCliente").value = saved.nombre;
        $("#hiddenTelefono").value = saved.telefono;

        const opt = document.createElement("option");
        opt.value = saved.id;
        opt.dataset.nombre = saved.nombre;
        opt.dataset.telefono = saved.telefono;
        opt.textContent = saved.nombre;
        sel.insertBefore(opt, sel.querySelector('option[value="__nuevo__"]'));
      }
    }

    // Preguntar WhatsApp ANTES de los awaits — los navegadores bloquean window.open() después de async
    let repair = createRepair(new FormData(form));
    const doWhatsApp = repair.telefono
      ? confirm(`¿Enviar WhatsApp a ${repair.cliente} con los datos de la orden?`)
      : false;

    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Guardando..."; }

    const saved = await dbInsert(repair);
    if (saved) {
      repair = saved;
      if (repair.anticipo > 0) {
        const antMov = await dbSyncAnticipoMovimiento(repair);
        if (antMov) movimientos = [antMov, ...movimientos];
      }
    }

    const files = fotosManager ? fotosManager.getFiles() : [];
    if (files.length) {
      if (submitBtn) submitBtn.textContent = `Subiendo fotos (0/${files.length})...`;
      const urls = await dbUploadFotos(repair.id, files);
      console.log("[fotos] URLs subidas:", urls);
      if (urls.length) {
        const fotosNuevas = { recepcion: urls, reparacion: [], entrega: [] };
        const savedFotos = await dbUpdateFotos(repair.id, fotosNuevas);
        repair.fotos = savedFotos || fotosNuevas;
      }
    }

    repairs = [repair, ...repairs];
    form.reset();
    if (sel) { sel.value = ""; $("#nuevoClienteFields").style.display = "none"; }
    renderAll();
    if (doWhatsApp) sendWhatsAppOrder(repair);
    window.location.href = "reparaciones.html";
  });
}

setupExpenses();
setupFinishFlow();

if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);

if (tableBody) {
  tableBody.addEventListener("click", async (event) => {
    const delBtn = event.target.closest(".delete-icon");
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const repair = repairs.find((r) => Number(r.id) === id);
      const label = repair ? `#${repair.id} — ${repair.cliente}` : `#${id}`;
      if (!confirm(`¿Eliminar la reparacion ${label}?\n\nEsta accion no se puede deshacer.`)) return;
      await dbDelete(id);
      repairs = repairs.filter((r) => Number(r.id) !== id);
      renderAll();
      return;
    }

    const activarBtn = event.target.closest(".activar-icon");
    if (activarBtn) {
      event.preventDefault();
      event.stopPropagation();
      const id = Number(activarBtn.dataset.id);
      const repair = repairs.find((r) => Number(r.id) === id);
      if (!repair) return;
      if (!confirm(`¿Pasar #${repair.id} — ${repair.cliente} a Activo?`)) return;
      repair.estado = "Activo";
      await dbUpsert(repair);
      renderAll();
      return;
    }

    const finalizarBtn = event.target.closest(".finalizar-icon");
    if (finalizarBtn) {
      event.preventDefault();
      event.stopPropagation();
      const id = Number(finalizarBtn.dataset.id);
      const repair = repairs.find((r) => Number(r.id) === id);
      if (!repair) return;
      openQuickFinishModal(repair);
      return;
    }

    const deliverBtn = event.target.closest(".deliver-icon");
    if (deliverBtn) {
      event.preventDefault();
      event.stopPropagation();
      const id = Number(deliverBtn.dataset.id);
      const modal = $("#deliverModal");
      const dateInput = $("#deliverDateInput");
      if (!modal || !dateInput) return;
      dateInput.value = today;
      modal.dataset.repairId = id;
      modal.style.display = "flex";
      return;
    }

    const row = event.target.closest(".clickable-row");
    if (row && row.dataset.editId) {
      window.location.href = `editar-reparacion.html?id=${row.dataset.editId}`;
    }
  });
}

// ── Modal cierre rápido (desde lista) ────────────────────
const quickFinishModal       = $("#quickFinishModal");
const quickFinishForm        = $("#quickFinishForm");
const quickFinishCosto       = $("#quickFinishCosto");
const quickFinishSolucion    = $("#quickFinishSolucion");
const quickFinishGanancia    = $("#quickFinishGanancia");
const quickFinishGastosTotal = $("#quickFinishGastosTotal");
const quickFinishBody        = $("#quickFinishExpensesBody");
const quickFinishSubtitle    = $("#quickFinishSubtitle");

function closeQuickFinish() {
  if (quickFinishModal) quickFinishModal.style.display = "none";
}

function openQuickFinishModal(repair) {
  if (!quickFinishModal) return;

  quickFinishModal.dataset.repairId = repair.id;

  if (quickFinishSubtitle)
    quickFinishSubtitle.textContent = `#${repair.id} — ${repair.cliente} · ${repair.marca} ${repair.modelo}`;

  const gastos = repair.gastos || [];
  const totalGastos = expensesTotal(gastos);

  if (quickFinishBody) {
    quickFinishBody.innerHTML = gastos.length
      ? gastos.map(g => `
          <tr>
            <td style="padding:4px 8px">${escapeHtml(g.concepto)}</td>
            <td style="text-align:right;padding:4px 8px">${formatMoney(g.montoUnitario)}</td>
            <td style="text-align:center;padding:4px 8px">${g.cantidad}</td>
            <td style="text-align:right;padding:4px 8px"><strong>${formatMoney(g.total)}</strong></td>
          </tr>`).join("")
      : `<tr><td colspan="4" style="padding:8px;color:#94a3b8;font-size:13px">Sin gastos registrados.</td></tr>`;
  }
  if (quickFinishGastosTotal) quickFinishGastosTotal.textContent = formatMoney(totalGastos);

  const costoInicial = repair.costoAproximado || 0;
  if (quickFinishCosto) quickFinishCosto.value = costoInicial || "";
  if (quickFinishSolucion) quickFinishSolucion.value = "";
  if (quickFinishGanancia) quickFinishGanancia.textContent = formatMoney((costoInicial || 0) - totalGastos);

  quickFinishModal.style.display = "flex";
}

function updateQuickFinishGanancia() {
  if (!quickFinishGanancia || !quickFinishGastosTotal) return;
  const id = Number(quickFinishModal?.dataset.repairId);
  const repair = repairs.find(r => Number(r.id) === id);
  const totalGastos = expensesTotal(repair?.gastos || []);
  quickFinishGanancia.textContent = formatMoney(Number(quickFinishCosto?.value || 0) - totalGastos);
}

if (quickFinishCosto) quickFinishCosto.addEventListener("input", updateQuickFinishGanancia);
if ($("#closeQuickFinishModal")) $("#closeQuickFinishModal").addEventListener("click", closeQuickFinish);
if ($("#cancelQuickFinishModal")) $("#cancelQuickFinishModal").addEventListener("click", closeQuickFinish);
if (quickFinishModal) quickFinishModal.addEventListener("click", e => { if (e.target === quickFinishModal) closeQuickFinish(); });

if (quickFinishForm) {
  quickFinishForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number(quickFinishModal.dataset.repairId);
    const repair = repairs.find(r => Number(r.id) === id);
    if (!repair) return;

    const costoFinal = Number(quickFinishCosto.value || 0);
    const totalGastos = expensesTotal(repair.gastos || []);

    repair.estado = "Finalizado";
    repair.cierre = {
      costoInicial: Number(repair.costoAproximado || 0),
      gastos: totalGastos,
      costoFinal,
      solucionFinal: quickFinishSolucion?.value.trim() || "",
      ganancia: costoFinal - totalGastos,
      fechaFinalizacion: today,
    };

    await dbUpsert(repair);
    repairs = repairs.map(r => Number(r.id) === id ? repair : r);
    closeQuickFinish();
    renderAll();
  });
}

// ── Modal entrega ─────────────────────────────────────────
const deliverModal = $("#deliverModal");
const deliverForm  = $("#deliverForm");
const closeDeliverModal  = $("#closeDeliverModal");
const cancelDeliverModal = $("#cancelDeliverModal");

function closeDeliver() {
  if (deliverModal) deliverModal.style.display = "none";
}

if (closeDeliverModal)  closeDeliverModal.addEventListener("click", closeDeliver);
if (cancelDeliverModal) cancelDeliverModal.addEventListener("click", closeDeliver);
if (deliverModal) deliverModal.addEventListener("click", (e) => { if (e.target === deliverModal) closeDeliver(); });

if (deliverForm) {
  deliverForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number(deliverModal.dataset.repairId);
    const fechaEntregaReal = $("#deliverDateInput").value;
    const repair = repairs.find((r) => Number(r.id) === id);
    if (!repair) return;
    repair.estado = "Entregado";
    repair.fechaEntregaReal = fechaEntregaReal;
    await dbUpsert(repair);

    const entregaMov = await dbSyncEntregaMovimiento(repair);
    movimientos = movimientos.filter(m => !(m.reparacionId === repair.id && m.categoria === "Reparación"));
    if (entregaMov) movimientos = [entregaMov, ...movimientos];

    closeDeliver();
    renderAll();
  });
}

// drawer handled by shell.js via #menuBtn

function openLightbox(url) {
  let lb = document.getElementById("lightbox");
  if (!lb) {
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.className = "lightbox hidden";
    lb.innerHTML = `
      <div class="lightbox-bar">
        <a class="lightbox-btn" id="lbDownload" download>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Descargar
        </a>
        <button class="lightbox-btn" id="lbClose">✕ Cerrar</button>
      </div>
      <img id="lbImg" src="" alt="Foto" />`;
    document.body.appendChild(lb);
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    document.getElementById("lbClose").addEventListener("click", closeLightbox);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLightbox(); });
  }
  document.getElementById("lbImg").src = url;
  const dl = document.getElementById("lbDownload");
  dl.href = url;
  dl.download = url.split("/").pop();
  lb.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  const lb = document.getElementById("lightbox");
  if (lb) lb.classList.add("hidden");
  document.body.style.overflow = "";
}

function createFotoSection(gridId, inputId, metaId, existingUrls = [], onDeleteExisting = null, inputIdExtra = null) {
  const grid  = $(`#${gridId}`);
  const input = $(`#${inputId}`);
  const inputExtra = inputIdExtra ? $(`#${inputIdExtra}`) : null;
  const meta  = $(`#${metaId}`);
  if (!grid || !input) return null;

  let pendingFiles = [];
  let savedUrls = [...existingUrls];
  console.log(`[fotos] createFotoSection ${gridId} existingUrls:`, existingUrls);

  function updateMeta() {
    if (!meta) return;
    const total = savedUrls.length + pendingFiles.length;
    meta.textContent = total
      ? `${total} foto${total > 1 ? "s" : ""}`
      : "";
  }

  function addSavedThumb(url) {
    const thumb = document.createElement("div");
    thumb.className = "foto-thumb";

    const img = document.createElement("img");
    img.src = url;
    img.alt = "Foto guardada";
    img.addEventListener("click", () => openLightbox(url));

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "foto-thumb-remove";
    btn.title = "Eliminar";
    btn.textContent = "✕";
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta foto?")) return;
      savedUrls = savedUrls.filter((u) => u !== url);
      thumb.remove();
      if (onDeleteExisting) await onDeleteExisting(url);
      updateMeta();
    });

    thumb.appendChild(img);
    thumb.appendChild(btn);
    grid.insertBefore(thumb, grid.querySelector(".foto-add"));
  }

  function addPendingThumb(file, index) {
    const thumb = document.createElement("div");
    thumb.className = "foto-thumb";
    thumb.dataset.index = index;

    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.alt = "Foto nueva";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "foto-thumb-remove";
    btn.title = "Quitar";
    btn.textContent = "✕";
    btn.addEventListener("click", () => {
      pendingFiles = pendingFiles.filter((_, i) => i !== Number(thumb.dataset.index));
      rebuildPending();
    });

    thumb.appendChild(img);
    thumb.appendChild(btn);
    grid.insertBefore(thumb, grid.querySelector(".foto-add"));
  }

  function rebuildPending() {
    grid.querySelectorAll(".foto-thumb[data-index]").forEach((t) => t.remove());
    pendingFiles.forEach((f, i) => addPendingThumb(f, i));
    updateMeta();
  }

  savedUrls.forEach((url) => addSavedThumb(url));
  updateMeta();

  function onInputChange(el) {
    Array.from(el.files).forEach((f) => pendingFiles.push(f));
    el.value = "";
    rebuildPending();
  }

  input.addEventListener("change", () => onInputChange(input));
  if (inputExtra) inputExtra.addEventListener("change", () => onInputChange(inputExtra));

  return {
    getFiles:    () => pendingFiles,
    getSavedUrls: () => savedUrls,
    clear() { pendingFiles = []; savedUrls = []; grid.querySelectorAll(".foto-thumb").forEach((t) => t.remove()); updateMeta(); },
  };
}

function setupFotos() {
  const mgr = createFotoSection("fotoPreviewGrid", "fotoInputCamara", "fotoMeta", [], null, "fotoInputGaleria");
  if (!mgr) return null;
  if (form) form.addEventListener("reset", () => mgr.clear());
  return mgr;
}

function setupFotosEdit(repair) {
  if (!repair) return null;
  const fotos = repair.fotos || { recepcion: [], reparacion: [], entrega: [] };
  console.log("[fotos] setupFotosEdit recepcion:", fotos.recepcion);

  async function deleteAndSave(section, url) {
    await dbDeleteFoto(url);
    const current = repairs.find((r) => Number(r.id) === Number(repair.id));
    if (current) {
      current.fotos[section] = current.fotos[section].filter((u) => u !== url);
      await dbUpdateFotos(current.id, current.fotos);
    }
  }

  const recepcion  = createFotoSection("fotoGridRecepcion",  "fotoInputRecepcionCam",  "fotoMetaRecepcion",  fotos.recepcion,  (url) => deleteAndSave("recepcion",  url), "fotoInputRecepcionGal");
  const reparacion = createFotoSection("fotoGridReparacion", "fotoInputReparacionCam", "fotoMetaReparacion", fotos.reparacion, (url) => deleteAndSave("reparacion", url), "fotoInputReparacionGal");
  const entrega    = createFotoSection("fotoGridEntrega",    "fotoInputEntregaCam",    "fotoMetaEntrega",    fotos.entrega,    (url) => deleteAndSave("entrega",    url), "fotoInputEntregaGal");

  return { recepcion, reparacion, entrega };
}

async function setupClienteSelect() {
  const sel = $("#clienteSelect");
  if (!sel) return;

  const clientes = await dbLoadClientes();
  const nuevoOpt = sel.querySelector('option[value="__nuevo__"]');

  clientes.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.dataset.nombre = c.nombre;
    opt.dataset.telefono = c.telefono || "";
    opt.textContent = c.nombre;
    sel.insertBefore(opt, nuevoOpt);
  });

  sel.addEventListener("change", () => {
    const val = sel.value;
    const panel = $("#nuevoClienteFields");
    const hiddenNombre = $("#hiddenCliente");
    const hiddenTel = $("#hiddenTelefono");

    if (val === "__nuevo__") {
      panel.style.display = "";
      hiddenNombre.value = "";
      hiddenTel.value = "";
    } else if (val) {
      panel.style.display = "none";
      const opt = sel.selectedOptions[0];
      hiddenNombre.value = opt.dataset.nombre;
      hiddenTel.value = opt.dataset.telefono;
    } else {
      panel.style.display = "none";
      hiddenNombre.value = "";
      hiddenTel.value = "";
    }
  });
}

let fotosManager = null;

async function initApp() {
  updateDate();
  [repairs, inventario, movimientos] = await Promise.all([dbLoad(), dbLoadInventario(), dbLoadMovimientos()]);
  window.repairs = repairs;
  const openCount = repairs.filter(r => r.estado === "En espera" || r.estado === "Activo").length;
  if (window.shellSetRepairCount) window.shellSetRepairCount(openCount);
  document.dispatchEvent(new Event("repairsLoaded"));
  await setupEditForm();
  setupPatternCanvas();
  fotosManager = setupFotos();
  await setupClienteSelect();
  renderAll();
  setupReportsDashboard();
  await initMovimientos();
  await migrateGastosMovimientos();
}

async function migrateGastosMovimientos() {
  const migKey = "fixtrack_mov_v2";
  if (localStorage.getItem(migKey)) return;

  for (const repair of repairs) {
    // Gastos individuales
    if ((repair.gastos || []).length) {
      const yaExiste = movimientos.some(m => m.reparacionId === repair.id && m.categoria === "Gasto de reparación");
      if (!yaExiste) {
        const newMov = await dbSyncGastosMovimientos(repair);
        movimientos = [...newMov, ...movimientos];
      }
    }

    // Anticipo — usa fechaIngreso como fecha aproximada
    if (repair.anticipo > 0) {
      const yaExiste = movimientos.some(m => m.reparacionId === repair.id && m.categoria === "Anticipo");
      if (!yaExiste) {
        const saved = await dbInsertMovimiento({
          fecha: repair.fechaIngreso || new Date().toISOString().slice(0, 10),
          descripcion: `Anticipo — Reparación #${repair.id} · ${repair.cliente} (${repair.marca} ${repair.modelo})`.trim(),
          categoria: "Anticipo",
          tipo: "ingreso",
          monto: repair.anticipo,
          reparacionId: repair.id,
        });
        if (saved) movimientos = [saved, ...movimientos];
      }
    }

    // Entrega — solo reparaciones ya entregadas
    if (repair.estado === "Entregado" && repair.fechaEntregaReal) {
      const yaExiste = movimientos.some(m => m.reparacionId === repair.id && m.categoria === "Reparación");
      if (!yaExiste) {
        const costoFinal = repair.cierre?.costoFinal || repair.costoAproximado || 0;
        const anticipo = repair.anticipo || 0;
        const saldo = costoFinal - anticipo;
        if (saldo > 0) {
          const antStr = anticipo > 0 ? ` (anticipo previo: $${anticipo})` : "";
          const saved = await dbInsertMovimiento({
            fecha: repair.fechaEntregaReal,
            descripcion: `Entrega #${repair.id} · ${repair.cliente} — ${repair.marca} ${repair.modelo}${antStr}`.trim(),
            categoria: "Reparación",
            tipo: "ingreso",
            monto: saldo,
            reparacionId: repair.id,
          });
          if (saved) movimientos = [saved, ...movimientos];
        }
      }
    }
  }

  localStorage.setItem(migKey, migKey);
}

initApp();

// ===== REPORTES =====

let weeklyChartInstance = null;

function setupReportsDashboard() {
  const grid = document.querySelector(".report-grid");
  if (!grid) return;

  const monthSelect = $("#reportMonth");
  const yearSelect = $("#reportYear");
  if (!monthSelect || !yearSelect) return;

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const now = new Date();

  monthNames.forEach((name, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = name;
    if (i === now.getMonth()) opt.selected = true;
    monthSelect.appendChild(opt);
  });

  [now.getFullYear(), now.getFullYear() - 1].forEach((y) => {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    if (y === now.getFullYear()) opt.selected = true;
    yearSelect.appendChild(opt);
  });

  monthSelect.addEventListener("change", renderReportsDashboard);
  yearSelect.addEventListener("change", renderReportsDashboard);
  renderReportsDashboard();
}

function renderReportsDashboard() {
  const month = Number($("#reportMonth")?.value ?? new Date().getMonth());
  const year = Number($("#reportYear")?.value ?? new Date().getFullYear());

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const inMonth = repairs.filter((r) => {
    const d = new Date(`${r.fechaIngreso}T00:00:00`);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const inPrevMonth = repairs.filter((r) => {
    const d = new Date(`${r.fechaIngreso}T00:00:00`);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
  });

  const finalized = inMonth.filter((r) => r.estado === "Finalizado" || r.estado === "Entregado");
  const prevFinalized = inPrevMonth.filter((r) => r.estado === "Finalizado" || r.estado === "Entregado");

  const inMonthConPrecio = inMonth.filter(r => r.estado !== "Cancelado" && (r.cierre?.costoFinal || r.costoAproximado));
  const facturado = inMonthConPrecio.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);
  const prevInMonthConPrecio = inPrevMonth.filter(r => r.estado !== "Cancelado" && (r.cierre?.costoFinal || r.costoAproximado));
  const prevFacturado = prevInMonthConPrecio.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);

  const movMes = movimientos.filter(m => {
    if (!m.fecha) return false;
    const [y, mo] = m.fecha.split("-");
    return Number(mo) - 1 === month && Number(y) === year;
  });
  const cobrado = movMes.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const gastos  = movMes.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
  const ganancia = cobrado - gastos;

  const ticketPromedio = inMonthConPrecio.length ? Math.round(facturado / inMonthConPrecio.length) : 0;

  const clientesNuevos = new Set(inMonth.map((r) => r.cliente.toLowerCase().trim())).size;
  const prevClientesNuevos = new Set(inPrevMonth.map((r) => r.cliente.toLowerCase().trim())).size;


  function fmtDelta(curr, prev) {
    if (!prev && !curr) return null;
    if (!prev) return "+100%";
    const pct = Math.round(((curr - prev) / prev) * 100);
    return `${pct >= 0 ? "+" : ""}${pct}%`;
  }

  function setBadge(id, text, cls) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = `report-badge ${cls}`;
  }

  function setValue(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  // Facturado
  setValue("rcFacturadoValue", formatMoney(facturado));
  const facDelta = fmtDelta(facturado, prevFacturado);
  setBadge("rcFacturadoBadge", facDelta ?? "Sin datos", facDelta ? (facturado >= prevFacturado ? "badge-green" : "badge-red") : "badge-gray");

  // Cobrado
  setValue("rcCobradoValue", formatMoney(cobrado));
  setBadge("rcCobradoBadge", `${movMes.filter(m => m.tipo === "ingreso").length} mov.`, "badge-blue");

  // Gastos
  setValue("rcGastosValue", formatMoney(gastos));
  setBadge("rcGastosBadge", `${movMes.filter(m => m.tipo === "egreso").length} mov.`, gastos ? "badge-gray" : "badge-green");

  // Ganancia
  setValue("rcGananciaValue", formatMoney(ganancia));
  setBadge("rcGananciaBadge", ganancia >= 0 ? "Positiva" : "Negativa", ganancia >= 0 ? "badge-green" : "badge-red");

  // Ticket promedio
  setValue("rcTicketValue", formatMoney(ticketPromedio));
  setBadge("rcTicketBadge", `${inMonthConPrecio.length} rep.`, "badge-blue");

  // Reparaciones completadas
  setValue("rcReparacionesValue", finalized.length);
  const repDelta = fmtDelta(finalized.length, prevFinalized.length);
  setBadge("rcReparacionesBadge", repDelta ?? "0%", finalized.length >= prevFinalized.length ? "badge-green" : "badge-red");

  // Clientes nuevos
  setValue("rcClientesValue", clientesNuevos);
  const cliDelta = fmtDelta(clientesNuevos, prevClientesNuevos);
  setBadge("rcClientesBadge", cliDelta ?? "Sin datos", cliDelta ? (clientesNuevos >= prevClientesNuevos ? "badge-green" : "badge-red") : "badge-gray");

  // Inventario
  const invValorCosto  = inventario.reduce((s, i) => s + i.stock * i.precioCosto,  0);
  const invValorVenta  = inventario.reduce((s, i) => s + i.stock * i.precioVenta,  0);
  const invArticulos   = inventario.length;
  setValue("rcInventarioValue", formatMoney(invValorCosto));
  setValue("rcInventarioVenta", formatMoney(invValorVenta));
  setBadge("rcInventarioBadge", `${invArticulos} artículo${invArticulos !== 1 ? "s" : ""}`, "badge-gray");

  // Por entregar (Finalizado pero aún no retirado)
  const porEntregarRepairs = repairs.filter((r) => r.estado === "Finalizado");
  const porEntregarMonto = porEntregarRepairs.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);
  const porEntregar = porEntregarRepairs.length;
  setValue("rcEntregarValue", porEntregar);
  setValue("rcEntregarMonto", formatMoney(porEntregarMonto));
  setBadge("rcEntregarBadge", porEntregar ? `${porEntregar} listo${porEntregar !== 1 ? "s" : ""}` : "Ninguno pendiente", porEntregar ? "badge-blue" : "badge-green");

  renderWeeklyChart();
  renderTop5Table(inMonth);
  renderCategoriesChart(inMonth);
}

function renderWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas || typeof Chart === "undefined") return;

  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });

  const data = days.map((dateStr) =>
    repairs
      .filter((r) => r.estado === "Entregado" && r.fechaEntregaReal === dateStr)
      .reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0)
  );

  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
    weeklyChartInstance = null;
  }

  weeklyChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"],
      datasets: [
        {
          data,
          borderColor: "#1268f3",
          backgroundColor: "rgba(18, 104, 243, 0.07)",
          pointBackgroundColor: "#1268f3",
          pointRadius: 5,
          tension: 0.35,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#e8edf4" },
          ticks: { font: { family: "Hanken Grotesk", size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "Hanken Grotesk", size: 11 } },
        },
      },
    },
  });
}

function renderTop5Table(monthRepairs) {
  const tbody = document.getElementById("top5TableBody");
  if (!tbody) return;

  const sorted = [...monthRepairs]
    .sort((a, b) => (b.cierre?.costoFinal || b.costoAproximado || 0) - (a.cierre?.costoFinal || a.costoAproximado || 0))
    .slice(0, 5);

  if (!sorted.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="5">Sin reparaciones este mes.</td></tr>`;
    return;
  }

  tbody.innerHTML = sorted
    .map(
      (r) => `
    <tr class="clickable-row" data-edit-id="${r.id}">
      <td><strong>#${r.id}</strong></td>
      <td>${escapeHtml(r.cliente)}</td>
      <td>${escapeHtml(repairDeviceLabel(r))}</td>
      <td><span class="pill ${getStatusClass(r.estado)}">${escapeHtml(r.estado)}</span></td>
      <td><strong>${formatMoney(r.cierre?.costoFinal || r.costoAproximado || 0)}</strong></td>
    </tr>
  `
    )
    .join("");
}

function renderCategoriesChart(monthRepairs) {
  const container = document.getElementById("rcCategoriesBody");
  if (!container) return;

  const counts = {};
  monthRepairs.forEach((r) => {
    const key = r.dispositivo || "Otro";
    counts[key] = (counts[key] || 0) + 1;
  });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  if (!sorted.length) {
    container.innerHTML = `<p class="rc-empty">Sin datos para este mes.</p>`;
    return;
  }

  container.innerHTML = sorted
    .map(
      ([label, count]) => `
    <div class="category-row">
      <span class="category-label">${escapeHtml(label)}</span>
      <div class="category-bar-wrap">
        <div class="category-bar" style="width: ${Math.round((count / max) * 100)}%"></div>
      </div>
      <span class="category-count">${count}</span>
    </div>
  `
    )
    .join("");
}

// ===== INVENTARIO =====

let inventario = [];
let invDeleteTargetId = null;

function invStockBadge(item) {
  if (item.stock === 0) return `<span class="pill sc-cancelado">Sin stock</span>`;
  if (item.stockMinimo > 0 && item.stock <= item.stockMinimo)
    return `<span class="pill sc-espera">${item.stock} <small style="opacity:.7">▼mín</small></span>`;
  return `<span class="pill sc-entregado">${item.stock}</span>`;
}

function renderInvTable() {
  const tbody = document.getElementById("invTableBody");
  if (!tbody) return;

  const search = (document.getElementById("invSearch")?.value || "").toLowerCase().trim();
  const catFilter = document.getElementById("invCatFilter")?.value || "";

  let items = inventario;
  if (search) {
    items = items.filter((i) =>
      i.nombre.toLowerCase().includes(search) ||
      i.sku.toLowerCase().includes(search) ||
      i.proveedor.toLowerCase().includes(search)
    );
  }
  if (catFilter) items = items.filter((i) => i.categoria === catFilter);

  if (!items.length) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--fg-3)">${inventario.length ? "Sin resultados." : "No hay ítems cargados."}</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map((item) => `
    <tr>
      <td>
        <strong>${escapeHtml(item.nombre)}</strong>
        ${item.descripcion ? `<br><small style="color:var(--fg-3)">${escapeHtml(item.descripcion)}</small>` : ""}
        ${item.sku ? `<br><code style="font-size:11px;color:var(--fg-3)">${escapeHtml(item.sku)}</code>` : ""}
      </td>
      <td>${escapeHtml(item.categoria)}</td>
      <td style="color:var(--fg-3)">${escapeHtml(item.proveedor) || "—"}</td>
      <td>${invStockBadge(item)}</td>
      <td><strong>${formatMoney(item.precioVenta)}</strong></td>
      <td>
        <div class="row-actions-inner">
          <button class="btn btn-ghost btn-sm inv-edit-btn" data-id="${item.id}" type="button">Editar</button>
          <button class="btn btn-ghost btn-sm inv-delete-btn" data-id="${item.id}" data-nombre="${escapeHtml(item.nombre)}" type="button" style="color:var(--danger,#e53e3e)">Eliminar</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function openInvModal(item = null) {
  const modal = document.getElementById("invModal");
  const title = document.getElementById("invModalTitle");
  const sub   = document.getElementById("invModalSub");
  if (!modal) return;

  document.getElementById("invItemId").value      = item?.id || "";
  document.getElementById("invNombre").value       = item?.nombre || "";
  document.getElementById("invCategoria").value    = item?.categoria || "";
  document.getElementById("invEsChipImei").value   = item ? String(item.esChipImei) : "false";
  document.getElementById("invDescripcion").value  = item?.descripcion || "";
  document.getElementById("invProveedor").value    = item?.proveedor || "";
  document.getElementById("invSku").value          = item?.sku || "";
  document.getElementById("invPrecioCosto").value  = item?.precioCosto || "";
  document.getElementById("invPrecioVenta").value  = item?.precioVenta || "";
  document.getElementById("invStock").value        = item?.stock ?? "";
  document.getElementById("invStockMinimo").value  = item?.stockMinimo || "";

  if (title) title.textContent = item ? "Editar ítem" : "Nuevo ítem";
  if (sub)   sub.textContent   = item ? item.nombre : "Completá los datos del artículo.";

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.getElementById("invNombre").focus();
}

function closeInvModal() {
  const modal = document.getElementById("invModal");
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.getElementById("invForm").reset();
}

function openInvDeleteModal(id, nombre) {
  invDeleteTargetId = id;
  const modal = document.getElementById("invDeleteModal");
  const label = document.getElementById("invDeleteName");
  if (label) label.textContent = `¿Seguro que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`;
  if (modal) { modal.classList.add("open"); modal.setAttribute("aria-hidden", "false"); }
}

function closeInvDeleteModal() {
  invDeleteTargetId = null;
  const modal = document.getElementById("invDeleteModal");
  if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
}

function setupInventario() {
  if (!document.getElementById("invTableBody")) return;

  document.getElementById("invSearch")?.addEventListener("input", renderInvTable);
  document.getElementById("invCatFilter")?.addEventListener("change", renderInvTable);

  document.getElementById("newItemBtn")?.addEventListener("click", () => openInvModal());
  document.getElementById("closeInvModal")?.addEventListener("click", closeInvModal);
  document.getElementById("cancelInvModal")?.addEventListener("click", closeInvModal);
  document.getElementById("cancelInvDelete")?.addEventListener("click", closeInvDeleteModal);

  document.getElementById("invModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("invModal")) closeInvModal();
  });
  document.getElementById("invDeleteModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("invDeleteModal")) closeInvDeleteModal();
  });

  document.getElementById("invTableBody")?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".inv-edit-btn");
    if (editBtn) {
      const item = inventario.find((i) => i.id === Number(editBtn.dataset.id));
      if (item) openInvModal(item);
      return;
    }
    const delBtn = e.target.closest(".inv-delete-btn");
    if (delBtn) openInvDeleteModal(Number(delBtn.dataset.id), delBtn.dataset.nombre);
  });

  document.getElementById("confirmInvDelete")?.addEventListener("click", async () => {
    if (!invDeleteTargetId) return;
    await dbDeleteItem(invDeleteTargetId);
    inventario = inventario.filter((i) => i.id !== invDeleteTargetId);
    closeInvDeleteModal();
    renderInvTable();
    if (window.showToast) window.showToast("Ítem eliminado", "", "red");
  });

  document.getElementById("invForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("invSubmitBtn");
    if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }

    const id = document.getElementById("invItemId").value;
    const itemData = {
      nombre:      document.getElementById("invNombre").value.trim(),
      categoria:   document.getElementById("invCategoria").value,
      esChipImei:  document.getElementById("invEsChipImei").value === "true",
      descripcion: document.getElementById("invDescripcion").value.trim(),
      proveedor:   document.getElementById("invProveedor").value.trim(),
      sku:         document.getElementById("invSku").value.trim(),
      precioCosto: Number(document.getElementById("invPrecioCosto").value || 0),
      precioVenta: Number(document.getElementById("invPrecioVenta").value || 0),
      stock:       Number(document.getElementById("invStock").value || 0),
      stockMinimo: Number(document.getElementById("invStockMinimo").value || 0),
    };

    let saved;
    if (id) {
      itemData.id = Number(id);
      saved = await dbUpsertItem(itemData);
      if (saved) inventario = inventario.map((i) => i.id === saved.id ? saved : i);
    } else {
      saved = await dbInsertItem(itemData);
      if (saved) inventario = [saved, ...inventario];
    }

    closeInvModal();
    renderInvTable();
    if (btn) { btn.disabled = false; btn.textContent = "Guardar ítem"; }
    if (window.showToast) window.showToast(id ? "Ítem actualizado" : "Ítem guardado", itemData.nombre, "green");
  });
}

async function initInventario() {
  if (!document.getElementById("invTableBody")) return;
  renderInvTable();
  setupInventario();
}

initInventario();

// ===== MOVIMIENTOS PAGE =====

const CATEGORIA_TIPO = {
  "Anticipo":            "ingreso",
  "Reparación":          "ingreso",
  "Venta":               "ingreso",
  "Otro ingreso":        "ingreso",
  "Gasto de reparación": "egreso",
  "Compra de stock":     "egreso",
  "Gasto operativo":     "egreso",
  "Retiro":              "egreso",
};

const CATEGORIAS_INGRESO = ["Anticipo", "Reparación", "Venta", "Otro ingreso"];
const CATEGORIAS_EGRESO  = ["Gasto de reparación", "Compra de stock", "Gasto operativo", "Retiro"];

function formatFechaCorta(fecha) {
  if (!fecha) return "";
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

function renderMovTable(filtered) {
  const tbody = document.getElementById("movTableBody");
  if (!tbody) return;
  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="4">Sin movimientos para este período.</td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(m => {
    const esIngreso = m.tipo === "ingreso";
    const signo = esIngreso ? "+" : "−";
    const colorClass = esIngreso ? "mov-pos" : "mov-neg";
    const catClass = esIngreso ? "pill done" : "pill waiting";
    const rep = m.reparacionId ? repairs.find(r => Number(r.id) === Number(m.reparacionId)) : null;
    const repLink = rep ? `<span class="mov-rep-link">Reparación #${rep.id} · ${escapeHtml(rep.cliente)} — ${escapeHtml(rep.marca)} ${escapeHtml(rep.modelo)}</span>` : "";
    return `<tr class="clickable-row" data-mov-id="${m.id}">
      <td><span class="mov-fecha">${formatFechaCorta(m.fecha)}</span></td>
      <td>
        <div class="cell-stack">
          <strong>${escapeHtml(m.descripcion)}</strong>
          <span><span class="${catClass}">${escapeHtml(m.categoria)}</span>${repLink}</span>
        </div>
      </td>
      <td class="mov-monto ${colorClass}">${signo} ${formatMoney(m.monto)}</td>
      <td class="row-actions">
        ${!m.reparacionId ? `<button class="btn-icon del" data-delete-mov="${m.id}" title="Eliminar">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>` : ""}
      </td>
    </tr>`;
  }).join("");
}

function renderMovSummary(filtered) {
  const ingresos = filtered.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
  const egresos  = filtered.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
  const resultado = ingresos - egresos;
  const el = id => document.getElementById(id);
  if (el("movTotalIngresos")) el("movTotalIngresos").textContent = formatMoney(ingresos);
  if (el("movTotalEgresos"))  el("movTotalEgresos").textContent  = formatMoney(egresos);
  if (el("movResultado")) {
    el("movResultado").textContent = formatMoney(resultado);
    el("movResultado").className = "mov-result-val " + (resultado >= 0 ? "mov-pos" : "mov-neg");
  }
}

function getMovFiltered() {
  const mes  = document.getElementById("movMesSelect")?.value;
  const anio = document.getElementById("movAnioSelect")?.value;
  const cat  = document.getElementById("movCatFilter")?.value || "";
  return movimientos.filter(m => {
    if (!m.fecha) return false;
    const [y, mo] = m.fecha.split("-");
    if (mes  && mo !== mes)  return false;
    if (anio && y  !== anio) return false;
    if (cat  && m.categoria !== cat) return false;
    return true;
  });
}

function renderMov() {
  const filtered = getMovFiltered();
  renderMovSummary(filtered);
  renderMovTable(filtered);
}

function openMovModal(mov = null) {
  const modal = document.getElementById("movModal");
  const form  = document.getElementById("movForm");
  const title = document.getElementById("movModalTitle");
  if (!modal || !form) return;

  form.reset();
  if (title) title.textContent = "Nuevo movimiento";

  const catSel = document.getElementById("movCategoria");
  if (catSel) {
    catSel.innerHTML = `<optgroup label="Ingresos">${CATEGORIAS_INGRESO.map(c => `<option value="${c}">${c}</option>`).join("")}</optgroup>
      <optgroup label="Egresos">${CATEGORIAS_EGRESO.map(c => `<option value="${c}">${c}</option>`).join("")}</optgroup>`;
  }

  const fechaInput = document.getElementById("movFecha");
  if (fechaInput) fechaInput.value = today;

  modal.style.display = "flex";
}

function closeMovModal() {
  const modal = document.getElementById("movModal");
  if (modal) modal.style.display = "none";
}

async function initMovimientos() {
  if (!document.getElementById("movTableBody")) return;

  const now = new Date();
  const mesSel  = document.getElementById("movMesSelect");
  const anioSel = document.getElementById("movAnioSelect");

  if (mesSel) {
    const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
    mesSel.innerHTML = meses.map((n, i) => {
      const v = String(i + 1).padStart(2, "0");
      return `<option value="${v}" ${i === now.getMonth() ? "selected" : ""}>${n}</option>`;
    }).join("");
  }

  if (anioSel) {
    const y = now.getFullYear();
    anioSel.innerHTML = [y - 1, y, y + 1].map(yr =>
      `<option value="${yr}" ${yr === y ? "selected" : ""}>${yr}</option>`
    ).join("");
  }

  renderMov();

  mesSel?.addEventListener("change", renderMov);
  anioSel?.addEventListener("change", renderMov);
  document.getElementById("movCatFilter")?.addEventListener("change", renderMov);

  document.getElementById("newMovBtn")?.addEventListener("click", () => openMovModal());
  document.getElementById("closeMovModal")?.addEventListener("click", closeMovModal);
  document.getElementById("movModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("movModal")) closeMovModal();
  });

  document.getElementById("movForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const fecha       = document.getElementById("movFecha")?.value;
    const descripcion = document.getElementById("movDescripcion")?.value.trim();
    const categoria   = document.getElementById("movCategoria")?.value;
    const monto       = Number(document.getElementById("movMonto")?.value || 0);
    if (!descripcion || !monto || !categoria) return;
    const tipo = CATEGORIA_TIPO[categoria] || "egreso";
    const saved = await dbInsertMovimiento({ fecha, descripcion, categoria, tipo, monto, reparacionId: null });
    if (saved) {
      movimientos = [saved, ...movimientos];
      renderMov();
    }
    closeMovModal();
  });

  document.getElementById("movTableBody")?.addEventListener("click", async e => {
    const btn = e.target.closest("[data-delete-mov]");
    if (!btn) return;
    if (!confirm("¿Eliminar este movimiento?")) return;
    const id = Number(btn.dataset.deleteMov);
    await dbDeleteMovimiento(id);
    movimientos = movimientos.filter(m => m.id !== id);
    renderMov();
  });
}
