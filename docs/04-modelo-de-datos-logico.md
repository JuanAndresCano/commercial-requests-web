# Modelo de datos lógico (del prototipo)

> ⚠️ **Esto no es un esquema de producción.** Es la estructura de datos *implícita* en el prototipo (`src/lib/mock-data.ts` + `src/context/AuthContext.tsx`), que vive en memoria/`localStorage` sin backend real. Se documenta para **no perder reglas de negocio ya validadas** (cálculos, campos obligatorios vs. opcionales, relaciones) cuando se diseñe el modelo de datos definitivo en el entorno de desarrollo real.

## Entidad principal: `RequestItem` (la "solicitud comercial")

```ts
interface RequestItem {
  id: string;                    // formato "REQ-2026-NNNN", autogenerado secuencialmente
  title: string;                 // título comercial de la propuesta
  applicant: string;             // nombre del contacto principal en la empresa cliente
  type: RequestType;              // "Capacitación" | "Consultoría" | "Mentoría" | "Investigación" | "Proyectos Especiales (Eventos)" | "Otro"
  createdAt: string;             // ISO date
  deadline?: string;             // ISO date, opcional — "Entrega esperada"
  status: RequestStatus;         // "nueva" | "en-experto" | "en-costeo" | "entregada"
  urgency: Urgency;               // "alta" | "media" | "baja"
  participantes?: string;        // rango de cupo proyectado, ej. "15 - 20"
  modalidad?: string;             // Presencial / Virtual / Híbrida
  horas?: string;                 // intensidad horaria estimada
  tipoOtro?: string;              // descripción libre cuando type === "Otro"

  // Datos completos de la empresa (paso 1 del wizard). "company" es solo el
  // nombre, mantenido por compatibilidad con el resto de la app.
  companyNit?: string;
  companyDireccion?: string;
  companyTelefono?: string;
  companyCorreo?: string;
  companyCiiuPrincipal?: string;
  companyCiiuPrincipalDesc?: string;
  companyCiiusSecundarios?: string[];
  companyTipo?: string;
  companyDescripcion?: string;
  companyWeb?: string;

  // Contacto del cliente (paso 2). "applicant" arriba es solo el nombre.
  contactTelefono?: string;
  contactTelefonoSecundario?: string;
  contactCorreo?: string;
  contactCorreoAlternativo?: string;
  contactCargo?: string;
  contactArea?: string;
  additionalContacts?: ClientContact[];

  // Diagnóstico del requerimiento (paso 3)
  alimentacion?: string;
  necesidad?: string;
  competencias?: string;
  exito?: string;
  resultados?: string;
  areaParticipantes?: string;

  // Formación previa (paso 4)
  formacionPrevia?: "Sí" | "No" | "No sé";
  descFormacion?: string;
  empresaPrevia?: string;
  fechaPrevia?: string;

  // Observaciones finales (paso 5)
  observaciones?: string;

  company: string;               // nombre de la empresa cliente (texto libre, no FK estricta)
  node: string;                  // nodo temático (texto libre desde la lista NODES, o "Por definir")
  productLeader: string;         // nombre del Líder de Producto responsable
  kam: string;                   // nombre del KAM responsable — también el "dueño" de la solicitud
  professor?: string;            // nombre del docente/experto asignado
  professorType?: "planta" | "externo";
  externalProfessorData?: ExternalProfessorData;  // solo si professorType === "externo"
  totalCostCop?: number;         // espejo de costing.totalOfferedCop, mantenido en sync
  costing?: ProposalCosting;
  clientKamDocuments?: ProposalDocument[];
  internalCostingDocuments?: ProposalDocument[];

  // Nota que deja el KAM al devolver una propuesta "Entregada" a costeo
  // porque el cliente pidió ajustes — visible para el Líder de Producto
  // hasta que se vuelva a entregar (ver "Reglas de negocio validadas" abajo).
  // Redundante con la última ronda "rechazada" de `negotiationRounds` (abajo)
  // desde que existe ese historial, pero se conserva por compatibilidad con
  // el banner que ya la muestra.
  clientObservations?: string;

  // Historial de negociación comercial — una entrada por cada vez que el
  // Líder confirma "Enviar a KAM" (ver `NegotiationRound` más abajo). Sin
  // esto, cada ajuste de precio o alcance sobrescribía al anterior sin dejar
  // rastro de qué cambió ni por qué.
  negotiationRounds?: NegotiationRound[];

  // ISO timestamp de la última vez que el KAM guardó cambios en "Información
  // completa de la solicitud" (empresa/contacto/diagnóstico/etc.).
  fullInfoUpdatedAt?: string;

  // ISO timestamp de la última vez que cambió `status` — se actualiza
  // automáticamente dentro de `updateRequest` (no en cada pantalla que
  // dispara el cambio), para que sea correcto sin importar si vino del
  // Kanban, del detalle, de "Entregar" o de "Devolver con observaciones".
  // Alimenta el indicador "lleva X días en esta fase" del Kanban del Líder.
  statusUpdatedAt?: string;
}
```

**Notas de diseño importantes:**
- `company`, `node`, `productLeader`, `kam`, `professor` son **strings libres**, no referencias a IDs de otras entidades — en el prototipo no hay una tabla real de "usuarios" o "empresas" con relación referencial, son listas fijas (`KAMS`, `PRODUCT_LEADERS`, `MOCK_COMPANIES`, `NODES`) usadas como opciones de formulario. En un modelo de producción esto debería normalizarse (FKs reales a tablas de usuarios/empresas).
- `id` se genera como `REQ-2026-${requests.length + 145}` — es un contador local ingenuo, **no apto para producción** (colisiones, no es secuencial real, año hardcodeado).
- Los campos de empresa/contacto/diagnóstico/formación son opcionales, pero el wizard del KAM sí exige **6 campos obligatorios** para poder enviar (no 2, como decía una versión anterior de este documento): razón social y naturaleza jurídica de la empresa, título de la propuesta, tipo de requerimiento (+ su descripción libre si es "Otro"), si ha habido formación previa, y la urgencia — ver `01-negocio-y-dominio.md` y `03-flujos-de-usuario.md` para el detalle completo.

## Reglas de negocio validadas con la Líder de Producto (ciclo de `08`)

Estas reglas ya fueron confirmadas por Dianis y quedan implementadas en el prototipo — deben preservarse en el modelo de datos real:

- **Propiedad de la solicitud:** el KAM (`kam`) es dueño de los datos que él mismo diligencia (empresa, contacto, diagnóstico, formación previa, observaciones) y es quien debe corregirlos si se equivoca — no el Líder de Producto. El Líder de Producto, en cambio, es dueño de "Especificaciones del Servicio" (horas, modalidad, participantes, tipo, fecha de entrega) una vez tiene información real del cliente.
- **Ventana de edición del KAM:** el KAM solo puede editar o cancelar su propia solicitud mientras el estado es `nueva` — es decir, antes de que el Líder de Producto empiece a trabajarla. Una vez avanza a `en-experto`, esos campos deben quedar de solo lectura para el KAM (en el modelo real esto es una regla de autorización por campo + estado, no solo de UI).
- **Visibilidad económica del KAM:** el KAM nunca ve `expectedMarginPercent`/`marginAmountCop` (información interna del costeo). Solo ve `totalOfferedCop` y, si aplica, la referencia de `proCulturaTaxAmount`. Pendiente de confirmar con la Líder (pregunta 3 en `08`, no quedó clara en la primera ronda): si esta restricción aplica también mientras la solicitud está en `en-costeo` sin valor aún definido, y si la nota de negociación (`negotiationNotes`) debe ocultarse también.
- **Costeo se define de una sola vez:** no hay valores parciales de costeo antes de la fase `en-costeo` — todo el costeo (valor final, margen) se define en ese único momento, no hay que modelar estados intermedios de costeo parcial.
- **Sin bloqueo de precio post-entrega, pero con trazabilidad:** es intencional que el Líder de Producto pueda seguir editando el costeo después de `entregada` (vía "Devolver con observaciones") — no hay una "versión final protegida". Lo que sí cambió: cada ajuste ya no sobreescribe en silencio, queda registrado como una ronda nueva en `negotiationRounds` (ver más abajo) — esto responde directamente lo que la pregunta 9 de `08` dejaba pendiente ("en algún momento se necesitará un historial de cambios").
- **Sin aprobación adicional:** el Líder de Producto tiene autonomía total sobre el precio final — no hay un segundo visto bueno (jefe de nodo, dirección comercial) en el flujo real. No modelar un estado "Pendiente de aprobación".
- **Honorarios del asesor externo fuera de la plataforma:** el pago al asesor externo se documenta en el "Documento de Costeo" (adjunto/externo a la app), no como un campo estructurado en `ProposalCosting`. No se necesita un campo `advisorFeeCop` en el modelo real, salvo que el negocio pida lo contrario más adelante.
- **El Profesor no tiene cuenta propia (por ahora):** son muchos profesores y no se espera que entren a ver solicitudes pendientes; la coordinación sigue siendo manual (WhatsApp/correo) y el Líder de Producto refleja el avance en la app. No hay urgencia de modelar autenticación/permisos para este rol todavía.
- **Cancelación real, no lógica:** cancelar una solicitud (`deleteRequest` en el prototipo) la elimina por completo — no se modeló un estado `cancelada` porque no se pidió conservar el histórico de solicitudes canceladas. Si el negocio real necesita auditoría de solicitudes canceladas, esto debe revisarse (borrado lógico vs. físico) antes de construir el backend.
- **"Devolver con observaciones" reabre el pipeline:** cuando el cliente pide ajustes tras `entregada`, el KAM la regresa a `en-costeo` con una nota (`clientObservations`). No se modeló un estado explícito "Rechazada" — se reutiliza el mismo pipeline lineal, y la ronda correspondiente en `negotiationRounds` queda marcada `"rechazada"` en su lugar (ver `NegotiationRound` más abajo — esto ya responde la duda de `08`, pregunta 13, sobre llevar historial de estos casos). Si el volumen real es alto y se necesita un estado dedicado en vez de reutilizar el pipeline lineal, seguirá siendo una decisión de diseño pendiente para el backend real.
- **Reasignación en "Nueva" y "En Experto":** ⚠️ la Líder solo confirmó "Nueva" (pregunta 6 en `08`, respuesta no concluyente: "quizás todo puede pasar en la vida"). Se amplió a "En Experto" también por decisión de Tomás (caso concreto: el experto determina que el tema no corresponde a su nodo), **sin validación explícita de Dianis todavía** — ver `08`, pregunta 16. Al reasignar desde "En Experto" el estado vuelve a `nueva` y se limpia el docente/asesor asignado.

## Reglas adicionales descubiertas durante la implementación (post-ronda `08`)

Estas no vinieron de una pregunta explícita a Dianis — se encontraron auditando el código en busca de huecos de la misma familia que uno reportado directamente ("se pudo entregar una propuesta con costeo en $0"). Igual de importantes para el modelo real:

- **Valor de entrega obligatorio y positivo:** ninguna solicitud puede marcarse `entregada` si `costing.totalOfferedCop` no es mayor a `0`. Antes no existía ninguna validación — se podía "entregar" con el costeo completamente vacío. En el modelo real, esta es una restricción de integridad a nivel de transición de estado (`en-costeo → entregada`), no solo de UI.
- **Montos financieros no negativos:** `totalOfferedCop`, `expectedMarginPercent` (acotado además a 0–100) y `marginAmountCop` se acotan a valores ≥ 0 en el formulario. Antes no había ningún límite — se podía guardar un valor negativo sin ningún aviso. Debe replicarse como constraint de base de datos, no solo validación de formulario.
- **Fricción proporcional al riesgo en las transiciones de estado:** "Pasar a Experto" y "Pasar a Costeo" requieren confirmación explícita (con los datos de la solicitud a la vista, no un texto genérico) antes de ejecutar — se encontró que el tablero del Líder ejecutaba estos cambios al primer clic, sin ningún tipo de confirmación, en tarjetas densas donde un clic de más movía la solicitud sin querer.
- **`entregada` es una transición exclusiva del KAM:** se encontró (reporte directo) que el Líder de Producto tenía su propio botón "Marcar Entregada" en `RequestDetail.tsx` que ejecutaba el mismo handler que el "Enviar a cliente" del KAM — cualquiera de los dos roles podía cerrar el ciclo comercial, contradiciendo la regla de negocio (`08`, pregunta 13) de que el envío final al cliente es del KAM. Se quitó esa acción del Líder por completo: en el modelo real, la transición `en-costeo → entregada` debería estar autorizada solo para el rol KAM, nunca para el Líder de Producto.
- **"Sin docente" no debe vaciar completamente una vista sin explicación:** un filtro que produce cero resultados debe decirlo explícitamente (con opción de quitarlo), en vez de dejar 4 columnas vacías indistinguibles de "no hay datos". Aplica a cualquier filtro combinable futuro, no solo a este.
- **El "reset a datos de ejemplo" debe limpiar también el estado de UI persistido**, no solo los datos: filtros, vista activa (Kanban/Tabla) y columna aislada se guardan en el cliente (hoy `localStorage`, vía `usePersistentState`) de forma independiente a los datos de negocio. Si el reset solo restaura los datos, un filtro que quedó activo (ej. "Sin docente") sigue ocultando todo después del reset, sin ninguna pista de por qué. En producción esto es más relevante aún si el estado de UI se sincroniza entre sesiones/dispositivos.
- **Un filtro no debe quedar visible en una etapa donde no puede aportar nada:** se encontró que "Sin docente" seguía mostrándose (con un conteo que no correspondía a lo visible en pantalla) incluso aislando "En Costeo" o "Entregadas" — etapas donde, por la regla de arriba ("docente obligatorio desde En Experto"), esa condición ya no puede darse. Un filtro/indicador que no puede producir información útil en cierto contexto debe ocultarse ahí, no mostrarse con un dato que no aplica.
- **Un tablero de resumen no debe asumir "listo" solo por el estado del pipeline:** se encontró que el tablero del KAM etiquetaba *toda* la columna/conteo de `en-costeo` como "Lista para Entregar" y la resaltaba como accionable, sin revisar si el Líder ya había confirmado el envío (`readyForKam`) — el KAM veía como lista una propuesta que el Líder todavía estaba costeando. Cualquier vista de resumen que derive un estado "accionable" de un sub-campo (no solo del `status` principal) debe calcularlo desde una única función/regla compartida, para que no se repita el mismo olvido en cada tablero que muestre esa solicitud.
- **"Requiere asesor externo" ya no es un campo independiente** — ver la nota en `ProposalCosting` más arriba. Se resolvió eliminándolo y derivándolo de la asignación real de docente/asesor (`07`, gap #11).

## `ProposalCosting` (costeo financiero — subdocumento de `RequestItem`)

> ⚠️ **Este modelo cambió por completo el 2026-09-19/20** (ver `07`, y las preguntas 9/13 de `08` que ya anticipaban la necesidad). La versión anterior (`baseCostCop` + margen% → `suggestedTotalCop` calculado, con `totalOfferedCop` como override opcional) quedó **retirada**: el equipo ya trae el valor final calculado de un Excel externo y necesita digitarlo exacto, sin que el sistema lo recalcule ni lo contradiga.

```ts
interface ProposalCosting {
  // Valor Final de la Propuesta (COP) — único campo operativo real. El Líder
  // lo digita directamente; ya NO se deriva de una base + margen.
  totalOfferedCop: number;

  // Margen de Contribución — dos campos manuales e independientes entre sí y
  // de `totalOfferedCop`. Es intencional que puedan no cuadrar matemáticamente
  // (ej. 35% de $32M no tiene por qué dar exacto el monto en pesos que se
  // registró) — son informativos, no una fórmula. La UI muestra una
  // referencia calculada junto al campo en pesos solo para comparar.
  expectedMarginPercent: number;   // ej. 30 (= 30%)
  marginAmountCop: number;         // monto en pesos, digitado a mano

  // Estampilla Pro-Cultura — fila de referencia informativa, calculada sobre
  // `totalOfferedCop` pero nunca sumada/restada de él (el equipo ya la
  // contempla en el Excel externo del que sale ese valor).
  proCulturaTaxPercent: number;    // 1.5 si type === "Capacitación", si no 0
  proCulturaTaxAmount: number;     // round(totalOfferedCop * 0.015), si aplica

  negotiationNotes?: string;       // nota de alcance libre, independiente del historial de rondas

  // Gate explícito del Líder de Producto antes de que el KAM pueda entregar
  // al cliente — mientras sea `false`, el botón "Enviar a cliente" del KAM
  // permanece deshabilitado aunque ya exista un valor > 0.
  readyForKam: boolean;
  // ISO timestamp de cuándo se marcó `readyForKam = true` por última vez —
  // alimenta "hace X" en el tablero del Líder. Se limpia junto con
  // `readyForKam` si se invalida (ver reglas abajo).
  costingSentAt?: string;
}
```

**Reglas de invalidación del gate:** si el Líder edita el valor final o el margen (%o$) *después* de haber marcado `readyForKam = true`, ese flag vuelve a `false` automáticamente (y `costingSentAt` se limpia) — el Líder debe reconfirmar el envío. Lo mismo ocurre cuando el KAM usa "Devolver con observaciones" (ver más abajo): es la corrección de un bug real que existía al construir esto — sin este reseteo explícito, el botón del KAM quedaba reactivado solo, sin que el Líder hubiera vuelto a confirmar nada.

⚠️ **Tarifa de Estampilla Pro-Cultura por confirmar:** el prototipo usa 1.5%, pero al responder `08` (pregunta 2) la Líder de Producto mencionó de forma informal "el 1% de procultura" al describir cómo se presenta una cotización al cliente. No se cambió la tarifa en el código a partir de ese comentario suelto — falta confirmar explícitamente cuál es la tarifa vigente (y si varía) antes de tocar el cálculo. Ver `08`, pregunta 12 (sigue abierta, sin responder en esta ronda).

⚠️ **"Asesor del Servicio" ya no es un campo de `ProposalCosting`** — antes existían `requiresExternalAdvisor`/`externalAdvisorDetails` aquí, independientes del docente/asesor realmente asignado en `RequestItem.professorType`/`professor`/`externalProfessorData`, y podían contradecirse entre sí sin ninguna validación (`07`, gap #11, ya resuelto). El indicador que hoy se ve en la tarjeta de costeo es puramente derivado de esos campos de `RequestItem` — no dupliques esta información en el modelo real, una sola fuente de verdad basta.

## `NegotiationRound` (una entrada por cada ronda de negociación con el cliente)

Vive en `RequestItem.negotiationRounds` (no dentro de `ProposalCosting`), porque es historial del ciclo de vida completo de la solicitud, no del costeo vigente:

```ts
type ClientResponse = "pendiente" | "rechazada";
// No existe "aceptada" explícita: el sistema no tiene un evento real de "el
// cliente aceptó" — solo "fue entregada" (vigente mientras nadie la
// devuelva). Modelarlo como "aceptada" sería fabricar un dato que nadie
// confirma explícitamente hoy.

interface NegotiationRound {
  id: string;
  roundNumber: number;             // 1, 2, 3...
  // Snapshot del costeo Y del alcance en el momento en que el Líder confirmó
  // el envío — no solo precio, también lo que cambió si el rechazo del
  // cliente fue por alcance (ej. "reducir de 5 plantas a 3").
  totalOfferedCop: number;
  marginAmountCop: number;
  expectedMarginPercent: number;
  participantes?: string;
  modalidad?: string;
  horas?: string;
  type?: RequestType;
  necesidad?: string;
  leaderNote?: string;             // obligatoria desde la ronda 2 (validado en la UI)
  sentToKamAt: string;             // ISO — cuando el Líder confirmó "Enviar a KAM"
  sentToClientAt?: string;         // ISO — cuando el KAM efectivamente la entregó
  clientResponse: ClientResponse;
  clientObservation?: string;      // solo si clientResponse === "rechazada"
  clientRespondedAt?: string;      // ISO — cuando el KAM registró la devolución
}
```

**Ciclo de vida de una ronda:**
1. **Cada confirmación de "Enviar a KAM" abre una ronda nueva, sin excepción** — con el snapshot vigente del costeo y el alcance, `clientResponse: "pendiente"`. No importa si la ronda anterior nunca llegó a entregarse al cliente: cada clic de confirmación es su propio número de ronda. (Versión anterior de esta regla: se reutilizaba la ronda si nunca se había entregado, para "no dejar rondas huérfanas" — se revirtió el 2026-09-20 tras probarlo en vivo: el Líder espera ver un número de ronda por cada envío que confirma, no solo por cada rechazo real del cliente.)
2. El KAM entrega al cliente (`status → entregada`) → la **ronda vigente** (la última del arreglo) recibe `sentToClientAt`.
3. Si el cliente rechaza (KAM usa "Devolver con observaciones") → la ronda vigente pasa a `"rechazada"` con `clientObservation` y `clientRespondedAt`.
4. Como puede haber varias rondas `"pendiente"` en el historial (las que el Líder reemplazó con un envío más reciente antes de que el KAM llegara a entregarlas), los pasos 2 y 3 identifican la ronda a modificar **por posición (la última del arreglo), no solo por `clientResponse === "pendiente"`** — de lo contrario se marcarían todas las pendientes a la vez. Las rondas pendientes que no son la última se muestran en el Historial como "reemplazada por una ronda posterior", no como rechazadas.
5. La UI exige un `leaderNote` desde la ronda 2 en adelante, sin excepción — explicando qué cambió frente a la ronda anterior.
6. **Cualquier edición posterior a la confirmación** — no solo del valor final o el margen, también de los campos que cada ronda congela (`participantes`, `modalidad`, `horas`, `type`, `necesidad`, vía "Especificaciones del Servicio" o "Información completa de la solicitud") — invalida `readyForKam` igual que editar el precio. Antes solo el precio invalidaba el gate, dejando que el alcance cambiara sin que el KAM se enterara de que la propuesta que iba a entregar ya no era la que el Líder confirmó por última vez.

## `ClientContact` (contacto adicional de la empresa cliente)

```ts
interface ClientContact {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  correo: string;
  area: string;
}
```

Usado en `RequestItem.additionalContacts` — contactos secundarios del cliente, más allá del contacto principal (`applicant`).

## `ExternalProfessorData` (ficha del consultor externo)

```ts
interface ExternalProfessorData {
  nombre: string;                 // obligatorio
  identificacion?: string;        // cédula/pasaporte/NIT
  empresaConsultora?: string;     // firma o institución
  correo?: string;
  telefono?: string;
  perfil?: string;                // descripción de especialidad/experiencia
}
```

## `ProposalDocument` (documento adjunto)

```ts
interface ProposalDocument {
  id: string;
  name: string;
  size: string;                   // texto formateado, ej. "2.4 MB" (no bytes numéricos)
  date: string;                   // texto formateado dd/mm/aaaa
  type: "pdf" | "doc" | "excel" | "sheet" | "archive";
  category: "client_kam" | "internal_costing";
  uploadedBy?: string;
  tag?: string;                   // ej. "Matriz de Costeo", "Cronograma Detallado", "Contrato"
}
```

Nota: en el prototipo, subir un archivo probablemente no persiste el binario real (revisar `ProposalDocumentsSection.tsx` si se retoma esa pieza) — es una simulación de metadata.

## `CompanyRecord` (directorio de empresas con convenio, usado para autocompletar)

```ts
interface CompanyRecord {
  nit: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  ciiuPrincipal: string;           // código CIIU (clasificación de actividad económica, Colombia)
  ciiuDescripcion?: string;
  web?: string;
  tipoEmpresa?: string;            // "Pública" | "Privada" | "Mixta" | "Sin ánimo de lucro"
}
```

Poblado con 9 empresas reales de referencia (Icesi, Bancolombia, Carvajal, Manuelita, Colombina, Tecnoquímicas, Grupo Nutresa, Grupo Éxito, Gases de Occidente).

## Volumen de datos semilla (`MOCK_REQUESTS`)

**24 solicitudes** (se amplió desde las 9 originales para simular un pipeline realista), validadas programáticamente contra las reglas de negocio de este documento (0 violaciones: ninguna `en-experto`/`en-costeo`/`entregada` sin docente, ninguna `en-experto` con costeo ya definido):

| Corte | Distribución |
|---|---|
| Por estado | Nueva: 8 · En Experto: 6 · En Costeo: 5 · Entregada: 5 |
| Por Líder de Producto | Los 6 líderes tienen al menos 2 solicitudes cada uno (antes 2 de los 6 tenían cero) |
| Por KAM | Los 4 KAMs tienen solicitudes propias |
| Por tipo de servicio | Los 6 tipos están representados (antes Investigación, Proyectos Especiales y Otro no tenían ningún ejemplo) |

Incluye casos construidos a propósito para probar funcionalidad específica: al menos 2 solicitudes con `clientObservations` (para ver el flujo de "devuelta con observaciones" en más de una tarjeta), y al menos 1 solicitud con varios días de antigüedad en su fase actual (para ver el indicador de "cuello de botella"). Los valores de `statusUpdatedAt` de los datos semilla están fijados cerca de la fecha real de uso del prototipo (no de `createdAt`, que puede ser mucho más antigua) — a propósito, para que el indicador de antigüedad se vea con variación realista al probar, igual que ya hacía `getRelativeTime()` con `createdAt` (ver más abajo).

## `User` (sesión activa — sin autenticación real)

```ts
type UserRole = "kam" | "lider-nodo" | "lider-producto" | "profesor";

interface User {
  role: UserRole;
  roleLabel: string;    // etiqueta legible, ej. "Líder de Producto"
  name: string;
  email: string;
  node?: string;        // solo para lider-producto y lider-nodo
}
```

## Listas/enumeraciones de referencia (todas en `mock-data.ts`)

| Constante | Contenido |
|---|---|
| `REQUEST_TYPES` | Los 6 tipos de servicio (ver `01-negocio-y-dominio.md`) |
| `NODES` | Los 5 nodos temáticos |
| `KAMS` | 4 KAMs: Andrea Martínez, Carlos Riveros, Diana Salcedo, Felipe Ortiz |
| `PRODUCT_LEADERS` | 6 líderes de producto |
| `PROFESSORS` | Lista corta de referencia (la lista real usada en el modal de asignación es `ICESI_FACULTY`, definida aparte en `AdvisorAssignmentModal.tsx` con 6 profesores + departamento + correo) |
| `NODE_DEFAULT_LEADERS` | Mapeo Nodo → Líder de Producto sugerido |
| `STATUS_META` | Metadata visual (label, clases de color Tailwind) por cada `RequestStatus` |
| `URGENCY_META` | Metadata visual por cada `Urgency` |

## Funciones utilitarias relevantes

- `formatCop(amount)` — formatea a moneda colombiana (`Intl.NumberFormat("es-CO", { currency: "COP" })`), sin decimales.
- `formatCompactCop(amount)` — versión compacta para KPIs grandes, ej. `"$ 18.4M COP"`.
- `getRelativeTime(id)` — **hardcodeado por ID de solicitud específico** (no es un cálculo real de tiempo transcurrido), usado solo en `KamCommandCenter`. No replicar este patrón — en producción debe ser un cálculo real sobre `createdAt`.

## Persistencia actual (solo prototipo)

`AuthContext.tsx` guarda todo en `localStorage` bajo dos llaves: `icesi_auth_user_v3` (usuario/rol activo) e `icesi_requests_data_v3` (arreglo completo de solicitudes). Al cargar, hace un merge entre lo guardado y `MOCK_REQUESTS` (para no perder solicitudes semilla nuevas si se actualiza el código). **Este mecanismo desaparece por completo al migrar a un backend real** — se documenta solo para entender que hoy no hay noción de sesión multiusuario ni concurrencia.

Además, cada dashboard persiste su propio **estado de UI** (filtro activo, columna aislada del Kanban, búsqueda, vista Tabla/Kanban) en `localStorage` vía el hook `usePersistentState` (`src/hooks/use-persistent-state.ts`), bajo llaves con prefijo `icesi_kam_dashboard_*` y `icesi_lp_dashboard_*`. Es deliberadamente independiente de los datos de negocio — sobrevive a navegar al detalle y volver, sin depender de un backend. La función `resetData()` de `AuthContext` limpia ambos tipos de estado (datos + UI) para evitar la inconsistencia descrita arriba ("Sin docente" quedando activo tras un reset).
