# Roles y permisos

El sistema define 4 roles (`UserRole` en `src/context/AuthContext.tsx`). No hay autenticación real: en `/login` el usuario elige un rol con un clic y el sistema le asigna un nombre/correo por defecto (`ROLE_CONFIGS`). El rol también puede cambiarse en caliente desde el menú de usuario en `AppShell` (dropdown del avatar en el rail lateral, o dropdown de rol en la topbar) — es ayuda de prototipo para probar vistas, ver `07-gaps-conocidos-y-deuda-tecnica.md`. El selector adicional que existía dentro de `RequestDetail` ya se eliminó.

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
- Ver **únicamente sus propias solicitudes** — confirmado con la Líder de Producto (`08`, pregunta 1): el KAM es dueño de su propia cartera de clientes, no tiene acceso al pipeline comercial de sus compañeros. Se eliminó el toggle "Mis Solicitudes / Todas" que existía antes.
- Ver el detalle de sus solicitudes (`/solicitudes/:id`) en **modo mayormente solo-lectura**: ve el **Valor Total Ofertado** y, si el tipo es "Capacitación", la Estampilla Pro-Cultura — pero **no ve el Costo Base Directo ni el Margen de Contribución** (información interna de costeo, exclusiva del Líder de Producto — `08`, pregunta 3). No edita el costeo.
- **Editar la información completa de su propia solicitud** (empresa, contacto, diagnóstico, formación previa, observaciones, título y urgencia) **mientras esté en estado "Nueva"** — es el dueño de esos datos y es quien debe corregirlos si se equivocó al diligenciarlos (`08`, preguntas 4 y 8). Se edita desde un modal con pestañas (General/Empresa/Contacto/Diagnóstico/Formación/Otros), con validación de formato en correos/teléfonos, aviso si se cierra con cambios sin guardar, y un contador de "X de Y campos diligenciados" visible incluso sin abrir el modal. Una vez el Líder de Producto empieza a trabajarla (estado distinto de "Nueva"), deja de ser editable para el KAM.
- **Cancelar/eliminar su propia solicitud mientras esté en estado "Nueva"** (`08`, pregunta 14) — para corregir errores de creación (empresa duplicada, datos incorrectos) antes de que nadie la haya trabajado. Es un borrado físico e inmediato (con confirmación), no queda historial.
- Marcar una solicitud como **"Entregada"** (botón "Enviar a cliente" en el detalle) — esta es su acción de cierre de ciclo, y es **exclusiva del KAM**: el Líder de Producto no tiene ningún botón equivalente (ver más abajo, se corrigió un hueco donde sí lo tenía). **El botón está deshabilitado si el Líder de Producto todavía no definió un Valor Total Ofertado mayor a $0** (se encontró y corrigió un hueco donde se podía entregar con costeo en $0).
- **Devolver una propuesta "Entregada" a "En proceso de costeo" con observaciones del cliente** (`08`, pregunta 13) — cuando el cliente pide ajustes tras recibir la propuesta. La nota queda visible para ambos roles (banner ámbar en el detalle, y en la tarjeta del Kanban del Líder) hasta que se vuelva a entregar.
- Ver/gestionar documentos adjuntos de la solicitud (subir/eliminar, ambas categorías).

### Qué NO hace

- No ve las solicitudes de otros KAMs.
- No asigna docentes/expertos.
- No edita el costeo (campos deshabilitados o directamente no se muestran los controles de edición — ve una tarjeta de resumen en vez del módulo de costeo interactivo), ni ve el desglose interno (costo base, margen).
- No reasigna Líder de Producto (esa acción es exclusiva del rol Líder de Producto).
- No puede editar ni cancelar la solicitud una vez el Líder de Producto empezó a trabajarla (estado distinto de "Nueva").

### Su pantalla principal: `KamCommandCenter`

Archivo: `src/components/dashboard/KamCommandCenter.tsx`, montado desde `src/pages/Dashboard.tsx` cuando `role === "kam"`. Todo su estado de UI (filtro, búsqueda, vista, columna aislada) se persiste en `localStorage` vía el hook `usePersistentState` — sobrevive a navegar al detalle y volver.

Estructura (de arriba hacia abajo):
1. **Saludo personalizado** ("Hola, Andrea" + `RoleBadge` "KAM Icesi") + botón prominente "Nueva Solicitud".
2. **Banner contextual** que solo aparece si hay ≥1 solicitud propia realmente lista para entregar — es decir, con `readyForKam === true` (el Líder ya confirmó "Enviar a KAM"), **no basta con que esté en estado `en-costeo`**: *"¡Tienes N propuestas listas para entregar!"* — botón "Ver listas" que filtra la tabla (vista Tabla) o aísla la columna "Lista para Entregar" (vista Kanban), según cuál esté activa.
3. **Dato agregado secundario** (texto, no tarjeta): "N solicitudes en total · $X COP en pipeline cotizado" (suma de `en-costeo` + `entregada`).
4. **4 tarjetas KPI**, una por cada etapa tal como la percibe el KAM (Nueva / En Proceso / Lista para Entregar / Entregada — mismos 4 estados y colores que usa el Kanban, para que nunca se desalineen entre vistas). "Lista para Entregar" cuenta y agrupa **solo** lo confirmado por el Líder (`readyForKam`); una solicitud en `en-costeo` que el Líder todavía está trabajando (incluida una con "Cliente pidió ajustes") cae bajo "En Proceso" — se corrigió porque antes el número de la tarjeta ya filtraba así, pero el Kanban seguía agrupando toda la etapa `en-costeo` sin filtrar, y un KAM veía "1" arriba con 3 tarjetas idénticas debajo (`KamCommandCenter.tsx`, función `kamStageOf`, fuente única de verdad para KPI/tabla/Kanban):
   - **En vista Tabla**, un clic filtra la tabla (oculta filas que no coinciden) — aquí sí aporta valor porque la tabla mezcla todos los estados en una lista plana.
   - **En vista Kanban**, un clic **no oculta nada** (las columnas del Kanban ya son el filtro) — en cambio **aísla esa columna a pantalla completa**, mostrando las tarjetas en una cuadrícula de hasta 3 por fila en vez de una lista angosta. Un botón "Ver las 4 fases" (en la columna aislada y junto al buscador) regresa a la vista completa, o se hace clic de nuevo en la misma tarjeta. Cada tarjeta en "Lista para Entregar" muestra además un atajo "Revisar y entregar" al pie, igual que los botones de acción del tablero del Líder.
5. **Toggle Tabla/Kanban** y buscador (por ID, empresa, título, tipo, Líder de Producto).
6. **Vista Tabla**: columnas ID+fecha relativa, Propuesta+Empresa+tipo de servicio, Líder de Producto, Valor Ofertado (o "Pendiente de costeo"), Estado (4 badges de color, ya no fusiona Nueva+En Proceso), Acción.
7. **Vista Kanban**: 4 columnas (o 1 si hay una aislada), tarjetas `RequestCard` compactas (banner ámbar "Cliente pidió ajustes" si tiene `clientObservations`, ID, empresa, título, urgencia, tipo, Líder de Producto, docente o "Sin docente", fecha).

### Su journey de creación de solicitud

Ver detalle completo en `03-flujos-de-usuario.md`. Resumen: wizard de 5 pasos (`src/pages/NewRequest.tsx`) — Empresa → Contacto → Requerimiento → Formación previa → Observaciones y Documentos. **6 campos son obligatorios para enviar** (no solo 2 — esto estaba desactualizado): razón social de la empresa y su naturaleza jurídica (paso 1), título de la propuesta y tipo de requerimiento — con su descripción libre si el tipo es "Otro" (paso 3), y si ha habido formación previa y el nivel de urgencia (paso 4). Todo lo demás es opcional, con autoguardado en `localStorage` y recuperación de borrador. El nodo temático es opcional pero **si se deja en blanco, la solicitud queda con `productLeader: "Por definir"` y no le aparece a ningún Líder de Producto real** — vale la pena que el KAM siempre elija un nodo.

---

## 🟪 Líder de Producto

**`role: "lider-producto"`** · Nombre por defecto: Juan Pablo Corrales Arenas · `juanpablo.corrales@icesi.edu.co` · Nodo asociado: Inteligencia Artificial y Tecnologías Digitales

### Quién es y qué quiere lograr

Es el motor operativo/técnico interno. Recibe la solicitud cruda del KAM y tiene que convertirla en una propuesta ejecutable con precio. Su "resultado soñado": **triage rápido de lo nuevo que le llega, asignar al experto correcto sin fricción, calcular un costeo confiable en segundos, y devolver la propuesta al KAM sin ambigüedad de que ya está lista.**

A diferencia del KAM (que opera con pocas solicitudes activas a la vez conceptualmente), el Líder de Producto normalmente gestiona un **volumen de solicitudes en distintas etapas simultáneamente** — de ahí que su pantalla principal sea un Kanban con acciones directas en cada tarjeta, no una tabla.

### Qué puede hacer (permisos funcionales)

- Ver **únicamente las solicitudes asignadas a su nombre** ("Mis Solicitudes") — se eliminó el toggle "Todas" que existía antes; ya no ve el pipeline de otros líderes.
- **Asignar docente/experto** a una solicitud (`nueva` → tiene que hacerlo antes/al avanzar): elige entre profesor de planta (lista cerrada, `ICESI_FACULTY`) o registra un consultor externo (ficha completa: nombre obligatorio, identificación, firma consultora, correo, teléfono, perfil).
- **Editar el costeo financiero completo**: el Valor Final de la Propuesta y el Margen de Contribución (% y $) se digitan directamente — ya no se calculan a partir de un costo base, porque el equipo trae ese número exacto de un Excel externo (ver `04`, `ProposalCosting`). También puede agregar una nota de alcance libre y confirmar explícitamente el envío al KAM con el botón "Enviar a KAM" (ver más abajo). Ya no existe el switch "requiere asesor externo": el indicador de asesor es de solo lectura, derivado directamente de a quién se asignó como docente/experto. Los campos numéricos están protegidos contra valores negativos (y el margen % contra >100) — se corrigió un hueco donde se podían guardar sin ningún aviso.
- **Avanzar el estado** de la solicitud a través de las 4 etapas, con fricción proporcional al riesgo de cada transición (ver "Confirmaciones y validaciones" más abajo).
- **Reasignar** una solicitud completa a otro Líder de Producto/nodo — mientras está en **"Nueva" o "En Experto"** (si el tema no corresponde a su especialidad, fue mal asignada por el KAM, hay sobrecarga operativa, o el experto asignado determina que el tema es de otro nodo) — con motivo estructurado (`select` de razones) y nota opcional. Ya está protegido por su propio modal (selección + confirmación), no es un riesgo de un solo clic. Si la solicitud estaba en "En Experto", reasignar la devuelve a "Nueva" y limpia el docente/asesor asignado (no aplicaría necesariamente bajo el nuevo nodo). ⚠️ La ampliación a "En Experto" es una decisión de Tomás, no confirmada aún por Dianis (`08`, pregunta 16).
- Subir/eliminar documentos (ambas categorías: cara al cliente e internos de costeo).
- Ver contacto del asesor externo asignado.

### Confirmaciones y validaciones (fricción proporcional al riesgo)

Se auditó cada transición de estado buscando huecos donde un clic accidental (o una tarjeta de Kanban densa con varios botones pegados) pudiera mover una solicitud sin querer. El resultado, aplicado tanto en el Kanban como en el detalle:

- **"Pasar a Experto"**: deshabilitado sin docente asignado; requiere confirmar en un diálogo que muestra la empresa y el título de la solicitud (no un texto genérico).
- **"Pasar a Costeo"**: requiere el mismo diálogo de confirmación.
- **"Entregar" (enviar al cliente): ya no es una acción del Líder de Producto, es exclusiva del KAM.** Se encontró (reporte directo) que el Líder tenía su propio botón "Marcar Entregada" en el detalle que hacía exactamente lo mismo que el "Enviar a cliente" del KAM — saltándose por completo al KAM, cuando la regla de negocio (`08`, pregunta 13: "después de que le llegue al KAM, ellos puedan volver a enviarla") asume que es el KAM quien hace ese último paso. Se quitó ese botón. El trabajo del Líder termina con un **gate explícito**: dejar el costeo completo no basta — debe confirmar con el botón **"Enviar a KAM"** (que además abre una ronda en el Historial de Negociación, ver `04`, `NegotiationRound`); mientras no lo haga, el "Enviar a cliente" del KAM sigue deshabilitado aunque ya exista un valor > $0. En el Kanban, la tarjeta en "En Costeo" pasa por tres estados: **"Completar costeo"** (enlace al detalle, mientras no hay valor), **"Completar envío"** (enlace al detalle, valor ya existe pero falta confirmar), y la insignia pasiva **"Enviado al KAM"** (con "hace X tiempo") una vez confirmado — ya no hay ningún botón de avance en esa columna. En el detalle, el mismo estado final se refleja como un indicativo **"Enviado al KAM — a la espera de envío al cliente"**.

### Qué NO hace

- No crea solicitudes nuevas (aunque tiene acceso a la ruta, esa acción es del KAM).
- **No marca la solicitud como "Entregada"** — esa es la acción de cierre comercial exclusiva del KAM ("Enviar a cliente"). El Líder solo deja el costeo listo; no tiene ningún botón que mueva el estado a `entregada` (corregido — antes sí lo tenía, ver sección de confirmaciones arriba).

### Su pantalla principal: `ProductLeaderDashboard`

Archivo: `src/components/dashboard/ProductLeaderDashboard.tsx`, montado desde `src/pages/Dashboard.tsx` cuando `role === "lider-producto"`. Igual que en `KamCommandCenter`, todo su estado de UI se persiste en `localStorage`.

Estructura:
1. **Header** con saludo personalizado ("Hola, Juan Pablo" + `RoleBadge`).
2. **Banner contextual** que solo aparece si hay ≥1 solicitud propia en estado `nueva`: *"¡Tienes N solicitudes nuevas por revisar!"* — botón "Ver nuevas" que aísla/filtra la columna "Nueva" (mismo comportamiento dual tabla/kanban que el resto de tarjetas KPI). Espejo del banner equivalente del KAM.
3. **Dato agregado secundario** (texto, no tarjeta): "N solicitudes en total · $X COP en pipeline cotizado" (suma de `en-costeo` + `entregada`) — mismo formato que usa `KamCommandCenter`.
4. **4 tarjetas KPI** — una por cada etapa del pipeline (1. Nuevas / 2. En Experto / 3. En Costeo / 4. Entregadas, esta última con el valor real aprobado en COP como dato secundario). Mismo comportamiento dual que en el dashboard del KAM: **filtran en vista Tabla, aíslan la columna a pantalla completa en vista Kanban** (no vacían las 4 columnas sin motivo, como pasaba antes).
5. **Buscador** (por empresa, código, docente, título) y botón-filtro **"Sin docente (N)"** — solo cuenta/muestra solicitudes activas (no `entregada`) sin profesor asignado. Si el filtro deja el tablero vacío, se muestra un aviso explícito con botón "Quitar filtros" (antes las 4 columnas se veían vacías sin ninguna pista de que había un filtro activo).
6. **Toggle Kanban/Tabla** (arranca en Kanban, a diferencia del KAM que arranca en Tabla).
7. **Kanban de 4 columnas** (o 1 si hay una aislada). Cada tarjeta de solicitud muestra, de arriba hacia abajo:
   - Banner ámbar "Cliente pidió ajustes" si la solicitud tiene `clientObservations` (viene de una devolución del KAM) — es la señal más prioritaria de la tarjeta.
   - ID, empresa, urgencia, título.
   - Tipo de servicio + **valor cotizado** (visible solo si ya hay costeo real, en "En Costeo"/"Entregada").
   - Docente asignado (o "Sin docente").
   - **Antigüedad en la fase actual** ("En esta fase hace X días/horas") — usa `statusUpdatedAt`, útil para detectar cuellos de botella.
   - Pie: fecha de creación + **fecha límite** (coloreada: roja si venció, naranja si vence en ≤3 días, gris si no hay apuro; no se muestra en "Entregada"), botón de reasignar (ícono, en "Nueva" **y** "En Experto"), y la acción/indicador de etapa correspondiente (ver confirmaciones arriba) — en "En Costeo" ya no es un botón de avance de estado, es "Completar costeo", "Completar envío" o la etiqueta pasiva "Enviado al KAM", según qué tan confirmado esté el gate.
8. **Vista Tabla**: columnas ID+fecha, Propuesta+Empresa+tipo+urgencia, Docente, Valor Ofertado, Estado (`StatusBadge`), Acción (solo "Ver detalle" — sin botones de avance directos en esta vista).

### Su journey de trabajo sobre una solicitud

Ver detalle completo en `03-flujos-de-usuario.md`. Resumen: desde el Kanban o desde el detalle (`/solicitudes/:id`), en `RequestDetail.tsx` ve **dos módulos adicionales que el KAM no ve**:
- `ProposalCostingModule` (módulo interactivo completo de costeo, editable en vivo).
- Botones de acción de cambio de estado según la etapa actual, y botón de reasignación de Líder de Producto en la tarjeta lateral "Equipo Asignado".

---

## 🟨 Líder de Nodo (rol secundario, menos desarrollado)

**`role: "lider-nodo"`** · Nombre por defecto: Carlos Riveros · Nodo asociado: Competitividad Organizacional, Economías Creativas

Rol de supervisión/coordinación a nivel de nodo académico. En el prototipo actual **no tiene un dashboard propio dedicado** (cae en la rama genérica de `src/pages/Dashboard.tsx`, la cual además tiene un bug que la rompe — ver `07-gaps-conocidos-y-deuda-tecnica.md`). Su navegación (`AppShell`) solo ofrece "Inicio" y "Solicitudes de nodo". No es foco de este esfuerzo de UX, pero cualquier cambio en la lógica de reasignación (que involucra nodos) debería considerar que este rol existe conceptualmente.

**Respuesta parcial de la Líder de Producto (`08`, pregunta 15):** el rol sí existe en la operación real y supervisa las propuestas que están bajo su nodo — pero ella se refirió a él como **"Director de Nodo"**, no "Líder de Nodo". Falta confirmar si es el mismo rol con otro nombre más correcto, o si son dos roles distintos — no cambiar el nombre en el código todavía sin esa confirmación (ver pregunta 15 actualizada en `08`).

## 🟩 Profesor (rol secundario, menos desarrollado)

**`role: "profesor"`** · Nombre por defecto: Dr. Ricardo Mejía

Rol del docente ya asignado a una solicitud, que diseñaría el contenido curricular. Tampoco tiene dashboard propio dedicado (misma rama genérica rota). Su navegación solo ofrece "Inicio" y "Mis propuestas". No es foco de este esfuerzo de UX.

### Utilidad de prototipo: restablecer datos

Todos los roles tienen, en el menú del avatar (rail lateral), la opción **"Restablecer datos de ejemplo"** — vuelve las 24 solicitudes semilla a su estado original y limpia los filtros de UI persistidos (`localStorage`) de ambos dashboards, con una recarga automática de página. Pide confirmación antes de ejecutar porque **borra cualquier solicitud o cambio hecho durante la sesión de prueba**. Es la forma correcta de "empezar de cero" al probar — no hay backend real que lo haga por sí solo.

**Confirmado con la Líder de Producto (`08`, pregunta 4):** por ahora el Profesor **no tendrá cuenta ni acceso propio** — son muchos profesores y no se espera que entren al sistema a ver solicitudes pendientes. El Líder de Producto sigue coordinando con ellos por fuera de la app (hoy por WhatsApp/correo) y refleja manualmente el avance. Esto puede revisarse más adelante, pero no es parte del alcance actual.

---

## Tabla resumen de permisos

| Acción | KAM | Líder de Producto | Líder de Nodo | Profesor |
|---|:---:|:---:|:---:|:---:|
| Crear solicitud | ✅ | (técnicamente accesible, no es su flujo) | — | — |
| Ver solicitudes | ✅ (solo las suyas) | ✅ (solo las suyas) | ✅ (implícito, de su nodo) | ❌ (solo las suyas) |
| Asignar docente/experto | ❌ | ✅ | ❌ | ❌ |
| Editar costeo | ❌ (no ve costo base ni margen) | ✅ | ❌ | ❌ |
| Editar información propia de la solicitud (empresa, contacto, diagnóstico) | ✅ (mientras esté "Nueva") | ⚠️ Solo en "En Costeo" y solo tras un rechazo del cliente (`03`, B.7) | — | — |
| Editar Especificaciones del Servicio | ❌ | ✅ | — | — |
| Cancelar solicitud | ✅ (mientras esté "Nueva") | ❌ | — | — |
| Avanzar etapa del pipeline (Nueva → Experto → Costeo) | ❌ | ✅ | ❌ | ❌ |
| Reasignar Líder de Producto | ❌ | ✅ ("Nueva" o "En Experto") | — (no implementado) | — |
| Subir/eliminar documentos | ✅ | ✅ | — | — |
| Marcar "Entregada"/"Enviar a cliente" | ✅ (única acción que cierra el ciclo) | ❌ (corregido — antes también podía) | — | — |
| Devolver propuesta entregada con observaciones | ✅ | ❌ | — | — |
