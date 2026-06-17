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
  const activos    = repairs.filter(r => r.estado === "Activo" || r.estado === "Garantía").length;
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
  if (status === "Garantía")   return "sc-garantia";
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
  const text = (repair.problema || "").trim();
  if (!text) return "Servicio sin detallar";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function serviceDetail(repair) {
  if (repair.accesorios && repair.accesorios.trim()) return `Accesorio: ${repair.accesorios.trim()}`;
  if (repair.observaciones && repair.observaciones.trim()) return truncateText(repair.observaciones, 42);
  return "";
}

function formatDateShort(value) {
  if (!value) return "-";
  const parts = value.split("-");
  return `${parts[2]}/${parts[1]}`;
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
  collectCount.textContent = repairs.filter((repair) => repair.estado === "Activo" || repair.estado === "Garantía").length;
  monthCount.textContent = thisMonth.length;
  salesTotal.textContent = formatMoney(
    repairs
      .filter((r) => (r.estado === "Entregado" || r.estado === "Garantía") && r.fechaEntregaReal && (() => {
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

const GROUP_ORDER = ["Activo", "Garantía", "En espera", "Finalizado", "Entregado", "Cancelado"];
const GROUP_LABELS = {
  "Activo":     "En reparacion",
  "Garantía":   "En garantía",
  "En espera":  "Pendientes de inicio",
  "Finalizado": "Terminados — pendiente de retiro",
  "Entregado":  "Entregados al cliente",
  "Cancelado":  "Cancelados",
};

const LOCKED_STATES = ["Finalizado", "Entregado"];

function repairRow(repair) {
  const id = repair.id;
  const precio = repair.cierre?.costoFinal || repair.costoAproximado || 0;
  const priceCell = precio > 0
    ? `<b class="rw-price">${formatMoney(precio)}</b>`
    : `<span class="rw-tbd">A cotizar</span>`;

  let stepBtn = "";
  if (repair.estado === "En espera") {
    stepBtn = `<button class="btn-step activar-icon" type="button" data-id="${id}">Iniciar</button>`;
  } else if (repair.estado === "Activo" || repair.estado === "Garantía") {
    stepBtn = `<button class="btn-step finalizar-icon" type="button" data-id="${id}">Finalizar</button>`;
  } else if (repair.estado === "Finalizado") {
    stepBtn = `<button class="btn-step deliver-icon" type="button" data-id="${id}">Entregar</button>`;
  }

  const svcTitle  = serviceTitle(repair);
  const svcDetail = serviceDetail(repair);

  return `
    <tr class="clickable-row" data-edit-id="${id}">
      <td>
        <div class="cell-stack id-stack">
          <span class="cell-nro">#${id}</span>
          <span class="cell-date">${formatDateShort(repair.fechaIngreso)}</span>
        </div>
      </td>
      <td>
        <div class="cell-stack">
          <strong>${escapeHtml(repair.cliente)}</strong>
          <span class="cell-dim">${escapeHtml(repairDeviceLabel(repair))}</span>
        </div>
      </td>
      <td class="rw-svc">
        <div class="rw-svc-main">${escapeHtml(svcTitle)}</div>
        ${svcDetail ? `<div class="rw-svc-sub">${escapeHtml(svcDetail)}</div>` : ""}
      </td>
      <td class="rw-price-cell">${priceCell}</td>
      <td class="rw-act">
        <div class="rw-act-inner">
          ${stepBtn}
          <div class="rw-more">
            <button class="rw-more-btn" type="button" aria-label="Más opciones">···</button>
            <div class="rw-more-menu">
              <a class="rw-more-item" href="editar-reparacion.html?id=${id}">Editar</a>
              ${repair.estado === "Entregado" ? `<button class="rw-more-item garantia-icon" type="button" data-id="${id}">Recibir en garantía</button>` : ""}
              <button class="rw-more-item rw-del delete-icon" type="button" data-id="${id}">Eliminar</button>
            </div>
          </div>
        </div>
      </td>
    </tr>`;
}

function groupHeaderRow(estado, count) {
  const sc = getStatusClass(estado);
  return `<tr class="rw-grp">
    <td colspan="5">
      <span class="rw-grp-inner">
        <span class="rw-grp-dot ${sc}-dot"></span>
        <span class="rw-grp-name">${escapeHtml(estado)}</span>
        <span class="rw-grp-n">${count}</span>
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
    cierre: ["Finalizado", "Entregado", "Garantía"].includes(formData.get("estado")) ? (existing.cierre || null) : null,
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
  if (totalEl) totalEl.textContent = formatMoney(price * qty);
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

  // reset price inputs
  const unitPriceEl = $("#expenseUnitPrice");
  const invPriceEl  = $("#expInvPrice");
  if (unitPriceEl) { unitPriceEl.style.display = ""; unitPriceEl.disabled = false; }
  if (invPriceEl)  { invPriceEl.style.display  = "none"; invPriceEl.disabled = true; }
  const stockNote = $("#expStockNote");
  if (stockNote) stockNote.style.display = "none";

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
        opt.dataset.stock  = i.stock;
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

  const existingBanner = document.getElementById("garantiaHistorialBanner");
  if (existingBanner) existingBanner.remove();
  if (repair.garantiaFecha && repair.garantiaMotivo) {
    const banner = document.createElement("div");
    banner.id = "garantiaHistorialBanner";
    banner.className = "garantia-historial";
    banner.innerHTML = `
      <div class="gh-icon">🔁</div>
      <div class="gh-body">
        <p class="gh-title">Devuelta en garantía · ${formatDate(repair.garantiaFecha)}</p>
        <p class="gh-motivo">${escapeHtml(repair.garantiaMotivo)}</p>
      </div>`;
    editForm.insertAdjacentElement("beforebegin", banner);
  }

  const enableEditButton = $("#enableEditButton");
  const saveEditButton   = $("#saveEditButton");

  if (LOCKED_STATES.includes(repair.estado)) {
    if (openFinishModalButton) openFinishModalButton.style.display = "none";
    if (saveEditButton) saveEditButton.style.display = "none";
    if (enableEditButton) enableEditButton.style.display = "";

    const finishModal = document.getElementById("finishModal");
    const fields = [...editForm.querySelectorAll("input, select, textarea, button[data-delete-expense], #openExpenseModalButton")]
      .filter(f => !finishModal?.contains(f));
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

    const clienteSel = $("#clienteSelect");
    if (clienteSel) {
      if (!clienteSel.value) { alert("Seleccioná un cliente o elegí '+ Nuevo cliente'."); return; }
      if (clienteSel.value === "__nuevo__") {
        const nombre = ($("#nuevoNombre")?.value || "").trim();
        if (!nombre) { alert("El nombre del cliente es obligatorio."); return; }
        const savedCliente = await dbInsertCliente({
          nombre,
          telefono:  ($("#nuevoTelefono")?.value  || "").trim(),
          correo:    ($("#nuevoCorreo")?.value     || "").trim(),
          direccion: ($("#nuevoDireccion")?.value  || "").trim(),
        });
        if (!savedCliente) { alert("No se pudo guardar el cliente. Revisá la conexión."); return; }
        $("#hiddenCliente").value  = savedCliente.nombre;
        $("#hiddenTelefono").value = savedCliente.telefono;
        const opt = document.createElement("option");
        opt.value = savedCliente.id;
        opt.dataset.nombre = savedCliente.nombre;
        opt.dataset.telefono = savedCliente.telefono;
        opt.textContent = savedCliente.nombre;
        clienteSel.insertBefore(opt, clienteSel.querySelector('option[value="__nuevo__"]'));
        clienteSel.value = savedCliente.id;
      }
    }

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

    if (updatedRepair.estado !== "Cancelado" && updatedRepair.estado !== "En espera") {
      const savedGastos = await dbSyncGastosMovimientos(updatedRepair);
      movimientos = movimientos.filter(m => !(m.reparacionId === updatedRepair.id && m.categoria === "Gasto de reparación"));
      movimientos = [...savedGastos, ...movimientos];
    } else if (updatedRepair.estado === "En espera") {
      const toDelete = movimientos.filter(m => m.reparacionId === updatedRepair.id && m.categoria === "Gasto de reparación");
      for (const m of toDelete) {
        await dbDeleteMovimiento(m.id);
        movimientos = movimientos.filter(x => x.id !== m.id);
      }
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
      tryWhatsApp(() => sendWhatsAppPattern(current));
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
      tryWhatsApp(() => sendWhatsAppStatus(current));
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
  if (repair.estado === "En espera") return;
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
    const up = $("#expenseUnitPrice"); const ip = $("#expInvPrice");
    if (up) { up.style.display = ""; up.disabled = false; }
    if (ip) { ip.style.display = "none"; ip.disabled = true; }
    updateExpenseTotalPreview();
  });

  $("#expTypeInv")?.addEventListener("click", () => {
    expenseMode = "inv";
    $("#expTypeInv").classList.add("active");
    $("#expTypeFree").classList.remove("active");
    $("#expFreeFields").style.display = "none";
    $("#expInvFields").style.display  = "";
    const up = $("#expenseUnitPrice"); const ip = $("#expInvPrice");
    if (up) { up.style.display = "none"; up.disabled = true; }
    if (ip) { ip.style.display = ""; ip.disabled = false; }
    updateExpenseTotalPreview();
  });

  // al elegir ítem del inventario, precargar precio y stock note
  $("#expInvSelect")?.addEventListener("change", () => {
    const sel = $("#expInvSelect");
    const opt = sel.selectedOptions[0];
    const priceInput = $("#expInvPrice");
    if (opt?.dataset.precio && priceInput) {
      priceInput.value = opt.dataset.precio;
    } else if (priceInput) {
      priceInput.value = "";
    }
    const stockNote = $("#expStockNote");
    const stockText = $("#expStockText");
    if (stockNote && stockText && opt?.dataset.stock) {
      stockText.textContent = `${opt.dataset.stock} unid. en stock · costo ${formatMoney(opt.dataset.precio || 0)} c/u`;
      stockNote.style.display = "";
    } else if (stockNote) {
      stockNote.style.display = "none";
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
          $("#notifyYes").onclick = () => { tryWhatsApp(() => sendWhatsAppFinished(finalizedRepair)); redirect(); };
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

  // Lock si no es Pro
  if (window._plan && !window._plan.isPro) {
    const wrap = patternCanvas.closest('.pattern-section') || patternCanvas.parentElement;
    if (wrap) {
      wrap.classList.add('pro-lock-wrap');
      patternCanvas.classList.add('pro-lock-blur');
      const overlay = document.createElement('div');
      overlay.className = 'pro-lock-overlay';
      overlay.innerHTML = `<span class="pro-lock-pill">🔒 Función Pro</span><span class="pro-lock-text">Guardá el patrón de desbloqueo<br>con el plan Pro</span><button class="btn btn-accent btn-sm" type="button" id="_unlockPatternBtn">Upgradear a Pro</button>`;
      wrap.appendChild(overlay);
      overlay.querySelector('#_unlockPatternBtn').addEventListener('click', () => window._plan.showUpgrade('Patrón de desbloqueo — disponible en el plan Pro'));
    }
    return;
  }

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

function tryWhatsApp(fn) {
  const plan = window._plan;
  if (plan && !plan.isPro) {
    plan.showUpgrade('Vinculación a WhatsApp (vía web) — disponible en el plan Pro');
    return false;
  }
  fn();
  return true;
}

async function getTallerNombre() {
  const { data: { user } } = await _authClient.auth.getUser();
  return user?.user_metadata?.taller || '';
}

function formatPhoneForWhatsApp(phone) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "54" + digits.slice(1);
  if (digits.length === 10) return "54" + digits;
  return digits;
}

function _openWaLink(phone, lines) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  window.open(url, '_blank');
}

async function sendWhatsAppFinished(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const taller = await getTallerNombre();
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  const costoFinal = repair.cierre?.costoFinal || repair.costoAproximado || 0;
  const anticipo = repair.anticipo || 0;
  const saldo = costoFinal - anticipo;
  const precioLines = [
    `Costo total: ${formatMoney(costoFinal)}`,
    ...(anticipo > 0 ? [`Anticipo: ${formatMoney(anticipo)}`, `Saldo a pagar: ${formatMoney(saldo)}`] : []),
  ];
  _openWaLink(phone, [
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
    `Te esperamos en ${taller}!`,
  ]);
}

async function sendWhatsAppStatus(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;

  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  _openWaLink(phone, [
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
  ]);
}

async function sendWhatsAppPattern(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;

  const taller = await getTallerNombre();
  const patronUrl = `${window.location.origin}/patron.html?id=${repair.id}`;
  _openWaLink(phone, [
    `Hola ${repair.cliente}`,
    ``,
    `Para avanzar con la reparación de tu ${repair.marca} ${repair.modelo} en ${taller}, necesitamos el código de desbloqueo del equipo.`,
    ``,
    `Podés completarlo desde este enlace (solo tarda un momento):`,
    patronUrl,
    ``,
    `¡Muchas gracias!`,
  ]);
}

async function sendWhatsAppOrder(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;

  const taller = await getTallerNombre();
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  _openWaLink(phone, [
    `Hola ${repair.cliente}`,
    ``,
    `Tu equipo fue recibido en ${taller}.`,
    ``,
    `Orden: #${repair.id}`,
    `Equipo: ${repair.marca} ${repair.modelo}`,
    ``,
    `Podes ver y descargar tu orden aca:`,
    orderUrl,
    ``,
    `Te avisamos cuando tengamos novedades.`,
  ]);
}

const NR_SAVE_KEY = "nr_draft";
const NR_FIELDS = [
  "nuevoNombre","nuevoTelefono","nuevoCorreo","nuevoDireccion",
  "marcaInput","modeloInput","imeiInput","problemaInput",
  "accesoriosInput","observacionesInput","pinInput",
  "costoInput","anticipoInput","dispositivoHidden",
];

function nrSaveDraft() {
  if (!form) return;
  const sel = $("#clienteSelect");
  const draft = {
    clienteVal: sel?.value || "",
    dispositivo: $("#dispositivoHidden")?.value || "",
  };
  NR_FIELDS.forEach(id => { const el = $(`#${id}`); if (el) draft[id] = el.value; });
  sessionStorage.setItem(NR_SAVE_KEY, JSON.stringify(draft));
}

function nrRestoreDraft() {
  if (!form) return;
  let draft;
  try { draft = JSON.parse(sessionStorage.getItem(NR_SAVE_KEY)); } catch { return; }
  if (!draft) return;

  NR_FIELDS.forEach(id => {
    const el = $(`#${id}`);
    if (el && draft[id] != null) el.value = draft[id];
  });

  const sel = $("#clienteSelect");
  if (sel && draft.clienteVal) {
    const opt = sel.querySelector(`option[value="${CSS.escape(draft.clienteVal)}"]`);
    if (opt || draft.clienteVal === "__nuevo__") {
      sel.value = draft.clienteVal;
      sel.dispatchEvent(new Event("change"));
    }
  }

  if (draft.dispositivo) {
    const disp = $(`#dispositivoHidden`);
    if (disp) disp.value = draft.dispositivo;
    $(`#tipoChips`)?.querySelectorAll(".chip").forEach(c => {
      c.classList.toggle("on", c.dataset.val === draft.dispositivo);
    });
  }
}

function nrClearDraft() {
  sessionStorage.removeItem(NR_SAVE_KEY);
}

if (form) {
  NR_FIELDS.forEach(id => {
    const el = $(`#${id}`);
    if (el) el.addEventListener("input", nrSaveDraft);
  });
  $("#clienteSelect")?.addEventListener("change", nrSaveDraft);
  $("#tipoChips")?.addEventListener("click", nrSaveDraft);

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

    let repair = createRepair(new FormData(form));

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
    nrClearDraft();
    form.reset();
    if (sel) { sel.value = ""; $("#nuevoClienteFields").style.display = "none"; }
    renderAll();

    const redirect = () => { window.location.href = "reparaciones.html"; };
    const waModal = document.getElementById('waOrderModal');
    if (waModal && repair.telefono) {
      waModal.classList.add('open');
      waModal.setAttribute('aria-hidden', 'false');
      document.getElementById('waOrderYes').onclick = () => {
        waModal.classList.remove('open');
        const sent = tryWhatsApp(() => sendWhatsAppOrder(repair));
        setTimeout(redirect, sent ? 800 : 0);
      };
      document.getElementById('waOrderNo').onclick = () => {
        waModal.classList.remove('open');
        redirect();
      };
    } else {
      redirect();
    }
  });
}

setupExpenses();
setupFinishFlow();

if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);

document.addEventListener("click", (e) => {
  if (!e.target.closest(".rw-more")) {
    document.querySelectorAll(".rw-more.open").forEach(m => m.classList.remove("open"));
  }
});

if (tableBody) {
  tableBody.addEventListener("click", async (event) => {
    const moreBtn = event.target.closest(".rw-more-btn");
    if (moreBtn) {
      event.stopPropagation();
      const menu = moreBtn.closest(".rw-more");
      const isOpen = menu.classList.contains("open");
      document.querySelectorAll(".rw-more.open").forEach(m => m.classList.remove("open"));
      if (!isOpen) menu.classList.add("open");
      return;
    }

    if (event.target.closest(".rw-more-item")) {
      event.target.closest(".rw-more")?.classList.remove("open");
    }

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
      if ((repair.gastos || []).length) {
        const saved = await dbSyncGastosMovimientos(repair);
        movimientos = movimientos.filter(m => !(m.reparacionId === repair.id && m.categoria === "Gasto de reparación"));
        movimientos = [...saved, ...movimientos];
      }
      renderAll();
      return;
    }

    const garantiaBtn = event.target.closest(".garantia-icon");
    if (garantiaBtn) {
      event.preventDefault();
      event.stopPropagation();
      const id = Number(garantiaBtn.dataset.id);
      const repair = repairs.find((r) => Number(r.id) === id);
      if (!repair) return;
      openGarantiaModal(repair);
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
      const repair = repairs.find((r) => Number(r.id) === id);
      const garantiaSection = $("#garantiaCobroSection");
      if (garantiaSection) garantiaSection.style.display = "none";
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

function openGarantiaFinishModal(repair) {
  let modal = document.getElementById("garantiaFinishModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "garantiaFinishModal";
    modal.className = "gm-backdrop";
    modal.innerHTML = `
      <div class="gm-box" role="dialog" aria-modal="true">
        <h3 class="gm-title">Finalizar reparación en garantía</h3>
        <p class="gm-sub">El equipo ya fue cobrado. ¿Vas a cobrar algo adicional por esta reparación?</p>
        <input class="inp" id="garantiaFinishExtra" type="number" min="0" placeholder="$0 — dejá vacío si no cobrás nada" />
        <div class="gm-actions">
          <button class="btn btn-ghost" id="garantiaFinishCancel" type="button">Cancelar</button>
          <button class="btn btn-accent" id="garantiaFinishConfirm" type="button">Confirmar</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("garantiaFinishCancel").addEventListener("click", () => modal.classList.remove("open"));
    modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("open"); });
  }

  document.getElementById("garantiaFinishExtra").value = "";
  modal.dataset.repairId = repair.id;
  modal.classList.add("open");

  document.getElementById("garantiaFinishConfirm").onclick = async () => {
    modal.classList.remove("open");
    const extra = Number(document.getElementById("garantiaFinishExtra").value || 0);
    repair.estado = "Finalizado";
    await dbUpsert(repair);
    repairs = repairs.map(r => Number(r.id) === Number(repair.id) ? repair : r);
    if (extra > 0) {
      const mov = await dbInsertMovimiento({
        fecha: today,
        descripcion: `Garantía #${repair.id} · ${repair.cliente} — ${repair.marca} ${repair.modelo} (cargo adicional)`,
        categoria: "Reparación",
        tipo: "ingreso",
        monto: extra,
        reparacionId: repair.id,
      });
      if (mov) movimientos = [mov, ...movimientos];
    }
    renderAll();
  };
}

function openQuickFinishModal(repair) {
  if (repair.estado === "Garantía") { openGarantiaFinishModal(repair); return; }
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

    const esGarantia = !!(repair.garantiaFecha);
    if (!esGarantia) {
      const entregaMov = await dbSyncEntregaMovimiento(repair);
      movimientos = movimientos.filter(m => !(m.reparacionId === repair.id && m.categoria === "Reparación"));
      if (entregaMov) movimientos = [entregaMov, ...movimientos];
    }

    closeDeliver();
    renderAll();
  });
}

// ── Modal garantía ────────────────────────────────────────
function openGarantiaModal(repair) {
  let modal = document.getElementById("garantiaModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "garantiaModal";
    modal.className = "gm-backdrop";
    modal.innerHTML = `
      <div class="gm-box" role="dialog" aria-modal="true">
        <h3 class="gm-title">Recibir en garantía</h3>
        <p class="gm-sub">Describí el motivo de la devolución del cliente.</p>
        <textarea class="gm-textarea" id="garantiaMotivoInput" rows="4" placeholder="Ej: El cliente dice que la pantalla parpadea al cabo de una semana..."></textarea>
        <div class="gm-actions">
          <button class="btn btn-ghost" id="garantiaCancelBtn" type="button">Cancelar</button>
          <button class="btn btn-accent" id="garantiaConfirmBtn" type="button">Confirmar garantía</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById("garantiaCancelBtn").addEventListener("click", () => { modal.classList.remove("open"); });
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.remove("open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.classList.remove("open"); });
  }

  const textarea = document.getElementById("garantiaMotivoInput");
  textarea.value = "";
  modal.dataset.repairId = repair.id;
  modal.classList.add("open");

  document.getElementById("garantiaConfirmBtn").onclick = async () => {
    const motivo = textarea.value.trim();
    if (!motivo) { textarea.focus(); textarea.style.borderColor = "var(--accent)"; return; }
    textarea.style.borderColor = "";
    modal.classList.remove("open");

    repair.estado = "Garantía";
    repair.garantiaFecha = today;
    repair.garantiaMotivo = motivo;
    repair.gastos = [];
    await dbUpsert(repair);
    const toDelete = movimientos.filter(m => m.reparacionId === repair.id && m.categoria === "Gasto de reparación");
    for (const m of toDelete) await dbDeleteMovimiento(m.id);
    movimientos = movimientos.filter(m => !(m.reparacionId === repair.id && m.categoria === "Gasto de reparación"));
    renderAll();
  };
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
    const plan = window._plan;
    const limit = (!plan || plan.isPro) ? Infinity : plan.FREE_PHOTOS_LIMIT;
    const current = savedUrls.length + pendingFiles.length;
    const files = Array.from(el.files);
    const canAdd = Math.max(0, limit - current);
    if (files.length > 0 && canAdd === 0) {
      el.value = "";
      if (plan) plan.showUpgrade('Fotos ilimitadas — disponible en el plan Pro');
      return;
    }
    files.slice(0, canAdd).forEach((f) => pendingFiles.push(f));
    el.value = "";
    rebuildPending();
    updateAddButton();
  }

  function updateAddButton() {
    const plan = window._plan;
    const limit = (!plan || plan.isPro) ? Infinity : plan.FREE_PHOTOS_LIMIT;
    const total = savedUrls.length + pendingFiles.length;
    const addBtn = grid.querySelector('.foto-add');
    if (addBtn) addBtn.classList.toggle('locked', total >= limit);
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

  Promise.resolve(window._planReady).then(() => {
    if (window._plan?.isPro) return;
    [
      document.getElementById("fotoGridReparacion"),
      document.getElementById("fotoGridEntrega"),
    ].forEach((grid) => {
      const sub = grid?.closest(".foto-subseccion");
      if (!sub) return;
      sub.querySelectorAll("input").forEach((i) => { i.disabled = true; });
      const ov = document.createElement("div");
      ov.className = "foto-sub-lock";
      ov.innerHTML = `<span class="pro-lock-pill">🔒 Pro</span><span class="pro-lock-text">Disponible en el plan Pro</span>`;
      ov.addEventListener("click", () => window._plan?.showUpgrade("Fotos de reparación y entrega — plan Pro"));
      sub.appendChild(ov);
      sub.classList.add("foto-sub-locked");
    });
  });

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

  const panel = $("#nuevoClienteFields");
  const hiddenNombre = $("#hiddenCliente");
  const hiddenTel = $("#hiddenTelefono");

  function applySelection(val) {
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
  }

  sel.addEventListener("change", () => applySelection(sel.value));

  // Sincronizar hiddenCliente/Telefono mientras el usuario tipea en el panel de nuevo cliente
  const inputNuevoNombre = $("#nuevoNombre");
  const inputNuevoTel    = $("#nuevoTelefono");
  if (inputNuevoNombre && hiddenNombre) {
    inputNuevoNombre.addEventListener("input", () => {
      if (sel.value === "__nuevo__") hiddenNombre.value = inputNuevoNombre.value;
    });
  }
  if (inputNuevoTel && hiddenTel) {
    inputNuevoTel.addEventListener("input", () => {
      if (sel.value === "__nuevo__") hiddenTel.value = inputNuevoTel.value;
    });
  }

  // En la página de edición: pre-seleccionar el cliente actual
  if (hiddenNombre && hiddenNombre.value) {
    const nombreActual = hiddenNombre.value.toLowerCase().trim();
    const match = [...sel.options].find(o => o.dataset.nombre && o.dataset.nombre.toLowerCase().trim() === nombreActual);
    if (match) {
      sel.value = match.value;
      applySelection(match.value);
    } else {
      // El nombre no está en la lista: mostrar panel de nuevo cliente con el nombre ya cargado
      sel.value = "__nuevo__";
      const inputNombre = $("#nuevoNombre");
      const inputTel = $("#nuevoTelefono");
      if (inputNombre) inputNombre.value = hiddenNombre.value;
      if (inputTel && hiddenTel) inputTel.value = hiddenTel.value;
      panel.style.display = "";
    }
  }
}

let fotosManager = null;

async function initApp() {
  updateDate();
  [repairs, inventario, movimientos] = await Promise.all([dbLoad(), dbLoadInventario(), dbLoadMovimientos()]);
  window.repairs = repairs;
  const openCount = repairs.filter(r => ["En espera", "Activo", "Garantía"].includes(r.estado)).length;
  if (window.shellSetRepairCount) window.shellSetRepairCount(openCount);
  document.dispatchEvent(new Event("repairsLoaded"));
  await setupEditForm();
  setupPatternCanvas();
  fotosManager = setupFotos();
  await setupClienteSelect();
  nrRestoreDraft();
  renderAll();
  setupReportsDashboard();
  await initMovimientos();
  await migrateGastosMovimientos();
  renderReportsDashboard();
  initPorCobrar();
  // Migrar ítems con categoría vieja "Celular usado" → "Celular"
  const toMigrate = inventario.filter(i => i.categoria === "Celular usado");
  for (const item of toMigrate) {
    item.categoria = "Celular";
    await dbUpsertItem(item);
  }
  renderInvTable();
}

async function migrateGastosMovimientos() {
  // Paso 1: siempre limpiar ingresos de reparaciones "Finalizado" (sin localStorage guard)
  for (const repair of repairs) {
    if (repair.estado === "Finalizado") {
      const viejosMov = movimientos.filter(m => m.reparacionId === repair.id && m.categoria === "Reparación");
      for (const m of viejosMov) {
        await dbDeleteMovimiento(m.id);
        movimientos = movimientos.filter(x => x.id !== m.id);
      }
    }
  }

  // Siempre limpiar gastos de reparaciones "En espera" (no deben tener movimientos)
  for (const repair of repairs) {
    if (repair.estado === "En espera") {
      const viejosMov = movimientos.filter(m => m.reparacionId === repair.id && m.categoria === "Gasto de reparación");
      for (const m of viejosMov) {
        await dbDeleteMovimiento(m.id);
        movimientos = movimientos.filter(x => x.id !== m.id);
      }
    }
  }

  // Paso 2: crear movimientos faltantes (solo corre una vez)
  const migKey = "fixtrack_mov_v4";
  if (localStorage.getItem(migKey)) return;

  for (const repair of repairs) {
    // Gastos individuales — solo si ya está en curso (no En espera)
    if ((repair.gastos || []).length && repair.estado !== "En espera") {
      const yaExiste = movimientos.some(m => m.reparacionId === repair.id && m.categoria === "Gasto de reparación");
      if (!yaExiste) {
        const newMov = await dbSyncGastosMovimientos(repair);
        movimientos = [...newMov, ...movimientos];
      }
    }

    // Anticipo
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
  const grid = document.querySelector(".report-grid, .kpi-row, .rc-section-head");
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

  // Facturado devengado: reparaciones finalizadas en el mes (por fecha de finalización)
  const inMonthFin = repairs.filter(r => {
    if (r.estado === "Cancelado") return false;
    const fechaFin = r.cierre?.fechaFinalizacion || r.fechaEntregaReal;
    if (!fechaFin) return false;
    const d = new Date(`${fechaFin}T00:00:00`);
    return d.getMonth() === month && d.getFullYear() === year && (r.cierre?.costoFinal || r.costoAproximado);
  });
  const facturado = inMonthFin.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);
  const prevInMonthFin = repairs.filter(r => {
    if (r.estado === "Cancelado") return false;
    const fechaFin = r.cierre?.fechaFinalizacion || r.fechaEntregaReal;
    if (!fechaFin) return false;
    const d = new Date(`${fechaFin}T00:00:00`);
    return d.getMonth() === prevMonth && d.getFullYear() === prevYear && (r.cierre?.costoFinal || r.costoAproximado);
  });
  const prevFacturado = prevInMonthFin.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);

  // Ganancia devengada = Facturado − gastos de repuestos de esas reparaciones
  const inMonthFinIds = new Set(inMonthFin.map(r => Number(r.id)));
  const gastosDevengados = movimientos
    .filter(m => m.tipo === "egreso" && m.reparacionId && inMonthFinIds.has(Number(m.reparacionId)))
    .reduce((s, m) => s + m.monto, 0);
  const gananciaDev = facturado - gastosDevengados;
  const margenPct = facturado > 0 ? Math.round((gananciaDev / facturado) * 100) : null;

  const finalizadoIds = new Set(repairs.filter(r => r.estado === "Finalizado").map(r => Number(r.id)));

  const movMes = movimientos.filter(m => {
    if (!m.fecha) return false;
    const [y, mo] = m.fecha.split("-");
    return Number(mo) - 1 === month && Number(y) === year;
  });

  console.log("[DEBUG cobrado] finalizadoIds:", [...finalizadoIds]);
  movMes.filter(m => m.tipo === "ingreso").forEach((m, i) => {
    const excluido = m.categoria === "Reparación" && finalizadoIds.has(Number(m.reparacionId));
    console.log(`[DEBUG mov ${i+1}] cat="${m.categoria}" repId=${m.reparacionId} monto=${m.monto} excluido=${excluido}`);
  });

  const cobrado = movMes
    .filter(m => m.tipo === "ingreso" && !(m.categoria === "Reparación" && finalizadoIds.has(Number(m.reparacionId))))
    .reduce((s, m) => s + m.monto, 0);
  const gastos  = movMes.filter(m => m.tipo === "egreso").reduce((s, m) => s + m.monto, 0);
  const ganancia = cobrado - gastos;

  const ticketPromedio = inMonthFin.length ? Math.round(facturado / inMonthFin.length) : 0;

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
  setBadge("rcTicketBadge", `${inMonthFin.length} rep.`, "badge-blue");

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

  // Saldo pendiente de cobro (global — foto del estado actual, no filtra por mes)
  const _paidForRep = id => movimientos
    .filter(m => m.reparacionId === Number(id) && m.tipo === "ingreso")
    .reduce((s, m) => s + m.monto, 0);
  const finalizadosGlobal = repairs.filter(r => r.estado === "Finalizado");
  let saldoFinMonto = 0;
  finalizadosGlobal.forEach(r => {
    saldoFinMonto += Math.max(0, (r.cierre?.costoFinal || r.costoAproximado || 0) - _paidForRep(r.id));
  });
  const enCursoGlobal = repairs.filter(r =>
    (r.estado === "Activo" || r.estado === "Garantía") && (r.cierre?.costoFinal || r.costoAproximado)
  );
  let saldoActMonto = 0;
  enCursoGlobal.forEach(r => {
    saldoActMonto += Math.max(0, (r.cierre?.costoFinal || r.costoAproximado || 0) - _paidForRep(r.id));
  });
  const saldoPendienteTotal = saldoFinMonto + saldoActMonto;
  setValue("rcSaldoTotal", formatMoney(saldoPendienteTotal));
  setValue("rcSaldoFinMonto", formatMoney(saldoFinMonto));
  setValue("rcSaldoFinCount", `${finalizadosGlobal.length} equipo${finalizadosGlobal.length !== 1 ? "s" : ""}`);
  setValue("rcSaldoActMonto", formatMoney(saldoActMonto));
  setValue("rcSaldoActCount", `${enCursoGlobal.length} en proceso`);

  // Ganancia devengada
  setValue("rcGananciaDevValue", formatMoney(gananciaDev));
  setBadge("rcGananciaDevBadge", gananciaDev >= 0 ? "Positiva" : "Negativa", gananciaDev >= 0 ? "badge-green" : "badge-red");
  setValue("rcMargenChip", margenPct !== null ? `Margen ${margenPct}%` : "—");

  renderWeeklyChart();
  renderTop5Table(inMonth);
  renderCategoriesChart(inMonth);
}

function renderWeeklyChart() {
  const canvas = document.getElementById("weeklyChart");
  if (!canvas || typeof Chart === "undefined") return;

  const selMonth = Number($("#reportMonth")?.value ?? new Date().getMonth());
  const selYear  = Number($("#reportYear")?.value  ?? new Date().getFullYear());

  const MONTH_NAMES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  // Build the last 6 months ending at the selected month
  const months = [];
  for (let i = 5; i >= 0; i--) {
    let m = selMonth - i;
    let y = selYear;
    while (m < 0) { m += 12; y--; }
    months.push({ m, y });
  }

  const labels = months.map(({ m, y }) => `${MONTH_NAMES[m]} ${y}`);

  const cobradoData = months.map(({ m, y }) =>
    movimientos.filter(mov => {
      if (!mov.fecha || mov.tipo !== "ingreso") return false;
      const [my, mm] = mov.fecha.split("-");
      return Number(mm) - 1 === m && Number(my) === y;
    }).reduce((s, mov) => s + mov.monto, 0)
  );

  const gastosData = months.map(({ m, y }) =>
    movimientos.filter(mov => {
      if (!mov.fecha || mov.tipo !== "egreso") return false;
      const [my, mm] = mov.fecha.split("-");
      return Number(mm) - 1 === m && Number(my) === y;
    }).reduce((s, mov) => s + mov.monto, 0)
  );

  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
    weeklyChartInstance = null;
  }

  const gridColor = getComputedStyle(document.documentElement).getPropertyValue("--line").trim() || "rgba(128,128,128,0.2)";
  const textColor = getComputedStyle(document.documentElement).getPropertyValue("--text-3").trim() || "#999";

  weeklyChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Cobrado",
          data: cobradoData,
          backgroundColor: "rgba(139,92,246,0.72)",
          borderRadius: 5,
          borderSkipped: false,
        },
        {
          label: "Gastos",
          data: gastosData,
          backgroundColor: "rgba(220,80,80,0.55)",
          borderRadius: 5,
          borderSkipped: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: "top", labels: { font: { family: "Hanken Grotesk", size: 11 }, boxWidth: 12, padding: 16, color: textColor } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${formatMoney(ctx.raw)}` } },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: gridColor },
          ticks: { font: { family: "Hanken Grotesk", size: 11 }, color: textColor, callback: v => formatMoney(v) },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "Hanken Grotesk", size: 11 }, color: textColor },
        },
      },
    },
  });
}

function renderTop5Table(monthRepairs) {
  const tbody = document.getElementById("top5TableBody");
  if (!tbody) return;

  const sorted = [...monthRepairs]
    .filter(r => r.estado !== "En espera")
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

const INV_CAT_LABEL_DEFAULT = { "Repuesto": "Repuestos", "Accesorio": "Accesorios", "Celular": "Celulares", "Otro": "Otros" };
const INV_CAT_LABEL = new Proxy(INV_CAT_LABEL_DEFAULT, { get: (t, k) => t[k] || k });

function loadInvCategorias() {
  try { return JSON.parse(localStorage.getItem("invCategorias_v1")) || null; } catch { return null; }
}
function saveInvCategorias() {
  localStorage.setItem("invCategorias_v1", JSON.stringify(invCategorias));
}
let invCategorias = loadInvCategorias() || ["Repuesto", "Accesorio", "Celular", "Otro"];

const INV_CAT_ICO = {
  "Repuesto": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  "Accesorio": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  "Celular": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
  "Otro": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
};

function invStockState(item) {
  if (item.categoria === "Celular") return item.stock > 0 ? "used-ok" : "used-sold";
  if (item.stock === 0) return "none";
  if (item.stockMinimo > 0 && item.stock <= item.stockMinimo) return "low";
  return "ok";
}

function invUpdateKpis() {
  const nonUsed = inventario.filter(i => i.categoria !== "Celular");
  const el = id => document.getElementById(id);
  if (el("invKpiItems"))     el("invKpiItems").textContent     = inventario.length;
  if (el("invKpiCapital"))   el("invKpiCapital").textContent   = formatMoney(inventario.reduce((s, i) => s + i.stock * i.precioCosto, 0));
  if (el("invKpiSinStock"))  el("invKpiSinStock").textContent  = nonUsed.filter(i => i.stock === 0).length;
  if (el("invKpiStockBajo")) el("invKpiStockBajo").textContent = nonUsed.filter(i => i.stockMinimo > 0 && i.stock > 0 && i.stock <= i.stockMinimo).length;
}

function invCardHtml(item) {
  const state = invStockState(item);
  const esUsado = item.categoria === "Celular";

  const cardClass = { "ok": "stock-ok", "low": "stock-low", "none": "stock-none", "used-ok": "stock-used-ok", "used-sold": "stock-used-sold" }[state];

  const chipClass = { "ok": "chip-ok", "low": "chip-low", "none": "chip-none", "used-ok": "chip-avail", "used-sold": "chip-sold" }[state];
  const chipLabel = { "ok": `${item.stock} en stock`, "low": `${item.stock} bajo mínimo`, "none": "Sin stock", "used-ok": "Disponible", "used-sold": "Vendido" }[state];

  const barPct = (!esUsado && item.stockMinimo > 0)
    ? Math.min(100, Math.round(item.stock / (item.stockMinimo * 2) * 100))
    : 0;
  const barClass = { "ok": "bar-ok", "low": "bar-low", "none": "bar-none" }[state] || "";

  const subParts = [
    item.sku ? `<span>${escapeHtml(item.sku)}</span>` : "",
    item.proveedor ? `<span>${escapeHtml(item.proveedor)}</span>` : "",
    (esUsado && item.descripcion) ? `<span>${escapeHtml(item.descripcion)}</span>` : "",
  ].filter(Boolean).join(" · ");

  const stepper = !esUsado
    ? `<div class="inv-stepper">
        <button class="inv-stepper-btn" data-step="-1" data-item-id="${item.id}" type="button" ${item.stock <= 0 ? "disabled" : ""}>−</button>
        <span class="inv-stepper-val" id="invStepVal_${item.id}">${item.stock}</span>
        <button class="inv-stepper-btn" data-step="1" data-item-id="${item.id}" type="button">+</button>
      </div>`
    : "";

  return `<div class="inv-card ${cardClass}" data-inv-id="${item.id}">
    <div class="inv-card-ico">${INV_CAT_ICO[item.categoria] || INV_CAT_ICO["Otro"]}</div>
    <div class="inv-card-body">
      <div class="inv-card-name">
        ${escapeHtml(item.nombre)}
        ${esUsado ? `<span class="inv-chip-unica">Pieza única</span>` : ""}
      </div>
      ${subParts ? `<div class="inv-card-sub">${subParts}</div>` : ""}
      <div class="inv-card-stock">
        <span class="inv-stock-chip ${chipClass}">${chipLabel}</span>
        ${!esUsado && item.stockMinimo > 0 ? `<div class="inv-bar-wrap"><div class="inv-bar ${barClass}" style="width:${barPct}%"></div></div><span class="inv-stock-min">mín ${item.stockMinimo}</span>` : ""}
      </div>
    </div>
    <div class="inv-card-right">
      <div>
        <div class="inv-price-val">${formatMoney(item.precioVenta)}</div>
        <div class="inv-price-sub">precio venta</div>
      </div>
      <div class="inv-card-actions">
        ${stepper}
        <div class="inv-kebab">
          <button class="inv-kebab-btn" data-inv-kebab="${item.id}" type="button">⋯</button>
          <div class="inv-menu" id="invMenu_${item.id}">
            ${item.stock > 0 ? `<button class="inv-menu-item" data-inv-sell="${item.id}" type="button">Vender</button>` : ""}
            <button class="inv-menu-item" data-inv-edit="${item.id}" type="button">Editar ítem</button>
            <button class="inv-menu-item danger" data-inv-del="${item.id}" data-inv-nombre="${escapeHtml(item.nombre)}" type="button">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function renderInvSegTabs() {
  const seg = document.getElementById("invCatSeg");
  if (!seg) return;
  const current = seg.querySelector(".inv-seg-btn.active")?.dataset.cat ?? "";
  seg.innerHTML = [{ cat: "", label: "Todas" }, ...invCategorias.map(c => ({ cat: c, label: INV_CAT_LABEL[c] }))]
    .map(({ cat, label }) => `<button class="inv-seg-btn${cat === current ? " active" : ""}" data-cat="${escapeHtml(cat)}" type="button">${escapeHtml(label)}</button>`)
    .join("");
}

function fillInvCatSelect(currentVal = "") {
  const sel = document.getElementById("invCategoria");
  if (!sel) return;
  sel.innerHTML = `<option value="">Seleccionar…</option>` +
    invCategorias.map(c => `<option${c === currentVal ? " selected" : ""}>${escapeHtml(c)}</option>`).join("");
}

function renderInvTable() {
  const container = document.getElementById("invTableBody");
  if (!container) return;

  renderInvSegTabs();
  invUpdateKpis();

  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q   = norm(document.getElementById("invSearch")?.value || "").trim();
  const cat = document.querySelector(".inv-seg-btn.active")?.dataset.cat || "";

  let items = inventario;
  if (q) items = items.filter(i =>
    norm(i.nombre).includes(q) ||
    norm(i.sku).includes(q) ||
    norm(i.proveedor).includes(q)
  );
  if (cat) items = items.filter(i => i.categoria === cat);

  if (!items.length) {
    container.innerHTML = `<div class="inv-empty">${inventario.length ? "Sin resultados." : "No hay ítems cargados."}</div>`;
    return;
  }

  const knownCats = cat ? [cat] : invCategorias.filter(c => items.some(i => i.categoria === c));
  const extraItems = items.filter(i => !invCategorias.includes(i.categoria));
  const cats = knownCats;

  container.innerHTML = cats.map(catName => {
    const group = items.filter(i => i.categoria === catName);
    if (!group.length) return "";

    const nonUsed = catName !== "Celular" ? group : [];
    const sinStock  = nonUsed.filter(i => i.stock === 0).length;
    const stockBajo = nonUsed.filter(i => i.stockMinimo > 0 && i.stock > 0 && i.stock <= i.stockMinimo).length;

    const flags = [
      sinStock  ? `<span class="inv-flag-red">${sinStock} sin stock</span>` : "",
      stockBajo ? `<span class="inv-flag-amber">${stockBajo} bajo mínimo</span>` : "",
    ].filter(Boolean).join("");

    return `<div class="inv-group">
      <div class="inv-group-head">
        <span class="inv-group-ico">${INV_CAT_ICO[catName] || INV_CAT_ICO["Otro"]}</span>
        <span class="inv-group-name">${INV_CAT_LABEL[catName]}</span>
        <span class="inv-group-count">${group.length}</span>
        <div class="inv-group-flags">${flags}</div>
      </div>
      ${group.map(invCardHtml).join("")}
    </div>`;
  }).join("")
    + (extraItems.length ? `<div class="inv-group">${extraItems.map(invCardHtml).join("")}</div>` : "");
}

function openInvModal(item = null) {
  const modal = document.getElementById("invModal");
  const title = document.getElementById("invModalTitle");
  const sub   = document.getElementById("invModalSub");
  if (!modal) return;

  fillInvCatSelect(item?.categoria || "");
  document.getElementById("invItemId").value      = item?.id || "";
  document.getElementById("invNombre").value       = item?.nombre || "";
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

function openInvCatModal() {
  const modal = document.getElementById("invCatModal");
  if (!modal) return;
  renderCatList();
  document.getElementById("invCatNewInput").value = "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeInvCatModal() {
  const modal = document.getElementById("invCatModal");
  if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
}

function renderCatList() {
  const list = document.getElementById("invCatList");
  if (!list) return;
  const xIco = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  list.innerHTML = invCategorias.map(cat => {
    const inUse = inventario.some(i => i.categoria === cat);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)">
      <span style="font-size:14px">${escapeHtml(cat)}</span>
      <button class="btn-icon" data-cat-del="${escapeHtml(cat)}" type="button"
        ${inUse ? `disabled title="Hay ítems con esta categoría" style="opacity:0.25;cursor:not-allowed"` : `title="Eliminar categoría"`}>
        ${xIco}
      </button>
    </div>`;
  }).join("") || `<p style="color:var(--text-3);font-size:13px">No hay categorías.</p>`;
}

function openInvSellModal(item) {
  const modal = document.getElementById("invSellModal");
  if (!modal) return;
  const esUsado = item.categoria === "Celular";
  document.getElementById("invSellItemId").value = item.id;
  document.getElementById("invSellSubtitle").textContent = item.nombre;
  document.getElementById("invSellPrecio").value = item.precioVenta || "";
  document.getElementById("invSellCantidad").value = 1;
  document.getElementById("invSellNota").value = "";
  const cantWrap = document.getElementById("invSellCantidadWrap");
  if (cantWrap) cantWrap.style.display = esUsado ? "none" : "";
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
}

function closeInvSellModal() {
  const modal = document.getElementById("invSellModal");
  if (modal) { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
}

function closeAllInvMenus() {
  document.querySelectorAll(".inv-menu.open").forEach(m => m.classList.remove("open"));
}

function setupInventario() {
  if (!document.getElementById("invTableBody")) return;

  document.getElementById("invSearch")?.addEventListener("input", renderInvTable);

  // Segmented category tabs
  document.getElementById("invCatSeg")?.addEventListener("click", (e) => {
    const btn = e.target.closest(".inv-seg-btn");
    if (!btn) return;
    document.querySelectorAll(".inv-seg-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderInvTable();
  });

  document.getElementById("newItemBtn")?.addEventListener("click", () => openInvModal());
  document.getElementById("closeInvModal")?.addEventListener("click", closeInvModal);
  document.getElementById("cancelInvModal")?.addEventListener("click", closeInvModal);
  document.getElementById("cancelInvDelete")?.addEventListener("click", closeInvDeleteModal);

  document.getElementById("invModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("invModal")) closeInvModal();
  });
  // Categorías modal
  document.getElementById("invManageCatsBtn")?.addEventListener("click", openInvCatModal);
  document.getElementById("closeInvCatModal")?.addEventListener("click", closeInvCatModal);
  document.getElementById("cancelInvCat")?.addEventListener("click", closeInvCatModal);
  document.getElementById("invCatModal")?.addEventListener("click", e => { if (e.target === document.getElementById("invCatModal")) closeInvCatModal(); });

  document.getElementById("invCatList")?.addEventListener("click", e => {
    const btn = e.target.closest("[data-cat-del]");
    if (!btn || btn.disabled) return;
    const cat = btn.dataset.catDel;
    if (!cat || inventario.some(i => i.categoria === cat)) return;
    invCategorias = invCategorias.filter(c => c !== cat);
    saveInvCategorias();
    renderCatList();
    renderInvSegTabs();
  });

  document.getElementById("invCatAddBtn")?.addEventListener("click", () => {
    const input = document.getElementById("invCatNewInput");
    const val = input?.value.trim();
    if (!val) return;
    if (invCategorias.some(c => c.toLowerCase() === val.toLowerCase())) {
      if (window.showToast) window.showToast("Ya existe esa categoría", "", "red");
      return;
    }
    invCategorias = [...invCategorias, val];
    saveInvCategorias();
    renderCatList();
    renderInvSegTabs();
    if (input) input.value = "";
  });

  document.getElementById("closeInvSellModal")?.addEventListener("click", closeInvSellModal);
  document.getElementById("cancelInvSell")?.addEventListener("click", closeInvSellModal);
  document.getElementById("invSellModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("invSellModal")) closeInvSellModal();
  });
  document.getElementById("invSellForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = Number(document.getElementById("invSellItemId").value);
    const item = inventario.find(i => i.id === id);
    if (!item) return;
    const esUsado = item.categoria === "Celular";
    const precio = Number(document.getElementById("invSellPrecio").value || 0);
    const cantidad = esUsado ? 1 : Math.max(1, Number(document.getElementById("invSellCantidad").value || 1));
    const nota = document.getElementById("invSellNota").value.trim();
    const descripcion = nota || `Venta${cantidad > 1 ? " ×" + cantidad : ""} — ${item.nombre}`;
    const mov = await dbInsertMovimiento({ tipo: "ingreso", categoria: "Venta", descripcion, monto: precio * cantidad, fecha: today, reparacionId: null });
    if (mov) movimientos = [mov, ...movimientos];
    const stockAnterior = item.stock;
    item.stock = Math.max(0, item.stock - cantidad);
    const saved = await dbUpsertItem(item);
    if (!saved) {
      item.stock = stockAnterior;
      alert("Error al actualizar el stock. Verificá los permisos de la tabla inventario en Supabase.");
      return;
    }
    inventario = inventario.map(i => i.id === saved.id ? saved : i);
    closeInvSellModal();
    renderInvTable();
    if (window.showToast) window.showToast("Venta registrada", formatMoney(precio * cantidad), "green");
  });
  document.getElementById("invDeleteModal")?.addEventListener("click", (e) => {
    if (e.target === document.getElementById("invDeleteModal")) closeInvDeleteModal();
  });

  // Close kebab menus on outside click
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".inv-kebab")) closeAllInvMenus();
  });

  // Card interactions: stepper, kebab, edit, delete
  document.getElementById("invTableBody")?.addEventListener("click", async (e) => {
    // Stepper
    const stepBtn = e.target.closest("[data-step]");
    if (stepBtn) {
      const id  = Number(stepBtn.dataset.itemId);
      const dir = Number(stepBtn.dataset.step);
      const item = inventario.find(i => i.id === id);
      if (!item) return;
      const newStock = Math.max(0, item.stock + dir);
      if (newStock === item.stock) return;
      item.stock = newStock;
      const valEl = document.getElementById(`invStepVal_${id}`);
      if (valEl) valEl.textContent = newStock;
      const card = stepBtn.closest(".inv-card");
      if (card) {
        const state = invStockState(item);
        card.className = `inv-card ${{ "ok":"stock-ok","low":"stock-low","none":"stock-none","used-ok":"stock-used-ok","used-sold":"stock-used-sold" }[state]}`;
      }
      stepBtn.closest(".inv-stepper")?.querySelector("[data-step='-1']")?.toggleAttribute("disabled", newStock <= 0);
      await dbUpsertItem(item);
      invUpdateKpis();
      return;
    }

    // Kebab toggle
    const kebabBtn = e.target.closest("[data-inv-kebab]");
    if (kebabBtn) {
      e.stopPropagation();
      const id = kebabBtn.dataset.invKebab;
      const menu = document.getElementById(`invMenu_${id}`);
      const wasOpen = menu?.classList.contains("open");
      closeAllInvMenus();
      if (menu && !wasOpen) menu.classList.add("open");
      return;
    }

    // Sell
    const sellBtn = e.target.closest("[data-inv-sell]");
    if (sellBtn) {
      closeAllInvMenus();
      const item = inventario.find(i => i.id === Number(sellBtn.dataset.invSell));
      if (item) openInvSellModal(item);
      return;
    }

    // Edit
    const editBtn = e.target.closest("[data-inv-edit]");
    if (editBtn) {
      closeAllInvMenus();
      const item = inventario.find(i => i.id === Number(editBtn.dataset.invEdit));
      if (item) openInvModal(item);
      return;
    }

    // Delete
    const delBtn = e.target.closest("[data-inv-del]");
    if (delBtn) {
      closeAllInvMenus();
      openInvDeleteModal(Number(delBtn.dataset.invDel), delBtn.dataset.invNombre);
    }
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

function formatFechaLarga(fecha) {
  if (!fecha) return "";
  const [y, mo, d] = fecha.split("-").map(Number);
  const dias = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"];
  const meses = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  const dt = new Date(y, mo - 1, d);
  return `${dias[dt.getDay()]} ${d} ${meses[mo - 1]}`;
}

// reparacionId presente → automático (generado por el flujo de reparaciones)
const MOV_CAT_COLOR = {
  "Anticipo":            "mcc-blue",
  "Reparación":          "mcc-green",
  "Venta":               "mcc-violet",
  "Otro ingreso":        "mcc-gray",
  "Gasto de reparación": "mcc-amber",
  "Compra de stock":     "mcc-slate",
  "Gasto operativo":     "mcc-red",
  "Retiro":              "mcc-gray",
};

const MOV_CAT_ICON = {
  "Anticipo":            `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  "Reparación":          `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  "Venta":               `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
  "Otro ingreso":        `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>`,
  "Gasto de reparación": `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  "Compra de stock":     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>`,
  "Gasto operativo":     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  "Retiro":              `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
};

const LOCK_ICO = `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;

function renderMovRow(m) {
  const esIngreso = m.tipo === "ingreso";
  const esAuto    = !!m.reparacionId;
  const signo     = esIngreso ? "+" : "−";
  const clrClass  = esIngreso ? "mov-pos" : "mov-neg";
  const cat       = m.categoria || "";
  const cc        = MOV_CAT_COLOR[cat] || "mcc-gray";
  const ico       = MOV_CAT_ICON[cat]  || "";

  const repChip = esAuto
    ? `<a class="mov-rep-chip" href="editar-reparacion.html?id=${m.reparacionId}" title="Ver reparación #${m.reparacionId}">#${m.reparacionId}</a>`
    : "";
  const lockChip = esAuto
    ? `<span class="mov-lock" title="Generado por una reparación — editá desde la reparación">${LOCK_ICO} automático</span>`
    : "";

  const kebab = esAuto
    ? `<button class="mov-kebab-btn" disabled title="Generado por una reparación — editá desde la reparación">⋯</button>`
    : `<div class="mov-kebab">
        <button class="mov-kebab-btn" data-kebab="${m.id}" type="button">⋯</button>
        <div class="mov-menu" id="movMenu_${m.id}">
          <button class="mov-menu-item" data-edit-mov="${m.id}" type="button">Editar</button>
          <button class="mov-menu-item danger" data-delete-mov="${m.id}" type="button">Eliminar</button>
        </div>
      </div>`;

  return `<div class="mov-row ${esAuto ? "mov-row-auto" : "mov-row-manual"}" data-mov-id="${m.id}">
    <div class="mov-row-ico ${cc}">${ico}</div>
    <div class="mov-row-body">
      <span class="mov-row-desc">${escapeHtml(m.descripcion)}</span>
      <div class="mov-row-chips">
        <span class="mov-cat-chip ${cc}">${escapeHtml(cat)}</span>
        ${repChip}${lockChip}
      </div>
    </div>
    <div class="mov-row-right">
      <span class="mov-row-monto ${clrClass}">${signo} ${formatMoney(m.monto)}</span>
      ${kebab}
    </div>
  </div>`;
}

function renderMovTable(filtered) {
  const container = document.getElementById("movTableBody");
  if (!container) return;
  if (!filtered.length) {
    container.innerHTML = `<div class="mov-empty">Sin movimientos para este período.</div>`;
    return;
  }

  // Agrupar por fecha (orden descendente)
  const groups = {};
  filtered.forEach(m => {
    const d = m.fecha || "0000-00-00";
    if (!groups[d]) groups[d] = [];
    groups[d].push(m);
  });

  const html = Object.keys(groups).sort((a, b) => b.localeCompare(a)).map(date => {
    const movs = groups[date];
    const sub  = movs.reduce((s, m) => s + (m.tipo === "ingreso" ? m.monto : -m.monto), 0);
    const subCls = sub >= 0 ? "mov-pos" : "mov-neg";
    const subStr = `${sub >= 0 ? "+" : "−"} ${formatMoney(Math.abs(sub))}`;
    return `<div class="mov-day-group">
      <div class="mov-day-head">
        <span class="mov-day-date">${formatFechaLarga(date)}</span>
        <span class="mov-day-sub ${subCls}">${subStr}</span>
      </div>
      ${movs.map(renderMovRow).join("")}
    </div>`;
  }).join("");

  container.innerHTML = html;
}

function renderMovSummary(filtered) {
  const ing  = filtered.filter(m => m.tipo === "ingreso");
  const egr  = filtered.filter(m => m.tipo === "egreso");
  const ingresos  = ing.reduce((s, m) => s + m.monto, 0);
  const egresos   = egr.reduce((s, m) => s + m.monto, 0);
  const resultado = ingresos - egresos;
  const el = id => document.getElementById(id);
  if (el("movTotalIngresos")) el("movTotalIngresos").textContent = formatMoney(ingresos);
  if (el("movTotalEgresos"))  el("movTotalEgresos").textContent  = formatMoney(egresos);
  if (el("movCountIngresos")) el("movCountIngresos").textContent = `${ing.length} movimiento${ing.length !== 1 ? "s" : ""}`;
  if (el("movCountEgresos"))  el("movCountEgresos").textContent  = `${egr.length} movimiento${egr.length !== 1 ? "s" : ""}`;
  if (el("movCountTotal"))    el("movCountTotal").textContent    = `${filtered.length} en total`;
  if (el("movResultado")) {
    el("movResultado").textContent = formatMoney(resultado);
    el("movResultado").className   = "mov-result-val " + (resultado >= 0 ? "mov-pos" : "mov-neg");
  }
}

function getMovFiltered() {
  const mes  = document.getElementById("movMesSelect")?.value;
  const anio = document.getElementById("movAnioSelect")?.value;
  const cat  = document.getElementById("movCatFilter")?.value || "";
  const q    = (document.getElementById("movSearch")?.value || "").toLowerCase().trim();
  const tipo = document.querySelector(".mov-seg-btn.active")?.dataset.tipo || "";
  return movimientos.filter(m => {
    if (!m.fecha) return false;
    const [y, mo] = m.fecha.split("-");
    if (mes  && mo !== mes)  return false;
    if (anio && y  !== anio) return false;
    if (cat  && m.categoria !== cat) return false;
    if (tipo && m.tipo !== tipo) return false;
    if (q    && !(m.descripcion || "").toLowerCase().includes(q)) return false;
    return true;
  });
}

function renderMov() {
  const filtered = getMovFiltered();
  renderMovSummary(filtered);
  renderMovTable(filtered);
}

let _editingMovId = null;

function _setMovTipo(tipo) {
  document.querySelectorAll(".mov-tipo-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.tipo === tipo);
  });
  const catSel = document.getElementById("movCategoria");
  if (!catSel) return;
  if (tipo === "ingreso") {
    catSel.innerHTML = CATEGORIAS_INGRESO.map(c => `<option value="${c}">${c}</option>`).join("");
  } else {
    catSel.innerHTML = CATEGORIAS_EGRESO.map(c => `<option value="${c}">${c}</option>`).join("");
  }
}

function openMovModal(mov = null) {
  const modal = document.getElementById("movModal");
  const form  = document.getElementById("movForm");
  const title = document.getElementById("movModalTitle");
  if (!modal || !form) return;

  form.reset();
  _editingMovId = mov ? mov.id : null;

  if (title) title.textContent = mov ? "Editar movimiento" : "Nuevo movimiento";

  const tipoInicial = mov ? mov.tipo : "ingreso";
  _setMovTipo(tipoInicial);

  if (mov) {
    const catSel = document.getElementById("movCategoria");
    if (catSel) catSel.value = mov.categoria;
    const descEl = document.getElementById("movDescripcion");
    if (descEl) descEl.value = mov.descripcion;
    const montoEl = document.getElementById("movMonto");
    if (montoEl) montoEl.value = mov.monto;
    const fechaEl = document.getElementById("movFecha");
    if (fechaEl) fechaEl.value = mov.fecha;
  } else {
    const fechaEl = document.getElementById("movFecha");
    if (fechaEl) fechaEl.value = today;
  }

  modal.style.display = "flex";
}

function closeMovModal() {
  const modal = document.getElementById("movModal");
  if (modal) modal.style.display = "none";
  _editingMovId = null;
}

function showMovToast(msg) {
  const t = document.getElementById("movToast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2400);
}

function _closeAllMovMenus() {
  document.querySelectorAll(".mov-menu.open").forEach(m => m.classList.remove("open"));
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

  // Buscador con debounce leve
  let _searchTimer;
  document.getElementById("movSearch")?.addEventListener("input", () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(renderMov, 180);
  });

  // Segmentado Todos / Ingresos / Egresos
  document.querySelectorAll(".mov-seg-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mov-seg-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderMov();
    });
  });

  // Toggle tipo en modal
  document.getElementById("movTipoToggle")?.addEventListener("click", e => {
    const btn = e.target.closest(".mov-tipo-btn");
    if (!btn) return;
    _setMovTipo(btn.dataset.tipo);
  });

  document.getElementById("newMovBtn")?.addEventListener("click", () => openMovModal());
  document.getElementById("closeMovModal")?.addEventListener("click", closeMovModal);
  document.getElementById("movModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("movModal")) closeMovModal();
  });

  // Guardar (nuevo o edición)
  document.getElementById("movForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    const fecha       = document.getElementById("movFecha")?.value;
    const descripcion = document.getElementById("movDescripcion")?.value.trim();
    const categoria   = document.getElementById("movCategoria")?.value;
    const monto       = Number(document.getElementById("movMonto")?.value || 0);
    if (!descripcion || !monto || !categoria) return;
    const tipo = CATEGORIA_TIPO[categoria] || "egreso";

    if (_editingMovId) {
      const updated = await dbUpdateMovimiento({ id: _editingMovId, fecha, descripcion, categoria, tipo, monto, reparacionId: null });
      if (updated) {
        movimientos = movimientos.map(m => m.id === _editingMovId ? updated : m);
        renderMov();
        showMovToast("Movimiento actualizado");
      }
    } else {
      const saved = await dbInsertMovimiento({ fecha, descripcion, categoria, tipo, monto, reparacionId: null });
      if (saved) {
        movimientos = [saved, ...movimientos];
        renderMov();
        showMovToast("Movimiento guardado");
      }
    }
    closeMovModal();
  });

  // Clicks en la lista: kebab, editar, eliminar
  document.getElementById("movTableBody")?.addEventListener("click", async e => {
    // Kebab toggle
    const kebabBtn = e.target.closest("[data-kebab]");
    if (kebabBtn) {
      e.stopPropagation();
      const id   = kebabBtn.dataset.kebab;
      const menu = document.getElementById(`movMenu_${id}`);
      const isOpen = menu?.classList.contains("open");
      _closeAllMovMenus();
      if (!isOpen && menu) menu.classList.add("open");
      return;
    }

    // Editar
    const editBtn = e.target.closest("[data-edit-mov]");
    if (editBtn) {
      _closeAllMovMenus();
      const id  = Number(editBtn.dataset.editMov);
      const mov = movimientos.find(m => m.id === id);
      if (mov) openMovModal(mov);
      return;
    }

    // Eliminar
    const delBtn = e.target.closest("[data-delete-mov]");
    if (delBtn) {
      _closeAllMovMenus();
      if (!confirm("¿Eliminar este movimiento?")) return;
      const id = Number(delBtn.dataset.deleteMov);
      await dbDeleteMovimiento(id);
      movimientos = movimientos.filter(m => m.id !== id);
      renderMov();
      showMovToast("Movimiento eliminado");
      return;
    }
  });

  // Cerrar menús al hacer click fuera
  document.addEventListener("click", e => {
    if (!e.target.closest(".mov-kebab")) _closeAllMovMenus();
  });
}

// ===== POR COBRAR =====

function initPorCobrar() {
  if (!document.getElementById("pcList")) return;

  // Mismo cálculo que renderReportsDashboard
  const paidForRep = id => movimientos
    .filter(m => Number(m.reparacionId) === Number(id) && m.tipo === "ingreso")
    .reduce((s, m) => s + m.monto, 0);

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  // Campo incobrable no existe en DB — se persiste en localStorage
  // TODO: agregar columna `incobrable boolean default false` en la tabla reparaciones
  const isIncobrable = id => localStorage.getItem(`fixtrack_incobrable_${id}`) === "1";
  const setIncobrable = id => localStorage.setItem(`fixtrack_incobrable_${id}`, "1");

  function buildDeudas() {
    const result = [];
    for (const r of repairs) {
      if (r.estado === "Cancelado" || r.estado === "En espera") continue;
      if (isIncobrable(r.id)) continue;
      const precio = r.cierre?.costoFinal || r.costoAproximado || 0;
      if (!precio) continue;
      const pagado = paidForRep(r.id);
      const saldo = precio - pagado;
      if (saldo <= 0) continue;

      // Fecha cobrable: finalización → entregaReal → ingreso (fallback)
      const fechaStr = r.cierre?.fechaFinalizacion || r.fechaEntregaReal || r.fechaIngreso || "";
      const fechaCobrableUsada = r.cierre?.fechaFinalizacion ? "finalizacion"
        : r.fechaEntregaReal ? "entregaReal" : "ingreso";
      const fechaCobrable = fechaStr ? new Date(`${fechaStr}T00:00:00`) : todayDate;
      const dias = Math.floor((todayDate - fechaCobrable) / 86400000);

      const bucket = dias >= 60 ? "60+" : dias >= 31 ? "31-60" : "0-30";
      const esListo = r.estado === "Finalizado";

      result.push({ r, precio, pagado, saldo, dias, bucket, esListo, fechaCobrableUsada });
    }
    result.sort((a, b) => b.dias - a.dias);
    return result;
  }

  function initials(name) {
    return (name || "?").split(" ").slice(0, 2).map(w => w[0]?.toUpperCase() || "").join("");
  }

  function renderSummary(deudas) {
    const total    = deudas.reduce((s, d) => s + d.saldo, 0);
    const vencido  = deudas.filter(d => d.bucket !== "0-30").reduce((s, d) => s + d.saldo, 0);
    const red      = deudas.filter(d => d.bucket === "60+").reduce((s, d) => s + d.saldo, 0);
    const amber    = deudas.filter(d => d.bucket === "31-60").reduce((s, d) => s + d.saldo, 0);
    const green    = deudas.filter(d => d.bucket === "0-30").reduce((s, d) => s + d.saldo, 0);

    const el = id => document.getElementById(id);
    if (el("pcTotal"))    el("pcTotal").textContent    = formatMoney(total);
    if (el("pcTotalSub")) el("pcTotalSub").textContent = `${deudas.length} deuda${deudas.length !== 1 ? "s" : ""} abierta${deudas.length !== 1 ? "s" : ""}`;
    if (el("pcCount"))    el("pcCount").textContent    = deudas.length;
    if (el("pcCountSub")) el("pcCountSub").textContent = `equipo${deudas.length !== 1 ? "s" : ""} pendiente${deudas.length !== 1 ? "s" : ""}`;
    if (el("pcOld"))      el("pcOld").textContent      = formatMoney(vencido);
    if (el("pcOldSub"))   el("pcOldSub").textContent   = `${deudas.filter(d => d.bucket !== "0-30").length} caso${deudas.filter(d => d.bucket !== "0-30").length !== 1 ? "s" : ""}`;

    // Barra
    const pct = v => total > 0 ? ((v / total) * 100).toFixed(1) + "%" : "0%";
    if (el("pcSegRed"))   el("pcSegRed").style.width   = pct(red);
    if (el("pcSegAmber")) el("pcSegAmber").style.width  = pct(amber);
    if (el("pcSegGreen")) el("pcSegGreen").style.width  = pct(green);
    if (el("pcLegRed"))   el("pcLegRed").textContent   = `+60 días — ${formatMoney(red)}`;
    if (el("pcLegAmber")) el("pcLegAmber").textContent  = `31–60 días — ${formatMoney(amber)}`;
    if (el("pcLegGreen")) el("pcLegGreen").textContent  = `Hasta 30 días — ${formatMoney(green)}`;
  }

  function renderRow(d) {
    const { r, precio, pagado, saldo, dias, bucket, esListo } = d;
    const daysCls  = bucket === "60+" ? "pc-days-red" : bucket === "31-60" ? "pc-days-amber" : "pc-days-green";
    const daysLbl  = `${dias} día${dias !== 1 ? "s" : ""}`;
    const estadoPill = esListo
      ? `<span class="pill done" style="font-size:10px">Listo · sin retirar</span>`
      : `<span class="pill active" style="font-size:10px">En curso</span>`;
    const senaChip = pagado > 0
      ? `<span class="pc-sena-chip">señó ${formatMoney(pagado)}</span>`
      : "";
    const equipo = [r.marca, r.modelo].filter(Boolean).join(" ") || r.dispositivo || "Equipo";
    const tel = (r.telefono || "").replace(/\D/g, "");
    const waBtn = tel
      ? `<button class="pc-btn-wa" data-wa-tel="${tel}" data-wa-rep="${r.id}" title="Recordar por WhatsApp">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
        </button>`
      : "";

    return `<div class="pc-row" data-rep-id="${r.id}">
      <div class="pc-avatar">${escapeHtml(initials(r.cliente))}</div>
      <div class="pc-row-body">
        <div class="pc-row-name">${escapeHtml(r.cliente)}</div>
        <div class="pc-row-meta">
          ${estadoPill}
          <span class="pc-row-equipo">${escapeHtml(equipo)}</span>
          <a class="mov-rep-chip" href="editar-reparacion.html?id=${r.id}">#${r.id}</a>
          <span class="pc-days-chip ${daysCls}">${daysLbl}</span>
          ${senaChip}
        </div>
      </div>
      <div class="pc-row-right">
        <div class="pc-saldo">
          <span class="pc-saldo-val">${formatMoney(saldo)}</span>
          <span class="pc-saldo-total">de ${formatMoney(precio)}</span>
        </div>
        <div class="pc-actions">
          ${waBtn}
          <button class="pc-btn-cobrar" data-cobrar="${r.id}" data-saldo="${saldo}" data-cliente="${escapeHtml(r.cliente)}" data-equipo="${escapeHtml(equipo)}">Cobrar</button>
          <div class="pc-kebab">
            <button class="pc-kebab-btn" data-pc-kebab="${r.id}" type="button">⋯</button>
            <div class="pc-menu" id="pcMenu_${r.id}">
              <a class="pc-menu-item" href="editar-reparacion.html?id=${r.id}">Ver reparación</a>
              <button class="pc-menu-item danger" data-incobrable="${r.id}" type="button">Marcar incobrable</button>
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  const BUCKETS = [
    { key: "60+",   label: "+60 días",     dotCls: "pc-seg-red",   subCls: "pc-amber" },
    { key: "31-60", label: "31–60 días",   dotCls: "pc-seg-amber", subCls: "pc-amber" },
    { key: "0-30",  label: "Hasta 30 días",dotCls: "pc-seg-green", subCls: "mov-pos"  },
  ];

  function renderList(deudas) {
    const container = document.getElementById("pcList");
    if (!container) return;
    if (!deudas.length) {
      container.innerHTML = `<div class="pc-empty">¡Todo al día! No hay saldos pendientes.</div>`;
      return;
    }

    const html = BUCKETS.map(({ key, label, dotCls, subCls }) => {
      const grupo = deudas.filter(d => d.bucket === key);
      if (!grupo.length) return "";
      const subtotal = grupo.reduce((s, d) => s + d.saldo, 0);
      return `<div class="pc-bucket">
        <div class="pc-bucket-head">
          <span class="pc-leg-dot pc-bucket-dot ${dotCls}"></span>
          <span class="pc-bucket-title">${label}</span>
          <span class="pc-bucket-count">${grupo.length} caso${grupo.length !== 1 ? "s" : ""}</span>
          <span class="pc-bucket-sub ${subCls}">${formatMoney(subtotal)}</span>
        </div>
        ${grupo.map(renderRow).join("")}
      </div>`;
    }).join("");

    container.innerHTML = html;
  }

  function getFiltered(deudas) {
    const q      = (document.getElementById("pcSearch")?.value || "").toLowerCase().trim();
    const bucket = document.querySelector(".mov-seg-btn.active[data-bucket]")?.dataset.bucket || "";
    return deudas.filter(d => {
      if (bucket === "31-60" && d.bucket === "0-30") return false;
      if (bucket === "60+"   && d.bucket !== "60+")  return false;
      if (q && ![d.r.cliente, d.r.marca, d.r.modelo, String(d.r.id)].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }

  let _deudas = buildDeudas();

  function render() {
    const filtered = getFiltered(_deudas);
    renderSummary(filtered);
    renderList(filtered);
  }

  render();

  // Buscador
  let _pcSearchTimer;
  document.getElementById("pcSearch")?.addEventListener("input", () => {
    clearTimeout(_pcSearchTimer);
    _pcSearchTimer = setTimeout(render, 180);
  });

  // Segmentado
  document.querySelectorAll(".mov-seg-btn[data-bucket]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".mov-seg-btn[data-bucket]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      render();
    });
  });

  // Kebab
  function closeAllPcMenus() {
    document.querySelectorAll(".pc-menu.open").forEach(m => m.classList.remove("open"));
  }
  document.addEventListener("click", e => {
    if (!e.target.closest(".pc-kebab")) closeAllPcMenus();
  });

  // Modal cobrar
  let _cobrarRepId = null;

  function showPcToast(msg) {
    const t = document.getElementById("pcToast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2400);
  }

  document.getElementById("pcList")?.addEventListener("click", async e => {
    // Kebab toggle
    const kbtn = e.target.closest("[data-pc-kebab]");
    if (kbtn) {
      e.stopPropagation();
      const id   = kbtn.dataset.pcKebab;
      const menu = document.getElementById(`pcMenu_${id}`);
      const isOpen = menu?.classList.contains("open");
      closeAllPcMenus();
      if (!isOpen && menu) menu.classList.add("open");
      return;
    }

    // Marcar incobrable
    const incobrableBtn = e.target.closest("[data-incobrable]");
    if (incobrableBtn) {
      closeAllPcMenus();
      const id = incobrableBtn.dataset.incobrable;
      if (!confirm("¿Marcar esta deuda como incobrable? Se quitará de la lista (solo en este dispositivo).")) return;
      setIncobrable(id);
      _deudas = buildDeudas();
      render();
      showPcToast("Marcada como incobrable");
      return;
    }

    // WhatsApp
    const waBtn = e.target.closest("[data-wa-tel]");
    if (waBtn) {
      const tel   = waBtn.dataset.waTel;
      const repId = waBtn.dataset.waRep;
      tryWhatsApp(() => {
        const rep   = repairs.find(r => Number(r.id) === Number(repId));
        const equipo = rep ? `${rep.marca} ${rep.modelo}`.trim() : "tu equipo";
        const saldo  = _deudas.find(d => Number(d.r.id) === Number(repId))?.saldo || 0;
        const msg    = encodeURIComponent(`Hola! Te recuerdo que tenés un saldo pendiente de ${formatMoney(saldo)} por la reparación de tu ${equipo} en nuestro taller. ¿Cuándo podés pasar a buscarlo? Saludos, 1Fixtrack`);
        const a = document.createElement('a'); a.href = `https://wa.me/${tel}?text=${msg}`; a.target = '_blank'; a.rel = 'noopener'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      });
      return;
    }

    // Cobrar
    const cobrarBtn = e.target.closest("[data-cobrar]");
    if (cobrarBtn) {
      _cobrarRepId = Number(cobrarBtn.dataset.cobrar);
      const saldo  = Number(cobrarBtn.dataset.saldo);
      const cliente = cobrarBtn.dataset.cliente;
      const equipo  = cobrarBtn.dataset.equipo;
      document.getElementById("pcModalTitle").textContent = "Registrar cobro";
      document.getElementById("pcModalBody").innerHTML =
        `<strong>${escapeHtml(cliente)}</strong> — ${escapeHtml(equipo)} · Saldo: <strong>${formatMoney(saldo)}</strong>`;
      document.getElementById("pcMonto").value = saldo;
      document.getElementById("pcMedio").value = "Efectivo";
      document.getElementById("pcModal").style.display = "flex";
      return;
    }
  });

  document.getElementById("pcModalClose")?.addEventListener("click", () => {
    document.getElementById("pcModal").style.display = "none";
  });
  document.getElementById("pcModal")?.addEventListener("click", e => {
    if (e.target === document.getElementById("pcModal")) document.getElementById("pcModal").style.display = "none";
  });

  document.getElementById("pcForm")?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!_cobrarRepId) return;
    const monto  = Number(document.getElementById("pcMonto")?.value || 0);
    const medio  = document.getElementById("pcMedio")?.value || "Efectivo";
    if (!monto || monto <= 0) return;

    const rep = repairs.find(r => Number(r.id) === _cobrarRepId);
    if (!rep) return;

    const equipo = [rep.marca, rep.modelo].filter(Boolean).join(" ") || rep.dispositivo || "";
    // Reutiliza dbInsertMovimiento — mismo flujo que el cobro al entregar una reparación
    const saved = await dbInsertMovimiento({
      fecha: today,
      descripcion: `Cobro #${rep.id} · ${rep.cliente} — ${equipo} (${medio})`.trim(),
      categoria: "Reparación",
      tipo: "ingreso",
      monto,
      reparacionId: rep.id,
    });

    if (saved) {
      movimientos = [saved, ...movimientos];
      _deudas = buildDeudas();
      render();
      showPcToast(`Cobro de ${formatMoney(monto)} registrado`);
    }

    document.getElementById("pcModal").style.display = "none";
    _cobrarRepId = null;
  });
}
