# Cierre de gaps en el ciclo de re-costeo tras rechazo del cliente

> **Estado: VALIDADO, listo para implementación (2026-09-20).** Origen: preguntas de Tomás al probar en vivo `docs/12` (historial de negociación) sobre qué pasa cuando el rechazo del cliente no es solo de precio. Complementa, no reemplaza, `docs/12-trazabilidad-negociacion.md` — léelo primero, esto asume que ya existe `NegotiationRound`.

## 1. Backfill de dato de ejemplo: `REQ-2026-0135`

**Encontrado:** esta solicitud (Consultoría en Optimización de Redes, Gases de Occidente) ya estaba diseñada como "propuesta devuelta por el cliente" — trae `clientObservations` con el texto completo del rechazo, pero se escribió **antes** de que existiera `negotiationRounds`, así que el historial nuevo le sale vacío pese a que su propia narrativa dice que ya fue rechazada.

- [x] En `src/lib/mock-data.ts`, agregar a `REQ-2026-0135` una entrada en `negotiationRounds`: ronda 1, snapshot de `totalOfferedCop: 42_000_000`, `marginAmountCop: 10_850_000`, `expectedMarginPercent: 35` (los valores que ya trae `calculateCosting` en este registro), más los campos de alcance vigentes en el registro (`participantes: "6 - 10"`, `modalidad: "Híbrida"`, `horas: "100"`, `type: "Consultoría"`, `necesidad` = el valor actual del registro), `sentToKamAt` y `sentToClientAt` unos días antes de `statusUpdatedAt` (2026-09-15), `clientResponse: "rechazada"`, `clientObservation` = el texto exacto que ya tiene `clientObservations`, `clientRespondedAt: "2026-09-15T08:00:00.000Z"` (coincide con el comentario ya existente "Recién devuelta a costeo").
- [x] No hace falta un `leaderNote` en esta ronda 1 (es la propuesta original, antes de cualquier ajuste).

## 2. Referencia calculada junto al margen manual (no fuerza consistencia)

**Decisión:** el margen en $ y el valor final siguen siendo independientes (`docs/11`, Requisito 1) — eso no cambia. Pero como en la práctica se ve como un error cuando no cuadran (ej. el registro de arriba: $10.850.000 no es 35% de $42.000.000), se agrega una referencia informativa.

- [x] En `ProposalCostingModule.tsx`, junto al input manual de "Margen de Contribución ($)", un texto pequeño (no editable, no se guarda): `Referencia: {marginPercent}% de {valor final} = {formatCop(valorFinal * marginPercent / 100)}`. Solo ayuda a comparar visualmente; nunca sobreescribe el campo manual.

## 3. Ampliar el snapshot de cada ronda de negociación

**Decisión:** además de precio, cada `NegotiationRound` (docs/12) debe congelar: `participantes`, `modalidad`, `horas`, `type` (tipo de servicio), y `necesidad` (descripción del alcance — el campo donde viviría un cambio como "reducir de 5 plantas a 3").

- [x] Ampliar la interfaz `NegotiationRound` en `mock-data.ts`: agregar `participantes?: string`, `modalidad?: string`, `horas?: string`, `type?: RequestType`, `necesidad?: string`.
- [x] En `handleMarkReadyForKam` (`RequestDetail.tsx`), al construir/actualizar la ronda, incluir un snapshot de estos 5 campos tomados de `req` (no de `req.costing`) en el momento del envío.
- [x] En la sección "Historial de Negociación", si alguno de estos campos difiere respecto a la ronda anterior, mostrarlo como parte del resumen de la ronda (ej. "Participantes: 15-20 → 9-12"). Si no hay ronda anterior con la que comparar (ronda 1), no mostrar diffs, solo el snapshot.

## 4. El Líder de Producto puede editar "Información completa de la solicitud" mientras esté en "En Costeo"

**Encontrado:** `canEditFullInfo` en `RequestDetail.tsx` (línea ~158) hoy es `isKam && req.kam === user.name && req.status === "nueva"` — ni el KAM puede tocar estos campos fuera de "Nueva", y el Líder de Producto nunca puede, en ningún estado. Es el campo `necesidad` (dentro de este bloque) donde vive la descripción de alcance que un rechazo del cliente necesitaría corregir, y hoy nadie puede hacerlo en ese punto del flujo.

**Decisión:** el Líder de Producto también puede editar esta sección, mientras la solicitud esté en `"en-costeo"` y sea suya (mismo patrón de guarda ya usado en el archivo: `req.productLeader === user.name && role === "lider-producto"`).

- [x] Cambiar `canEditFullInfo` a: `(isKam && req.kam === user.name && req.status === "nueva") || (role === "lider-producto" && req.productLeader === user.name && req.status === "en-costeo")`.
- [x] No se requiere ningún cambio adicional de UI para esto — el modal de edición (`isEditingFullInfo`/`fullInfoDraft`) ya es genérico y no está condicionado a un rol específico en su contenido, solo en si aparece el botón "Editar información".
- [x] Esto se integra solo con el punto 3: si el Líder corrige `necesidad` (u otro campo de alcance) y luego confirma "Enviar a KAM", el snapshot de esa ronda ya va a capturar el valor corregido automáticamente — no hace falta lógica adicional para conectar ambos cambios.

## 5. "¿Requiere asesor externo?" pasa de switch editable a indicador derivado, de solo lectura

**Encontrado:** gap #11 ya documentado en `docs/07-gaps-conocidos-y-deuda-tecnica.md` — `requiresExternalAdvisor`/`externalAdvisorDetails` en `ProposalCosting` son un estado independiente del docente/asesor realmente asignado (`req.professorType`/`req.professor`/`req.externalProfessorData`), así que pueden contradecirse entre sí sin ninguna validación.

**Decisión:** dejar de tratarlo como un dato propio del costeo — se deriva 100% de la asignación real de docente/asesor, que ya vive en la tarjeta "Equipo Asignado".

- [x] En `mock-data.ts`: quitar `requiresExternalAdvisor` y `externalAdvisorDetails` de la interfaz `ProposalCosting`. Actualizar la firma de `calculateCosting(...)` quitando esos 2 parámetros, y ajustar todos los call sites existentes en `MOCK_REQUESTS` (son varios, buscar `calculateCosting(`).
- [x] En `ProposalCostingModule.tsx`: quitar el `<Switch>` "¿Requiere asesor externo?", su estado (`requiresExternalAdvisor`, `externalAdvisorDetails`), y el mini-formulario de "Nombre o empresa consultora" (redundante con lo que ya se ve en "Equipo Asignado"). En su lugar, un indicador de solo lectura derivado de `request.professorType`: si es `"externo"`, mostrar el nombre/empresa desde `request.externalProfessorData` (o `request.professor` si no hay `externalProfessorData`) con un botón/enlace "Ver en Equipo Asignado" o similar; si es `"planta"`, un texto simple "Docente de planta asignado" (o nada, si se considera ruido innecesario — usar criterio de espacio/consistencia visual con el resto de la tarjeta).
- [x] Quitar esos 2 parámetros de `triggerSave(...)` y de todas las llamadas internas del componente.
- [x] Actualizar `docs/07-gaps-conocidos-y-deuda-tecnica.md`: marcar el gap #11 como ✅ RESUELTO, con una línea explicando la solución (igual que los demás ítems ya resueltos en ese archivo).

## Checklist de verificación
- [x] `npm run build`, `npm run lint`, `npm run test` limpios.
- [x] Probar manualmente (leyendo el código): `REQ-2026-0135` ahora debe mostrar su ronda 1 rechazada en el historial apenas se abre, sin tocar nada.
- [x] Confirmar que un Líder de Producto puede abrir "Editar información" en una solicitud propia en "En Costeo", y que un KAM sigue sin poder hacerlo fuera de "Nueva".
- [x] Confirmar que el bloque de asesor externo en la tarjeta de costeo ya no tiene ningún control editable, y refleja fielmente lo que dice "Equipo Asignado".

## Rama
`feature/cierre-gaps-costeo`, creada desde `feature/historial-negociacion` (depende de `NegotiationRound`, que vive ahí).
