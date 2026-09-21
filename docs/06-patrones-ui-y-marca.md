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

### Tarjeta KPI: doble comportamiento según la vista (`StageKpiCard`, componente compartido)
Patrón repetido en `KamCommandCenter` y `ProductLeaderDashboard`, ya extraído a un componente único (`src/components/kanban/StageKpiCard.tsx`) parametrizado por `RequestStatus` vía `STAGE_THEME`. El comportamiento del clic **depende de la vista activa**, porque el mismo control significa cosas distintas según el contexto:
- **En vista Tabla**, filtra: oculta las filas que no coinciden. Aporta valor real porque la tabla mezcla todos los estados en una lista plana.
- **En vista Kanban**, **no filtra** — las columnas del Kanban ya son el filtro, así que ocultar tarjetas no aportaría nada nuevo (se probó y se descartó: dejaba 3 columnas vacías sin explicación, sensación de "esto no hace nada"). En su lugar, **aísla esa columna a pantalla completa** (`KanbanColumn` con prop `isolated`), mostrando las tarjetas en una cuadrícula de hasta 3 por fila. Esto SÍ aporta algo que la Tabla no puede: revisar varias tarjetas de una fase con más detalle visual, sin salir del formato Kanban.

Lección de diseño: antes de replicar un control de filtro en una vista nueva, preguntarse si esa vista ya comunica la misma información de otra forma (ej. columnas separadas) — si es así, el control necesita un propósito distinto ahí, no el mismo con menos efecto.

### Kanban con acción de avance — fricción proporcional al riesgo
En `ProductLeaderDashboard`, cada tarjeta de columna trae su propio botón de "siguiente paso" coloreado según la etapa destino, para no obligar a entrar al detalle en la acción más frecuente. Pero no todas las transiciones tienen el mismo costo de error:
- "Pasar a Experto" / "Pasar a Costeo": requieren confirmar en un diálogo que muestra los datos concretos de la solicitud (empresa + título), no un texto genérico — mitiga el clic accidental en una tarjeta densa con varios botones pegados.
- "Entregar" (enviar al cliente): es el punto sin retorno comercial, y **ya no existe en absoluto para el Líder de Producto** — ni como botón de un clic en el Kanban, ni en el detalle. Se encontró que el Líder tenía su propio "Marcar Entregada" que saltaba directo a `entregada` sin pasar por el KAM, contradiciendo la regla de negocio de que es el KAM quien hace el envío final al cliente. Ahora, en "En Costeo", lo más lejos que puede llegar el Líder es confirmar el gate con el botón "Enviar a KAM"; una vez confirmado, la tarjeta solo muestra la etiqueta pasiva "Enviado al KAM" — la fricción máxima aquí es **quitar el control por completo**, no solo esconderlo detrás de una confirmación.

Patrón a replicar: la fricción (confirmar, o incluso quitar el atajo directo) debe ser proporcional a qué tan caro es deshacer el error, no uniforme para todas las acciones de una pantalla.

### Rail lateral con expansión en hover (`AppShell.tsx`)
El rail izquierdo arranca angosto (solo íconos, `w-16`) y se expande suavemente (`transition-[width]`, ~300ms) al pasar el cursor, revelando las etiquetas de texto de cada ítem (nombre de usuario + rol, "Solicitudes", tema, cerrar sesión). Técnica: el contenedor tiene `overflow-hidden` y las etiquetas usan `whitespace-nowrap` — no se necesita animar opacidad ni ancho por elemento, el contenido simplemente se revela a medida que el contenedor crece. Como el rail es `fixed`, se expande *sobre* el contenido en vez de empujarlo (no hay reflow). Inspirado explícitamente en el rail del portal de estudiantes de Icesi (`portal.icesi.edu.co`).

### Stepper de formulario (`NewRequest.tsx`)
Círculos numerados conectados por una línea, clicables hacia atrás libremente y hacia adelante solo si el paso actual pasa validación blanda. Estado visual: pendiente (gris) / activo (azul, con anillo) / completado (verde con check).

### Modal de reasignación
Mismo patrón (select de nuevo responsable + select de nodo autosugerido + select de motivo + textarea de nota opcional) repetido de forma **casi idéntica en 3 lugares** del código (`Dashboard.tsx` rama genérica, `ProductLeaderDashboard.tsx`, `RequestDetail.tsx`). Ver `07-gaps-conocidos-y-deuda-tecnica.md` — es un candidato claro a extraerse como componente único si se continúa iterando sobre este flujo.

### Autocompletado con chips de atajo
Patrón del Paso 1 del wizard: buscador con dropdown de coincidencias + fila de "chips" de opciones frecuentes debajo, para resolver el caso común (empresa ya conocida) en un clic, sin escribir.

### Toasts (`sonner`)
Toda acción de escritura (guardar, asignar, reasignar, avanzar estado) dispara un toast de confirmación breve. Es el mecanismo de feedback estándar — no hay modales de confirmación bloqueantes para acciones no destructivas.

## Layout general (`AppShell.tsx`)

- Rail lateral de 64px (`w-16`) en reposo, expandido a 256px (`w-64`) en hover, solo en desktop (`lg:flex`) — oculto en móvil a favor de un botón de menú hamburguesa que despliega un drawer con los mismos ítems.
- Navegación **por rol**, no un menú genérico con permisos ocultos — cada rol ve solo sus 1-3 ítems relevantes (ver `05-inventario-pantallas-componentes.md`).
- Franja secundaria azul debajo del header con el nombre de la unidad institucional — presente en todas las pantallas autenticadas, refuerza la identidad institucional constantemente.
- El selector de rol vive en un solo sitio (dropdown en la topbar, arriba a la derecha) — el que existía además dentro de `RequestDetail` ya se eliminó, y el dropdown del avatar en el rail es exclusivamente para "Restablecer datos de ejemplo" y "Cerrar sesión". Sigue siendo una ayuda de prototipo para probar roles sin backend real (ver gaps conocidos), no algo a preservar en producción.
