# Especificación de cambios — Costeo (valor final y margen) y Reasignación en "En Experto"

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
- [ ] En `src/lib/mock-data.ts`, interfaz `ProposalCosting`: agregar `marginAmountCop: number` (nuevo campo persistido); retirar `baseCostCop` y `suggestedTotalCop` (ya no se usan).
- [ ] En `ProposalCostingModule.tsx`: renombrar el input actual de costo base a **"Valor Final de la Propuesta (COP)"**, y que escriba directamente sobre `totalOfferedCop` en vez de sobre `baseCostCop`.
- [ ] Convertir el renglón de margen en plata (hoy texto "+{formatCop(marginAmount)} COP") en un `<Input>` numérico editable, vinculado a `marginAmountCop`.
- [ ] Eliminar el auto-cálculo hacia adelante: quitar `calculatedTotalCop`, la resincronización automática en `handleBaseCostChange`/`handleMarginChange`, el toggle "Personalizar valor ofertado" y el botón "Sincronizar a $X" — ya no aplican porque no hay un total "sugerido" del cual desviarse; el total **es** lo que el Líder digita.
- [ ] Actualizar el desglose visual (línea ~347 actual) para reflejar los campos nuevos, no la fórmula vieja: fila "Valor Final de la Propuesta" (manual), fila "Margen de Contribución" (% + $, ambos manuales), fila "Referencia Pro-Cultura (1.5%)" solo cuando el tipo de servicio sea Capacitación — informativa, calculada sobre el valor final, nunca sumada/restada de él.
- [ ] Actualizar `calculateCosting(...)` (helper que arma el objeto `ProposalCosting`) para la nueva forma de construir el objeto.

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
- [ ] En `src/lib/mock-data.ts`, interfaz `ProposalCosting`: agregar `readyForKam: boolean` (default `false`).
- [ ] En `RequestDetail.tsx` (rama `role === "lider-producto" && status === "en-costeo"`, líneas ~525-529 actuales): reemplazar el badge estático por un botón **"Enviar a KAM"** cuando `hasValidCosting && !costing.readyForKam`, y por un badge "Enviado al KAM — a la espera de envío al cliente" cuando `readyForKam === true`. Reusar el patrón de confirmación existente (`confirmingAction` + `CONFIRM_ACTION_META`) para pedir confirmación antes de marcar `readyForKam = true`.
- [ ] En `RequestDetail.tsx`, botón "Enviar a cliente" del KAM (línea ~537-547): cambiar `disabled={!hasValidCosting}` por `disabled={!hasValidCosting || !req.costing?.readyForKam}`.
- [ ] **Regla de invalidación:** si el Líder edita cualquier campo del costeo (`baseCostCop`/valor final, margen %, margen $) después de haber marcado `readyForKam = true`, ese flag debe volver a `false` automáticamente — para que el KAM no actúe sobre cifras que el Líder ya está corrigiendo. Implementar dentro del `triggerSave(...)` de `ProposalCostingModule.tsx`.
- [ ] Verificar si `ProductLeaderDashboard.tsx` (vista Kanban) también necesita esta acción o si basta con tenerla en el detalle (`RequestDetail.tsx`).

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
- [ ] **Refactor recomendado primero:** extraer el modal + `handleConfirmReassign` (hoy duplicado en 2 archivos vivos) a un componente/hook compartido (ej. `useReassignRequest` o `<ReassignDialog />`) antes de agregar la segunda condición de estado — evita triplicar la lógica que ya está señalada como deuda técnica en `07-gaps-conocidos-y-deuda-tecnica.md` (punto 9).
- [ ] Cambiar la condición de visibilidad del botón "Reasignar" de `status === "nueva"` a `status === "nueva" || status === "en-experto"` en `RequestDetail.tsx` y `ProductLeaderDashboard.tsx`.
- [ ] En `handleConfirmReassign`: si `req.status === "en-experto"` al momento de reasignar, incluir `status: "nueva"` en el `updateRequest(...)`.
- [ ] Al volver a `"nueva"`, limpiar los campos de asignación de experto/profesor que ya no aplican bajo el nuevo líder/nodo (revisar `professorType`/`professor` en `RequestItem`, ver `04-modelo-de-datos-logico.md` y el gap #11 de `07-...`) — de lo contrario la solicitud vuelve a "nueva" pero conserva un profesor ya asignado que puede no corresponder al nuevo nodo.
- [ ] Eliminar la tercera copia muerta del modal de reasignación en `Dashboard.tsx` (rama inalcanzable para `lider-producto`, con el bug ya documentado de `listas` no declarada) como limpieza incluida en este mismo cambio, ya que se está tocando ese código de todas formas.
- [ ] Confirmar si `reassignReason`/`reassignNotes` (hoy se capturan y se pierden, nunca se persisten) deben empezar a guardarse en este cambio, o se deja igual (fuera de alcance salvo que se pida explícitamente).

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

## Orden sugerido de implementación
1. Requisito 3 (reasignación) — es el más autocontenido y no depende de los otros dos.
2. Requisito 1 (costeo) — resolver primero los ⚠️ puntos pendientes con Dianis.
3. Requisito 2 (gate a KAM) — depende de que el modelo de costeo del Requisito 1 ya esté estable, porque el flag `readyForKam` vive en el mismo objeto `ProposalCosting`.

Cada requisito se implementa en su propia rama `feature/<nombre>` creada desde `develop` (ver flujo acordado en `docs/10-decisiones-pendientes-equipo.md`), no una sola rama gigante con los tres.
