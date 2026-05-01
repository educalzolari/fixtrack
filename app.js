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
const menuToggle = $(".menu-toggle");
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
  if (status === "Entregado") return "Finalizado";
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
    currentDate.textContent = new Intl.DateTimeFormat("es-AR").format(new Date());
  }
}

function getStatusClass(status) {
  if (status === "Activo") return "active";
  if (status === "Finalizado") return "done";
  if (status === "Cancelado") return "cancelled";
  return "waiting";
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
      .filter((repair) => repair.estado === "Finalizado")
      .reduce((sum, repair) => sum + Number(repair.costoAproximado || 0), 0)
  );

  const delta = previousMonth.length
    ? Math.round(((thisMonth.length - previousMonth.length) / previousMonth.length) * 100)
    : thisMonth.length
      ? 100
      : 0;
  monthDelta.textContent = `${delta}%`;
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
          <td>#${repair.id}</td>
          <td>${escapeHtml(repair.cliente)}</td>
          <td>${escapeHtml(repairDeviceLabel(repair))}</td>
          <td><span class="status-pill ${getStatusClass(repair.estado)}">${escapeHtml(repair.estado)}</span></td>
          <td>${formatMoney(repair.costoAproximado)}</td>
        </tr>
      `
    )
    .join("");
}

function renderTable() {
  if (!tableBody) return;

  const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
  const status = statusFilter ? statusFilter.value : "todos";
  const filtered = repairs.filter((repair) => {
    const text = `${repair.cliente} ${repair.dispositivo} ${repair.marca} ${repair.modelo} ${repair.identificador}`.toLowerCase();
    const matchesText = !query || text.includes(query);
    const matchesStatus = status === "todos" || repair.estado === status;
    return matchesText && matchesStatus;
  });

  if (!filtered.length) {
    tableBody.innerHTML = `<tr class="empty-row"><td colspan="6">No hay reparaciones para mostrar.</td></tr>`;
    return;
  }

  tableBody.innerHTML = filtered
    .map(
      (repair) => `
        <tr class="clickable-row" data-edit-id="${repair.id}">
          <td>
            <div class="cell-stack id-stack">
              <strong>#${repair.id}</strong>
              <span>Reparacion</span>
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
            </div>
          </td>
          <td>${formatDate(repair.fechaIngreso)}</td>
          <td><span class="status-pill ${getStatusClass(repair.estado)}">${escapeHtml(repair.estado)}</span></td>
          <td class="action-cell">
            <a class="table-action edit-action" href="editar-reparacion.html?id=${repair.id}" aria-label="Editar reparacion #${repair.id}">Editar</a>
            <button class="table-action delete-action" data-id="${repair.id}" aria-label="Eliminar reparacion #${repair.id}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </td>
        </tr>
      `
    )
    .join("");
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
    cierre: existing.cierre || null,
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
  const costoReparacion = Number(repair?.costoAproximado || 0);

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
  if (!expenseUnitPrice || !expenseQuantity || !expenseTotal) return;
  const total = Number(expenseUnitPrice.value || 0) * Number(expenseQuantity.value || 0);
  expenseTotal.value = formatMoney(total);
}

function openExpenseModal() {
  if (!expenseModal || !expenseForm) return;
  expenseForm.reset();
  if (expenseQuantity) expenseQuantity.value = 1;
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
    <span class="status-pill ${getStatusClass(repair.estado)}">${escapeHtml(repair.estado)}</span>
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

function setupEditForm() {
  if (!editForm) return;

  const repair = getRepairFromUrl();
  if (!repair) {
    editForm.innerHTML = `<div class="empty-ticket wide">No se encontro la reparacion seleccionada.</div>`;
    renderEditSummary(null);
    return;
  }

  fillFormFromRepair(editForm, repair);
  editingExpenses = [...(repair.gastos || [])];
  if (editTitle) editTitle.textContent = `Reparacion #${repair.id}`;
  renderEditSummary(repair);
  renderSavedPatternPreview(repair.patronImagen);
  renderExpensesTable(repair);

  if (editForm.elements.costoAproximado) {
    editForm.elements.costoAproximado.addEventListener("input", () => {
      renderExpensesTable(getEditRepairPreview());
    });
  }

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    syncExpensesInput();
    const updatedRepair = formToRepair(new FormData(editForm), repair);
    await dbUpsert(updatedRepair);
    repairs = repairs.map((item) => (Number(item.id) === Number(updatedRepair.id) ? updatedRepair : item));
    window.location.href = "reparaciones.html";
  });

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

function setupExpenses() {
  if (!expensesTable && !expenseModal) return;

  if (openExpenseModalButton) openExpenseModalButton.addEventListener("click", openExpenseModal);
  if (closeExpenseModalButton) closeExpenseModalButton.addEventListener("click", closeExpenseModal);
  if (cancelExpenseModalButton) cancelExpenseModalButton.addEventListener("click", closeExpenseModal);
  if (expenseUnitPrice) expenseUnitPrice.addEventListener("input", updateExpenseTotalPreview);
  if (expenseQuantity) expenseQuantity.addEventListener("input", updateExpenseTotalPreview);

  if (expenseModal) {
    expenseModal.addEventListener("click", (event) => {
      if (event.target === expenseModal) closeExpenseModal();
    });
  }

  if (expenseForm) {
    expenseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(expenseForm);
      const montoUnitario = Number(formData.get("montoUnitario") || 0);
      const cantidad = Number(formData.get("cantidad") || 0);
      editingExpenses = [
        ...editingExpenses,
        {
          id: Date.now(),
          concepto: formData.get("concepto").trim(),
          montoUnitario,
          cantidad,
          total: montoUnitario * cantidad,
        },
      ];
      const repair = getEditRepairPreview();
      renderExpensesTable(repair);
      renderEditSummary(repair);
      closeExpenseModal();
    });
  }

  if (expensesTable) {
    expensesTable.addEventListener("click", (event) => {
      const button = event.target.closest("[data-delete-expense]");
      if (!button) return;
      const id = Number(button.dataset.deleteExpense);
      editingExpenses = editingExpenses.filter((expense) => Number(expense.id) !== id);
      const repair = getEditRepairPreview();
      renderExpensesTable(repair);
      renderEditSummary(repair);
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

  function drawBackground() {
    context.clearRect(0, 0, size, size);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
  }

  function drawPattern() {
    drawBackground();

    if (selected.length) {
      context.beginPath();
      selected.forEach((node, index) => {
        if (index === 0) context.moveTo(node.x, node.y);
        else context.lineTo(node.x, node.y);
      });

      if (drawing && pointer) {
        context.lineTo(pointer.x, pointer.y);
      }

      context.strokeStyle = "#1487df";
      context.lineWidth = 10;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.stroke();
    }

    nodes.forEach((node) => {
      const isSelected = selected.some((item) => item.id === node.id);
      context.beginPath();
      context.arc(node.x, node.y, 19, 0, Math.PI * 2);
      context.fillStyle = isSelected ? "#078ee8" : "#f7fbff";
      context.fill();
      context.lineWidth = isSelected ? 5 : 3;
      context.strokeStyle = isSelected ? "#a9dcff" : "#d4dde8";
      context.stroke();

      context.beginPath();
      context.arc(node.x, node.y, 5, 0, Math.PI * 2);
      context.fillStyle = isSelected ? "#ffffff" : "#b5c0cc";
      context.fill();
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

  if (clearPatternButton) clearPatternButton.addEventListener("click", clearPattern);
  if (form) form.addEventListener("reset", () => window.setTimeout(clearPattern, 0));

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
  const lines = [
    `*1Fix!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Tu equipo esta listo para retirar.`,
    ``,
    `Orden: #${repair.id}`,
    `Equipo: ${repair.marca} ${repair.modelo}`,
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
    `*1Fix!*`,
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

function sendWhatsAppOrder(repair) {
  if (!repair.telefono) return;
  const phone = formatPhoneForWhatsApp(repair.telefono);
  if (!phone) return;
  const orderUrl = `${window.location.origin}/orden.html?id=${repair.id}`;
  const lines = [
    `*1Fix!*`,
    ``,
    `Hola ${repair.cliente}`,
    ``,
    `Tu equipo fue recibido en 1Fix!.`,
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
    const repair = createRepair(new FormData(form));
    await dbInsert(repair);
    repairs = [repair, ...repairs];
    sendWhatsAppOrder(repair);
    form.reset();
    renderAll();
    window.location.href = "reparaciones.html";
  });
}

setupExpenses();
setupFinishFlow();

if (searchInput) searchInput.addEventListener("input", renderTable);
if (statusFilter) statusFilter.addEventListener("change", renderTable);

if (tableBody) {
  tableBody.addEventListener("click", async (event) => {
    const btn = event.target.closest(".delete-action");
    if (!btn) return;
    const id = Number(btn.dataset.id);
    const repair = repairs.find((r) => Number(r.id) === id);
    const label = repair ? `#${repair.id} — ${repair.cliente}` : `#${id}`;
    if (!confirm(`¿Eliminar la reparacion ${label}?\n\nEsta accion no se puede deshacer.`)) return;
    await dbDelete(id);
    repairs = repairs.filter((r) => Number(r.id) !== id);
    renderAll();
  });
}

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    document.body.classList.toggle("menu-open");
  });
}

async function initApp() {
  updateDate();
  repairs = await dbLoad();
  setupEditForm();
  setupPatternCanvas();
  renderAll();
  setupReportsDashboard();
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

  const finalized = inMonth.filter((r) => r.estado === "Finalizado");
  const prevFinalized = inPrevMonth.filter((r) => r.estado === "Finalizado");

  const ingresos = finalized.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);
  const prevIngresos = prevFinalized.reduce((s, r) => s + (r.cierre?.costoFinal || r.costoAproximado || 0), 0);

  const gastos = inMonth.reduce((s, r) => s + expensesTotal(r.gastos || []), 0);
  const ganancia = ingresos - gastos;
  const ticketPromedio = finalized.length ? Math.round(ingresos / finalized.length) : 0;

  const clientesNuevos = new Set(inMonth.map((r) => r.cliente.toLowerCase().trim())).size;
  const prevClientesNuevos = new Set(inPrevMonth.map((r) => r.cliente.toLowerCase().trim())).size;

  const porEntregar = repairs.filter((r) => r.estado !== "Finalizado" && r.estado !== "Cancelado").length;

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

  // Ingresos
  setValue("rcIngresosValue", formatMoney(ingresos));
  const ingDelta = fmtDelta(ingresos, prevIngresos);
  setBadge("rcIngresosBadge", ingDelta ?? "Sin datos", ingDelta ? (ingresos >= prevIngresos ? "badge-green" : "badge-red") : "badge-red");

  // Reparaciones completadas
  setValue("rcReparacionesValue", finalized.length);
  const repDelta = fmtDelta(finalized.length, prevFinalized.length);
  setBadge("rcReparacionesBadge", repDelta ?? "0%", finalized.length >= prevFinalized.length ? "badge-green" : "badge-red");

  // Ticket promedio
  setValue("rcTicketValue", formatMoney(ticketPromedio));
  setBadge("rcTicketBadge", `Ventas: ${finalized.length}`, "badge-blue");

  // Clientes nuevos
  setValue("rcClientesValue", clientesNuevos);
  const cliDelta = fmtDelta(clientesNuevos, prevClientesNuevos);
  setBadge("rcClientesBadge", cliDelta ?? "Sin datos", cliDelta ? (clientesNuevos >= prevClientesNuevos ? "badge-green" : "badge-red") : "badge-gray");

  // Gastos
  setValue("rcGastosValue", formatMoney(gastos));
  setBadge("rcGastosBadge", gastos ? formatMoney(gastos) : "Sin datos", gastos ? "badge-gray" : "badge-red");

  // Ganancia
  setValue("rcGananciaValue", formatMoney(ganancia));
  setBadge("rcGananciaBadge", "Gan = Ing-Gas", "badge-blue");

  // Inventario (placeholder)
  setValue("rcInventarioValue", formatMoney(0));
  setBadge("rcInventarioBadge", "Articulos: 0", "badge-gray");

  // Por entregar
  setValue("rcEntregarValue", porEntregar);
  setBadge("rcEntregarBadge", `Pendientes: ${porEntregar}`, "badge-blue");

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
      .filter((r) => r.estado === "Finalizado" && (r.cierre?.fechaFinalizacion === dateStr || r.fechaIngreso === dateStr))
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
          ticks: { font: { family: "Poppins", size: 11 } },
        },
        x: {
          grid: { display: false },
          ticks: { font: { family: "Poppins", size: 11 } },
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
      <td><span class="status-pill ${getStatusClass(r.estado)}">${escapeHtml(r.estado)}</span></td>
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
