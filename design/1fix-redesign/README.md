# Handoff: Rediseño de 1Fix — “Workshop OS”

## Overview
Rediseño visual completo de **1Fix** (gestión de taller de reparación de celulares).
Mantiene exactamente el mismo flujo y las mismas pantallas que el sitio actual, pero con
una identidad nueva, audaz y orientada a *“sistema operativo de taller”*: base oscura tipo
sala de control, grilla de líneas finas, tipografía técnica y un color de acento configurable.

Incluye un **sistema de temas** (oscuro/claro + variantes) que el usuario final puede elegir
y personalizar, y que se guarda automáticamente en `localStorage`.

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML/CSS/React (vía Babel
en el navegador)** — un prototipo que muestra el look & feel y el comportamiento buscado.
**No son código de producción para copiar tal cual.**

La tarea es **recrear este diseño dentro del entorno del sitio actual de 1Fix**, usando sus
patrones y librerías ya establecidos (el sitio actual parece ser HTML multipágina:
`index.html`, `nueva-reparacion.html`, `reparaciones.html`, etc.). Si se decide migrar a un
framework, recrear las pantallas respetando estos tokens y specs.

Lo importante a portar es: **los design tokens, la estructura de cada pantalla, los
componentes y las interacciones** descritos abajo — no la mecánica interna del prototipo
(React + Babel en el navegador es solo para la demo).

## Fidelity
**Alta fidelidad (hi-fi).** Colores, tipografía, espaciado e interacciones son definitivos.
Recrear la UI lo más fiel posible usando las herramientas del codebase actual.

---

## Design Tokens

Todos los colores están en **oklch** (recomendado mantenerlos así; los navegadores modernos lo
soportan). Si el proyecto necesita hex/rgb, convertir con cualquier conversor oklch→hex.

### Tipografía (Google Fonts)
```
Display / títulos / números : 'Space Grotesk'  (400,500,600,700)
Cuerpo / texto general       : 'Hanken Grotesk' (400,500,600,700,800)
Mono / labels / IDs / datos  : 'JetBrains Mono' (400,500,600)
```
Import:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```
Reglas de uso:
- Títulos de página / KPIs / números: **Space Grotesk** (con `font-variant-numeric: tabular-nums`).
- Texto, descripciones, inputs: **Hanken Grotesk**.
- Labels de tabla, kickers, IDs (#1008), fechas, IMEI, badges de estado: **JetBrains Mono**
  (uppercase, `letter-spacing` ~.04–.16em).
- Los “números” (KPIs, precios, IDs) pueden usar Space Grotesk **o** JetBrains Mono según el
  toggle “Números monoespaciados” (token `--num-font`).

### Color — Tema OSCURO (default)
```
--bg        oklch(0.165 0.014 265)   /* fondo app */
--bg-1      oklch(0.205 0.016 265)   /* paneles, sidebar, tarjetas */
--bg-2      oklch(0.245 0.018 265)   /* elevado, hover */
--bg-inset  oklch(0.145 0.014 265)   /* head de tabla, inputs hundidos */
--line      oklch(0.30 0.018 265)    /* bordes/divisores */
--line-2    oklch(0.40 0.02 265)     /* bordes más marcados, inputs */
--text      oklch(0.97 0.004 265)
--text-2    oklch(0.74 0.012 265)
--text-3    oklch(0.56 0.012 265)
--field-bg  oklch(0.19 0.015 265)
--shadow    0 4px 24px rgba(0,0,0,.45)
--shadow-sm 0 1px 3px rgba(0,0,0,.35)
```

### Color — Tema CLARO  (selector `[data-theme="light"]`)
```
--bg        oklch(0.965 0.004 265)
--bg-1      #ffffff
--bg-2      oklch(0.985 0.003 265)
--bg-inset  oklch(0.945 0.005 265)
--line      oklch(0.905 0.006 265)
--line-2    oklch(0.84 0.008 265)
--text      oklch(0.21 0.014 265)
--text-2    oklch(0.46 0.013 265)
--text-3    oklch(0.62 0.011 265)
--field-bg  oklch(0.985 0.003 265)
--shadow    0 6px 28px rgba(20,22,45,.08)
--shadow-sm 0 1px 2px rgba(20,22,45,.06)
```

### Colores de estado (semánticos, iguales en ambos temas)
```
En espera   --st-espera     oklch(0.82 0.13 75)    (ámbar)
Activo      --st-activo     oklch(0.72 0.15 240)   (azul)
Finalizado  --st-finalizado oklch(0.76 0.16 150)   (verde)
Entregado   --st-entregado  oklch(0.70 0.035 265)  (gris/neutro = archivado)
Peligro/eliminar            oklch(0.65 0.20 18)    (rojo)
```
Píldoras de estado: fondo = `color-mix(in oklch, <st> 15%, transparent)`,
borde = `color-mix(in oklch, <st> 30%, transparent)`,
texto = el color de estado (en claro, oscurecido: `color-mix(in oklch, <st> 55%, black)`),
+ un punto `<st>` de 7px a la izquierda.

### Acentos (configurables — todos comparten chroma/lightness, varían el hue)
```
Lima     --accent oklch(0.87 0.19 130)  · ink oklch(0.25 0.05 135)
Cyan     --accent oklch(0.82 0.13 212)  · ink oklch(0.20 0.05 230)
Violeta  --accent oklch(0.78 0.15 300)  · ink oklch(0.24 0.06 305)
Ámbar    --accent oklch(0.81 0.15 65)   · ink oklch(0.26 0.06 55)
```
`--accent-ink` = color del texto/íconos **sobre** el acento (siempre oscuro).

### Forma y espaciado
```
Radio de esquinas  --radius   Recto=2px · Suave=8px · Redondo=16px
Densidad (row-py/gap)         Compacto=10/14 · Normal=13/18 · Amplio=17/24
Padding de página            30px desktop · 18px mobile · max-width 1320px
Gap general entre tarjetas   var(--gap)
```

### Detalle de fondo (opcional, da el aire “técnico”)
Grilla sutil de 54×54px sobre `--bg`, con máscara radial que la desvanece:
```css
background-image:
  linear-gradient(var(--grid-line) 1px, transparent 1px),
  linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
background-size: 54px 54px;
mask-image: radial-gradient(120% 120% at 80% 0%, #000 30%, transparent 75%);
/* --grid-line: oklch(0.97 0.004 265 / .035) en oscuro */
```
Se oculta en mobile (<900px).

---

## App Shell (layout común a todas las pantallas)

Grid de 2 columnas: **sidebar 248px** + **main 1fr** (alto 100vh, cada uno con su scroll).

### Sidebar (`--bg-1`, borde derecho `--line`)
- **Brand** (arriba): cuadrado de 34px con fondo `--accent` y texto `--accent-ink` “1F”
  (Space Grotesk 700), al lado “1Fix” (19px/700) + sublínea mono “WORKSHOP OS”
  (9.5px, `letter-spacing:.18em`, `--text-3`).
- **Nav** en 2 grupos con labels mono uppercase:
  - *Operación*: Inicio, Nueva Reparación, Ver Reparaciones, Clientes, Reportes
  - *Negocio*: Inventario, Proveedores, Configuración
  - Ítem: ícono 18px + label 14px/500. Hover → `--bg-2`. **Activo** → fondo
    `color-mix(--accent 15%, transparent)`, borde `color-mix(--accent 30%)`, barra vertical
    de 3px en `--accent` pegada a la izquierda, ícono en `--accent`.
  - “Ver Reparaciones” muestra a la derecha el conteo de trabajos abiertos (activo+en espera).
- **Footer** (borde superior): “Centro de Ayuda” y “Salir” (este último en rojo).
- **Mobile (<900px):** la sidebar pasa a **drawer** off-canvas (280px, `translateX(-100%)`,
  entra con `.drawer-open`), con scrim oscuro detrás. Se abre con el botón hamburguesa del topbar.

### Topbar (sticky, con blur)
`backdrop-filter: blur(14px)`, fondo `color-mix(--bg 82%, transparent)`, borde inferior `--line`.
- Izquierda: botón hamburguesa (**solo <900px**) + breadcrumb mono “1Fix / <pantalla>”.
- Derecha: indicador “Taller abierto · HH:MM” (con punto verde que pulsa) + **botón toggle de
  tema** (ícono sol en modo oscuro / luna en claro) que alterna `theme.theme`.

---

## Screens / Views

### 1) Inicio (Dashboard)  — `index.html`
**Propósito:** estado del taller de un vistazo.
- **Header:** kicker mono con la fecha (capitalizada), título “Hola, Eduardo 👋” (Space Grotesk
  700, 34px), subtítulo con el conteo de trabajos en curso.
- **4 KPI cards** (grid 4 col; 2 col <1100px; 1 col <560px). Cada card (`--bg-1`, borde `--line`,
  radio `--radius+3`, padding 18px):
  - Barra de acento vertical de 3px a la izquierda (color según KPI).
  - Top: tag mono uppercase (`--text-3`) + ícono 30px en cuadro `--bg-2`.
  - Número grande (38px/700, tabular). Footer con texto o chip de delta (↑ verde / ↓ rojo).
  - **Mini-sparkline** abajo: 6 barras (CSS), la última en `--accent`.
  - KPIs: *Trabajos en espera* (ámbar), *Trabajos activos* (azul), *Reparaciones (mes)*
    (verde, con delta “−33% vs. mes anterior”), *Total de ventas* (card con número en `--accent`).
  - Valores derivados de los datos (no hardcodear): en_espera=count, activos=count,
    mes=finalizado+entregado, ventas=suma de costos. Formato moneda `es-AR` con “$”.
- **Accesos directos:** 4 botones-card (grid 4 col) → Cargar Reparación, Ver Reparaciones,
  Clientes, Resumen de Mes. Card con ícono 42px (al hover se rellena de `--accent`), título
  18px, flechita ↗ arriba-derecha que se desplaza al hover; el card sube y resalta el borde.
- **Últimas reparaciones:** tabla (ver componente Tabla) con las 5 más recientes + botón
  “Ver todo →”. Filas clickeables → van a Ver Reparaciones.

### 2) Nueva Reparación (Formulario)  — `nueva-reparacion.html`
**Propósito:** alta de un trabajo.
Header kicker “Operación / Carga”, título “Formulario de carga”.
3 secciones, cada una en un panel (`--bg-1`) con head: cuadro de ícono en
`color-mix(--accent 16%)`, título mono uppercase y numeración “0X / 03” a la derecha.
- **01 Cliente:** select “Seleccionar cliente…” (8/12) + botón “Nuevo cliente” (4/12).
- **02 Datos del equipo:** *Tipo de dispositivo* como **chips** seleccionables (Celular,
  Tablet, Notebook, Consola, Otro — cada uno con ícono; chip activo: fondo
  `color-mix(--accent 16%)`, borde `--accent`). Luego Marca (select), Modelo (input),
  IMEI/Serie (input, opcional) en 3 columnas.
- **03 Acceso y trabajo:** Contraseña/PIN (input), Problema reportado (textarea, requerido),
  **Patrón de desbloqueo** (componente interactivo, ver abajo), Presupuesto estimado (input
  numérico que formatea a moneda).
- **Barra de acción sticky** (abajo, con blur): contador “X/4 campos requeridos completos” +
  botones “Limpiar” y “Guardar reparación” (acento).
- **Validación:** requeridos = cliente, tipo, marca, problema. Al intentar guardar sin
  completarlos, los campos faltantes se marcan con borde rojo + hint. Al guardar OK: se crea el
  trabajo con estado `en_espera`, fecha de hoy, id = max+1, aparece un **toast** y navega a Ver
  Reparaciones.

### 3) Ver Reparaciones (Listado)  — `reparaciones.html`
**Propósito:** gestionar y avanzar trabajos.
Header kicker “Operación / Trabajos”, título “Listado de trabajos”.
- **Toolbar:** buscador (por cliente, equipo o nro) + select de filtro por estado + botón
  “Nueva” (acento).
- **Tabla agrupada por estado**, en orden de pipeline: Activo → En espera → Finalizado →
  Entregado. Cada grupo tiene una fila-encabezado (`--bg-inset`) con la píldora de estado y un
  contador circular. Columnas: **Nro/Fecha** (id en número 700 + fecha mono), **Cliente**
  (nombre + marca/modelo con ícono de tipo), **Servicio** (texto + “IMEI …” o “Sin detalle
  adicional” en mono), **Estado** (píldora), **Acción**.
- **Acciones por fila** (botones-ícono 34px): avanzar estado (▶ para en_espera→activo, ✓ para
  activo→finalizado y finalizado→entregado; entregado no tiene avance) y eliminar (🗑, rojo).
  Cada acción dispara un toast.
- Búsqueda/filtro vacíos → estado vacío “Sin resultados”.

### 4) Clientes  — `clientes.html`
Grid de cards (auto-fill, min 280px). Card: avatar cuadrado con iniciales (fondo
`color-mix(--accent 20%, --bg-2)`, texto `--accent`), nombre + teléfono (mono), y a la derecha
el conteo de trabajos. Toolbar con buscador + “Nuevo cliente”. **Importante:** nombre y teléfono
con `text-overflow: ellipsis` (una línea) para que no se solapen.

### 5) Configuración · Apariencia  — `configuracion.html`
Pantalla nueva (no existía). Selector de tema persistente:
- **Galería de Temas:** 6 cards seleccionables (Neón, Medianoche, Carbón = oscuros; Estudio,
  Papel, Índigo = claros). Cada card muestra un **mini-preview** (sidebar + barra + 2 tarjetas
  con el acento) y abajo nombre + “OSCURO/CLARO”; el activo lleva borde de acento + check.
- **Controles finos** (filas con label+descripción a la izquierda y control a la derecha):
  Modo base (segmented Oscuro/Claro), Color de acento (4 swatches), Esquinas
  (Recto/Suave/Redondo), Densidad (Compacto/Normal/Amplio), Glow del acento (switch, solo
  oscuro), Números monoespaciados (switch).
- Nota “Cambios guardados automáticamente” + botón “Restablecer a Neón”.

### 6) Reportes / Inventario / Proveedores
Placeholders “Próximamente” (ícono + descripción). No estaban en los screenshots; dejarlos como
estados vacíos hasta que se diseñen.

---

## Componentes reutilizables

- **Píldora de estado** (`.pill`): altura 26px, radio full, mono 11px uppercase, punto + label.
  Color por estado (ver tokens). Variante de texto oscurecida en tema claro.
- **Botones:** `.btn-accent` (fondo `--accent`, texto `--accent-ink`; glow opcional en oscuro),
  `.btn-ghost` (fondo `--bg-1`, borde `--line-2`), `.btn-soft`, `.btn-sm`, `.btn-icon` (34px,
  variantes hover go/ok/del). Alto base 40px, radio `--radius`, peso 600.
- **Tabla** (`.tbl`): head con `--bg-inset`, th mono 10.5px uppercase `--text-3`; td 14px,
  padding vertical = `--row-py`; filas con hover `--bg-2` y borde inferior `--line`.
  En <560px la tabla se reflowa a “cards” (thead oculto, cada fila en bloque).
- **Inputs/selects/textarea** (`.inp/.sel`): alto 44px, fondo `--field-bg`, borde `--line-2`,
  radio `--radius`. Focus: borde `--accent` + ring `color-mix(--accent 22%)`. `.invalid` = rojo.
  Select con flecha SVG custom.
- **Chips** (`.chip`): 42px, para selección de tipo de dispositivo.
- **Patrón de desbloqueo** (`.pattern`): cuadro 200×200, 9 puntos en grilla 3×3; al
  arrastrar (pointer events) se marcan los puntos tocados y se dibuja la polilínea en `--accent`
  por SVG. Devuelve el array de índices (0–8). Es opcional.
- **Toasts** (`.toast`): arriba-derecha, entran con slide-in, autodismiss ~3.4s. Punto de color
  + título + subtítulo.
- **Segmented control / switches / swatches**: usados en Apariencia (ver `screen-config.jsx`).

---

## Interactions & Behavior
- **Navegación:** SPA por estado de ruta en el prototipo; en el sitio actual = navegar entre
  páginas (`index/nueva-reparacion/reparaciones/clientes/configuracion`). El ítem de nav activo
  se resalta como se describió.
- **Avanzar estado:** `en_espera → activo → finalizado → entregado` (botón de la fila). Toast de
  confirmación. La fila se reubica en su nuevo grupo.
- **Eliminar:** quita el trabajo + toast.
- **Alta:** valida requeridos, crea trabajo `en_espera`, toast, redirige al listado.
- **Toggle de tema** (topbar) y **selección de tema** (Apariencia) aplican variables CSS al
  `:root` al instante y **persisten en localStorage** (ver State).
- **Hover/focus:** definidos en cada componente (cards suben 2–3px, botones, inputs con ring).
- **Animación de entrada** (opcional): tarjetas con `translateY(10px)→0` escalonado. **No usar
  `opacity:0` como estado base** (rompe captura/print); animar solo transform.
- **Responsive:** 4→2→1 columnas en KPIs/acciones; sidebar→drawer <900px; tabla→cards <560px.
- **Reduced motion:** respetar `prefers-reduced-motion`.

## State Management
Estado mínimo de la app:
- `jobs` — lista de reparaciones (id, fecha, cliente, tel, marca, modelo, tipo, servicio, imei,
  estado, costo). KPIs y conteos se **derivan** de acá.
- `route` — pantalla activa.
- `theme` — `{ theme:'dark'|'light', accent, radius, density, glow, monoNum }`.
- `toasts` — cola efímera.
- `drawer` — sidebar mobile abierta/cerrada.

**Persistencia del tema (clave del pedido del usuario):**
```js
const THEME_KEY = '1fix:theme:v1';
// al cambiar cualquier opción:
localStorage.setItem(THEME_KEY, JSON.stringify(theme));
// al cargar:
const saved = JSON.parse(localStorage.getItem(THEME_KEY) || 'null');
// si no hay guardado, respetar prefers-color-scheme para elegir el modo inicial.
```
Aplicar el tema seteando en `document.documentElement`: atributo `data-theme` (dark/light) y las
variables `--accent`, `--accent-ink`, `--radius`, `--row-py`, `--gap`, `--num-font`, y la clase
`glow` (solo si glow && dark). Toda la lógica está en `fixtrack/app.jsx` (función `App`,
`loadTheme`, `setTheme`, y el `useEffect` que aplica los tokens).

## Assets
- **Sin imágenes propias.** Todos los íconos son SVG inline de trazo (set en `fixtrack/ui.jsx`,
  objeto `P`). Pueden reemplazarse por la librería de íconos del codebase (lucide/feather/heroicons
  tienen equivalentes directos: home, plus, list, users, chart, box, truck, gear, phone, tablet,
  laptop, wrench, key, lock, trash, search, check, etc.).
- **Fuentes:** Google Fonts (links arriba).
- El “👋” es un emoji de texto; opcional.

## Files (en este bundle)
```
1Fix Rediseño.html          → punto de entrada del prototipo (abrir en navegador)
fixtrack/styles.css         → TODOS los tokens y estilos de componentes (la referencia visual maestra)
fixtrack/data.js            → datos mock (jobs, clientes, estados, marcas, tipos)
fixtrack/ui.jsx             → íconos (objeto P), Sidebar, Topbar, Pill, Toasts, helpers (fmt, initials…)
fixtrack/screen-inicio.jsx  → Dashboard
fixtrack/screen-reparaciones.jsx → Listado + acciones de pipeline
fixtrack/screen-nueva.jsx   → Formulario + patrón de desbloqueo
fixtrack/screen-misc.jsx    → Clientes + placeholders
fixtrack/screen-config.jsx  → Apariencia (galería de temas + controles)
fixtrack/app.jsx            → root: routing, estado, sistema de temas + persistencia
fixtrack/tweaks-panel.jsx   → panel flotante de la demo (NO portar; es solo para prototipar)
```
> `tweaks-panel.jsx` es una utilidad del entorno de prototipado. El selector de temas real para
> producción es **`screen-config.jsx` + la lógica de `app.jsx`**.

## Cómo usar esto con Claude Code
1. Descargá el zip y descomprimílo dentro de tu repo (p. ej. en `design/1fix-redesign/`).
2. En Claude Code, pedile algo como:
   *“Tomá la carpeta `design/1fix-redesign/` como referencia de diseño. Leé el README y
   `fixtrack/styles.css`. Aplicá estos design tokens y rediseñá mis páginas
   `index.html`, `nueva-reparacion.html` y `reparaciones.html` para que coincidan con el
   prototipo, manteniendo mi lógica actual. Implementá también el selector de temas con
   persistencia en localStorage descrito en el README.”*
3. Empezá por portar **`styles.css`** (los tokens + clases) — es el 80% del look. Después
   ajustá el markup de cada página a la estructura descrita arriba.
4. Para abrir el prototipo de referencia: abrí `1Fix Rediseño.html` en el navegador.
