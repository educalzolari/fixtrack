/* ── 1Fix Shell — tema, drawer, reloj, toasts ───────────────────────────
   Cargá este archivo ANTES de app.js en cada página (excepto login/orden/patron).
   ─────────────────────────────────────────────────────────────────────────── */

const THEME_KEY = '1fix:theme:v1';

const ACCENTS = {
  lima:    { accent: 'oklch(0.86 0.19 130)', ink: 'oklch(0.22 0.03 135)' },
  cyan:    { accent: 'oklch(0.82 0.13 212)', ink: 'oklch(0.20 0.05 230)' },
  violeta: { accent: 'oklch(0.78 0.15 300)', ink: 'oklch(0.24 0.06 305)' },
  ambar:   { accent: 'oklch(0.81 0.15 65)',  ink: 'oklch(0.26 0.06 55)'  },
};

const THEMES = {
  neon:       { mode: 'dark',  accent: 'lima'    },
  medianoche: { mode: 'dark',  accent: 'cyan'    },
  carbon:     { mode: 'dark',  accent: 'violeta' },
  estudio:    { mode: 'light', accent: 'lima'    },
  papel:      { mode: 'light', accent: 'ambar'   },
  indigo:     { mode: 'light', accent: 'violeta' },
};

const DEFAULT_THEME = {
  theme: 'neon',
  mode: 'dark',
  accent: 'lima',
  radius: 'suave',
  density: 'normal',
  glow: false,
  monoNum: false,
};

const RADIUS_MAP    = { recto: '2px',  suave: '8px',  redondo: '16px' };
const DENSITY_MAP   = { compacto: ['10px','14px'], normal: ['13px','18px'], amplio: ['17px','24px'] };

let _theme = Object.assign({}, DEFAULT_THEME);

function loadTheme() {
  try {
    const saved = JSON.parse(localStorage.getItem(THEME_KEY));
    if (saved) _theme = Object.assign({}, DEFAULT_THEME, saved);
  } catch {}
  applyTheme();
}

function saveTheme() {
  localStorage.setItem(THEME_KEY, JSON.stringify(_theme));
}

function applyTheme() {
  const root = document.documentElement;
  const { mode, accent, radius, density, glow, monoNum, theme } = _theme;

  // base mode
  root.dataset.theme = mode;

  // accent
  const ac = ACCENTS[accent] || ACCENTS.lima;
  root.style.setProperty('--accent', ac.accent);
  root.style.setProperty('--accent-ink', ac.ink);

  // radius
  root.style.setProperty('--radius', RADIUS_MAP[radius] || '8px');

  // density
  const [rowPy, gap] = DENSITY_MAP[density] || DENSITY_MAP.normal;
  root.style.setProperty('--row-py', rowPy);
  root.style.setProperty('--gap', gap);

  // mono numbers
  root.style.setProperty('--num-font', monoNum ? 'var(--font-mono)' : 'var(--font-display)');

  // glow class
  const app = document.querySelector('.app');
  if (app) app.classList.toggle('glow', glow && mode === 'dark');

  // update theme-btn icon
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = mode === 'dark'
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    btn.title = mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';
  }

  // update nav badge count
  _updateRepairsBadge();
}

function toggleTheme() {
  const newMode = _theme.mode === 'dark' ? 'light' : 'dark';
  // map to the first preset of that mode
  const presets = { dark: 'neon', light: 'estudio' };
  const preset = presets[newMode];
  _theme = Object.assign({}, _theme, {
    theme: preset,
    mode: newMode,
    accent: THEMES[preset].accent,
  });
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setThemePreset(name) {
  const preset = THEMES[name];
  if (!preset) return;
  _theme = Object.assign({}, _theme, { theme: name, mode: preset.mode, accent: preset.accent });
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setAccent(name) {
  if (!ACCENTS[name]) return;
  _theme.accent = name;
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setRadius(name) {
  _theme.radius = name;
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setDensity(name) {
  _theme.density = name;
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setGlow(val) {
  _theme.glow = val;
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function setMonoNum(val) {
  _theme.monoNum = val;
  saveTheme();
  applyTheme();
  syncConfigPage();
}

function getTheme() { return Object.assign({}, _theme); }

function resetTheme() {
  _theme = Object.assign({}, DEFAULT_THEME);
  saveTheme();
  applyTheme();
  syncConfigPage();
}

/* ── Reloj ──────────────────────────────────────────────────────────────── */
function _startClock() {
  const el = document.getElementById('topbarClock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    el.textContent = `Taller abierto · ${hh}:${mm}`;
  }
  tick();
  setInterval(tick, 30000);
}

/* ── Nav badge (trabajos abiertos) ─────────────────────────────────────── */
function _updateRepairsBadge() {
  // called from app.js after loading repairs via window.shellSetRepairCount
}

window.shellSetRepairCount = function(count) {
  const badge = document.getElementById('repairsBadge');
  if (!badge) return;
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? '' : 'none';
};

/* ── Drawer (mobile sidebar) ────────────────────────────────────────────── */
function _setupDrawer() {
  const app   = document.querySelector('.app');
  const btn   = document.getElementById('menuBtn');
  const scrim = document.querySelector('.scrim');
  if (!app || !btn) return;

  btn.addEventListener('click', () => app.classList.toggle('drawer-open'));
  if (scrim) scrim.addEventListener('click', () => app.classList.remove('drawer-open'));
}

/* ── Toast system ───────────────────────────────────────────────────────── */
function _ensureToastContainer() {
  let el = document.getElementById('toastContainer');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastContainer';
    el.className = 'toasts';
    document.body.appendChild(el);
  }
  return el;
}

function showToast(title, sub, color) {
  const container = _ensureToastContainer();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="tdot" style="background:${color || 'var(--st-finalizado)'}"></div>
    <div><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</div>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3400);
}

window.showToast = showToast;

/* ── Theme toggle button wiring ─────────────────────────────────────────── */
function _setupThemeBtn() {
  const btn = document.getElementById('themeToggleBtn');
  if (btn) btn.addEventListener('click', toggleTheme);
}

/* ── Config page sync ───────────────────────────────────────────────────── */
function syncConfigPage() {
  if (typeof window._syncConfig === 'function') window._syncConfig();
}

/* ── Init ───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  _setupDrawer();
  _setupThemeBtn();
  _startClock();
  // glow class needs app element
  const app = document.querySelector('.app');
  if (app && _theme.glow && _theme.mode === 'dark') app.classList.add('glow');
});

// Apply theme immediately (before DOMContentLoaded) to avoid flash
loadTheme();

// Expose for config page
window._shellThemeAPI = { getTheme, setThemePreset, setAccent, setRadius, setDensity, setGlow, setMonoNum, resetTheme, ACCENTS, THEMES };
