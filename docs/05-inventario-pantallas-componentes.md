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
├── components/
│   ├── AppShell.tsx            # Layout raíz: sidebar, topbar, footer (todas las páginas autenticadas)
│   ├── RequestCard.tsx         # Tarjeta compacta de solicitud (usada en tablero y grids)
│   ├── StatusBadge.tsx         # Badge de estado + badge de urgencia
│   ├── AndyAssistantWidget.tsx # Mascota/asistente flotante
│   ├── IcesiLogo.tsx           # Logo, símbolo y "cenefa" de marca Icesi (SVG)
│   ├── ThemeToggle.tsx         # Switch de tema
│   ├── NavLink.tsx
│   ├── dashboard/
│   │   ├── KamCommandCenter.tsx       # Dashboard específico de KAM
│   │   └── ProductLeaderDashboard.tsx # Dashboard específico de Líder de Producto
│   ├── costing/
│   │   ├── ProposalCostingModule.tsx      # Módulo interactivo de costeo (solo Líder de Producto)
│   │   ├── AdvisorAssignmentModal.tsx     # Modal de asignación de docente/experto
│   │   └── ProposalDocumentsSection.tsx   # Gestión de documentos adjuntos
│   └── ui/                     # Primitivos shadcn/ui (Button, Input, Select, Dialog, Tabs, etc.)
```

## Tabla ruta → pantalla

| Ruta | Archivo | Propósito | Roles que la ven distinto |
|---|---|---|---|
| `/` | `pages/Index.tsx` | Landing pública (no autenticada) | Todos |
| `/login` | `pages/Login.tsx` | Selección de rol + formulario de acceso simulado | Todos |
| `/dashboard` | `pages/Dashboard.tsx` | Bifurca: renderiza `KamCommandCenter` o `ProductLeaderDashboard` según rol; para `lider-nodo`/`profesor` cae en una rama genérica **rota** (ver `07-gaps-conocidos-y-deuda-tecnica.md`) | KAM / Líder de Producto tienen componente dedicado |
| `/solicitudes` | `pages/RequestsBoard.tsx` | Tablero general: vista Kanban o Lista, con filtros de texto/estado/urgencia/tipo + "scope" (Todas / Asignadas a mi rol / Sin profesor) | Mismo componente para todos los roles, pero el filtro por defecto cambia (Líder de Producto arranca en "mine") |
| `/solicitudes/nueva` | `pages/NewRequest.tsx` | Wizard de 5 pasos para registrar una solicitud | Pensado para KAM, pero accesible a cualquier rol |
| `/solicitudes/:id` | `pages/RequestDetail.tsx` | Detalle completo — bifurca fuertemente entre `role === "lider-producto"` (módulo de costeo editable + acciones de avance) y KAM (vista de costeo solo-lectura + botón "Enviar a cliente") | KAM vs. Líder de Producto — la diferencia más importante de todo el sistema |
| `/solicitudes/:id/resumen` | `pages/RequestSummary.tsx` | Vista de resumen "imprimible" | ⚠️ Hoy con contenido 100% fijo, no lee la solicitud real (ver gaps conocidos) |
| `*` | `pages/NotFound.tsx` | 404 | — |

## Componentes clave por journey

### Journey KAM
- `KamCommandCenter.tsx` — dashboard con KPIs clicables + tabla de actividad.
- `NewRequest.tsx` — wizard completo, incluye subcomponentes internos `Step1`..`Step5`, `Field`, `RadioGroup`, `SectionHeader`, `SuccessScreen` (todos definidos dentro del mismo archivo, no exportados aparte).
- `RequestDetail.tsx` (rama KAM) — tarjeta de propuesta económica de solo lectura, tarjeta "Equipo Asignado". También ve (compartida con Líder de Producto) la tarjeta lateral "Especificaciones del Servicio", que hoy muestra valores parcialmente hardcodeados ("60 horas", "Híbrida", "15-20 personas") sin leer los datos reales capturados en el wizard — ver `07-gaps-conocidos-y-deuda-tecnica.md`.

### Journey Líder de Producto
- `ProductLeaderDashboard.tsx` — Kanban de 4 columnas con KPIs-filtro y acciones de avance inline.
- `RequestDetail.tsx` (rama Líder de Producto) — monta `ProposalCostingModule` + `ProposalDocumentsSection` + botones de avance de etapa + modal de reasignación.
- `AdvisorAssignmentModal.tsx` — modal con tabs "Planta" / "Externo".
- `ProposalCostingModule.tsx` — el módulo financiero interactivo (inputs de costo base, margen, switch de externo, desglose en vivo, ajuste manual de valor ofertado, nota de negociación).

### Compartidos entre ambos
- `AppShell.tsx` — layout raíz. Contiene: rail lateral fijo (ícono app, avatar+dropdown de usuario/cambio de rol, navegación por ítems dinámicos según rol, toggle de tema, logout), topbar (logo, dropdown de rol, toggle de tema, botón "Nueva"), franja de marca secundaria, `<main>`, footer institucional, y el widget flotante `AndyAssistantWidget`.
- `RequestCard.tsx` — tarjeta usada en `RequestsBoard.tsx` (vista Kanban/Lista genérica, distinta del Kanban propio de `ProductLeaderDashboard`).
- `StatusBadge.tsx` — exporta `StatusBadge` (por `RequestStatus`) y `UrgencyBadge` (por `Urgency`).
- `ProposalDocumentsSection.tsx` — usado en el detalle para ambos roles (con matices de permisos vía prop `userRole`).

## Navegación por rol (`AppShell.tsx`, función `navItems`)

| Rol | Ítems de navegación |
|---|---|
| KAM | Inicio · Solicitudes · Nueva solicitud |
| Líder de Producto | Inicio · Solicitudes · **Asignar docentes** (atajo directo a `/solicitudes?filter=sin-profesor`) |
| Líder de Nodo | Inicio · Solicitudes de nodo |
| Profesor | Inicio · Mis propuestas |

## Componentes de UI base (shadcn/ui) usados intensivamente

`Button`, `Input`, `Textarea`, `Label`, `Select`, `Dialog`, `Tabs`, `Switch`, `Badge`, `DropdownMenu`, `Toast` (vía `sonner`). Están en `src/components/ui/` y no requieren documentación aparte — son los primitivos estándar de shadcn, sin personalización de lógica de negocio.
