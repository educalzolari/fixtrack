/* plan.js — control de plan Free/Pro */
window._planReady = (async function () {

  const { data: { user } } = await _authClient.auth.getUser();

  const isPro = user?.user_metadata?.plan === 'pro';
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
          <a class="upm-cta" href="#">Upgradear a Pro →</a>
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

  window._plan = { isPro, trialDaysLeft, reportsUnlocked, FREE_PHOTOS_LIMIT, showUpgrade, hideUpgrade };
})();
