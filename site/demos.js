/* site/demos.js — 1FixTrack demo animations */
(function () {
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Scalers ── */
  function initScalers() {
    document.querySelectorAll('.scaler').forEach(s => {
      function resize() {
        const stage = s.parentElement;
        const sw = stage.clientWidth;
        const dw = +s.dataset.w;
        const dh = +s.dataset.h;
        const scale = sw / dw;
        s.style.width  = dw + 'px';
        s.style.height = dh + 'px';
        s.style.transform = `scale(${scale})`;
        s.style.transformOrigin = 'top left';
        stage.style.height = Math.round(dh * scale) + 'px';
      }
      resize();
      new ResizeObserver(resize).observe(s.parentElement);
    });
  }

  /* ── Clock ── */
  function initClocks() {
    function tick() {
      const d = new Date();
      const t = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
      document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = t; });
    }
    tick();
    setInterval(tick, 60000);
  }

  /* ── Scroll reveal ── */
  function initReveal() {
    if (rm) { document.querySelectorAll('.reveal').forEach(el => el.classList.add('in')); return; }
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  /* ── KPI count-up ── */
  function countUp(el) {
    const to   = +el.dataset.to;
    const money = el.hasAttribute('data-money');
    if (rm) { el.textContent = money ? '$' + to.toLocaleString('es-AR') : to; return; }
    const dur = 1400, t0 = performance.now();
    (function tick(now) {
      const p   = Math.min((now - t0) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      const val  = Math.round(to * ease);
      el.textContent = money ? '$' + val.toLocaleString('es-AR') : val;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ── Cursor helper ── */
  function mv(cursor, x, y) {
    if (!cursor) return;
    cursor.style.left = x + 'px';
    cursor.style.top  = y + 'px';
  }

  /* ── intake demo: form typing ── */
  function runIntake(root) {
    if (rm) return;
    const cursor = root.querySelector('.cursor');
    const toast  = root.querySelector('.aw-toast');
    const fields = [
      { id:'f-cli',    val:'Ángel Tenasio · +54 11 5524-8890', cx:200, cy:198 },
      { id:'f-marca',  val:'Motorola',                          cx:175, cy:264 },
      { id:'f-modelo', val:'Moto E15',                          cx:310, cy:264 },
      { id:'f-prob',   val:'No carga · pin de carga flojo',     cx:200, cy:328 },
    ];
    let step = 0;
    mv(cursor, 420, 80);

    function next() {
      if (step >= fields.length) {
        mv(cursor, 500, 444);
        setTimeout(() => {
          if (toast) toast.classList.add('show');
          setTimeout(() => {
            if (toast) toast.classList.remove('show');
            step = 0;
            fields.forEach(f => {
              const el = root.querySelector('#' + f.id);
              if (el) { el.textContent = el.dataset.ph || ''; el.classList.remove('active'); }
            });
            setTimeout(next, 1400);
          }, 2200);
        }, 600);
        return;
      }
      const f = fields[step];
      mv(cursor, f.cx, f.cy);
      setTimeout(() => {
        const el = root.querySelector('#' + f.id);
        if (!el) { step++; next(); return; }
        el.textContent = '';
        el.classList.add('active');
        let i = 0;
        const chars = f.val.split('');
        (function typeChar() {
          if (i < chars.length) {
            el.textContent += chars[i++];
            setTimeout(typeChar, 26 + Math.random() * 18);
          } else {
            el.classList.remove('active');
            step++;
            setTimeout(next, 380);
          }
        })();
      }, 560);
    }
    setTimeout(next, 900);
  }

  /* ── pipeline demo: kanban card move ── */
  function runPipeline(root) {
    if (rm) return;
    const cursor    = root.querySelector('.cursor');
    const slotE     = root.querySelector('[data-slot="espera"]');
    const slotA     = root.querySelector('[data-slot="activo"]');
    if (!slotE || !slotA) return;
    const card = slotE.querySelector('.kc-trav');
    if (!card) return;
    const rr = root.getBoundingClientRect();

    function loop() {
      if (!slotE.contains(card)) slotE.prepend(card);
      card.classList.add('kc-trav');
      const pill = card.querySelector('.pill');
      if (pill) { pill.className = 'pill sc-espera'; pill.innerHTML = '<span class="pd"></span><span class="pt">En espera</span>'; }

      setTimeout(() => {
        const cr = card.getBoundingClientRect();
        mv(cursor, cr.left - rr.left + 24, cr.top - rr.top + 20);
        setTimeout(() => {
          const ar = slotA.getBoundingClientRect();
          mv(cursor, ar.left - rr.left + 40, ar.top - rr.top + 20);
          setTimeout(() => {
            slotA.prepend(card);
            if (pill) { pill.className = 'pill sc-activo'; pill.innerHTML = '<span class="pd"></span><span class="pt">Activo</span>'; }
            setTimeout(loop, 2800);
          }, 700);
        }, 900);
      }, 1200);
    }
    setTimeout(loop, 900);
  }

  /* ── dash demo: KPI count-up loop ── */
  function runDash(root) {
    const kpis = root.querySelectorAll('[data-to]');
    function loop() {
      kpis.forEach(k => { k.textContent = k.hasAttribute('data-money') ? '$0' : '0'; });
      setTimeout(() => { kpis.forEach(countUp); }, 200);
      setTimeout(loop, 4200);
    }
    loop();
  }

  /* ── filter demo: search typing ── */
  function runFilter(root) {
    if (rm) return;
    const cursor = root.querySelector('.cursor');
    const q      = root.querySelector('.q');
    const rows   = root.querySelectorAll('.aw-tbl tbody tr');
    if (!q || !rows.length) return;
    const query = 'moto';
    let step = 0;

    function loop() {
      q.textContent = '';
      rows.forEach(r => r.classList.remove('hidden'));
      step = 0;
      mv(cursor, 200, 168);
      setTimeout(() => {
        (function typeChar() {
          if (step < query.length) {
            q.textContent += query[step++];
            const val = q.textContent.toLowerCase();
            rows.forEach(r => r.classList.toggle('hidden', !(r.dataset.name || '').includes(val)));
            setTimeout(typeChar, 130);
          } else {
            setTimeout(loop, 2600);
          }
        })();
      }, 850);
    }
    setTimeout(loop, 1000);
  }

  /* ── Demo dispatcher ── */
  function initDemos() {
    document.querySelectorAll('.scaler[data-demo]').forEach(root => {
      const obs = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        obs.unobserve(root);
        switch (root.dataset.demo) {
          case 'intake':   runIntake(root);   break;
          case 'pipeline': runPipeline(root); break;
          case 'dash':     runDash(root);     break;
          case 'filter':   runFilter(root);   break;
        }
      }, { threshold: 0.25 });
      obs.observe(root);
    });
  }

  /* ── Mobile nav burger ── */
  function initBurger() {
    const burger = document.querySelector('.nav-burger');
    const links  = document.querySelector('.nav-links');
    if (!burger || !links) return;
    let open = false;
    burger.addEventListener('click', () => {
      open = !open;
      burger.setAttribute('aria-expanded', open);
      if (open) {
        Object.assign(links.style, {
          display:'flex', flexDirection:'column',
          position:'absolute', top:'var(--nav-h)', left:'0', right:'0',
          background:'var(--bg-1)', borderBottom:'1px solid var(--line)',
          padding:'16px 24px', gap:'4px', zIndex:'99'
        });
      } else {
        links.removeAttribute('style');
      }
    });
    links.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => { open = false; links.removeAttribute('style'); burger.setAttribute('aria-expanded','false'); });
    });
  }

  /* ── Boot ── */
  document.addEventListener('DOMContentLoaded', () => {
    initScalers();
    initClocks();
    initReveal();
    initDemos();
    initBurger();
  });
})();
