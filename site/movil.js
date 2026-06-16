/* ═══════════════════════════════════════════════════════════════════════════
   1FixTrack — motor del video MÓVIL
   Loop de 4 escenas con micro-animaciones. Pausa fuera de viewport.
   Respeta prefers-reduced-motion (muestra estado final, sin avanzar).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.querySelector('.mv-root');
  if (!root) return;
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => root.querySelectorAll(s);

  /* ── scaler ─────────────────────────────────────────────────────────────── */
  const scaler = $('.mv-scaler');
  function fit() {
    const W = 340, pad = 24;
    const host = root.clientWidth;
    const availH = (root.dataset.maxh ? +root.dataset.maxh : window.innerHeight) - 150;
    const s = Math.min(1, (host - pad) / W, availH / 710);
    scaler.style.transform = 'scale(' + s + ')';
    scaler.style.width = W + 'px';
    const sc = scaler.querySelector('.phone');
    if (sc) root.querySelector('.mv-phonewrap').style.height = (710 * s) + 'px';
  }
  addEventListener('resize', fit);

  /* ── helpers ────────────────────────────────────────────────────────────── */
  function tapAt(x, y) {
    const t = $('.tap'); if (!t) return;
    t.style.left = x + 'px'; t.style.top = y + 'px';
    t.classList.remove('go'); void t.offsetWidth; t.classList.add('go');
  }
  function show(sel) { const e = $(sel); if (e) e.classList.add(e.dataset.inclass || 'in'); }

  function setScene(id) {
    $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === id));
  }
  function setCap(k, t, idx) {
    const ck = $('.cap-k'), ct = $('.cap-t');
    if (ck) ck.textContent = k;
    if (ct) { ct.style.opacity = 0; setTimeout(() => { ct.textContent = t; ct.style.opacity = 1; }, 180); }
    $$('.mv-dots i').forEach((d, i) => d.classList.toggle('on', i === idx));
  }

  /* ── reset functions per scene ──────────────────────────────────────────── */
  function resetInstall() {
    $('.sheet').classList.remove('up');
    $('.home').classList.remove('show');
  }
  function resetCargar() {
    $$('#sc-cargar .mf-in').forEach((e) => { e.classList.remove('filled', 'focus'); e.textContent = e.dataset.ph || ''; });
    $$('#sc-cargar .mf-chip').forEach((e) => e.classList.remove('on'));
    $('.m-toast').classList.remove('in');
  }
  function resetWa() {
    $$('#sc-wa .bubble,#sc-wa .chat-sys').forEach((e) => e.classList.remove('in'));
  }
  function resetCfg() {
    $$('#sc-cfg .switch').forEach((e) => e.classList.toggle('on', e.dataset.init === '1'));
    $$('#sc-cfg .cfg-row').forEach((e) => e.classList.remove('hot'));
  }

  /* ── scene timelines (steps run via setTimeout) ─────────────────────────── */
  const SCENES = [
    {
      id: 'install', dur: 7000, cap: ['Paso 01 · Instalar', 'Instalala como app en tu celular — sin pasar por la tienda'],
      reset: resetInstall,
      steps: [
        { at: 700, fn: () => tapAt(250, 470) },
        { at: 1100, fn: () => $('.sheet').classList.add('up') },
        { at: 2600, fn: () => tapAt(170, 612) },
        { at: 2750, fn: () => $('.sheet-btn').style.transform = 'scale(.96)' },
        { at: 3050, fn: () => { $('.sheet-btn').style.transform = ''; $('.sheet').classList.remove('up'); } },
        { at: 3500, fn: () => $('.home').classList.add('show') },
      ],
      still: () => { $('.home').classList.add('show'); },
    },
    {
      id: 'cargar', dur: 7200, cap: ['Paso 02 · Cargar', 'Cargá una reparación en segundos, desde donde estés'],
      reset: resetCargar,
      steps: [
        { at: 500, fn: () => fill('#mf-cli') },
        { at: 1100, fn: () => $('#mf-chip-cel').classList.add('on') },
        { at: 1700, fn: () => fill('#mf-marca') },
        { at: 2200, fn: () => fill('#mf-modelo') },
        { at: 2900, fn: () => fill('#mf-falla') },
        { at: 3700, fn: () => tapAt(170, 640) },
        { at: 3850, fn: () => $('.mf-save').style.transform = 'scale(.97)' },
        { at: 4100, fn: () => { $('.mf-save').style.transform = ''; show('.m-toast'); } },
        { at: 6200, fn: () => $('.m-toast').classList.remove('in') },
      ],
      still: () => { ['#mf-cli', '#mf-marca', '#mf-modelo', '#mf-falla'].forEach(fill); $('#mf-chip-cel').classList.add('on'); show('.m-toast'); },
    },
    {
      id: 'wa', dur: 7000, cap: ['Paso 03 · Avisar', 'El cliente recibe el aviso por WhatsApp, automático'],
      reset: resetWa,
      steps: [
        { at: 500, fn: () => show('#wa-sys') },
        { at: 1100, fn: () => show('#wa-b1') },
        { at: 2300, fn: () => show('#wa-b2') },
        { at: 3700, fn: () => show('#wa-sys2') },
        { at: 4400, fn: () => show('#wa-b3') },
      ],
      still: () => { ['#wa-sys', '#wa-b1', '#wa-b2', '#wa-sys2', '#wa-b3'].forEach(show); },
    },
    {
      id: 'cfg', dur: 6600, cap: ['Paso 04 · Configurar', 'Ajustá estados, notificaciones y parámetros a tu medida'],
      reset: resetCfg,
      steps: [
        { at: 700, fn: () => { tapAt(280, 250); $('#cfg-wa').classList.add('on'); $('#cfg-wa').closest('.cfg-row').classList.add('hot'); } },
        { at: 1500, fn: () => $('#cfg-wa').closest('.cfg-row').classList.remove('hot') },
        { at: 2100, fn: () => { tapAt(280, 318); $('#cfg-auto').classList.add('on'); $('#cfg-auto').closest('.cfg-row').classList.add('hot'); } },
        { at: 2900, fn: () => $('#cfg-auto').closest('.cfg-row').classList.remove('hot') },
        { at: 3700, fn: () => { tapAt(280, 470); $('#cfg-rec').classList.add('on'); $('#cfg-rec').closest('.cfg-row').classList.add('hot'); } },
        { at: 4500, fn: () => $('#cfg-rec').closest('.cfg-row').classList.remove('hot') },
      ],
      still: () => { $$('#sc-cfg .switch').forEach((e) => e.classList.add('on')); },
    },
  ];

  function fill(sel) { const e = $(sel); if (e) { e.textContent = e.dataset.val || e.textContent; e.classList.add('filled'); } }

  /* ── runner ─────────────────────────────────────────────────────────────── */
  let timers = [], i = 0, alive = false;
  function clear() { timers.forEach(clearTimeout); timers = []; }
  function play(idx) {
    clear();
    i = idx % SCENES.length;
    const s = SCENES[i];
    SCENES.forEach((o) => o.reset && o.reset());     // reset all, clean slate
    setScene(s.id);
    setCap(s.cap[0], s.cap[1], i);
    if (reduce) { if (s.still) s.still(); return; }
    s.steps.forEach((st) => timers.push(setTimeout(() => { if (alive) st.fn(); }, st.at)));
    timers.push(setTimeout(() => { if (alive) play(i + 1); }, s.dur));
  }

  // dots: click to jump
  $$('.mv-dots i').forEach((d, idx) => d.addEventListener('click', () => { if (!reduce) { alive = true; play(idx); } }));

  // clock
  function clock() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    $$('[data-clock]').forEach((e) => e.textContent = p(d.getHours()) + ':' + p(d.getMinutes()));
  }
  clock(); setInterval(clock, 20000);

  // visibility gate
  const io = new IntersectionObserver((ents) => {
    ents.forEach((en) => {
      if (en.isIntersecting && !alive) { alive = true; play(0); }
      else if (!en.isIntersecting && alive) { alive = false; clear(); }
    });
  }, { threshold: 0.3 });
  io.observe(root);

  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  addEventListener('load', fit);
})();
