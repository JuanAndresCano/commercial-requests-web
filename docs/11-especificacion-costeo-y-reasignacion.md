# Especificación de cambios — Costeo (valor final y margen) y Reasignación en "En Experto"

> 🗄️ **Histórico — ya implementado y fusionado.** Todo lo implementado aquí ya vive en `03-flujos-de-usuario.md`, `04-modelo-de-datos-logico.md`, `07-gaps-conocidos-y-deuda-tecnica.md` y `08-preguntas-abiertas-negocio.md`. Este archivo se conserva solo como registro de cómo se llegó a esas decisiones (los audios originales, las preguntas resueltas en el momento) — **no lo uses como referencia del estado actual del código**, puede haber quedado desactualizado frente a esos documentos.

> **Estado: VALIDADO, listo para implementación (2026-09-19).** Origen: transcripción literal de 2 audios de Dianis (Líder de Producto), más las decisiones tomadas en conversación con Tomás sobre los puntos ambiguos de la transcripción. Este documento es la especificación que debe seguir el agente que implemente los cambios — no programar contra la transcripción cruda, programar contra esto.

## Requisito 1 — El campo de costeo pasa a capturar el valor final, no una base pre-margen

### Qué dijo Dianis (síntesis de audio 1)
Donde hoy dice "Costo Base Directo", ya no debe pedir una base sobre la que el sistema calcula el total — debe ser el campo donde el Líder digita el **valor final de la propuesta**, porque ese valor ya viene con el margen incluido (lo calculan ellos por fuera). El margen en plata también lo quieren digitar ellos, no que el sistema lo calcule solo.

### Estado actual del código (verificado en `ProposalCostingModule.tsx`)
- `baseCostCop` — input "Costo Base Directo (COP)". Es la base sobre la que el sistema deriva todo lo demás.
- `expectedMarginPercent` — input libre (chips 25/30/35/40% + custom). Ya es manual, no cambia.
- `marginAmount` — **derivado, solo lectura**: `baseCostCop * marginPercent / 100`, nunca se persiste como campo propio del tipo `ProposalCosting`.
- `totalOfferedCop` — se autocalcula (`baseCostCop + marginAmount + proCulturaTaxAmount`) y se re-sincroniza automáticamente salvo que el usuario lo haya desviado ya vía el toggle "Personalizar valor ofertado" + botón "Sincronizar a $X".

### Decisión validada
1. El campo "Costo Base Directo" **cambia de función** (no solo de nombre): pasa a ser el input **"Valor Final de la Propuesta (COP)"**, y su valor alimenta directamente `totalOfferedCop` — deja de existir un cálculo hacia adelante de base→total.
2. El margen en plata deja de ser derivado: se vuelve un **input manual nuevo** (persistido, hoy no existe como campo del tipo — hay que agregarlo a `ProposalCosting`).
3. Si base/margen%/margen$ no cuadran matemáticamente entre sí, **se permite la inconsistencia** — son campos informativos independientes; lo único que importa operativamente es el valor final de la propuesta.

### Checklist de implementación
- [x] En `src/lib/mock-data.ts`, interfaz `ProposalCosting`: agregar `marginAmountCop: number` (nuevo campo persistido); retirar `baseCostCop` y `suggestedTotalCop` (ya no se usan).
- [x] En `ProposalCostingModule.tsx`: renombrar el input actual de costo base a **"Valor Final de la Propuesta (COP)"**, y que escriba directamente sobre `totalOfferedCop` en vez de sobre `baseCostCop`.
- [x] Convertir el renglón de margen en plata (hoy texto "+{formatCop(marginAmount)} COP") en un `<Input>` numérico editable, vinculado a `marginAmountCop`.
- [x] Eliminar el auto-cálculo hacia adelante: quitar `calculatedTotalCop`, la resincronización automática en `handleBaseCostChange`/`handleMarginChange`, el toggle "Personalizar valor ofertado" y el botón "Sincronizar a $X" — ya no aplican porque no hay un total "sugerido" del cual desviarse; el total **es** lo que el Líder digita.
- [x] Actualizar el desglose visual (línea ~347 actual) para reflejar los campos nuevos, no la fórmula vieja: fila "Valor Final de la Propuesta" (manual), fila "Margen de Contribución" (% + $, ambos manuales), fila "Referencia Pro-Cultura (1.5%)" solo cuando el tipo de servicio sea Capacitación — informativa, calculada sobre el valor final, nunca sumada/restada de él.
- [x] Actualizar `calculateCosting(...)` (helper que arma el objeto `ProposalCosting`) para la nueva forma de construir el objeto.

### Puntos resueltos (2026-09-19, con Tomás)
- **Impuesto Pro-Cultura (1.5% en Capacitación):** el equipo ya calcula estos valores en un Excel externo y el valor final digitado debe quedar **exacto** a ese Excel — ningún cálculo del sistema debe alterarlo. Se convierte en **una fila de referencia informativa, no una operación**: se calcula (1.5% sobre el valor final, solo para servicios tipo Capacitación) y se muestra como recordatorio ("Referencia Pro-Cultura (1.5%): $X — ya debe estar contemplado en tu valor final"), pero **nunca se suma ni se resta** del valor final que el Líder digitó.
- **`baseCostCop` se retira por completo** — no se conserva como campo de referencia interna. El equipo solo necesita digitar dos valores: el valor final de la propuesta (antes "costo base directo") y el monto exacto del margen de contribución.

---

## Requisito 2 — Acción explícita del Líder para pasar la propuesta al KAM

### Qué dijo Dianis (síntesis de audio 2, parte 1)
En la etapa de costeo no encuentra dónde darle clic para pasarle la propuesta al KAM.

### Estado actual del código (verificado)
Cuando `status === "en-costeo"`, el Líder de Producto **no tiene ningún botón** — solo ve un badge estático "Costeo listo — a la espera del KAM". El botón "Enviar a cliente" del KAM se habilita solo con `costing.totalOfferedCop > 0`, sin ninguna confirmación explícita del Líder.

### Decisión validada
Se agrega un **gate formal**: el Líder debe confirmar explícitamente que el costeo está listo antes de que el KAM pueda actuar.

### Checklist de implementación
- [x] En `src/lib/mock-data.ts`, interfaz `ProposalCosting`: agregar `readyForKam: boolean` (default `false`).
- [x] En `RequestDetail.tsx` (rama `role === "lider-producto" && status === "en-costeo"`, líneas ~525-529 actuales): reemplazar el badge estático por un botón **"Enviar a KAM"** cuando `hasValidCosting && !costing.readyForKam`, y por un badge "Enviado al KAM — a la espera de envío al cliente" cuando `readyForKam === true`. Reusar el patrón de confirmación existente (`confirmingAction` + `CONFIRM_ACTION_META`) para pedir confirmación antes de marcar `readyForKam = true`.
- [x] En `RequestDetail.tsx`, botón "Enviar a cliente" del KAM (línea ~537-547): cambiar `disabled={!hasValidCosting}` por `disabled={!hasValidCosting || !req.costing?.readyForKam}`.
- [x] **Regla de invalidación:** si el Líder edita cualquier campo del costeo (`baseCostCop`/valor final, margen %, margen $) después de haber marcado `readyForKam = true`, ese flag debe volver a `false` automáticamente — para que el KAM no actúe sobre cifras que el Líder ya está corrigiendo. Implementar dentro del `triggerSave(...)` de `ProposalCostingModule.tsx`.
- [x] Verificar si `ProductLeaderDashboard.tsx` (vista Kanban) también necesita esta acción o si basta con tenerla en el detalle (`RequestDetail.tsx`).

### Addendum (2026-09-20) — Bug encontrado en el tablero del KAM + decisión de arquitectura

Al probar el gate en vivo, Tomás preguntó si convenía crear un **5to estado formal** en el pipeline (ej. `"esperando-kam"`) para las solicitudes ya enviadas, en vez de dejarlo como un flag dentro de `"en-costeo"` — sobre todo pensando en qué pasa si se acumulan muchas.

**Bug real encontrado durante el análisis:** `KamCommandCenter.tsx` (tablero del KAM, no tocado por el checklist original de este Requisito) etiquetaba la columna/KPI `"en-costeo"` completa como **"Lista para Entregar"** y resaltaba en verde (`isReady = r.status === "en-costeo"`) cualquier solicitud en esa etapa, **sin revisar `readyForKam`**. Es decir: el KAM veía como "lista para entregar" una propuesta que el Líder todavía estaba costeando y ni siquiera había confirmado.

**Decisión validada:** no crear un 5to estado real en `RequestStatus` (se descartó por alto costo/blast radius: la revisé y `RequestStatus` aparece en 11 archivos — 3 tableros con Kanban duplicado, `STATUS_META`, `StatusBadge.tsx`, `kanban-theme.ts`, además de toda la lógica de transición — y reabriría este mismo Requisito recién construido). En su lugar, **"Opción C": un predicado derivado compartido**, sin tocar el modelo de datos:

- [x] `isReadyForKamHandoff(req)` en `src/lib/mock-data.ts` — única fuente de verdad para "¿ya puede el KAM actuar?" (`status === "en-costeo" && !!costing?.readyForKam`).
- [x] `KamCommandCenter.tsx`: `isReady` (tabla) ahora usa este helper — corrige el resaltado verde, el badge "Lista para entregar", el texto "Costeo aprobado" y el botón de acción destacado, todos derivados de la misma variable. Se agregó un badge neutro "En Costeo" para el caso `en-costeo && !readyForKam` (antes quedaba en blanco). El contador `listasParaEntregarCount` (y el aviso "¡Tienes N propuestas listas para entregar!") ahora solo cuenta las confirmadas.
- [x] `ProductLeaderDashboard.tsx`: los chequeos sueltos de `readyForKam` (filtro "Esperando al KAM", badges del Kanban) migrados al mismo helper, para que no se repita el tipo de olvido que causó el bug del tablero del KAM.
- [x] **No se tocó** el título de columna "Lista para Entregar" en `KamCommandCenter.tsx` (es copia de negocio validada con Dianis, ver `docs/08`, pregunta 2) — sigue siendo el nombre de la columna/bucket por estado real, aunque ya no todas las tarjetas dentro de ella se marquen individualmente como "listas". Si el volumen de solicitudes "en costeo sin confirmar" crece y esto genera confusión real, revalidar el nombre de la columna con Dianis en ese momento — no antes.
- **Si más adelante el volumen de solicitudes acumuladas "esperando al KAM" resulta ser alto en operación real**, reconsiderar promover esto a un 5to estado formal (Opción B) — en ese momento el costo de la migración se paga una sola vez con datos reales de uso, en vez de anticiparlo ahora sin evidencia.

---

## Requisito 3 — Reasignar a otro líder desde la etapa "En Experto"

### Qué dijo Dianis (síntesis de audio 2, parte 2)
A veces, cuando el experto/profesor revisa la solicitud, determina que el tema no le corresponde a ese nodo/líder y hay que devolverla para reasignarla a otro líder.

### Estado actual del código (verificado)
La opción "Reasignar" solo existe cuando `status === "nueva"`, duplicada en `RequestDetail.tsx` y `ProductLeaderDashboard.tsx` (una tercera copia en `Dashboard.tsx` es código muerto/inalcanzable — ver `docs/07-gaps-conocidos-y-deuda-tecnica.md`, punto 4 y 9). El handler `handleConfirmReassign` solo actualiza `productLeader` y `node`; nunca toca `status`.

### Decisión validada
- La opción de reasignar se habilita también cuando `status === "en-experto"`.
- Al reasignar desde `en-experto`, el `status` **vuelve a `"nueva"`** (el nuevo líder reinicia el flujo, incluyendo la asignación de experto/profesor).

### Checklist de implementación
- [x] **Refactor recomendado primero:** extraer el modal + `handleConfirmReassign` (hoy duplicado en 2 archivos vivos) a un componente/hook compartido (ej. `useReassignRequest` o `<ReassignDialog />`) antes de agregar la segunda condición de estado — evita triplicar la lógica que ya está señalada como deuda técnica en `07-gaps-conocidos-y-deuda-tecnica.md` (punto 9).
- [x] Cambiar la condición de visibilidad del botón "Reasignar" de `status === "nueva"` a `status === "nueva" || status === "en-experto"` en `RequestDetail.tsx` y `ProductLeaderDashboard.tsx`.
- [x] En `handleConfirmReassign`: si `req.status === "en-experto"` al momento de reasignar, incluir `status: "nueva"` en el `updateRequest(...)`.
- [x] Al volver a `"nueva"`, limpiar los campos de asignación de experto/profesor que ya no aplican bajo el nuevo líder/nodo (revisar `professorType`/`professor` en `RequestItem`, ver `04-modelo-de-datos-logico.md` y el gap #11 de `07-...`) — de lo contrario la solicitud vuelve a "nueva" pero conserva un profesor ya asignado que puede no corresponder al nuevo nodo.
- [x] Eliminar la tercera copia muerta del modal de reasignación en `Dashboard.tsx` (rama inalcanzable para `lider-producto`, con el bug ya documentado de `listas` no declarada) como limpieza incluida en este mismo cambio, ya que se está tocando ese código de todas formas.
- [x] Confirmar si `reassignReason`/`reassignNotes` (hoy se capturan y se pierden, nunca se persisten) deben empezar a guardarse en este cambio, o se deja igual (fuera de alcance salvo que se pida explícitamente).

---

## Requisito 4 — Filtro "Esperando al KAM" en el tablero del Líder de Producto

### Origen
No viene de los audios de Dianis — surgió al probar en vivo el Requisito 2 (gate a KAM): Tomás preguntó si las solicitudes que ya se enviaron al KAM desaparecían del tablero del Líder o si había forma de consultarlas.

### Estado verificado tras implementar el Requisito 2
No desaparecen: mientras el KAM no las entregue al cliente, `status` sigue siendo `"en-costeo"`, así que la tarjeta se queda en la columna "En Costeo" del Kanban (y en esa misma fila en la vista Tabla). Lo único que cambia es el contenido de la tarjeta (botón "Enviar a KAM" vs. insignia "Listo para el KAM"). Pero no existía ningún filtro/contador que separara, dentro de esa misma etapa, "todavía tengo que trabajar esto" de "ya lo confirmé, solo espero al KAM" — ambos casos se cuentan juntos y hay que revisar tarjeta por tarjeta para distinguirlos.

### Decisión validada
Agregar un filtro tipo toggle (mismo patrón visual y de persistencia que el toggle existente "Sin docente"), que muestre solo las solicitudes con `status === "en-costeo" && costing.readyForKam === true`, aplicable tanto en la vista Kanban como en la vista Tabla del tablero del Líder de Producto.

### Checklist de implementación
- [x] Nuevo estado persistido `onlyWaitingForKam` en `ProductLeaderDashboard.tsx` (mismo mecanismo `usePersistentState` que `onlyMissingProfessor`).
- [x] Contador `waitingForKamCount` sobre `activeDataset`.
- [x] Aplicar el filtro tanto en `filteredRequests` (vista Tabla) como en `kanbanRequests` (vista Kanban).
- [x] Botón toggle "Esperando al KAM (N)" junto al botón existente "Sin docente (N)", mismo estilo visual.
- [x] Actualizar los mensajes de "sin resultados" (Kanban y Tabla) y los botones "Quitar filtros" para que también limpien este filtro nuevo.

**Nota:** implementado directamente como commit adicional sobre `feature/gate-envio-kam` (depende de `costing.readyForKam`, introducido en ese mismo requisito) — no requirió una rama propia por ser una extensión pequeña y directamente derivada de esa misma funcionalidad.

---

## Requisito 6 — Ajustes de claridad tras probar el gate en vivo (2026-09-20)

Encontrados por Tomás probando el Requisito 2/4/5 en `localhost`, no por audio de Dianis.

### 6.1 — Botón "Enviar a KAM" de la tarjeta del Kanban no hacía nada visible
El botón de la tarjeta (`ProductLeaderDashboard.tsx`) es en realidad un `<Link>` al detalle, no una acción — la confirmación real vive solo ahí (decisión ya documentada en Requisito 2, para no duplicar el diálogo). El texto "Enviar a KAM" prometía una acción inmediata que no ocurría en la tarjeta, dando la sensación de que "no pasaba nada" al hacer clic.
- [x] Renombrado a **"Completar envío"** (mismo comportamiento, mismo patrón que "Completar costeo"). Sin cambios de lógica.

### 6.2 — Contador de tiempo esperando al KAM
- [x] Nuevo campo `costingSentAt?: string` en `ProposalCosting` (`mock-data.ts`) — se fija en `handleMarkReadyForKam` (`RequestDetail.tsx`) al confirmar el envío, y se limpia junto con `readyForKam` cuando se invalida por edición posterior (`ProposalCostingModule.tsx`).
- [x] La insignia "Enviado al KAM" (tarjeta del Kanban y detalle) muestra "hace X" (`date-fns/formatDistanceToNow`, locale `es`).
- [x] Con el filtro "Esperando al KAM" activo, las solicitudes se ordenan por más antigua primero (tabla y Kanban).
- Alcance decidido: sin selector de rango de fechas por ahora — se agrega solo si en operación real hace falta.

### 6.3 — "Enviado al cliente" poco diferenciable de "Enviado al KAM"
Ambas insignias usaban el mismo tono suave verde, pese a que una es un paso intermedio y la otra el cierre del flujo.
- [x] "Enviado al cliente" / "Propuesta Entregada" ahora es una insignia sólida (fondo verde lleno, texto blanco, ícono más grande) en `ProductLeaderDashboard.tsx` y `RequestDetail.tsx` — visualmente distinta de "Enviado al KAM" (que se queda con el tono suave, por ser un estado intermedio).

### 6.4 — "Sin docente" visible en etapas donde no aplica
El botón/contador "Sin docente" se quedaba visible (con un conteo que no correspondía a lo aislado en pantalla) incluso al aislar "En Costeo" o "Entregadas" — etapas donde, por regla de negocio ya vigente (`docs/07`, gap #3: no se puede avanzar a "En Experto" sin docente asignado), esa condición ya no puede darse.
- [x] `missingProfessorRelevant`: el botón "Sin docente" solo se muestra viendo "Todas" o aislado en "Nueva" (Kanban), o con el filtro de tabla en "Todas"/"Nueva".
- [x] Mismo tratamiento simétrico para "Esperando al KAM" (`waitingForKamRelevant`): solo relevante en "Todas" o "En Costeo" — antes también quedaba visible, sin sentido, en las demás etapas.
- El valor del toggle se conserva aunque el botón se oculte (no se resetea): si el Líder vuelve a la etapa donde sí aplica, el filtro sigue activo tal como lo dejó.

### 6.5 — Pendiente, sin implementar: contacto de docentes de planta
Al revisar la tarjeta "Equipo Asignado", Tomás pidió mostrar información de contacto del docente cuando es de planta, igual que ya existe para asesores externos (botón "Contacto" → nombre, empresa, correo, teléfono, perfil, todo capturado en `ExternalProfessorData`).

**Estado real del dato:** `PROFESSORS` en `mock-data.ts` es solo un arreglo de 3 nombres (`"Dr. Ricardo Mejía"`, `"Dra. Paula Henao"`, `"Dr. Andrés Lozano"`) — no existe ningún correo, teléfono, ni oficina para docentes de planta en ningún lugar del código. No es un bug de UI: es un dato que nunca se capturó.

**Decisión:** no fabricar datos de contacto ficticios. Queda pendiente — antes de implementar, se necesita definir con Dianis/el equipo qué información de contacto real existe para estos 3 docentes (¿correo institucional? ¿extensión?) y si esa lista de docentes de planta va a seguir siendo un arreglo fijo en el código o debe convertirse en un directorio propio. Revisar junto con el punto de `docs/07-gaps-conocidos-y-deuda-tecnica.md` cuando se tome la decisión.

---

## Orden sugerido de implementación
1. Requisito 3 (reasignación) — es el más autocontenido y no depende de los otros dos.
2. Requisito 1 (costeo) — resolver primero los ⚠️ puntos pendientes con Dianis.
3. Requisito 2 (gate a KAM) — depende de que el modelo de costeo del Requisito 1 ya esté estable, porque el flag `readyForKam` vive en el mismo objeto `ProposalCosting`.

Cada requisito se implementa en su propia rama `feature/<nombre>` creada desde `develop` (ver flujo acordado en `docs/10-decisiones-pendientes-equipo.md`), no una sola rama gigante con los tres.
