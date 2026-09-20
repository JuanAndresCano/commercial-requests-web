# Trazabilidad de la negociación comercial (historial de rondas de costeo)

> **Estado: VALIDADO, listo para implementación (2026-09-20).** Origen: preocupación de Tomás sobre qué pasa cuando un cliente devuelve una propuesta y el Líder de Producto ajusta el valor — hoy ese ajuste se pierde sin dejar rastro. Alcance decidido en conversación: sí prototipar la UI aquí (no solo documentar el modelo para el backend real — ver `docs/README.md` sobre el alcance de este repo), y versionar el **ciclo completo de negociación** (no solo el número).

## El problema (verificado en código)

Hoy, cuando el Líder de Producto ajusta el valor final tras una devolución del cliente:
- `totalOfferedCop` se sobrescribe en el mismo campo — el valor anterior desaparece.
- `negotiationNotes` es un único campo mutable, no un historial — la nota anterior se pierde si se escribe una nueva.
- `clientObservations` (la razón por la que el cliente devolvió la propuesta) **se borra por completo** en `handleSendToClient` (`clientObservations: undefined`) en cuanto el KAM vuelve a entregar — ni siquiera queda la observación que motivó el cambio.
- **Bug encontrado de paso**: `handleReturnWithObservations` (línea ~394) regresa el estado a `"en-costeo"` pero **nunca resetea `costing.readyForKam` ni `costing.costingSentAt`**. Como quedaron en `true`/con fecha desde el ciclo anterior, el botón "Enviar a cliente" del KAM quedaría re-habilitado inmediatamente al volver a "en-costeo", **antes de que el Líder haya tocado nada** — se salta el gate que construimos en el Requisito 2. Hay que corregir esto en el mismo cambio.

Ninguno de estos tres es un problema de UI — es que el modelo de datos trata el costeo como un valor de estado actual, no como una serie temporal.

## Modelo de datos

Nuevo tipo en `src/lib/mock-data.ts`:

```ts
export type ClientResponse = "pendiente" | "rechazada";
// No existe "aceptada" explícita: el sistema no tiene hoy un evento real de
// "el cliente aceptó" — solo "fue entregada" (vigente mientras nadie la
// devuelva). Inventar un estado "aceptada" sería fabricar un dato que nadie
// confirma. Si más adelante se necesita ese evento, es un requisito nuevo.

export interface NegotiationRound {
  id: string;                    // `${requestId}-r${roundNumber}`
  roundNumber: number;           // 1, 2, 3...
  totalOfferedCop: number;       // snapshot del valor final en esta ronda
  marginAmountCop: number;
  expectedMarginPercent: number;
  leaderNote?: string;           // obligatoria desde la ronda 2 (ver más abajo)
  sentToKamAt: string;           // ISO — cuando el Líder confirmó "Enviar a KAM"
  sentToClientAt?: string;       // ISO — cuando el KAM efectivamente la entregó
  clientResponse: ClientResponse;
  clientObservation?: string;    // solo si clientResponse === "rechazada"
  clientRespondedAt?: string;    // ISO — cuando el KAM registró la devolución
}
```

Agregar a `RequestItem`: `negotiationRounds?: NegotiationRound[]`. Vive en `RequestItem`, no en `ProposalCosting`, porque es historial del ciclo de vida completo de la solicitud, no del costeo actual.

## Cambios en los handlers (`RequestDetail.tsx`)

### 1. `handleMarkReadyForKam` (abre una ronda nueva)
- Recibe un `leaderNote?: string` opcional.
- `roundNumber = (req.negotiationRounds?.length ?? 0) + 1`.
- **Si `roundNumber > 1`, `leaderNote` es obligatorio** (validar en la UI antes de permitir confirmar — ver sección de UI).
- Además de lo que ya hace (`readyForKam: true`, `costingSentAt`), agrega al arreglo `negotiationRounds` una nueva entrada: snapshot de `totalOfferedCop`/`marginAmountCop`/`expectedMarginPercent`, `leaderNote`, `sentToKamAt: now`, `clientResponse: "pendiente"`.

### 2. `handleSendToClient` (cierra el envío de la ronda pendiente)
- Además de lo que ya hace, busca la ronda con `clientResponse === "pendiente"` (la última) en `req.negotiationRounds` y le fija `sentToClientAt: now`.

### 3. `handleReturnWithObservations` (registra el rechazo + corrige el bug del gate)
- Busca la ronda `clientResponse === "pendiente"` y la actualiza: `clientResponse: "rechazada"`, `clientObservation: returnObservations.trim()`, `clientRespondedAt: now`.
- **Corrección del bug**: además de `status: "en-costeo"`, debe resetear `costing: { ...req.costing, readyForKam: false, costingSentAt: undefined }` — el Líder debe volver a confirmar explícitamente después de ajustar, igual que cualquier otra edición post-envío (ya existe esta regla para ediciones normales, ver Requisito 2; esta ruta específica se había quedado sin cubrir).
- `clientObservations` (el campo suelto singular, ya existente) puede seguir existiendo tal cual para no romper el badge que ya lo muestra en el detalle (línea ~628) — ahora es redundante con `clientObservation` de la ronda, pero quitarlo es un cambio aparte, no obligatorio para esto.

## UI

### Diálogo "Enviar a KAM" — nota obligatoria desde la ronda 2
El diálogo genérico de confirmación (`CONFIRM_ACTION_META`) se usa igual para 4 acciones distintas con un solo `<Dialog>` — no tiene hoy forma de inyectar un campo de texto condicional. Para esta acción específica, sacarla de ese patrón genérico:
- Crear un estado dedicado (ej. `isSendToKamModalOpen`) con su propio diálogo.
- Si `roundNumber === 1` (primera vez, sin rondas previas): mismo comportamiento actual, sin pedir nota.
- Si `roundNumber > 1`: mostrar un `<Textarea>` obligatorio ("Motivo del ajuste — explica qué cambió frente a la propuesta anterior"), botón de confirmar deshabilitado hasta que tenga contenido. Mostrar como contexto la observación del cliente de la ronda anterior (`clientObservation`) para que el Líder no tenga que ir a buscarla.

### Nueva sección "Historial de Negociación"
En `RequestDetail.tsx`, dentro o junto a la tarjeta de costeo — visible para Líder y KAM, solo se muestra si `negotiationRounds.length > 0` (una solicitud en su primera ronda no necesita ver un "historial" de una sola entrada en curso). Por cada ronda, en orden cronológico:
- "Ronda N — $[totalOfferedCop] — enviada a KAM el [sentToKamAt]"
- Si tiene `sentToClientAt`: "→ entregada al cliente el [fecha]"
- Si `clientResponse === "rechazada"`: insignia de devuelta + "Cliente: '[clientObservation]'" + fecha
- Si tiene `leaderNote`: "Motivo del ajuste: '[leaderNote]'"
- La ronda vigente (`clientResponse === "pendiente"` y es la última) se resalta visualmente distinta de las rondas cerradas.

## Checklist de implementación
- [ ] `NegotiationRound`, `ClientResponse`, y `negotiationRounds?: NegotiationRound[]` en `mock-data.ts`.
- [ ] `handleMarkReadyForKam`: acepta nota opcional, exige nota si `roundNumber > 1`, agrega la ronda.
- [ ] `handleSendToClient`: cierra `sentToClientAt` de la ronda pendiente.
- [ ] `handleReturnWithObservations`: marca la ronda como rechazada + **corrige el bug de `readyForKam`/`costingSentAt` no reseteados**.
- [ ] Nuevo diálogo dedicado para "Enviar a KAM" con nota condicional (reemplaza el uso de `CONFIRM_ACTION_META.kam` para este caso).
- [ ] Sección "Historial de Negociación" en el detalle de la solicitud.
- [ ] Verificar `npm run build`, `npm run lint`, `npm run test` antes de dar por terminado.
- [ ] No es necesario tocar `ProductLeaderDashboard.tsx` ni `KamCommandCenter.tsx` para esto — el historial vive solo en el detalle de la solicitud, no en las tarjetas del tablero.

## Rama
`feature/historial-negociacion`, creada desde `feature/gate-envio-kam` (depende de `readyForKam`/`costingSentAt`, que viven ahí y aún no están en `develop`).
