# Inventario de pantallas y componentes

Mapa completo ruta → propósito → roles → archivos, para ubicar rápido dónde tocar cada cosa.

## Estructura general

```
src/
├── App.tsx                    # Definición de rutas (react-router-dom)
├── context/
│   ├── AuthContext.tsx        # Sesión simulada + CRUD de solicitudes (localStorage)
│   └── ThemeContext.tsx       # Tema claro/oscuro
├── lib/
│   ├── mock-data.ts           # Todo el "modelo de datos" + datos semilla + cálculos
│   └── utils.ts                # helper cn() (clsx + tailwind-merge)
├── pages/                     # Una carpeta por ruta (ver tabla abajo)
├── hooks/
│   ├── use-persistent-state.ts # useState que persiste en localStorage (filtros/vista de los dashboards)
│   └── use-reassign-request.ts # Regla de negocio de reasignación (compartida, ver `07` gap #9)
├── components/
│   ├── AppShell.tsx            # Layout raíz: sidebar (hover-expand), topbar, footer (todas las páginas autenticadas)
│   ├── RequestCard.tsx         # Tarjeta compacta de solicitud (usada en tablero y grids)
│   ├── ReassignLeaderDialog.tsx # Modal compartido de reasignación de Líder de Producto (antes triplicado, ver `07` gap #9)
│   ├── ScrollToTop.tsx         # Resetea el scroll a (0,0) en cada cambio de ruta (ver `07` gap #19)
│   ├── RoleBadge.tsx           # Insignia de rol junto al saludo ("Hola, X [Rol]") — 1 solo color, reutilizada en 3 pantallas
│   ├── StatusBadge.tsx         # Badge de estado + badge de urgencia
│   ├── IcesiLogo.tsx           # Logo, símbolo y "cenefa" de marca Icesi (SVG)
│   ├── ThemeToggle.tsx         # Switch de tema (variantes icon/pill, con o sin etiqueta)
│   ├── NavLink.tsx
│   ├── kanban/
│   │   ├── KanbanColumn.tsx    # Columna de Kanban genérica y reutilizable (usada por los 3 tableros)
│   │   └── StageKpiCard.tsx    # Tarjeta KPI genérica y reutilizable (usada por los 2 dashboards)
│   ├── dashboard/
│   │   ├── KamCommandCenter.tsx       # Dashboard específico de KAM
│   │   └── ProductLeaderDashboard.tsx # Dashboard específico de Líder de Producto
│   ├── costing/
│   │   ├── ProposalCostingModule.tsx      # Módulo interactivo de costeo (solo Líder de Producto)
│   │   ├── AdvisorAssignmentModal.tsx     # Modal de asignación de docente/experto
│   │   └── ProposalDocumentsSection.tsx   # Gestión de documentos adjuntos
│   └── ui/                     # Primitivos shadcn/ui (Button, Input, Select, Dialog, Tabs, etc.)
```

`src/lib/kanban-theme.ts` complementa `mock-data.ts`: define la paleta única de las 4 fases del pipeline (color, clases de borde/hover/activo) que comparten `KanbanColumn`, `StageKpiCard` y los 3 tableros, para que Kanban y tarjetas KPI luzcan y se comporten igual en todas partes.

⚠️ El widget flotante "Andy" (`AndyAssistantWidget.tsx`) **se eliminó por completo** a petición explícita — si aparece referenciado en código o capturas viejas, ya no existe.

## Tabla ruta → pantalla

| Ruta | Archivo | Propósito | Roles que la ven distinto |
|---|---|---|---|
| `/` | `pages/Index.tsx` | Landing pública (no autenticada) | Todos |
| `/login` | `pages/Login.tsx` | Selección de rol + formulario de acceso simulado | Todos |
| `/dashboard` | `pages/Dashboard.tsx` | Bifurca: renderiza `KamCommandCenter` o `ProductLeaderDashboard` según rol; para `lider-nodo`/`profesor` cae en una rama genérica **rota** (ver `07-gaps-conocidos-y-deuda-tecnica.md`) | KAM / Líder de Producto tienen componente dedicado |
| `/solicitudes` | `pages/RequestsBoard.tsx` | Tablero general: vista Kanban o Lista, con filtros de texto/estado/urgencia/tipo + "scope" (Todas / Asignadas a mi rol / Sin profesor) | Mismo componente para todos los roles, pero en la navegación (`AppShell`) solo **Líder de Nodo** ("Solicitudes de nodo") y **Profesor** ("Mis propuestas") tienen un ítem de menú que apunta aquí — KAM y Líder de Producto usan su propio dashboard (`/dashboard`) como pantalla principal de solicitudes y solo llegan a esta ruta si la visitan directamente. El filtro por defecto sigue cambiando según el rol (Líder de Producto arranca en "mine") por si acaso. |
| `/solicitudes/nueva` | `pages/NewRequest.tsx` | Wizard de 5 pasos para registrar una solicitud | Pensado para KAM, pero accesible a cualquier rol |
| `/solicitudes/:id` | `pages/RequestDetail.tsx` | Detalle completo — bifurca fuertemente entre `role === "lider-producto"` (módulo de costeo editable + acciones de avance) y KAM (vista de costeo solo-lectura + botón "Enviar a cliente") | KAM vs. Líder de Producto — la diferencia más importante de todo el sistema |
| `*` | `pages/NotFound.tsx` | 404 | — |

⚠️ La ruta `/solicitudes/:id/resumen` (`RequestSummary.tsx`) **ya no existe** — se eliminó porque todo su contenido era fijo/de ejemplo. Si algún documento viejo la menciona, está desactualizado.

## Componentes clave por journey

### Journey KAM
- `KamCommandCenter.tsx` — dashboard con KPIs clicables + tabla de actividad.
- `NewRequest.tsx` — wizard completo, incluye subcomponentes internos `Step1`..`Step5`, `Field`, `RadioGroup`, `SectionHeader`, `SuccessScreen` (todos definidos dentro del mismo archivo, no exportados aparte).
- `RequestDetail.tsx` (rama KAM) — tarjeta de propuesta económica de solo lectura, tarjeta "Equipo Asignado", sección colapsable "Información completa de la solicitud" (editable solo por el KAM dueño mientras el estado es "Nueva", vía modal con 6 pestañas). También ve (compartida con Líder de Producto) la tarjeta lateral "Especificaciones del Servicio", que ya lee los datos reales capturados en el wizard (`horas`, `modalidad`, `participantes`) — el gap que documentaba valores hardcodeados ("60 horas", "Híbrida") ya está resuelto.

### Journey Líder de Producto
- `ProductLeaderDashboard.tsx` — Kanban de 4 columnas con KPIs-filtro y acciones de avance inline.
- `RequestDetail.tsx` (rama Líder de Producto) — monta `ProposalCostingModule` + `ProposalDocumentsSection` + botones de avance de etapa + modal de reasignación.
- `AdvisorAssignmentModal.tsx` — modal con tabs "Planta" / "Externo".
- `ProposalCostingModule.tsx` — el módulo financiero interactivo: Valor Final de la Propuesta y Margen de Contribución (% y $) digitados directamente (ya no hay costo base ni switch de "requiere asesor externo" — ver `04`, `ProposalCosting`), referencia de Estampilla Pro-Cultura, indicador de solo lectura del asesor, nota de alcance libre, y el botón de gate "Enviar a KAM".
- **"Historial de Negociación"** (sección dentro de `RequestDetail.tsx`, no un archivo aparte) — visible para Líder y KAM, solo si ya hay más de una ronda o una rechazada; cada ronda registra valor, margen y alcance del momento en que el Líder confirmó "Enviar a KAM" (ver `04`, `NegotiationRound`).

### Compartidos entre ambos
- `AppShell.tsx` — layout raíz. Contiene: rail lateral fijo (ícono app, avatar+dropdown de usuario/cambio de rol/**restablecer datos de ejemplo**, navegación por ítems dinámicos según rol, toggle de tema, logout), con **animación de expansión al pasar el cursor** (ancho angosto de solo íconos que se ensancha revelando las etiquetas de texto — inspirado en el portal de estudiantes de Icesi), topbar (logo, dropdown de rol, toggle de tema), franja de marca secundaria, `<main>`, footer institucional. Ya **no** tiene ningún widget flotante.
- `RequestCard.tsx` — tarjeta usada en `RequestsBoard.tsx` y en el Kanban de `KamCommandCenter` (vista Kanban/Lista genérica, distinta de las tarjetas del Kanban propio de `ProductLeaderDashboard`, que están en línea dentro del propio archivo por tener botones de acción específicos).
- `KanbanColumn.tsx` / `StageKpiCard.tsx` — genéricos, parametrizados por `RequestStatus` vía `STAGE_THEME` (`kanban-theme.ts`). `KanbanColumn` soporta un modo `isolated` (una sola columna a ancho completo, tarjetas en cuadrícula de hasta 3 por fila) usado cuando el usuario "aísla" una fase desde una tarjeta KPI en vista Kanban.
- `StatusBadge.tsx` — exporta `StatusBadge` (por `RequestStatus`) y `UrgencyBadge` (por `Urgency`).
- `ProposalDocumentsSection.tsx` — usado en el detalle para ambos roles (con matices de permisos vía prop `userRole`).

## Navegación por rol (`AppShell.tsx`, función `navItems`)

| Rol | Ítems de navegación |
|---|---|
| KAM | Solicitudes · Nueva solicitud |
| Líder de Producto | Solicitudes (un solo ítem — ya no hay "Inicio" separado del tablero, ni el atajo "Asignar docentes" que existía antes) |
| Líder de Nodo | Inicio · Solicitudes de nodo |
| Profesor | Inicio · Mis propuestas |

## Componentes de UI base (shadcn/ui) usados intensivamente

`Button`, `Input`, `Textarea`, `Label`, `Select`, `Dialog`, `Tabs`, `Switch`, `Badge`, `DropdownMenu`, `Toast` (vía `sonner`). Están en `src/components/ui/` y no requieren documentación aparte — son los primitivos estándar de shadcn, sin personalización de lógica de negocio.
