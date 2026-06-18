# Handoff a Claude Code — AGREGAR sección "App móvil" + video (1FixTrack)

> ⚠️ TAREA PURAMENTE ADITIVA. **No modifiques ni rehagas el resto de la landing.**
> El usuario ya hizo cambios propios en su landing y quiere conservarlos intactos.
> Lo único que tenés que hacer es:
>   1) copiar 3 archivos nuevos,
>   2) insertar UN bloque `<section>` nuevo,
>   3) anexar un bloque de CSS al final de la hoja de estilos,
>   4) (opcional) agregar 1 link en el nav.
> No toques ninguna otra sección, estilo, copy ni componente existente.

---

## Paso 1 — Copiar estos archivos nuevos (no existen en tu repo)
```
site/movil.css        → estilos del teléfono + las 4 pantallas del video
site/movil.js         → motor de escenas (loop + pausa fuera de viewport + reduced-motion)
demo-movil.html       → el video en sí (teléfono con 4 escenas). Es lo que carga el iframe.
```
(Equivalen a la referencia de diseño. `demo-movil.html` referencia `site/site.css`, `site/movil.css`
y `site/movil.js` con rutas relativas — mantené esa estructura, o ajustá las rutas a tu proyecto.)

El video recorre 4 escenas en loop: **instalar como app → cargar reparación desde el celu →
aviso por WhatsApp al cliente → configuración/parámetros**. Se pausa solo cuando no se ve y respeta
`prefers-reduced-motion`. (El chat usa una paleta verde propia; no toca los tokens violeta del sitio.)

## Paso 2 — Insertar ESTE bloque en la landing
Pegá la `<section>` tal cual, **justo antes** de tu sección de Precios (o donde quieras ubicarla).
No reemplaza nada: se suma.

```html
<!-- ═══ APP MÓVIL (video embebido) ═══ -->
<section class="sec wrap" id="movil" data-screen-label="Landing / App móvil">
  <div class="sec-head reveal">
    <span class="eyebrow">Desde el celular</span>
    <h2>Tu taller también <span class="hl">en el bolsillo</span></h2>
    <p>Instalá 1FixTrack como app en tu teléfono y manejá todo desde la palma de la mano.</p>
  </div>
  <div class="movil-row">
    <div class="movil-copy reveal">
      <ul class="movil-list">
        <li>
          <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 18h.01M8 21h8a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1z"/></svg></span>
          <div><b>Instalala como app</b><span>Se agrega a la pantalla de inicio. Sin pasar por la tienda, sin ocupar espacio.</span></div>
        </li>
        <li>
          <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg></span>
          <div><b>Cargá reparaciones al instante</b><span>Recibís un equipo y lo cargás en el momento, parado en el mostrador o donde estés.</span></div>
        </li>
        <li>
          <span class="mi"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2z"/></svg></span>
          <div><b>Avisos por WhatsApp, automáticos</b><span>El cliente recibe el estado de su equipo sin que tengas que escribir un mensaje.</span></div>
        </li>
        <li>
          <span class="mi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 14a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9v.09a1.65 1.65 0 0 0 1.51 1z"/></svg></span>
          <div><b>Toda la configuración a mano</b><span>Estados, notificaciones, moneda, usuarios y parámetros del taller, a tu medida.</span></div>
        </li>
      </ul>
    </div>
    <div class="movil-frame reveal d1">
      <span class="movil-glow"></span>
      <iframe src="demo-movil.html" title="Demo móvil de 1FixTrack" loading="lazy" scrolling="no"></iframe>
    </div>
  </div>
</section>
```

## Paso 3 — Anexar ESTE CSS al final de tu hoja de estilos
(Usa los tokens que ya tenés: `--accent`, `--bg-2`, `--text-2`, `--font-display`, `--font-mono`.
Si tus variables se llaman distinto, mapealas. No cambia ningún estilo existente.)

```css
/* ── App móvil (sección con iframe del video) ── */
.movil-row{display:grid;grid-template-columns:1fr 0.9fr;gap:56px;align-items:center}
.movil-copy .movil-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:22px}
.movil-list li{display:flex;gap:15px;align-items:flex-start}
.movil-list .mi{width:42px;height:42px;border-radius:11px;display:grid;place-items:center;flex-shrink:0;
  background:color-mix(in oklch,var(--accent) 14%,var(--bg-2));color:var(--accent);border:1px solid color-mix(in oklch,var(--accent) 24%,transparent)}
.movil-list .mi svg{width:21px;height:21px}
.movil-list li b{font-family:var(--font-display);font-weight:600;font-size:17px;letter-spacing:-.01em;display:block;margin-bottom:4px}
.movil-list li span{color:var(--text-2);font-size:14.5px;line-height:1.5;display:block;max-width:42ch}
.movil-frame{position:relative;display:flex;justify-content:center}
.movil-glow{position:absolute;top:6%;left:50%;transform:translateX(-50%);width:108%;height:90%;
  background:radial-gradient(50% 50% at 50% 40%,color-mix(in oklch,var(--accent) 40%,transparent),transparent 70%);filter:blur(26px);pointer-events:none;z-index:0}
.movil-frame iframe{position:relative;z-index:1;width:100%;max-width:560px;height:720px;border:0;background:transparent;border-radius:18px;overflow:hidden}
@media (max-width:1000px){
  .movil-row{grid-template-columns:1fr;gap:40px;max-width:560px;margin:0 auto}
  .movil-frame{order:-1}
}
@media (max-width:760px){ .movil-frame iframe{height:640px} }
```

## Paso 4 (opcional) — Link en el nav
Si tu nav tiene links de anclaje, agregá uno: `<a href="#movil">App móvil</a>`. Si no, omitilo.

---

## Forma de embeber (elegí una)
- **Rápido (lo que ya funciona):** el `<iframe src="demo-movil.html">` de arriba. Listo.
- **Recomendado en producción:** en vez del iframe, montá el video como **componente** de tu stack
  reusando `site/movil.css` + `site/movil.js` (el markup del teléfono está dentro de `demo-movil.html`).
  Si igual usás iframe, mantené el nombre **sin espacios** (`demo-movil.html`).
  Conservá los 3 comportamientos de `movil.js`: loop de escenas, pausa por IntersectionObserver y
  fallback de `prefers-reduced-motion`.

## NO hagas
- ❌ No reescribas ni “mejores” otras secciones de la landing.
- ❌ No cambies tokens, fuentes ni colores globales (el violeta sigue siendo el único acento del sitio).
- ❌ No toques las páginas de login/registro ni otros componentes.

## Para más adelante (no es parte de esta tarea, solo dejalo anotado)
PWA real instalable (manifest + service worker), formulario de carga táctil mobile-first,
integración real de WhatsApp por estado, y la pantalla de Configuración persistida en backend.
```
```
