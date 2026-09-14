# Roles y permisos

El sistema define 4 roles (`UserRole` en `src/context/AuthContext.tsx`). No hay autenticación real: en `/login` el usuario elige un rol con un clic y el sistema le asigna un nombre/correo por defecto (`ROLE_CONFIGS`). El rol también puede cambiarse en caliente desde el menú de usuario en `AppShell` o desde un selector dentro de `RequestDetail` (ayuda de prototipo para probar vistas — ver `07-gaps-conocidos-y-deuda-tecnica.md`).

Los dos roles **prioritarios** para este esfuerzo de UX/UI son **KAM** y **Líder de Producto**. Se documentan primero y en más profundidad.

---

## 🟦 KAM (Key Account Manager)

**`role: "kam"`** · Nombre por defecto: Andrea Martínez · `andrea.martinez@icesi.edu.co`

### Quién es y qué quiere lograr

Es el dueño comercial de la relación con el cliente corporativo. Su "resultado soñado" es simple: **conseguir que una necesidad del cliente se convierta en una propuesta económica aprobada y entregada, lo más rápido posible, sin fricción administrativa.** No le interesa la mecánica interna de costeo o asignación docente — solo necesita:

1. Registrar la necesidad del cliente rápidamente (incluso con información incompleta).
2. Saber en qué momento del proceso está cada solicitud, sin tener que perseguir a nadie.
3. Enterarse proactivamente cuando una propuesta ya tiene precio y está lista para presentar al cliente.
4. Confirmar la entrega al cliente con un clic.

### Qué puede hacer (permisos funcionales)

- Crear nuevas solicitudes (wizard de 5 pasos) — acción principal, accesible desde múltiples puntos (botón "Nueva Solicitud" en su dashboard, en la barra superior, en `/solicitudes`).
- Ver **todas** las solicitudes del sistema (no solo las suyas) en el tablero `/solicitudes` y en su dashboard.
- Ver el detalle de cualquier solicitud (`/solicitudes/:id`) en **modo mayormente solo-lectura**: ve el valor económico ya aprobado por el Líder de Producto, el desglose de respaldo (costo base, margen, estampilla) y cualquier nota de negociación — pero **no edita** el costeo.
- Marcar una solicitud como **"Entregada"** (botón "Enviar a cliente" en el detalle) — esta es su acción de cierre de ciclo.
- Ver/gestionar documentos adjuntos de la solicitud (subir/eliminar, ambas categorías).

### Qué NO hace

- No asigna docentes/expertos.
- No edita el costeo (campos deshabilitados o directamente no se muestran los controles de edición — ve una tarjeta de resumen en vez del módulo de costeo interactivo).
- No reasigna Líder de Producto (esa acción es exclusiva del rol Líder de Producto).

### Su pantalla principal: `KamCommandCenter`

Archivo: `src/components/dashboard/KamCommandCenter.tsx`, montado desde `src/pages/Dashboard.tsx` cuando `role === "kam"`.

Estructura (de arriba hacia abajo):
1. **Saludo personalizado** ("Hola, Andrea") + botón prominente "Nueva Solicitud".
2. **Banner contextual** que solo aparece si hay ≥1 solicitud en estado `en-costeo`: *"¡Tienes N propuestas listas para entregar!"* — con botón directo para filtrar la tabla a esas.
3. **4 tarjetas KPI clicables** (funcionan como filtros de la tabla de abajo):
   - Total Solicitudes
   - En Proceso (`nueva` + `en-experto`)
   - Listas para Entregar (`en-costeo`)
   - Pipeline Cotizado (suma en COP de todo lo que está en `en-costeo` o `entregada`)
4. **Tabla de actividad reciente** con buscador, columnas: ID+fecha relativa, Propuesta+Empresa+tipo de servicio, Líder de Producto, Valor Ofertado (o "Pendiente de costeo" si aún no hay), Estado, Acción (link a detalle; el botón cambia de estilo/label si está lista para entregar).

### Su journey de creación de solicitud

Ver detalle completo en `03-flujos-de-usuario.md`. Resumen: wizard de 5 pasos (`src/pages/NewRequest.tsx`) — Empresa → Contacto → Requerimiento → Formación previa → Observaciones y Documentos. Solo 2 campos son obligatorios en todo el flujo: **nombre/razón social de la empresa** (paso 1) y **título de la propuesta** (paso 3). Todo lo demás es opcional, con autoguardado en `localStorage` y recuperación de borrador.

---

## 🟪 Líder de Producto

**`role: "lider-producto"`** · Nombre por defecto: Juan Pablo Corrales Arenas · `juanpablo.corrales@icesi.edu.co` · Nodo asociado: Inteligencia Artificial y Tecnologías Digitales

### Quién es y qué quiere lograr

Es el motor operativo/técnico interno. Recibe la solicitud cruda del KAM y tiene que convertirla en una propuesta ejecutable con precio. Su "resultado soñado": **triage rápido de lo nuevo que le llega, asignar al experto correcto sin fricción, calcular un costeo confiable en segundos, y devolver la propuesta al KAM sin ambigüedad de que ya está lista.**

A diferencia del KAM (que opera con pocas solicitudes activas a la vez conceptualmente), el Líder de Producto normalmente gestiona un **volumen de solicitudes en distintas etapas simultáneamente** — de ahí que su pantalla principal sea un Kanban con acciones directas en cada tarjeta, no una tabla.

### Qué puede hacer (permisos funcionales)

- Ver solicitudes filtradas por **"Mis Solicitudes"** (asignadas a su nombre) o **"Todas"** (todo el sistema) — por defecto arranca en "Mis Solicitudes".
- **Asignar docente/experto** a una solicitud (`nueva` → tiene que hacerlo antes/al avanzar): elige entre profesor de planta (lista cerrada) o registra un consultor externo (ficha completa).
- **Editar el costeo financiero completo**: costo base, margen %, activar/desactivar "requiere asesor externo", ajustar manualmente el valor ofertado, agregar nota de negociación.
- **Avanzar el estado** de la solicitud a través de las 4 etapas (botones de acción directos: "Pasar a Experto", "Pasar a Costeo", "Entregar").
- **Reasignar** una solicitud completa a otro Líder de Producto/nodo (si el tema no corresponde a su especialidad, fue mal asignada por el KAM, o hay sobrecarga operativa) — con motivo estructurado (`select` de razones) y nota opcional.
- Subir/eliminar documentos (ambas categorías: cara al cliente e internos de costeo).
- Ver contacto del asesor externo asignado.

### Qué NO hace

- No crea solicitudes nuevas (aunque tiene acceso a la ruta, esa acción es del KAM).
- No confirma el "envío al cliente" final (eso lo hace el KAM una vez la propuesta está `entregada` desde el lado del Líder de Producto — aunque en la práctica el propio Líder de Producto también tiene un botón "Marcar Entregada" que mueve el estado; el paso de "Enviar a cliente" visible para KAM es la confirmación comercial de cierre).

### Su pantalla principal: `ProductLeaderDashboard`

Archivo: `src/components/dashboard/ProductLeaderDashboard.tsx`, montado desde `src/pages/Dashboard.tsx` cuando `role === "lider-producto"`.

Estructura:
1. **Header** con toggle "Mis Solicitudes (N)" vs "Todas (N)".
2. **4 tarjetas KPI-filtro** — una por cada etapa del pipeline (Nuevas / En Experto / En Costeo / Entregadas), coloreadas con el color oficial de esa etapa, clicables para filtrar el Kanban de abajo a una sola columna.
3. **Buscador** (por empresa, código, docente).
4. **Kanban de 4 columnas** (una por etapa). Cada tarjeta de solicitud muestra: ID+empresa, título, urgencia, tipo de servicio, badge "Mi producto" si es suya, docente asignado (o "Sin docente"), fecha, y en el pie: botón de reasignar (ícono) + **botón de avance de etapa específico para esa columna** (color distinto por etapa: naranja "Pasar a Experto", morado "Pasar a Costeo", verde "Entregar").

### Su journey de trabajo sobre una solicitud

Ver detalle completo en `03-flujos-de-usuario.md`. Resumen: desde el Kanban o desde el detalle (`/solicitudes/:id`), en `RequestDetail.tsx` ve **dos módulos adicionales que el KAM no ve**:
- `ProposalCostingModule` (módulo interactivo completo de costeo, editable en vivo).
- Botones de acción de cambio de estado según la etapa actual, y botón de reasignación de Líder de Producto en la tarjeta lateral "Equipo Asignado".

---

## 🟨 Líder de Nodo (rol secundario, menos desarrollado)

**`role: "lider-nodo"`** · Nombre por defecto: Carlos Riveros · Nodo asociado: Competitividad Organizacional, Economías Creativas

Rol de supervisión/coordinación a nivel de nodo académico. En el prototipo actual **no tiene un dashboard propio dedicado** (cae en la rama genérica de `src/pages/Dashboard.tsx`, la cual además tiene un bug que la rompe — ver `07-gaps-conocidos-y-deuda-tecnica.md`). Su navegación (`AppShell`) solo ofrece "Inicio" y "Solicitudes de nodo". No es foco de este esfuerzo de UX, pero cualquier cambio en la lógica de reasignación (que involucra nodos) debería considerar que este rol existe conceptualmente.

## 🟩 Profesor (rol secundario, menos desarrollado)

**`role: "profesor"`** · Nombre por defecto: Dr. Ricardo Mejía

Rol del docente ya asignado a una solicitud, que diseñaría el contenido curricular. Tampoco tiene dashboard propio dedicado (misma rama genérica rota). Su navegación solo ofrece "Inicio" y "Mis propuestas". No es foco de este esfuerzo de UX.

---

## Tabla resumen de permisos

| Acción | KAM | Líder de Producto | Líder de Nodo | Profesor |
|---|:---:|:---:|:---:|:---:|
| Crear solicitud | ✅ | (técnicamente accesible, no es su flujo) | — | — |
| Ver todas las solicitudes | ✅ | ✅ (toggle "Todas") | ✅ (implícito) | ❌ (solo las suyas) |
| Asignar docente/experto | ❌ | ✅ | ❌ | ❌ |
| Editar costeo | ❌ (solo lectura) | ✅ | ❌ | ❌ |
| Avanzar etapa del pipeline | ❌ (solo confirma entrega final) | ✅ | ❌ | ❌ |
| Reasignar Líder de Producto | ❌ | ✅ | — (no implementado) | — |
| Subir/eliminar documentos | ✅ | ✅ | — | — |
| Marcar "Entregada"/"Enviar a cliente" | ✅ (confirmación comercial) | ✅ (también puede, desde el Kanban) | — | — |
