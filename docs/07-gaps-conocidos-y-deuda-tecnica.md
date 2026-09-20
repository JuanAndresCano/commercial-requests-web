# Gaps conocidos y deuda técnica del prototipo

Inventario de huecos funcionales, placeholders sin conectar y atajos propios de un prototipo de UX. El propósito de este documento es que **ningún agente confunda estos comportamientos con reglas de negocio intencionales** al usarlos como referencia para el desarrollo real.

## 🔴 Funcionales (afectan lógica de negocio, no solo estética)

### 1. ✅ RESUELTO — `RequestSummary.tsx` — vista "Resumen" con contenido 100% fijo
La ruta `/solicitudes/:id/resumen` mostraba siempre datos de ejemplo fijos, sin importar qué solicitud se abriera. **Se eliminó la pantalla completa** (commit `6814a9f`) — quedan solo 2 pantallas por solicitud: el tablero y el detalle, que sí muestra la información real.

### 2. ✅ RESUELTO — El botón "Enviar a cliente" (KAM) no estaba condicionado a que exista costeo real
El botón ya solo aparece cuando `req.status === "en-costeo"`, y su clic pasa por un diálogo de confirmación (commit `6269cde`) — un KAM ya no puede marcar como entregada una solicitud sin costeo.

### 3. ✅ RESUELTO — Avance de etapa sin validar que el trabajo previo esté completo
En `ProductLeaderDashboard.tsx` y `RequestDetail.tsx`, los botones de avance de etapa:
- ✅ No se puede pasar de `nueva` a `en-experto` sin haber asignado docente.
- ✅ No se puede marcar `entregada` sin que `costing.totalOfferedCop` sea mayor a `0` — se encontró (reporte directo) que se podía entregar con costeo en $0. El botón "Enviar a cliente" del KAM (única acción que hoy marca `entregada`, ver el bullet siguiente) queda deshabilitado hasta que exista un valor real, con una validación adicional dentro del handler por si el botón queda desincronizado.
- ✅ "Pasar a Experto" y "Pasar a Costeo" ahora piden confirmación explícita (con empresa + título de la solicitud a la vista) antes de ejecutar — antes cambiaban de estado al primer clic, riesgoso en una tarjeta de Kanban densa con varios botones pegados.
- ✅ **El Líder de Producto podía marcar "Entregada" (enviar al cliente) directamente, saltándose al KAM por completo.** Se encontró (reporte directo) que en `RequestDetail.tsx`, cuando `req.status === "en-costeo"`, el Líder tenía su propio botón "Marcar Entregada" que llamaba exactamente al mismo handler que el "Enviar a cliente" del KAM — es decir, **cualquiera de los dos roles podía cerrar el ciclo comercial**, cuando la regla de negocio (`08`, pregunta 13: "después de que le llegue al KAM, ellos puedan volver a enviarla con observaciones") asume que el paso final al cliente es exclusivo del KAM. Se quitó el botón del Líder por completo. **Actualización 2026-09-20:** la etiqueta pasiva original ("Listo para el KAM") se reemplazó por un gate formal — el Líder debe confirmar explícitamente con un botón "Enviar a KAM" (que abre una ronda en el Historial de Negociación, ver `04`, `NegotiationRound`), y el botón "Enviar a cliente" del KAM permanece deshabilitado hasta esa confirmación, no solo con que exista un valor > $0. Ver `04` para el modelo completo.

### 20. ✅ RESUELTO — El gate "Enviado al KAM" solo se invalidaba al editar el precio, no el alcance
Si el Líder ya había confirmado "Enviar a KAM" y después corregía "Especificaciones del Servicio" o "Información completa de la solicitud" (participantes, modalidad, tipo, necesidad — campos que cada ronda del Historial de Negociación también congela, ver `04`) **sin tocar el precio**, el gate `readyForKam` no se invalidaba — el botón "Enviar a cliente" del KAM seguía habilitado aunque el alcance confirmado ya no fuera el vigente. Encontrado por Tomás probando el escenario completo. Se corrigió: `handleSaveSpecs` y `handleSaveFullInfo` ahora invalidan el gate igual que editar el costeo, si estaba activo.

De paso, al permitir que cada "Enviar a KAM" abra una ronda nueva sin importar si la anterior se entregó (ver `04`, cambio de diseño del mismo día), se encontró que `handleSendToClient` y `handleReturnWithObservations` identificaban "la ronda pendiente" filtrando solo por `clientResponse === "pendiente"` — con más de una ronda pendiente posible, esto las habría marcado **todas** a la vez en vez de solo la vigente. Corregido para identificar la ronda por posición (la última del arreglo).

### 16. ✅ RESUELTO — El tablero del KAM marcaba como "lista" una propuesta que el Líder aún no había confirmado
`KamCommandCenter.tsx` etiquetaba la columna/conteo `en-costeo` completa como "Lista para Entregar" y resaltaba cualquier fila en ese estado como accionable, sin revisar el gate `readyForKam` introducido arriba — un KAM podía ver en verde, como lista para entregar, una propuesta que el Líder seguía costeando. Se corrigió centralizando la condición en una única función compartida (`isReadyForKamHandoff`, `mock-data.ts`), usada por ambos tableros (KAM y Líder), para que no se repita este tipo de olvido en el próximo tablero que necesite mostrar esta información.

### 17. ✅ RESUELTO — El Líder de Producto podía fijar el valor final desde "Nueva", antes de que existiera ningún trabajo previo
En `RequestDetail.tsx`, la tarjeta de "Costeo Financiero" (`ProposalCostingModule`) se mostraba **totalmente editable** con la única condición `role === "lider-producto"` — sin revisar `req.status`. Un Líder podía escribir el Valor Final y el Margen desde el instante en que abría una solicitud "Nueva", antes incluso de asignar docente, contradiciendo la regla ya validada con Dianis (`08`, pregunta 7: *"Todo se hace en el momento del costeo"* — no hay valores parciales antes de esa fase) y documentada en `04` ("Costeo se define de una sola vez"). Encontrado por Tomás al revisar el flujo completo desde "Nueva". Se corrigió ocultando la tarjeta de costeo por completo mientras `status` sea `"nueva"` o `"en-experto"` (se muestra un aviso "Costeo aún no disponible" en su lugar) — vuelve a aparecer, editable, desde `"en-costeo"` en adelante (incluyendo `"entregada"`, donde sí es intencional que se pueda seguir editando, `08` pregunta 9).

**De paso, se eliminó el botón "Guardar Cambios"** de la cabecera del detalle: solo llamaba a `updateCosting` con el costeo actual (o uno vacío por defecto si no existía), sin ninguna función real — el módulo de costeo ya guarda cada campo automáticamente, y con el costeo oculto antes de "En Costeo", ese botón podía escribirle a una solicitud "Nueva"/"En Experto" un costeo vacío con valor $0 donde antes no había ninguno. No hacía falta como mecanismo de guardado manual en ningún estado.

**También se agregó un aviso explícito de siguiente paso** en la columna principal del detalle cuando la solicitud está en "Nueva" sin docente asignado ("Siguiente paso: asigna un docente o asesor" + botón que abre el modal directo) — antes la única pista de que hacía falta un docente era el `title` de un botón deshabilitado en la cabecera, invisible sin pasar el mouse por encima, y el botón mismo quedaba fuera de vista si la persona había hecho scroll hacia abajo.

### 19. ✅ RESUELTO — El scroll no se reseteaba al navegar entre páginas
React Router no resetea la posición de scroll entre rutas por defecto (es un cambio de contenido en la misma página, no una carga real). Si el Kanban del Líder quedaba scrolleado hacia abajo y hacía clic en una tarjeta, el detalle de la solicitud abría **también scrolleado abajo** — ocultando la cabecera, los botones de avance de estado, y el aviso de "Siguiente paso" agregado arriba (gap #17), que era exactamente el tipo de cosa que ese aviso debía evitar. Se agregó `src/components/ScrollToTop.tsx`, montado una sola vez en `App.tsx` dentro del `BrowserRouter`, que resetea el scroll a `(0, 0)` en cada cambio de ruta — aplica a toda la navegación de la app, no solo Kanban → detalle.

### 18. 🔴 Abierto — No hay forma de "regresar" una solicitud a la etapa anterior si se avanzó por error
Una vez el Líder avanza una solicitud (`"nueva" → "en-experto"` o `"en-experto" → "en-costeo"`, con o sin confirmación explícita), no existe ningún botón o acción en todo el sistema para devolverla a la etapa anterior. La única "vuelta atrás" que existe es la del KAM devolviendo desde `"entregada"` (un caso de negocio distinto, con su propio flujo). Si alguien avanza por error — el diálogo de confirmación ayuda, pero no elimina el riesgo de un clic mal pensado — hoy no hay corrección posible desde la interfaz. Detectado por Tomás revisando el flujo completo; **deliberadamente no resuelto todavía** — es una funcionalidad nueva de verdad (qué pasa con el docente/costeo ya cargado al devolver, quién puede hacerlo, si necesita su propio registro en el Historial de Negociación) que merece su propia especificación antes de tocar código, no una solución de pasada.

### 4. 🟡 PARCIAL — Dashboard genérico roto para `lider-nodo` y `profesor`
En `src/pages/Dashboard.tsx`, cuando el rol no es `kam` ni `lider-producto`, el componente cae en una rama de código que **usa variables nunca declaradas**. Esto provocaría un `ReferenceError` en tiempo de ejecución si un usuario con rol Líder de Nodo o Profesor visita `/dashboard`.
**No afecta** a KAM ni Líder de Producto (tienen componentes propios con `return` anticipado antes de llegar a ese código).

**Actualización 2026-09-20:** al extraer el modal de reasignación duplicado (ver #9), se eliminó por completo esta rama muerta junto con las variables `reassigningRequest`, `selectedNewLeader`, `selectedNewNode`, `reassignReason`, `reassignNotes`, `handleOpenReassign`, `handleConfirmReassign` y `listas` que traía. **Sigue sin resolver** la variable `displayedTableRequests`, independiente de la reasignación — cualquier trabajo futuro sobre los roles Líder de Nodo o Profesor debe empezar arreglando esto antes que nada.

### 5. ✅ RESUELTO — Tarjeta "Especificaciones del Servicio" con valores fijos
`horas`, `modalidad` y `participantes` ya se guardan en `RequestItem` y se leen en el detalle (con fallback "Sin especificar"). Además, el Líder de Producto puede corregirlos si el KAM los diligenció mal (commit `722c85a`, confirmado con Dianis en `08`, pregunta 5).

### 11. ✅ RESUELTO — "Requiere asesor externo" no estaba enlazado a una asignación real
En `ProposalCostingModule.tsx`, el switch "¿Requiere asesor externo?" era independiente del docente realmente asignado (`req.professorType`/`req.professor`) — se podía activar sin que existiera ningún consultor externo vinculado, o dejarlo apagado con uno sí asignado. Se quitaron `requiresExternalAdvisor`/`externalAdvisorDetails` de `ProposalCosting` (y de `calculateCosting`) y se reemplazó el switch por un indicador de solo lectura ("Asesor del Servicio") derivado directamente de `req.professorType`/`req.professor`/`req.externalProfessorData` — ya no puede existir la contradicción porque no hay dos fuentes de verdad.

## 🟡 De prototipo (esperables mientras no hay backend, pero a tener en cuenta)

### 6. Sin autenticación ni backend real
Todo vive en `localStorage` del navegador (`AuthContext.tsx`). No hay sesiones multiusuario ni control de acceso real — cualquiera puede cambiar de rol con un clic desde el dropdown de rol en la topbar. Es intencional para poder probar todos los roles rápido durante el diseño, pero **no debe existir en producción** tal cual. (El selector adicional que existía dentro de `RequestDetail.tsx` y el que estaba duplicado en el dropdown del avatar ya se eliminaron — solo queda un sitio para cambiar de rol.)

### 7. `id` de solicitud generado de forma ingenua
`REQ-2026-${requests.length + 145}` en `AuthContext.addRequest` — no es un identificador robusto (se rompe con borrados, concurrencia, o cambio de año). Solo válido como placeholder visual.

### 8. `getRelativeTime()` hardcodeado por ID específico
En `mock-data.ts`, la función que muestra "Hace 2 horas" / "Ayer" / etc. en `KamCommandCenter` tiene un `switch` con IDs de solicitud literales (`REQ-2026-0142` → `"Hace 2 horas"`, etc.) en vez de calcular la diferencia real contra `createdAt`. Cualquier solicitud nueva creada por el usuario cae en el `default: "Reciente"`.

### 9. ✅ RESUELTO — Modal de reasignación duplicado en 3 archivos
Prácticamente el mismo JSX y lógica de reasignación de Líder de Producto estaba copiado en: la rama genérica rota de `Dashboard.tsx`, `ProductLeaderDashboard.tsx`, y `RequestDetail.tsx`. Se extrajo a un componente compartido (`src/components/ReassignLeaderDialog.tsx`) y un hook con la regla de negocio (`src/hooks/use-reassign-request.ts`), usados ahora por los 2 archivos vivos — la tercera copia (rama muerta de `Dashboard.tsx`) se eliminó junto con el bug de `listas` que traía (ver #4). Se aprovechó este cambio para extender la reasignación a la etapa "En Experto" (`03`, B.5; `04`).

### 10. Documentos adjuntos son solo metadata
`ProposalDocument` guarda `name`, `size` (como texto, no bytes), `date` (como texto formateado, no `Date`) — sugiere que la subida de archivos en `ProposalDocumentsSection.tsx` simula el registro pero no maneja binarios reales. Válido para prototipo; el backend real necesitará almacenamiento de archivos de verdad (S3, etc.) y metadata numérica/tipada.

## Cómo usar este documento

Si estás extendiendo el prototipo de UX/UI: puedes decidir dejar estos gaps tal cual (no son el foco si el objetivo es solo validar interacción/flujo), **pero nunca los repliques como si fueran la especificación correcta** al informar el diseño del backend real. Si estás diseñando el modelo de datos/backend de producción: usa `04-modelo-de-datos-logico.md` como referencia de reglas de negocio *validadas*, y este archivo como lista de lo que **no** se debe copiar literalmente.
