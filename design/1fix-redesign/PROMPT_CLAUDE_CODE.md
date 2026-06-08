# Prompt maestro para Claude Code

Copiá y pegá esto en Claude Code, **dentro de tu repo de 1Fix**, con la carpeta de este
handoff colocada en `design/1fix-redesign/`.

---

## Prompt (pegar tal cual)

> Tengo este sitio de gestión de taller (1Fix) ya funcionando. Quiero **rediseñarlo por
> completo** —diseño visual **y** comportamiento— para que coincida con el prototipo de
> referencia que dejé en `design/1fix-redesign/`. NO empieces a tocar código hasta haber leído:
> 1. `design/1fix-redesign/README.md` (specs completas: tokens, pantallas, componentes, estado,
>    interacciones).
> 2. `design/1fix-redesign/fixtrack/styles.css` (todos los design tokens y clases de componentes).
> 3. El prototipo `design/1fix-redesign/1Fix Rediseño.html` y los archivos `fixtrack/*.jsx`
>    para entender la estructura de cada pantalla.
>
> Reglas:
> - **Conservá mi lógica/datos/backend actuales.** Esto es un rediseño de la capa de
>   presentación + algunas mejoras de UX descritas en el README; no cambies cómo se guardan o
>   leen los datos, solo adaptá el markup y los estilos y conectá los mismos handlers.
> - **Portá primero `styles.css`**: integrá los tokens (variables CSS de tema oscuro y claro,
>   acentos, radios, densidad, estados) y las clases de componentes a mi proyecto. Eso resuelve
>   el ~80% del look.
> - Después rediseñá **cada página existente** para que matchee el prototipo, una por una,
>   verificando que sigan funcionando:
>   - `index.html` → Dashboard (KPIs derivados de los datos reales, accesos directos, tabla de
>     últimas reparaciones).
>   - `nueva-reparacion.html` → Formulario (secciones, chips de tipo, patrón de desbloqueo,
>     validación de requeridos, alta + toast + redirección).
>   - `reparaciones.html` → Listado agrupado por estado, buscador, filtro, y acciones de avanzar
>     estado / eliminar con toasts.
>   - `clientes.html` → Grid de clientes.
>   - **Nueva** `configuracion.html` (o sección Apariencia) → galería de temas + controles, con
>     **persistencia en localStorage** (`1fix:theme:v1`) y toggle de tema en el topbar, tal como
>     se describe en el README (sección State Management).
>   - Reportes / Inventario / Proveedores → placeholders “Próximamente”.
> - Implementá el **app shell** común: sidebar 248px (con drawer en mobile <900px), topbar
>   sticky con breadcrumb + reloj + toggle de tema.
> - Respetá el **responsive** (4→2→1 columnas, sidebar→drawer, tabla→cards) y
>   `prefers-reduced-motion`.
> - Usá la librería de íconos que ya tenga el proyecto (o agregá lucide/feather); los íconos del
>   prototipo son SVG de trazo equivalentes.
> - Cargá las fuentes de Google: Space Grotesk, Hanken Grotesk, JetBrains Mono.
>
> Plan de trabajo sugerido (hacelo por pasos y mostrame cada paso):
> 1. Integrar tokens + clases de `styles.css` y las fuentes.
> 2. App shell (sidebar + topbar) + sistema de temas con localStorage.
> 3. Página por página, rediseñar markup conservando handlers.
> 4. Pasar responsive y estados (hover/focus/inválido/vacío).
>
> Empezá listando mis archivos actuales y proponiendo el plan antes de editar.

---

## Notas
- Si tu sitio no es HTML multipágina sino un framework (React/Vue/etc.), reemplazá los nombres
  de archivo por tus componentes/rutas equivalentes; el resto del prompt aplica igual.
- `fixtrack/tweaks-panel.jsx` es solo del entorno de prototipado: **no lo portes**. El selector
  de temas de producción es `screen-config.jsx` + la lógica de `app.jsx`.
- Tip: pedile a Claude Code que trabaje **una página a la vez** y que después de cada una
  abra/te muestre el resultado, así controlás que no se rompa el funcionamiento.
