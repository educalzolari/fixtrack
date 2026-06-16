/* plan.js — control de plan Free/Pro */
window._planReady = (async function () {

  const { data: { user } } = await _authClient.auth.getUser();

  const rawPro = user?.user_metadata?.plan === 'pro';
  const expiresAt = user?.user_metadata?.plan_expires_at;
  const isPro = rawPro && (!expiresAt || new Date(expiresAt) > new Date());
  const createdAt = user ? new Date(user.created_at) : new Date();
  const daysSince = Math.floor((Date.now() - createdAt) / 86400000);
  const trialDaysLeft = Math.max(0, 60 - daysSince);
  const reportsUnlocked = isPro || trialDaysLeft > 0;
  const FREE_PHOTOS_LIMIT = 1;

  /* ── Modal de upgrade ── */
  const modalEl = document.createElement('div');
  modalEl.id = '_upgradeModal';
  modalEl.innerHTML = `
    <div class="upm-backdrop"></div>
    <div class="upm-box" role="dialog" aria-modal="true" aria-labelledby="upmTitle">
      <button class="upm-close" id="_upmClose" aria-label="Cerrar">✕</button>
      <div class="upm-icon">⚡</div>
      <h2 class="upm-title" id="upmTitle">Función exclusiva del plan Pro</h2>
      <p class="upm-sub" id="_upmFeatureName"></p>
      <div class="upm-plans">
        <div class="upm-plan">
          <div class="upm-plan-name">Gratis</div>
          <div class="upm-plan-price">$0<span>/mes</span></div>
          <ul class="upm-list">
            <li class="ok">Hasta 30 reparaciones/mes</li>
            <li class="ok">Clientes, caja, por cobrar</li>
            <li class="ok">1 foto por reparación</li>
            <li class="ok">Reportes (60 días de prueba)</li>
            <li class="no">Fotos ilimitadas</li>
            <li class="no">Reportes siempre</li>
            <li class="no">Vinculación a WhatsApp</li>
          </ul>
        </div>
        <div class="upm-plan featured">
          <div class="upm-badge">Recomendado</div>
          <div class="upm-plan-name">Pro</div>
          <div class="upm-plan-price">$18.000<span>/mes</span></div>
          <ul class="upm-list">
            <li class="ok">Reparaciones ilimitadas</li>
            <li class="ok">Clientes, caja, por cobrar</li>
            <li class="ok">Fotos ilimitadas</li>
            <li class="ok">Reportes siempre</li>
            <li class="ok">Vinculación a WhatsApp <small style="opacity:.7">(vía web)</small></li>
          </ul>
          <a class="upm-cta" href="configuracion.html#plan">Ver planes →</a>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modalEl);

  modalEl.querySelector('#_upmClose').addEventListener('click', hideUpgrade);
  modalEl.querySelector('.upm-backdrop').addEventListener('click', hideUpgrade);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideUpgrade(); });

  function showUpgrade(featureLabel) {
    const el = document.getElementById('_upmFeatureName');
    if (el) el.textContent = featureLabel || '';
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function hideUpgrade() {
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  const tallerNombre = user?.user_metadata?.taller || '1Fixtrack!';
  window._plan = { isPro, trialDaysLeft, reportsUnlocked, FREE_PHOTOS_LIMIT, showUpgrade, hideUpgrade, tallerNombre };

  /* ── Aviso de vencimiento ── */
  if (rawPro && expiresAt) {
    const exp = new Date(expiresAt);
    const daysLeft = Math.ceil((exp - Date.now()) / 86400000);

    if (daysLeft > 0 && daysLeft <= 7) {
      _injectExpiryBar(daysLeft);
    } else if (daysLeft <= 0) {
      _showExpiryModal();
    }
  }

  function _injectExpiryBar(days) {
    const urgent = days <= 3;
    const bar = document.createElement('div');
    bar.id = '_expiryBar';
    bar.dataset.urgent = urgent ? '1' : '0';
    bar.innerHTML = `
      <span class="eb-text">
        Tu plan Pro vence en <b>${days} día${days !== 1 ? 's' : ''}</b>
      </span>
      <a class="eb-btn" href="configuracion.html#plan">Renovar ahora</a>
      <button class="eb-close" aria-label="Cerrar">✕</button>`;
    const main = document.querySelector('.main');
    if (main) main.prepend(bar); else document.body.prepend(bar);
    bar.querySelector('.eb-close').addEventListener('click', () => bar.remove());
  }

  function _showExpiryModal() {
    const m = document.createElement('div');
    m.id = '_expiryModal';
    m.innerHTML = `
      <div class="exm-box" role="dialog" aria-modal="true">
        <div class="exm-icon">⏰</div>
        <h2 class="exm-title">Tu plan Pro venció</h2>
        <p class="exm-sub">Renovalo para seguir usando fotos ilimitadas, reportes y WhatsApp sin límites.</p>
        <a class="btn btn-accent" href="configuracion.html#plan">Renovar ahora →</a>
        <button class="exm-skip">Continuar sin Pro</button>
      </div>`;
    document.body.appendChild(m);
    m.querySelector('.exm-skip').addEventListener('click', () => m.remove());
  }
})();
