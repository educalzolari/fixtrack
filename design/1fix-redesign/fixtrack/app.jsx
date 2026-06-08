/* 1Fix — app root: routing, state, persistent theme system ------------------ */
const ACCENTS = [
  { v: 'oklch(0.87 0.19 130)', ink: 'oklch(0.25 0.05 135)', name: 'Lima' },
  { v: 'oklch(0.82 0.13 212)', ink: 'oklch(0.20 0.05 230)', name: 'Cyan' },
  { v: 'oklch(0.78 0.15 300)', ink: 'oklch(0.24 0.06 305)', name: 'Violeta' },
  { v: 'oklch(0.81 0.15 65)',  ink: 'oklch(0.26 0.06 55)',  name: 'Ámbar' },
];
const RADII = { Recto: 2, Suave: 8, Redondo: 16 };
const DENS = { Compacto: { py: 10, gap: 14 }, Normal: { py: 13, gap: 18 }, Amplio: { py: 17, gap: 24 } };
const inkFor = (acc) => (ACCENTS.find(a => a.v === acc) || ACCENTS[0]).ink;
const THEME_KEYS = ['theme', 'accent', 'radius', 'density', 'glow', 'monoNum'];

// Named theme presets — selectable like a gallery.
const THEMES = [
  { id: 'neon',       name: 'Neón',       mode: 'dark',  cfg: { theme: 'dark',  accent: ACCENTS[0].v, radius: 'Suave',   density: 'Normal',   glow: true,  monoNum: true  } },
  { id: 'medianoche', name: 'Medianoche', mode: 'dark',  cfg: { theme: 'dark',  accent: ACCENTS[1].v, radius: 'Suave',   density: 'Normal',   glow: true,  monoNum: true  } },
  { id: 'carbon',     name: 'Carbón',     mode: 'dark',  cfg: { theme: 'dark',  accent: ACCENTS[3].v, radius: 'Recto',   density: 'Compacto', glow: true,  monoNum: false } },
  { id: 'estudio',    name: 'Estudio',    mode: 'light', cfg: { theme: 'light', accent: ACCENTS[2].v, radius: 'Redondo', density: 'Amplio',   glow: false, monoNum: false } },
  { id: 'papel',      name: 'Papel',      mode: 'light', cfg: { theme: 'light', accent: ACCENTS[3].v, radius: 'Suave',   density: 'Normal',   glow: false, monoNum: false } },
  { id: 'indigo',     name: 'Índigo',     mode: 'light', cfg: { theme: 'light', accent: ACCENTS[1].v, radius: 'Redondo', density: 'Normal',   glow: false, monoNum: true  } },
];

const DEFAULT_THEME = THEMES[0].cfg;
const THEME_KEY = '1fix:theme:v1';

function loadTheme() {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) return { ...DEFAULT_THEME, ...JSON.parse(raw) };
  } catch (e) {}
  // first visit: respect OS preference for the base mode
  try {
    if (window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches) return THEMES[3].cfg;
  } catch (e) {}
  return DEFAULT_THEME;
}
const sameTheme = (a, b) => THEME_KEYS.every(k => a[k] === b[k]);

function App() {
  const [theme, setThemeRaw] = useState(loadTheme);
  const [route, setRoute] = useState('inicio');
  const [jobs, setJobs] = useState(FIX.JOBS);
  const [drawer, setDrawer] = useState(false);
  const [toasts, setToasts] = useState([]);
  const main = useRef(null);

  // single setter — patch ({key:val} or full cfg), persisted to localStorage
  const setTheme = React.useCallback((patch) => {
    setThemeRaw(s => {
      const next = { ...s, ...patch };
      try { localStorage.setItem(THEME_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);

  // apply theme tokens to :root
  useEffect(() => {
    const r = document.documentElement, s = r.style;
    r.setAttribute('data-theme', theme.theme);
    s.setProperty('--accent', theme.accent);
    s.setProperty('--accent-ink', inkFor(theme.accent));
    s.setProperty('--radius', (RADII[theme.radius] ?? 8) + 'px');
    const d = DENS[theme.density] || DENS.Normal;
    s.setProperty('--row-py', d.py + 'px');
    s.setProperty('--gap', d.gap + 'px');
    s.setProperty('--num-font', theme.monoNum ? 'var(--font-mono)' : 'var(--font-display)');
    r.classList.toggle('glow', !!theme.glow && theme.theme === 'dark');
  }, [theme]);

  const go = (k) => { setRoute(k); setDrawer(false); if (main.current) main.current.scrollTop = 0; };
  const toggleMode = () => setTheme({ theme: theme.theme === 'dark' ? 'light' : 'dark' });

  const toast = (title, body, color) => {
    const id = Date.now() + Math.random();
    setToasts(x => [...x, { id, title, body, color }]);
    setTimeout(() => setToasts(x => x.filter(t => t.id !== id)), 3400);
  };

  const advance = (id) => {
    setJobs(js => js.map(j => {
      if (j.id !== id) return j;
      const next = FIX.ESTADOS[j.estado].next;
      if (next) toast('Estado actualizado', `#${j.id} · ${j.cliente} → ${FIX.ESTADOS[next].label}`, `var(--st-${next.replace('_', '')})`);
      return next ? { ...j, estado: next } : j;
    }));
  };
  const remove = (id) => {
    const j = jobs.find(x => x.id === id);
    setJobs(js => js.filter(x => x.id !== id));
    if (j) toast('Trabajo eliminado', `#${j.id} · ${j.cliente}`, 'oklch(0.65 0.2 18)');
  };
  const addJob = (data) => {
    const id = Math.max(...jobs.map(j => j.id)) + 1;
    const job = { id, fecha: new Date().toISOString().slice(0, 10), tel: '', estado: 'en_espera', ...data };
    setJobs(js => [job, ...js]);
    toast('Reparación cargada', `#${id} · ${data.cliente} · ${data.marca} ${data.modelo}`, 'var(--st-espera)');
    go('reparaciones');
  };

  let screen;
  if (route === 'inicio') screen = <Inicio jobs={jobs} go={go} />;
  else if (route === 'nueva') screen = <NuevaReparacion onSubmit={addJob} go={go} />;
  else if (route === 'reparaciones') screen = <Reparaciones jobs={jobs} advance={advance} remove={remove} go={go} />;
  else if (route === 'clientes') screen = <Clientes jobs={jobs} go={go} />;
  else if (route === 'config') screen = <Config theme={theme} setTheme={setTheme} />;
  else screen = <Placeholder route={route} go={go} />;

  const isCustom = !THEMES.some(t => sameTheme(t.cfg, theme));

  return (
    <div className={'app' + (drawer ? ' drawer-open' : '')}>
      <div className="scrim" onClick={() => setDrawer(false)} />
      <Sidebar route={route} go={go} jobs={jobs} />
      <div className="main" ref={main}>
        <Topbar route={route} onMenu={() => setDrawer(true)} mode={theme.theme} onToggleMode={toggleMode} />
        {screen}
      </div>
      <Toasts items={toasts} />

      <TweaksPanel title="Apariencia">
        <TweakSection label="Tema guardado" />
        <TweakSelect label="Preset" value={isCustom ? '__custom' : THEMES.find(t => sameTheme(t.cfg, theme)).id}
          options={[...THEMES.map(t => ({ value: t.id, label: t.name })), ...(isCustom ? [{ value: '__custom', label: 'Personalizado' }] : [])]}
          onChange={id => { const t = THEMES.find(x => x.id === id); if (t) setTheme(t.cfg); }} />
        <TweakSection label="Modo" />
        <TweakRadio label="Base" value={theme.theme} options={[{ value: 'dark', label: 'Oscuro' }, { value: 'light', label: 'Claro' }]} onChange={v => setTheme({ theme: v })} />
        <TweakColor label="Acento" value={theme.accent} options={ACCENTS.map(a => a.v)} onChange={v => setTheme({ accent: v })} />
        <TweakSection label="Forma" />
        <TweakRadio label="Esquinas" value={theme.radius} options={['Recto', 'Suave', 'Redondo']} onChange={v => setTheme({ radius: v })} />
        <TweakRadio label="Densidad" value={theme.density} options={['Compacto', 'Normal', 'Amplio']} onChange={v => setTheme({ density: v })} />
        <TweakSection label="Detalles" />
        <TweakToggle label="Glow del acento (oscuro)" value={theme.glow} onChange={v => setTheme({ glow: v })} />
        <TweakToggle label="Números monoespaciados" value={theme.monoNum} onChange={v => setTheme({ monoNum: v })} />
        <div style={{ fontSize: 10.5, color: 'rgba(41,38,27,.5)', paddingTop: 4 }}>También configurable en Configuración · Apariencia. Se guarda solo.</div>
      </TweaksPanel>
    </div>
  );
}

window.THEMES = THEMES; window.ACCENTS = ACCENTS; window.RADII = RADII; window.DENS = DENS; window.sameTheme = sameTheme;
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
