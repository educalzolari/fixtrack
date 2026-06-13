(function () {
  const inp = document.getElementById('globalSearch');
  const drop = document.getElementById('gsearchDrop');
  if (!inp || !drop) return;

  let debounceTimer;

  function normalize(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function runSearch(q) {
    q = q.trim();
    drop.innerHTML = '';
    if (!q) { drop.classList.remove('open'); return; }

    const repairs = window.repairs || [];
    const terms = normalize(q).split(/\s+/);
    const results = repairs.filter(r => {
      const hay = normalize([r.id, r.cliente, r.marca, r.modelo, r.dispositivo, r.problema].join(' '));
      return terms.every(t => hay.includes(t));
    }).slice(0, 8);

    if (!results.length) {
      drop.innerHTML = '<div class="gsearch-empty">Sin resultados</div>';
      drop.classList.add('open');
      return;
    }

    results.forEach((r, i) => {
      const a = document.createElement('a');
      a.className = 'gsearch-item';
      a.href = `editar-reparacion.html?id=${r.id}`;
      a.tabIndex = 0;
      a.dataset.index = i;
      const device = [r.marca, r.modelo].filter(Boolean).join(' ') || r.dispositivo || '';
      a.innerHTML = `
        <div class="gsearch-item-main">
          <div class="gsearch-item-name">${escapeHtml(r.cliente || '—')}</div>
          <div class="gsearch-item-sub">${escapeHtml(device)}</div>
        </div>
        <span class="gsearch-item-id">#${r.id}</span>`;
      drop.appendChild(a);
    });

    drop.classList.add('open');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  inp.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => runSearch(inp.value), 200);
  });

  inp.addEventListener('keydown', e => {
    if (e.key === 'Escape') { inp.value = ''; drop.classList.remove('open'); inp.blur(); return; }
    if (e.key === 'Enter') {
      const q = inp.value.trim();
      if (q) window.location.href = `reparaciones.html?q=${encodeURIComponent(q)}`;
      return;
    }
    if (e.key === 'ArrowDown') {
      const first = drop.querySelector('.gsearch-item');
      if (first) { e.preventDefault(); first.focus(); }
    }
  });

  drop.addEventListener('keydown', e => {
    const items = [...drop.querySelectorAll('.gsearch-item')];
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && idx < items.length - 1) { e.preventDefault(); items[idx + 1].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); idx > 0 ? items[idx - 1].focus() : inp.focus(); }
    if (e.key === 'Escape') { inp.value = ''; drop.classList.remove('open'); inp.focus(); }
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); inp.focus(); inp.select(); }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#gsearchWrap')) drop.classList.remove('open');
  });

  function onRepairsReady() {
    if (inp.value.trim()) runSearch(inp.value);
  }

  if (window.repairs && window.repairs.length) {
    onRepairsReady();
  } else {
    document.addEventListener('repairsLoaded', onRepairsReady);
  }
})();
