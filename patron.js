(async function () {
  function esc(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));
  const content = document.getElementById("patronContent");

  if (!id) {
    content.innerHTML = '<p class="patron-error">Enlace inválido.</p>';
    return;
  }

  const repair = await dbGetById(id);
  if (!repair) {
    content.innerHTML = '<p class="patron-error">No se encontró la reparación.</p>';
    return;
  }

  content.innerHTML = `
    <div class="patron-info">
      <h2>Hola, ${esc(repair.cliente)}</h2>
      <p>Para reparar tu <strong>${esc(repair.marca)} ${esc(repair.modelo)}</strong> necesitamos los datos de desbloqueo del equipo.</p>
      <p>Completá lo que recuerdes y tocá <strong>Enviar</strong>. Podés completar solo el PIN, solo el patrón, o los dos.</p>
    </div>

    <form id="patronForm" class="patron-form">
      <label>
        PIN o contraseña
        <input name="pin" type="text" autocomplete="off" placeholder="Ej: 1234 (opcional si usás patrón)" />
      </label>

      <div class="pattern-field">
        <div class="pattern-heading">
          <div>
            <span>Patrón de desbloqueo</span>
            <small>Dibujá el recorrido si tu equipo usa patrón.</small>
          </div>
          <button class="ghost-button small-button" id="clearPattern" type="button">Limpiar</button>
        </div>
        <div class="pattern-card">
          <canvas id="patternCanvas" width="240" height="240" aria-label="Dibujar patrón de desbloqueo"></canvas>
        </div>
      </div>

      <div class="form-actions">
        <button class="primary-button" id="submitBtn" type="submit">Enviar</button>
      </div>
    </form>
  `;

  const canvas = document.getElementById("patternCanvas");
  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const gap = size / 4;
  const nodes = Array.from({ length: 9 }, (_, i) => ({
    id: i + 1,
    x: gap * ((i % 3) + 1),
    y: gap * (Math.floor(i / 3) + 1),
  }));

  let selected = [];
  let drawing = false;
  let pointer = null;
  let patronImagen = "";
  let patronSecuencia = "";

  function drawBg() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
  }

  function draw() {
    drawBg();
    if (selected.length) {
      ctx.beginPath();
      selected.forEach((n, i) => (i === 0 ? ctx.moveTo(n.x, n.y) : ctx.lineTo(n.x, n.y)));
      if (drawing && pointer) ctx.lineTo(pointer.x, pointer.y);
      ctx.strokeStyle = "#1487df";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
    }
    nodes.forEach((n) => {
      const sel = selected.some((s) => s.id === n.id);
      ctx.beginPath();
      ctx.arc(n.x, n.y, 19, 0, Math.PI * 2);
      ctx.fillStyle = sel ? "#078ee8" : "#f7fbff";
      ctx.fill();
      ctx.lineWidth = sel ? 5 : 3;
      ctx.strokeStyle = sel ? "#a9dcff" : "#d4dde8";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = sel ? "#ffffff" : "#b5c0cc";
      ctx.fill();
    });
  }

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * size,
      y: ((e.clientY - r.top) / r.height) * size,
    };
  }

  function addNode(pt) {
    const n = nodes.find(
      (n) => Math.hypot(n.x - pt.x, n.y - pt.y) <= 28 && !selected.some((s) => s.id === n.id)
    );
    if (n) selected.push(n);
  }

  function saveImg() {
    if (!selected.length) {
      patronImagen = "";
      patronSecuencia = "";
      return;
    }
    pointer = null;
    draw();
    patronImagen = canvas.toDataURL("image/png");
    patronSecuencia = selected.map((n) => n.id).join("-");
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    selected = [];
    drawing = true;
    pointer = getPos(e);
    addNode(pointer);
    draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    e.preventDefault();
    pointer = getPos(e);
    addNode(pointer);
    draw();
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach((ev) =>
    canvas.addEventListener(ev, () => {
      if (!drawing) return;
      drawing = false;
      saveImg();
    })
  );

  document.getElementById("clearPattern").addEventListener("click", () => {
    selected = [];
    drawing = false;
    pointer = null;
    patronImagen = "";
    patronSecuencia = "";
    draw();
  });

  draw();

  document.getElementById("patronForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pin = e.target.elements.pin.value.trim();

    if (!pin && !patronImagen) {
      alert("Ingresá el PIN o dibujá el patrón antes de enviar.");
      return;
    }

    const btn = document.getElementById("submitBtn");
    btn.disabled = true;
    btn.textContent = "Guardando...";

    await dbUpsert({
      ...repair,
      passwordDispositivo: pin || repair.passwordDispositivo,
      patronImagen: patronImagen || repair.patronImagen,
      patronSecuencia: patronSecuencia || repair.patronSecuencia,
    });

    content.innerHTML = `
      <div class="patron-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <h2>¡Listo!</h2>
        <p>Los datos fueron enviados correctamente. Ya podés cerrar esta ventana.</p>
      </div>
    `;
  });
})();
