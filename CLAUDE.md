# FixTrack — Contexto del proyecto

App web para gestión de reparaciones de un taller de celulares/dispositivos.

## Stack
- HTML + CSS + JS vanilla. Sin frameworks, sin build tools, sin dependencias.
- Un solo `app.js` y un solo `styles.css` compartidos por todas las páginas.
- Datos en `localStorage` (clave: `fixtrack_reparaciones`).
- Fuente: Poppins (Google Fonts).

## Estructura de datos — Reparación

```js
{
  id: Number,
  cliente: String,
  dispositivo: "Celular" | "Tablet" | "Laptop" | "Otro",
  marca: String,
  modelo: String,
  identificador: String,         // IMEI / ESN / SN
  passwordDispositivo: String,
  patronImagen: String,          // base64 PNG del canvas
  patronSecuencia: String,       // "1-2-5-8-9"
  gastos: [{ id, concepto, montoUnitario, cantidad, total }],
  accesorios: String,
  costoAproximado: Number,
  anticipo: Number,
  fechaEntrega: String,          // "YYYY-MM-DD"
  fechaIngreso: String,          // "YYYY-MM-DD"
  estado: "En espera" | "Activo" | "Finalizado" | "Cancelado",
  problema: String,
  observaciones: String,
  cierre: null | {
    costoInicial, gastos, costoFinal, solucionFinal, ganancia, fechaFinalizacion
  }
}
```

## Páginas

| Archivo | Estado | Descripción |
|---|---|---|
| `index.html` | Funcional | Dashboard: 4 stats, accesos rápidos, últimas 5 reparaciones |
| `nueva-reparacion.html` | Funcional | Formulario de alta de reparación |
| `reparaciones.html` | Funcional | Listado con búsqueda y filtro por estado |
| `editar-reparacion.html` | Funcional | Edición + gastos + modal de cierre/finalización |
| `clientes.html` | Placeholder | Fichas, historial y contacto por cliente |
| `reportes.html` | Funcional | Dashboard: 8 KPIs, gráfico semanal (Chart.js CDN), Top 5, categorías por dispositivo |
| `inventario.html` | Placeholder | Stock de repuestos, stock mínimo, movimientos |
| `proveedores.html` | Placeholder | Datos de proveedores |
| `configuracion.html` | Placeholder | Ajustes de la app |
| `ayuda.html` | Placeholder | Centro de ayuda |

## Funciones clave en app.js

| Función | Qué hace |
|---|---|
| `loadRepairs()` | Lee y normaliza reparaciones de localStorage |
| `saveRepairs()` | Persiste el array `repairs` en localStorage |
| `normalizeRepair(r)` | Normaliza campos legacy al esquema actual |
| `normalizeStatus(s)` | Mapea estados viejos al esquema actual |
| `renderStats()` | Actualiza los 4 contadores del dashboard |
| `renderTable()` | Renderiza listado con búsqueda y filtro |
| `renderDashboardTable()` | Renderiza las últimas 5 reparaciones |
| `setupEditForm()` | Carga datos en el form de edición |
| `setupExpenses()` | Gestiona el modal y tabla de gastos |
| `setupFinishFlow()` | Gestiona el modal de cierre de reparación |
| `setupPatternCanvas()` | Dibuja el patrón de desbloqueo en canvas |
| `setupReportsDashboard()` | Inicializa selectores de mes/año y llama a renderReportsDashboard |
| `renderReportsDashboard()` | Calcula y pinta los 8 KPIs del dashboard de reportes |
| `renderWeeklyChart()` | Dibuja el gráfico de línea semanal con Chart.js |
| `renderTop5Table(repairs)` | Tabla de top 5 reparaciones por valor del mes |
| `renderCategoriesChart(repairs)` | Barras CSS con conteo por tipo de dispositivo |
| `formatMoney(v)` | Formatea a ARS con `Intl.NumberFormat` |
| `formatDate(v)` | Convierte "YYYY-MM-DD" a "DD/MM/YYYY" |
| `escapeHtml(v)` | Escapa HTML para prevenir XSS |

## Convenciones
- Todas las páginas incluyen el mismo sidebar y `app.js`.
- El link activo del sidebar tiene clase `active`.
- Clases de estado en pills: `waiting` | `active` | `done` | `cancelled`.
- IDs de reparación empiezan en 1001 y se autoincrementan.
- Las páginas placeholder tienen una `<section class="panel empty-page">` como contenido.
- No agregar frameworks ni dependencias externas (excepciones: Chart.js CDN en `reportes.html`, Supabase CDN en todos los HTML).
- Base de datos: Supabase (PostgreSQL). Tabla `reparaciones`. Cliente en `db.js`.
- `db.js` debe cargarse antes que `app.js` en todos los HTML, y después del CDN de Supabase.
- Las operaciones de guardado son async: `dbInsert(repair)` para crear, `dbUpsert(repair)` para editar/finalizar.
- `initApp()` es async: carga los datos con `dbLoad()` antes de renderizar.
- No agregar comentarios en el código salvo que el "por qué" sea no obvio.
