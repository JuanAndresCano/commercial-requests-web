import { calculateProCulturaReference, PRO_CULTURA_PERCENT } from "@/lib/currency";
import type { CommercialStatus } from "@/lib/api/commercial-status";

export type RequestStatus = "nueva" | "en-experto" | "en-costeo" | "entregada" | "rechazada" | "cancelada";
export type RequestType =
  "Capacitación" | "Consultoría" | "Mentoría" | "Investigación" | "Proyectos Especiales (Eventos)" | "Otro";
export type Urgency = "alta" | "media" | "baja";

export const REQUEST_TYPES: RequestType[] = [
  "Capacitación",
  "Consultoría",
  "Mentoría",
  "Investigación",
  "Proyectos Especiales (Eventos)",
  "Otro",
];

export const NODES = [
  "Biotecnología, Bioeconomía y Sostenibilidad",
  "Inteligencia Artificial y Tecnologías Digitales",
  "Innovación Educativa, Bienestar Social, Innovación Pública",
  "Competitividad Organizacional, Economías Creativas",
  "Salud Global, Calidad de Vida",
];

export const PRODUCT_LEADERS = [
  "Diana Carolina Romero Valencia",
  "Juan Pablo Corrales Arenas",
  "Claudia Maitee Bahamón Osorio",
  "María Camila Restrepo",
  "Sebastián Vélez",
  "Laura Caicedo",
];

export const NODE_DEFAULT_LEADERS: Record<string, string> = {
  "Biotecnología, Bioeconomía y Sostenibilidad": "Claudia Maitee Bahamón Osorio",
  "Inteligencia Artificial y Tecnologías Digitales": "Juan Pablo Corrales Arenas",
  "Innovación Educativa, Bienestar Social, Innovación Pública": "Diana Carolina Romero Valencia",
  "Competitividad Organizacional, Economías Creativas": "María Camila Restrepo",
  "Salud Global, Calidad de Vida": "Sebastián Vélez",
};
/**
 * Data of the assigned professor/advisor, of either kind (the name is historical: it started for externals).
 * `identificacion` is only known to the product leader; the KAM's payload never carries it.
 */
export interface ExternalProfessorData {
  nombre: string;
  identificacion?: string;
  /** Faculty of a planta professor. */
  facultad?: string;
  /** Company or institution of an external advisor. */
  empresaConsultora?: string;
  correo?: string;
  telefono?: string;
  perfil?: string;
}

export interface ProposalDocument {
  id: string;
  name: string;
  size: string;
  date: string;
  type: "pdf" | "doc" | "excel" | "sheet" | "archive";
  category: "client_kam" | "internal_costing";
  uploadedBy?: string;
  tag?: string;
  // Only set for real (backend) documents; mock documents behave as downloadable/deletable.
  downloadable?: boolean;
  canDelete?: boolean;
}

export interface ClientContact {
  id: string;
  nombre: string;
  cargo: string;
  telefono: string;
  correo: string;
  area: string;
}

export interface ProposalCosting {
  // Margen de Contribución en pesos — input manual e independiente (docs/04,
  // Requisito 1). Es informativo: no tiene que cuadrar matemáticamente con
  // `expectedMarginPercent` ni con `totalOfferedCop`.
  // undefined = sin margen registrado (el backend lo guarda como null); 0 es un valor real.
  marginAmountCop?: number;
  expectedMarginPercent?: number; // e.g. 30 (%) — manual, informativo
  proCulturaTaxPercent: number; // 1.5% if Capacitación, 0% otherwise
  // Estampilla Pro-Cultura: fila de referencia calculada sobre el valor
  // final ya digitado. Nunca se suma ni se resta de `totalOfferedCop` — el
  // equipo ya la contempla en el Excel externo del que sale ese valor.
  proCulturaTaxAmount: number;
  // Valor Final de la Propuesta (COP) — único campo operativo real. Ya no se
  // deriva de una base + margen: el Líder lo digita directamente.
  totalOfferedCop: number;
  negotiationNotes?: string;
  // Gate explícito del Líder de Producto (docs/04): mientras
  // sea false, el KAM no puede enviar la propuesta al cliente aunque ya haya
  // un valor ofertado > 0. Se invalida automáticamente (vuelve a false) si
  // el Líder vuelve a editar el valor final o el margen tras haberlo marcado.
  readyForKam: boolean;
  // ISO timestamp de cuándo se marcó `readyForKam = true` por última vez —
  // permite mostrar "esperando hace X días" y ordenar por antigüedad en el
  // tablero del Líder. Se limpia junto con `readyForKam` si se invalida.
  costingSentAt?: string;
}

export interface RequestItem {
  commercialStatus?: CommercialStatus | null;
  deliveredValueCop?: string | null;
  id: string;
  /** Human-readable business code (e.g. "REQ-2026-0042"), distinct from `id` (UUID). */
  code?: string;
  title: string;
  applicant: string;
  type: RequestType;
  createdAt: string; // ISO
  deadline?: string; // ISO
  status: RequestStatus;
  urgency: Urgency;
  participantes?: string; // Cupo proyectado, diligenciado por el KAM (ej. "15 - 20")
  modalidad?: string; // Presencial / Virtual / Híbrida, diligenciado por el KAM
  horas?: string; // Intensidad horaria estimada, diligenciada por el KAM
  tipoOtro?: string; // Descripción libre cuando type === "Otro"

  // Datos completos de la empresa, diligenciados por el KAM en el wizard
  // (paso 1) — "company" arriba sigue siendo solo el nombre, por compatibilidad
  // con el resto de la app.
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

  // Contacto del cliente (paso 2). "applicant" arriba sigue siendo solo el
  // nombre del contacto principal, por compatibilidad.
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

  company: string;
  /** Name of the node; `null` when the request has none (C-06: the node is optional). */
  node: string | null;
  /** Real id of the node (only when it comes from the API); `null` when the request has none. */
  nodeId?: string | null;
  /** Center the business goes through (free text), typed by the Product Leader (C-07). */
  center?: string;
  /** Cost center ("CENCO", free text) loaded for that center (C-07). */
  costCenter?: string;
  /** Official number ("CP 2026-0169"); the API only sends it once the request is delivered (C-13). */
  officialNumber?: string;
  /** Every change of status, oldest first (detail only); feeds "Tiempo por etapa". */
  statusHistory?: StatusHistoryEntry[];
  productLeader: string;
  kam: string;
  professor?: string;
  professorType?: "planta" | "externo";
  externalProfessorData?: ExternalProfessorData;
  professorHistory?: ProfessorAssignmentLogEntry[];
  /** Cambios de nodo o de Líder de Producto, del más antiguo al más reciente. */
  teamHistory?: TeamChangeEntry[];
  totalCostCop?: number;
  costing?: ProposalCosting;
  clientKamDocuments?: ProposalDocument[];
  internalCostingDocuments?: ProposalDocument[];

  // Observaciones del cliente cuando pide ajustes tras una entrega — el KAM
  // "devuelve" la propuesta a costeo con esta nota (docs/08, pregunta 13).
  clientObservations?: string;

  // Devoluciones del cliente con observaciones («Sustentación y ajuste N») y si la
  // última aún no se ha vuelto a presentar. Las envía el servidor; sin ellas la regla
  // cae al texto de `clientObservations` (ver src/lib/adjustments.ts).
  adjustmentCount?: number;
  hasPendingAdjustment?: boolean;

  // ISO timestamp de la última vez que el KAM guardó cambios en "Información
  // completa de la solicitud" — para que el Líder note si algo cambió.
  fullInfoUpdatedAt?: string;

  // ISO timestamp de la última vez que cambió `status` — permite mostrar
  // "lleva X días en esta fase" en el Kanban del Líder para detectar cuellos
  // de botella. Se actualiza automáticamente en AuthContext.updateRequest.
  statusUpdatedAt?: string;

  // Historial de rondas de negociación comercial (docs/04): cada vez que el
  // Líder envía un valor final al KAM se abre una ronda nueva. Vive en
  // RequestItem (no en ProposalCosting) porque sobrevive a los sucesivos
  // sobrescritos de `costing` — es el registro de lo que pasó, no el estado
  // actual del costeo.
  negotiationRounds?: NegotiationRound[];
}

export interface StatusHistoryEntry {
  status: RequestStatus;
  changedAt: string;
}

export interface TeamChangeEntry {
  id: string;
  field: "nodo" | "lider";
  previous?: string;
  next: string;
  changedBy: string;
  changedAt: string;
  /** Motivo de la reasignación del Líder; vacío cuando el KAM corrigió el dato. */
  reason?: string;
}

export interface ProfessorAssignmentLogEntry {
  id: string; // `${requestId}-doc${n}`
  previousProfessor?: string;
  previousProfessorType?: "planta" | "externo";
  newProfessor: string;
  newProfessorType: "planta" | "externo";
  changedBy: string;
  changedAt: string;
  statusAtChange: RequestStatus;
}

// No existe "aceptada" explícita: el sistema no tiene hoy un evento real de
// "el cliente aceptó" — solo "fue entregada" (vigente mientras nadie la
// devuelva). Inventar un estado "aceptada" sería fabricar un dato que nadie
// confirma.
export type ClientResponse = "pendiente" | "rechazada" | "PENDING" | "CHANGES_REQUESTED";

export interface NegotiationRound {
  id: string; // `${requestId}-r${roundNumber}`
  roundNumber: number; // 1, 2, 3...
  totalOfferedCop: number; // snapshot del valor final en esta ronda
  marginAmountCop: number;
  expectedMarginPercent: number;
  leaderNote?: string; // obligatoria desde la ronda 2
  sentToKamAt: string; // ISO — cuando el Líder confirmó "Enviar a KAM"
  sentToClientAt?: string; // ISO — cuando el KAM efectivamente la entregó
  clientResponse: ClientResponse;
  clientObservation?: string; // solo si clientResponse === "rechazada"
  clientRespondedAt?: string; // ISO — cuando el KAM registró la devolución
  // Snapshot de alcance vigente al momento del envío (docs/04) — además del
  // precio, cada ronda congela estos campos tal como estaban en `req` (no en
  // `req.costing`) cuando el Líder confirmó "Enviar a KAM". Permite mostrar
  // qué cambió de alcance entre rondas, no solo el valor ofertado.
  participantes?: string;
  modalidad?: string;
  horas?: string;
  type?: RequestType;
  necesidad?: string;
  // Además de los 5 del prototipo, todo lo que el Líder puede ajustar entre
  // rondas (decisión del dueño, 2026-10-07), para listar cada cambio.
  deadline?: string; // ISO
  competencias?: string;
  exito?: string;
  resultados?: string;
  areaParticipantes?: string;
  alimentacion?: string;
  formacionPrevia?: string;
  /** false cuando la ronda no congeló el alcance (datos antiguos): solo se compara el precio. */
  hasScopeSnapshot?: boolean;
}

/**
 * Arma un `ProposalCosting` a partir del valor final de la propuesta
 * (docs/04). Ya no hay cálculo hacia adelante desde una base:
 * `totalOfferedCop` es el valor que el Líder digita directamente, y
 * `marginAmountCop` es un input manual independiente (informativo). La
 * estampilla Pro-Cultura es solo una referencia calculada sobre el valor
 * final — nunca se suma ni se resta de él.
 */
export function calculateCosting(
  type: RequestType,
  totalOfferedCop: number,
  expectedMarginPercent: number,
  marginAmountCop: number = 0,
  negotiationNotes?: string,
  readyForKam: boolean = false,
): ProposalCosting {
  const proCultura = calculateProCulturaReference(totalOfferedCop, type);
  const proCulturaTaxPercent = proCultura.applies ? PRO_CULTURA_PERCENT : 0;
  const proCulturaTaxAmount = proCultura.amount;

  return {
    marginAmountCop,
    expectedMarginPercent,
    proCulturaTaxPercent,
    proCulturaTaxAmount,
    totalOfferedCop,
    negotiationNotes,
    readyForKam,
  };
}

/**
 * @deprecated Legacy mock dataset. Persona 2 (KAM) now consumes real proposals from
 * the backend API (`useRequests` / `requestsApi`). Kept for compatibility with Persona 3 and 4.
 */
export const MOCK_REQUESTS: RequestItem[] = [
  {
    id: "REQ-2026-0142",
    title: "Capacitación interna - Marketing",
    applicant: "Juan Pérez",
    type: "Capacitación",
    createdAt: "2026-03-26",
    deadline: "2026-03-27",
    status: "nueva",
    // Independiente de createdAt/deadline (que ya venían desfasados del
    // "hoy" real del prototipo, ver getRelativeTime) — se fija cerca de la
    // fecha actual para que "tiempo en esta fase" se vea con datos reales.
    statusUpdatedAt: "2026-09-15T09:30:00.000Z",
    urgency: "alta",
    company: "Bancolombia",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    // Aún "nueva": el Líder de Producto todavía no ha costeado esta solicitud.
    horas: "16",
    modalidad: "Presencial en sede cliente",
    participantes: "20 - 25",
    companyNit: "890900608-9",
    companyDireccion: "Carrera 48 # 26-85, Medellín",
    companyTelefono: "(604) 510 9000",
    companyCorreo: "corporativo@bancolombia.com.co",
    companyCiiuPrincipal: "6412",
    companyCiiuPrincipalDesc: "Bancos comerciales",
    companyCiiusSecundarios: ["6499"],
    companyTipo: "Privada",
    companyWeb: "https://www.bancolombia.com",
    companyDescripcion: "Grupo financiero con presencia en Colombia, Centroamérica y el Caribe.",
    contactCargo: "Coordinador de Formación y Desarrollo",
    contactArea: "Gestión Humana",
    contactTelefono: "+57 310 245 8890",
    contactCorreo: "juan.perez@bancolombia.com.co",
    additionalContacts: [
      {
        id: "contact-0142-1",
        nombre: "Laura Gómez",
        cargo: "Analista de Aprendizaje Corporativo",
        telefono: "+57 311 900 4432",
        correo: "laura.gomez@bancolombia.com.co",
        area: "Gestión Humana",
      },
    ],
    necesidad:
      "Actualizar las competencias del equipo comercial en estrategias de marketing digital y analítica de clientes.",
    competencias: "Marketing digital, analítica de datos de clientes, gestión de campañas omnicanal",
    exito:
      "Encuesta de satisfacción post-capacitación con nota mínima de 4.5/5 y aplicación de al menos 2 herramientas vistas en el primer trimestre",
    resultados: "Equipo comercial certificado y capaz de diseñar campañas basadas en datos",
    areaParticipantes: "Gerencia de Mercadeo y Banca Comercial",
    alimentacion: "Refrigerio A.M. y almuerzo para los 2 días de formación presencial",
    formacionPrevia: "Sí",
    descFormacion: "Diplomado en Transformación Digital dictado por Icesi",
    empresaPrevia: "Universidad Icesi",
    fechaPrevia: "Agosto 2024",
    observaciones: "El cliente pide que el material quede disponible en su LMS interno después de la capacitación.",
    clientKamDocuments: [
      {
        id: "doc-ck-1",
        name: "Propuesta_Tecnico_Comercial_Bancolombia_v2.pdf",
        size: "2.4 MB",
        date: "26/03/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "Juan Pablo Corrales Arenas",
      },
    ],
    internalCostingDocuments: [
      {
        id: "doc-int-1",
        name: "Matriz_Costeo_Capacitacion_Marketing.xlsx",
        size: "1.2 MB",
        date: "26/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "Juan Pablo Corrales Arenas",
        tag: "Matriz de Costeo",
      },
      {
        id: "doc-int-2",
        name: "Cronograma_Dedicacion_Horas.xlsx",
        size: "540 KB",
        date: "26/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "Juan Pablo Corrales Arenas",
        tag: "Cronograma Detallado",
      },
    ],
  },
  {
    id: "REQ-2026-0135",
    title: "Consultoría en Optimización de Redes y Distribución Inteligente",
    applicant: "Ing. Jorge Mario Echeverri",
    type: "Consultoría",
    createdAt: "2026-03-12",
    deadline: "2026-03-29",
    status: "en-costeo",
    // Recién devuelta a costeo (ver clientObservations abajo) — reinicia el
    // reloj de la fase.
    statusUpdatedAt: "2026-09-15T08:00:00.000Z",
    urgency: "alta",
    company: "Gases de Occidente",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    professor: "Ing. Carlos Eduardo Valencia",
    professorType: "externo",
    totalCostCop: 42_000_000,
    costing: calculateCosting("Consultoría", 42_000_000, 35, 10_850_000),
    // Ejemplo de propuesta "devuelta con observaciones" (docs/08, pregunta 13):
    // el cliente ya la había recibido y pidió un ajuste de alcance — el KAM la
    // regresó a "en-costeo" y esta nota queda visible hasta que se reentregue.
    clientObservations:
      "El cliente pidió reducir el alcance de 5 plantas a 3 (Cali, Yumbo y Palmira) y ajustar el valor de la propuesta en consecuencia. Favor reenviar cotización corregida esta semana.",
    // Backfill (docs/04): esta solicitud ya traía `clientObservations` con un
    // rechazo completo del cliente antes de que existiera `negotiationRounds`
    // (docs/04) — sin esta ronda 1, su historial de negociación saldría
    // vacío pese a que la narrativa ya cuenta un rechazo.
    negotiationRounds: [
      {
        id: "REQ-2026-0135-r1",
        roundNumber: 1,
        totalOfferedCop: 42_000_000,
        marginAmountCop: 10_850_000,
        expectedMarginPercent: 35,
        participantes: "6 - 10",
        modalidad: "Híbrida",
        horas: "100",
        type: "Consultoría",
        necesidad:
          "Optimizar la distribución de gas natural en la red secundaria para reducir pérdidas técnicas y mejorar tiempos de respuesta ante fallas.",
        sentToKamAt: "2026-09-10T09:00:00.000Z",
        sentToClientAt: "2026-09-12T14:00:00.000Z",
        clientResponse: "rechazada",
        clientObservation:
          "El cliente pidió reducir el alcance de 5 plantas a 3 (Cali, Yumbo y Palmira) y ajustar el valor de la propuesta en consecuencia. Favor reenviar cotización corregida esta semana.",
        clientRespondedAt: "2026-09-15T08:00:00.000Z",
      },
    ],
    horas: "100",
    modalidad: "Híbrida",
    participantes: "6 - 10",
    companyNit: "890303893-0",
    companyDireccion: "Avenida 2 Norte # 7N-55, Cali",
    companyTelefono: "(602) 418 7300",
    companyCorreo: "contacto@gdo.com.co",
    companyCiiuPrincipal: "3520",
    companyCiiuPrincipalDesc: "Distribución de combustibles gaseosos por tuberías",
    companyTipo: "Privada",
    companyWeb: "https://www.gdo.com.co",
    contactCargo: "Gerente de Operaciones de Redes",
    contactArea: "Vicepresidencia de Operaciones",
    contactTelefono: "+57 315 900 1122",
    contactCorreo: "jorge.echeverri@gdo.com.co",
    necesidad:
      "Optimizar la distribución de gas natural en la red secundaria para reducir pérdidas técnicas y mejorar tiempos de respuesta ante fallas.",
    competencias: "Analítica de redes de distribución, mantenimiento predictivo, optimización de rutas",
    exito: "Reducción del 8% en pérdidas técnicas de la red en el primer año",
    resultados: "Modelo de priorización de mantenimiento de red basado en datos",
    areaParticipantes: "Vicepresidencia de Operaciones",
    formacionPrevia: "No sé",
    observaciones: "El cliente ya recibió una primera versión de la propuesta y pidió ajustar el alcance.",
    clientKamDocuments: [
      {
        id: "doc-gdo-2",
        name: "Propuesta_Comercial_Optimizacion_GdO_v3.pdf",
        size: "2.8 MB",
        date: "12/03/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "Juan Pablo Corrales Arenas",
      },
    ],
    internalCostingDocuments: [],
  },
];

export const STATUS_META: Record<
  RequestStatus,
  { label: string; tone: string; dot: string; headerBg: string; borderTone: string }
> = {
  nueva: {
    label: "Nueva",
    tone: "bg-[#5454e9]/10 text-[#5454e9] dark:text-[#865cf0] border-[#5454e9]/30",
    dot: "bg-[#5454e9]",
    headerBg: "bg-[#5454e9]/10",
    borderTone: "border-t-[#5454e9]",
  },
  "en-experto": {
    label: "En proceso por experto",
    tone: "bg-[#e9683b]/15 text-[#e9683b] dark:text-[#e9683b] border-[#e9683b]/30",
    dot: "bg-[#e9683b]",
    headerBg: "bg-[#e9683b]/10",
    borderTone: "border-t-[#e9683b]",
  },
  "en-costeo": {
    label: "En proceso de costeo",
    tone: "bg-[#865cf0]/15 text-[#7344e8] dark:text-[#865cf0] border-[#865cf0]/30",
    dot: "bg-[#865cf0]",
    headerBg: "bg-[#865cf0]/10",
    borderTone: "border-t-[#865cf0]",
  },
  entregada: {
    label: "Entregada",
    tone: "bg-[#4cb979]/15 text-[#2d8f55] dark:text-[#4cb979] border-[#4cb979]/30",
    dot: "bg-[#4cb979]",
    headerBg: "bg-[#4cb979]/10",
    borderTone: "border-t-[#4cb979]",
  },
  // Sin tablero propio todavía (HU 3.x, Persona 2) — placeholder mínimo para que
  // RequestStatus (ampliado por #7) siga siendo exhaustivo en este lookup.
  rechazada: {
    label: "Rechazada",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
    dot: "bg-destructive",
    headerBg: "bg-destructive/10",
    borderTone: "border-t-destructive",
  },
  cancelada: {
    label: "Cancelada",
    tone: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
    headerBg: "bg-muted",
    borderTone: "border-t-muted-foreground",
  },
};

export const URGENCY_META: Record<Urgency, { label: string; tone: string }> = {
  alta: { label: "Alta", tone: "text-[#e9683b] bg-[#e9683b]/10 border-[#e9683b]/30" },
  media: { label: "Media", tone: "text-[#757a07] dark:text-[#e4eb60] bg-[#e4eb60]/25 border-[#e4eb60]/40" },
  baja: { label: "Baja", tone: "text-muted-foreground bg-muted border-border" },
};

// Fuente única de verdad para "¿de quién es el turno dentro de En Costeo?".
// `status === "en-costeo"` no alcanza: desde que el Líder de Producto debe
// confirmar explícitamente el envío (docs/04), una solicitud
// puede estar en esa etapa sin que el KAM tenga nada que hacer todavía.
// Cualquier tablero que muestre "lista para el KAM" / "lista para entregar"
// debe pasar por aquí en vez de repetir la condición — así no se repite el
// olvido que causó que el tablero del KAM mostrara "Lista para Entregar"
// sobre solicitudes que el Líder ni siquiera había confirmado.
export function isReadyForKamHandoff(req: Pick<RequestItem, "status" | "costing">): boolean {
  return req.status === "en-costeo" && !!req.costing?.readyForKam;
}

export { formatCop, formatCompactCop, getNiceScale } from "@/lib/currency";
