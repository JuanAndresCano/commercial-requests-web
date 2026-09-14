# Patrones de UI y sistema de marca

Documenta lo que ya está establecido visualmente para que cualquier cambio nuevo se sienta parte del mismo sistema, no una pieza aislada.

## Paleta de marca Icesi (hex exactos usados en el código)

| Color | Hex | Uso |
|---|---|---|
| Azul Icesi | `#5454e9` | Color primario de marca — botones principales, links, franja superior, etapa "Nueva" |
| Morado | `#865cf0` | Acento secundario — etapa "En Costeo", variantes dark-mode del azul en texto |
| Naranja | `#e9683b` | Alertas/atención — etapa "En Experto", badges "Sin docente", urgencia alta |
| Verde | `#4cb979` | Éxito/completado — etapa "Entregada", confirmaciones |
| Amarillo/lima | `#e4eb60` | Acento de marca (usado en la franja superior del login, en el ítem activo de la barra lateral) |
| Negro | `#090a0e` | Fondo de la barra lateral (rail) y del footer en oscuro |

Todas las etapas del pipeline tienen su color fijo y consistente en **toda la aplicación** (badges, bordes de tarjetas Kanban, barras de las tarjetas KPI, puntos de estado): Nueva=azul, En Experto=naranja, En Costeo=morado, Entregada=verde. Este mapeo color↔etapa es una convención que debe respetarse en cualquier pantalla nueva.

Las clases están casi siempre escritas con el valor hex directo entre corchetes de Tailwind (ej. `bg-[#5454e9]`, `text-[#865cf0]`) en vez de tokens de tema — es una decisión ya tomada en el prototipo, no un error a corregir por sí solo.

## Tipografía

- Fuente "display"/títulos: clase utilitaria `font-display` combinada casi siempre con `font-sans` — usada en H1/H2 de página y montos grandes.
- Textos de cuerpo: tamaños pequeños predominan (`text-xs`, `text-sm`) — es una interfaz densa de tipo "panel de control operativo", no un sitio de marketing con tipografía grande.
- Números monetarios: siempre `font-mono` para alinear dígitos.

## Tema claro/oscuro

Todo el sistema soporta dark mode con clases `dark:` explícitas en (casi) cada elemento — no se apoya únicamente en tokens semánticos de Tailwind para los colores de marca (los grises/neutros sí usan tokens como `bg-card`, `text-muted-foreground`, `border-border`, que respetan el tema automáticamente vía `ThemeContext.tsx`). Al crear una pantalla nueva, seguir el mismo patrón: tokens semánticos para neutros, hex explícito + variante `dark:` para colores de marca.

## Patrones de componentes recurrentes

### Badge de estado (`StatusBadge`, `UrgencyBadge` en `StatusBadge.tsx`)
Punto de color (`dot`) + texto, con fondo tenue (`/10` o `/15` de opacidad) y borde a juego. Se usa consistentemente en tablas, tarjetas Kanban, detalle y resumen.

### Tarjeta KPI clicable-como-filtro
Patrón repetido en `KamCommandCenter` y `ProductLeaderDashboard`: una tarjeta que muestra un número grande + descripción, que al hacer clic se convierte en el filtro activo de la lista/tablero debajo, con estado visual claro (`ring-2` + fondo tenue del color de esa métrica) cuando está activa. Es el patrón principal de "filtrado sin fricción" del sistema — preferir este patrón sobre un `<Select>` de filtro tradicional cuando el número de opciones es bajo (≤4-5) y cada opción tiene un KPI asociado.

### Kanban con acción de avance inline
En `ProductLeaderDashboard`, cada tarjeta de columna trae su propio botón de "siguiente paso" coloreado según la etapa destino — evita que el usuario tenga que entrar al detalle para la acción más frecuente (avanzar estado). Este es el patrón de "menor cantidad de pasos posible" ya aplicado con éxito en una parte del sistema; es candidato a replicarse en otras interacciones frecuentes.

### Stepper de formulario (`NewRequest.tsx`)
Círculos numerados conectados por una línea, clicables hacia atrás libremente y hacia adelante solo si el paso actual pasa validación blanda. Estado visual: pendiente (gris) / activo (azul, con anillo) / completado (verde con check).

### Modal de reasignación
Mismo patrón (select de nuevo responsable + select de nodo autosugerido + select de motivo + textarea de nota opcional) repetido de forma **casi idéntica en 3 lugares** del código (`Dashboard.tsx` rama genérica, `ProductLeaderDashboard.tsx`, `RequestDetail.tsx`). Ver `07-gaps-conocidos-y-deuda-tecnica.md` — es un candidato claro a extraerse como componente único si se continúa iterando sobre este flujo.

### Autocompletado con chips de atajo
Patrón del Paso 1 del wizard: buscador con dropdown de coincidencias + fila de "chips" de opciones frecuentes debajo, para resolver el caso común (empresa ya conocida) en un clic, sin escribir.

### Toasts (`sonner`)
Toda acción de escritura (guardar, asignar, reasignar, avanzar estado) dispara un toast de confirmación breve. Es el mecanismo de feedback estándar — no hay modales de confirmación bloqueantes para acciones no destructivas.

## Layout general (`AppShell.tsx`)

- Rail lateral fijo de 64px (`w-16`) solo en desktop (`lg:flex`), oculto en móvil a favor de un botón de menú hamburguesa que despliega un drawer con los mismos ítems.
- Navegación **por rol**, no un menú genérico con permisos ocultos — cada rol ve solo sus 2-3 ítems relevantes (ver `05-inventario-pantallas-componentes.md`).
- Franja secundaria azul debajo del header con el nombre de la unidad institucional — presente en todas las pantallas autenticadas, refuerza la identidad institucional constantemente.
- Selector de rol accesible desde dos sitios a la vez (dropdown del avatar en el rail, y dropdown en la topbar) — es redundante a propósito en el prototipo para facilitar pruebas, no necesariamente deseable en producción (ver gaps conocidos).
