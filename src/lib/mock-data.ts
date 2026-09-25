export type RequestStatus = "nueva" | "en-experto" | "en-costeo" | "entregada";
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

export interface CompanyRecord {
  nit: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  ciiuPrincipal: string;
  ciiuDescripcion?: string;
  web?: string;
  tipoEmpresa?: string;
}

export const MOCK_COMPANIES: CompanyRecord[] = [
  {
    nit: "890399001-5",
    nombre: "Universidad Icesi",
    direccion: "Calle 18 # 122-135, Pance, Cali",
    telefono: "(602) 555 2334",
    correo: "contacto@icesi.edu.co",
    ciiuPrincipal: "8544",
    ciiuDescripcion: "Educación de instituciones de educación superior",
    web: "https://www.icesi.edu.co",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890900608-9",
    nombre: "Bancolombia S.A.",
    direccion: "Carrera 48 # 26-85, Medellín",
    telefono: "(604) 510 9000",
    correo: "corporativo@bancolombia.com.co",
    ciiuPrincipal: "6412",
    ciiuDescripcion: "Bancos comerciales",
    web: "https://www.bancolombia.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890300279-4",
    nombre: "Carvajal S.A.",
    direccion: "Calle 29 Norte # 6A-40, Cali",
    telefono: "(602) 667 5000",
    correo: "servicioalcliente@carvajal.com",
    ciiuPrincipal: "1811",
    ciiuDescripcion: "Actividades de impresión",
    web: "https://www.carvajal.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890301884-5",
    nombre: "Manuelita S.A.",
    direccion: "Km 7 Vía Palmira - El Cerrito, Valle del Cauca",
    telefono: "(602) 270 3000",
    correo: "contacto@manuelita.com",
    ciiuPrincipal: "1072",
    ciiuDescripcion: "Elaboración de panela y azúcar",
    web: "https://www.manuelita.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "860007738-9",
    nombre: "Colombina S.A.",
    direccion: "Carrera 1 # 24-56, La Paila, Zarzal",
    telefono: "(602) 886 1900",
    correo: "atencion@colombina.com",
    ciiuPrincipal: "1082",
    ciiuDescripcion: "Elaboración de cacao, chocolate y confitería",
    web: "https://www.colombina.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "900123456-1",
    nombre: "Tecnoquímicas S.A.",
    direccion: "Calle 23 No. 7-39, Cali",
    telefono: "(602) 882 1000",
    correo: "contacto@tecnoquimicas.com",
    ciiuPrincipal: "2100",
    ciiuDescripcion: "Fabricación de productos farmacéuticos y sustancias químicas",
    web: "https://www.tecnoquimicas.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890901382-7",
    nombre: "Grupo Nutresa S.A.",
    direccion: "Calle 8 Sur # 52-01, Medellín",
    telefono: "(604) 365 5600",
    correo: "contacto@gruponutresa.com",
    ciiuPrincipal: "1089",
    ciiuDescripcion: "Elaboración de otros productos alimenticios",
    web: "https://www.gruponutresa.com",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890901672-1",
    nombre: "Grupo Éxito S.A.",
    direccion: "Carrera 48 # 32B Sur-139, Envigado",
    telefono: "(604) 339 6565",
    correo: "servicioalcliente@grupo-exito.com",
    ciiuPrincipal: "4711",
    ciiuDescripcion: "Comercio al por menor en establecimientos no especializados",
    web: "https://www.grupoexito.com.co",
    tipoEmpresa: "Privada",
  },
  {
    nit: "890303893-6",
    nombre: "Gases de Occidente S.A. E.S.P.",
    direccion: "Avenida 2 Norte # 7N-55, Cali",
    telefono: "(602) 418 7300",
    correo: "contacto@gdo.com.co",
    ciiuPrincipal: "3520",
    ciiuDescripcion: "Distribución de combustibles gaseosos por tuberías",
    web: "https://www.gdo.com.co",
    tipoEmpresa: "Privada",
  },
];

export interface ExternalProfessorData {
  nombre: string;
  identificacion?: string;
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
  marginAmountCop: number;
  expectedMarginPercent: number; // e.g. 30 (%) — manual, informativo
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
  id: string;
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
  node: string;
  productLeader: string;
  kam: string;
  professor?: string;
  professorType?: "planta" | "externo";
  externalProfessorData?: ExternalProfessorData;
  totalCostCop?: number;
  costing?: ProposalCosting;
  clientKamDocuments?: ProposalDocument[];
  internalCostingDocuments?: ProposalDocument[];

  // Observaciones del cliente cuando pide ajustes tras una entrega — el KAM
  // "devuelve" la propuesta a costeo con esta nota (docs/08, pregunta 13).
  clientObservations?: string;

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

// No existe "aceptada" explícita: el sistema no tiene hoy un evento real de
// "el cliente aceptó" — solo "fue entregada" (vigente mientras nadie la
// devuelva). Inventar un estado "aceptada" sería fabricar un dato que nadie
// confirma.
export type ClientResponse = "pendiente" | "rechazada";

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
}

export const NODES = [
  "Biotecnología, Bioeconomía y Sostenibilidad",
  "Inteligencia Artificial y Tecnologías Digitales",
  "Innovación Educativa, Bienestar Social, Innovación Pública",
  "Competitividad Organizacional, Economías Creativas",
  "Salud Global, Calidad de Vida",
];

export const KAMS = ["Andrea Martínez", "Carlos Riveros", "Diana Salcedo", "Felipe Ortiz"];
export const PRODUCT_LEADERS = [
  "Diana Carolina Romero Valencia",
  "Juan Pablo Corrales Arenas",
  "Claudia Maitee Bahamón Osorio",
  "María Camila Restrepo",
  "Sebastián Vélez",
  "Laura Caicedo",
];
export const PROFESSORS = ["Dr. Ricardo Mejía", "Dra. Paula Henao", "Dr. Andrés Lozano"];

export const NODE_DEFAULT_LEADERS: Record<string, string> = {
  "Biotecnología, Bioeconomía y Sostenibilidad": "Claudia Maitee Bahamón Osorio",
  "Inteligencia Artificial y Tecnologías Digitales": "Juan Pablo Corrales Arenas",
  "Innovación Educativa, Bienestar Social, Innovación Pública": "Diana Carolina Romero Valencia",
  "Competitividad Organizacional, Economías Creativas": "María Camila Restrepo",
  "Salud Global, Calidad de Vida": "Sebastián Vélez",
};

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
  const isCapacitacion = type === "Capacitación";
  const proCulturaTaxPercent = isCapacitacion ? 1.5 : 0;
  const proCulturaTaxAmount = isCapacitacion ? Math.round(totalOfferedCop * 0.015) : 0;

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
    id: "REQ-2026-0143",
    title: "Consultoría en transformación digital",
    applicant: "Mariana López",
    type: "Consultoría",
    createdAt: "2026-03-26",
    deadline: "2026-03-30",
    status: "en-experto",
    statusUpdatedAt: "2026-09-13T14:00:00.000Z",
    urgency: "media",
    company: "Grupo Éxito",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Andrea Martínez",
    professor: "Ing. Carlos Eduardo Valencia",
    professorType: "externo",
    externalProfessorData: {
      nombre: "Ing. Carlos Eduardo Valencia",
      identificacion: "CC 94.456.789",
      empresaConsultora: "Valencia & Partners Strategic Advisory",
      correo: "carlos.valencia@partnersadvisory.co",
      telefono: "+57 315 789 1234",
      perfil: "Consultor Senior en Transformación Digital y Arquitectura Cloud",
    },
    // Aún "en-experto": el asesor está formulando la propuesta técnica, el
    // Líder de Producto todavía no arma el costeo (docs/08, pregunta 7).
    horas: "80",
    modalidad: "Híbrida",
    participantes: "6 - 10",
    companyNit: "890901672-1",
    companyDireccion: "Carrera 48 # 32B Sur-139, Envigado",
    companyTelefono: "(604) 339 6565",
    companyCorreo: "servicioalcliente@grupo-exito.com",
    companyCiiuPrincipal: "4711",
    companyCiiuPrincipalDesc: "Comercio al por menor en establecimientos no especializados",
    companyTipo: "Privada",
    companyWeb: "https://www.grupoexito.com.co",
    companyDescripcion: "Compañía de retail multiformato con operación en Colombia, Uruguay y Argentina.",
    contactCargo: "Directora de Transformación Digital",
    contactArea: "Vicepresidencia de Tecnología",
    contactTelefono: "+57 300 512 7789",
    contactCorreo: "mariana.lopez@grupo-exito.com",
    necesidad:
      "Diagnosticar el nivel de madurez digital de los procesos logísticos y de e-commerce, y definir una hoja de ruta de transformación a 18 meses.",
    competencias: "Arquitectura cloud, integración de datos, gobierno de TI",
    exito: "Hoja de ruta aprobada por la Junta Directiva antes de finalizar el segundo trimestre",
    resultados: "Plan de transformación digital priorizado con quick-wins identificados en los primeros 90 días",
    areaParticipantes: "Vicepresidencia de Tecnología y Logística",
    formacionPrevia: "No sé",
    observaciones:
      "El cliente solicitó firmar acuerdo de confidencialidad (NDA) antes de compartir información financiera.",
    clientKamDocuments: [
      {
        id: "doc-ck-2",
        name: "Propuesta_Consultoria_Transformacion_Digital_Exito.docx",
        size: "1.8 MB",
        date: "26/03/2026",
        type: "doc",
        category: "client_kam",
        uploadedBy: "María Camila Restrepo",
      },
    ],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0144",
    title: "Mentoría liderazgo ejecutivo",
    applicant: "Roberto Castaño",
    type: "Mentoría",
    createdAt: "2026-03-26",
    deadline: "2026-04-06",
    status: "nueva",
    statusUpdatedAt: "2026-09-14T11:00:00.000Z",
    urgency: "baja",
    company: "Postobón",
    node: NODES[2],
    productLeader: "Diana Carolina Romero Valencia",
    kam: "Diana Salcedo",
    // Aún "nueva": el Líder de Producto todavía no ha costeado esta solicitud.
    horas: "24",
    modalidad: "Virtual sincrónica",
    participantes: "6 - 10",
    companyNit: "890903939-1",
    companyDireccion: "Calle 18 Norte # 6N-15, Cali",
    companyTelefono: "(602) 486 6000",
    companyCorreo: "contacto@postobon.com",
    companyCiiuPrincipal: "1104",
    companyCiiuPrincipalDesc: "Elaboración de bebidas no alcohólicas",
    companyTipo: "Privada",
    companyWeb: "https://www.postobon.com",
    contactCargo: "Gerente de Talento Humano",
    contactArea: "Dirección de Desarrollo Organizacional",
    contactTelefono: "+57 318 400 2211",
    contactCorreo: "roberto.castano@postobon.com",
    necesidad:
      "Acompañar a un grupo de gerentes regionales recién ascendidos en su transición a roles de liderazgo senior.",
    competencias: "Toma de decisiones estratégicas, gestión de equipos multigeneracionales, comunicación ejecutiva",
    exito: "Los mentorados aplican al menos un plan de acción individual, evaluado por su jefe directo a los 3 meses",
    resultados: "Gerentes regionales con mayor autonomía y confianza en la toma de decisiones",
    areaParticipantes: "Gerencia Regional Comercial",
    formacionPrevia: "No",
    observaciones: "Los mentorados prefieren sesiones en horario de la mañana, antes de las 9 a.m.",
    clientKamDocuments: [
      {
        id: "doc-ck-3",
        name: "Propuesta_Mentoria_Directiva_Postobon.pdf",
        size: "1.5 MB",
        date: "26/03/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "Diana Carolina Romero",
      },
    ],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0138",
    title: "Capacitación en metodologías ágiles para equipo de producto",
    applicant: "Camila Ríos",
    type: "Capacitación",
    createdAt: "2026-03-15",
    deadline: "2026-05-04",
    status: "en-costeo",
    // Ejemplo intencional de "cuello de botella": lleva varios días aquí.
    statusUpdatedAt: "2026-09-10T08:00:00.000Z",
    urgency: "media",
    company: "Sura",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    professorType: "planta",
    totalCostCop: 24_000_000,
    costing: calculateCosting(
      "Capacitación",
      24_000_000,
      30,
      5_550_000,
      "Acuerdo de descuento del 1.3% por volumen de horas con SURA",
    ),
    horas: "32",
    modalidad: "Híbrida",
    participantes: "11 - 15",
    companyNit: "890903407-9",
    companyDireccion: "Carrera 45 # 15-190, Medellín",
    companyTelefono: "(604) 405 3000",
    companyCorreo: "contacto@sura.com",
    companyCiiuPrincipal: "6511",
    companyCiiuPrincipalDesc: "Seguros generales",
    companyTipo: "Privada",
    companyWeb: "https://www.sura.com",
    contactCargo: "Analista de Formación Corporativa",
    contactArea: "Gestión Humana",
    contactTelefono: "+57 312 678 4432",
    contactCorreo: "camila.rios@sura.com.co",
    necesidad:
      "Desarrollar habilidades técnicas en el equipo de producto para acelerar la entrega de nuevas funcionalidades del aplicativo móvil.",
    competencias: "Metodologías ágiles, integración continua, pruebas automatizadas",
    exito: "Reducción del 20% en el tiempo de ciclo de desarrollo tras la capacitación",
    resultados: "Equipo de producto certificado en prácticas ágiles avanzadas",
    areaParticipantes: "Equipo de Producto y Tecnología",
    alimentacion: "Refrigerio para las 3 sesiones presenciales",
    formacionPrevia: "Sí",
    descFormacion: "Curso básico de Scrum dictado internamente",
    empresaPrevia: "Equipo interno de Sura",
    fechaPrevia: "Enero 2025",
    observaciones: "Acuerdo de descuento del 1.3% por volumen de horas ya negociado con el cliente.",
    clientKamDocuments: [
      {
        id: "doc-ck-4",
        name: "Propuesta_Final_Aprobada_Sura.pdf",
        size: "3.1 MB",
        date: "15/03/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "Juan Pablo Corrales Arenas",
      },
    ],
    internalCostingDocuments: [
      {
        id: "doc-int-6",
        name: "Matriz_Costos_SURA_v3_Final.xlsx",
        size: "1.9 MB",
        date: "15/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "Juan Pablo Corrales Arenas",
        tag: "Matriz de Costeo",
      },
      {
        id: "doc-int-7",
        name: "Cronograma_Modulos_Horas.xlsx",
        size: "420 KB",
        date: "15/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "Juan Pablo Corrales Arenas",
        tag: "Cronograma Detallado",
      },
    ],
  },
  {
    id: "REQ-2026-0131",
    title: "Programa analítica de datos",
    applicant: "Felipe Naranjo",
    type: "Capacitación",
    createdAt: "2026-03-10",
    deadline: "2026-05-10",
    status: "en-experto",
    statusUpdatedAt: "2026-09-14T16:00:00.000Z",
    urgency: "baja",
    company: "Grupo Nutresa",
    node: NODES[1],
    productLeader: "Laura Caicedo",
    kam: "Felipe Ortiz",
    // El docente ya fue asignado (requisito para avanzar a "en-experto"), pero
    // el costeo todavía no existe — se define solo en "en-costeo" (docs/08,
    // pregunta 7). Antes este mock violaba esa regla; se corrigió aquí.
    professor: "Dra. Paula Henao",
    professorType: "planta",
    horas: "40",
    modalidad: "Virtual sincrónica",
    participantes: "15 - 20",
    companyNit: "890901382-7",
    companyDireccion: "Calle 8 Sur # 52-01, Medellín",
    companyTelefono: "(604) 365 5600",
    companyCorreo: "contacto@gruponutresa.com",
    companyCiiuPrincipal: "1089",
    companyCiiuPrincipalDesc: "Elaboración de otros productos alimenticios",
    companyTipo: "Privada",
    companyWeb: "https://www.gruponutresa.com",
    contactCargo: "Líder de Analítica de Datos",
    contactArea: "Vicepresidencia de Innovación",
    contactTelefono: "+57 300 888 2210",
    contactCorreo: "felipe.naranjo@gruponutresa.com",
    necesidad:
      "Formar a un equipo interno en fundamentos de analítica de datos para soportar decisiones de la cadena de suministro.",
    competencias: "Estadística aplicada, visualización de datos, modelos predictivos básicos",
    exito: "Al menos 3 proyectos internos usando las herramientas vistas dentro de los 6 meses siguientes",
    resultados: "Equipo con capacidad de construir tableros de control propios",
    areaParticipantes: "Cadena de Suministro y Logística",
    formacionPrevia: "No sé",
    observaciones:
      "La docente está terminando de definir el cronograma detallado con el cliente antes de pasar a costeo.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0120",
    title: "Consultoría sostenibilidad operativa",
    applicant: "Ana Gutiérrez",
    type: "Consultoría",
    createdAt: "2026-02-28",
    deadline: "2026-03-20",
    status: "entregada",
    statusUpdatedAt: "2026-08-26T10:00:00.000Z",
    urgency: "media",
    company: "Cementos Argos",
    node: NODES[0],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    professor: "Dra. Paula Henao",
    professorType: "planta",
    totalCostCop: 12_500_000,
    costing: calculateCosting("Consultoría", 12_500_000, 31.5, 2_992_500, undefined, true),
    horas: "60",
    modalidad: "Presencial en sede cliente",
    participantes: "1 - 5",
    companyNit: "890100251-1",
    companyDireccion: "Carrera 43A # 1A Sur-125, Medellín",
    companyTelefono: "(604) 315 0000",
    companyCorreo: "contacto@argos.co",
    companyCiiuPrincipal: "2394",
    companyCiiuPrincipalDesc: "Fabricación de cemento, cal y yeso",
    companyTipo: "Privada",
    companyWeb: "https://www.argos.co",
    contactCargo: "Directora de Sostenibilidad",
    contactArea: "Vicepresidencia de Sostenibilidad",
    contactTelefono: "+57 320 456 7890",
    contactCorreo: "ana.gutierrez@argos.co",
    necesidad:
      "Evaluar el desempeño ambiental de tres plantas productivas y proponer un plan de eco-eficiencia operativa.",
    competencias: "Gestión ambiental industrial, economía circular, indicadores ESG",
    exito: "Plan de eco-eficiencia aprobado por la Vicepresidencia de Sostenibilidad",
    resultados: "Diagnóstico de sostenibilidad con hallazgos priorizados por planta",
    areaParticipantes: "Plantas productivas de Cartagena, Rioclaro y El Cairo",
    formacionPrevia: "No",
    observaciones: "Entrega finalizada — el cliente confirmó recepción satisfactoria del informe final.",
    clientKamDocuments: [
      {
        id: "doc-ck-5",
        name: "Entregable_Propuesta_Argos_Entregada.pdf",
        size: "4.2 MB",
        date: "28/02/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "Carlos Riveros",
      },
    ],
    internalCostingDocuments: [
      {
        id: "doc-int-8",
        name: "Hoja_Costos_Argos_Auditoria.xlsx",
        size: "1.1 MB",
        date: "28/02/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "María Camila Restrepo",
        tag: "Matriz de Costeo",
      },
    ],
  },
  {
    id: "REQ-2026-0118",
    title: "Programa de Liderazgo Operativo y Cultura de Seguridad",
    applicant: "Patricia Holguín",
    type: "Capacitación",
    createdAt: "2026-02-14",
    deadline: "2026-03-05",
    status: "entregada",
    statusUpdatedAt: "2026-08-21T10:00:00.000Z",
    urgency: "media",
    company: "Gases de Occidente",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    professorType: "planta",
    totalCostCop: 34_500_000,
    costing: calculateCosting("Capacitación", 34_500_000, 30, 7_800_000, undefined, true),
    horas: "48",
    modalidad: "Presencial en sede cliente",
    participantes: "20 - 25",
    companyNit: "890303893-6",
    companyDireccion: "Avenida 2 Norte # 7N-55, Cali",
    companyTelefono: "(602) 418 7300",
    companyCorreo: "contacto@gdo.com.co",
    companyCiiuPrincipal: "3520",
    companyCiiuPrincipalDesc: "Distribución de combustibles gaseosos por tuberías",
    companyTipo: "Privada",
    companyWeb: "https://www.gdo.com.co",
    contactCargo: "Jefe de Seguridad y Salud en el Trabajo",
    contactArea: "Gestión Humana y SST",
    contactTelefono: "+57 317 220 6654",
    contactCorreo: "patricia.holguin@gdo.com.co",
    necesidad: "Fortalecer la cultura de seguridad operativa entre los líderes de planta y cuadrillas de campo.",
    competencias: "Liderazgo en seguridad, gestión de riesgos operativos, comunicación de incidentes",
    exito: "Reducción del 15% en incidentes reportables en los 6 meses posteriores a la capacitación",
    resultados: "Líderes de planta certificados como agentes de cambio en cultura de seguridad",
    areaParticipantes: "Líderes de planta y supervisores de campo",
    alimentacion: "Refrigerio A.M. y P.M. para las 4 sesiones presenciales",
    formacionPrevia: "Sí",
    descFormacion: "Inducción anual de seguridad industrial",
    empresaPrevia: "ARL Sura",
    fechaPrevia: "Enero 2026",
    observaciones: "Entregado — el cliente ya programó la primera sesión de seguimiento con su área de SST.",
    clientKamDocuments: [
      {
        id: "doc-gdo-1",
        name: "Propuesta_Final_Aprobada_GdO_Liderazgo.pdf",
        size: "3.5 MB",
        date: "14/02/2026",
        type: "pdf",
        category: "client_kam",
        uploadedBy: "María Camila Restrepo",
      },
    ],
    internalCostingDocuments: [
      {
        id: "doc-gdo-cost-1",
        name: "Costeo_Interno_GdO_Modulos.xlsx",
        size: "1.4 MB",
        date: "14/02/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "María Camila Restrepo",
        tag: "Matriz de Costeo",
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
    companyNit: "890303893-6",
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
  {
    id: "REQ-2026-0145",
    title: "Capacitación en Analítica Predictiva para Mantenimiento de Redes",
    applicant: "Mauricio Caicedo",
    type: "Capacitación",
    createdAt: "2026-03-24",
    deadline: "2026-04-10",
    status: "nueva",
    statusUpdatedAt: "2026-09-15T07:00:00.000Z",
    urgency: "media",
    company: "Gases de Occidente",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    // Aún "nueva": el Líder de Producto todavía no ha costeado esta solicitud.
    horas: "20",
    modalidad: "Presencial en sede cliente",
    participantes: "11 - 15",
    companyNit: "890303893-6",
    companyDireccion: "Avenida 2 Norte # 7N-55, Cali",
    companyTelefono: "(602) 418 7300",
    companyCorreo: "contacto@gdo.com.co",
    companyCiiuPrincipal: "3520",
    companyCiiuPrincipalDesc: "Distribución de combustibles gaseosos por tuberías",
    companyTipo: "Privada",
    companyWeb: "https://www.gdo.com.co",
    contactCargo: "Coordinador de Mantenimiento Predictivo",
    contactArea: "Vicepresidencia de Operaciones",
    contactTelefono: "+57 316 778 4420",
    contactCorreo: "mauricio.caicedo@gdo.com.co",
    necesidad:
      "Capacitar al equipo de mantenimiento en herramientas de analítica predictiva para anticipar fallas en la red de distribución.",
    competencias: "Analítica predictiva, sensórica IoT, mantenimiento basado en condición",
    exito: "El equipo aplica al menos un modelo predictivo propio dentro de los primeros 2 meses",
    resultados: "Equipo de mantenimiento capacitado en analítica predictiva aplicada a redes de gas",
    areaParticipantes: "Equipo de Mantenimiento y Confiabilidad",
    alimentacion: "Refrigerio A.M. para las sesiones presenciales",
    formacionPrevia: "No sé",
    observaciones: "Solicitud recién creada, pendiente de asignación de docente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },

  // ─────────────────────────────────────────────────────────────────────
  // Lote adicional (2026-09-15): volumen realista para que un Líder de
  // Producto (sobre todo Juan Pablo Corrales, el login por defecto) vea un
  // pipeline con las 4 fases pobladas, varios KAMs y tipos de servicio poco
  // representados antes (Investigación, Proyectos Especiales, Otro).
  // ─────────────────────────────────────────────────────────────────────

  // --- NUEVA ---
  {
    id: "REQ-2026-0146",
    title: "Consultoría en optimización de cadena de suministro",
    applicant: "Marta Isabel Vélez",
    type: "Consultoría",
    createdAt: "2026-09-13",
    deadline: "2026-09-25",
    status: "nueva",
    statusUpdatedAt: "2026-09-13T09:00:00.000Z",
    urgency: "media",
    company: "Carvajal S.A.",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    horas: "60",
    modalidad: "Híbrida",
    participantes: "6 - 10",
    companyNit: "890300279-4",
    companyDireccion: "Calle 29 Norte # 6A-40, Cali",
    companyTelefono: "(602) 667 5000",
    companyCorreo: "servicioalcliente@carvajal.com",
    companyCiiuPrincipal: "1811",
    companyCiiuPrincipalDesc: "Actividades de impresión",
    companyTipo: "Privada",
    companyWeb: "https://www.carvajal.com",
    contactCargo: "Directora de Operaciones",
    contactArea: "Cadena de Suministro",
    contactTelefono: "+57 314 220 5561",
    contactCorreo: "marta.velez@carvajal.com",
    necesidad: "Reducir tiempos de reabastecimiento entre plantas y centros de distribución.",
    competencias: "Gestión de inventarios, logística inversa, planeación de demanda",
    resultados: "Plan de optimización logística con quick-wins en 90 días",
    formacionPrevia: "No sé",
    observaciones: "Solicitud recién creada, pendiente de asignación de docente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0147",
    title: "Mentoría para líderes de planta recién promovidos",
    applicant: "Jorge Andrés Salazar",
    type: "Mentoría",
    createdAt: "2026-09-08",
    deadline: "2026-10-05",
    status: "nueva",
    statusUpdatedAt: "2026-09-08T14:00:00.000Z",
    urgency: "baja",
    company: "Manuelita S.A.",
    node: NODES[2],
    productLeader: "Diana Carolina Romero Valencia",
    kam: "Diana Salcedo",
    horas: "20",
    modalidad: "Presencial en sede cliente",
    participantes: "6 - 10",
    companyNit: "890301884-5",
    companyDireccion: "Km 7 Vía Palmira - El Cerrito, Valle del Cauca",
    companyTelefono: "(602) 270 3000",
    companyCorreo: "contacto@manuelita.com",
    companyCiiuPrincipal: "1072",
    companyCiiuPrincipalDesc: "Elaboración de panela y azúcar",
    companyTipo: "Privada",
    companyWeb: "https://www.manuelita.com",
    contactCargo: "Jefe de Desarrollo Organizacional",
    contactArea: "Gestión Humana",
    contactTelefono: "+57 318 774 2210",
    contactCorreo: "jorge.salazar@manuelita.com",
    necesidad: "Acompañar a supervisores de planta recién ascendidos en su primer año de liderazgo.",
    competencias: "Liderazgo de equipos operativos, manejo de conflicto, delegación efectiva",
    formacionPrevia: "No",
    observaciones: "Solicitud recién creada, pendiente de asignación de docente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0148",
    title: "Investigación de mercado para nueva línea farmacéutica",
    applicant: "Diana Carolina Osorio",
    type: "Investigación",
    createdAt: "2026-09-11",
    deadline: "2026-09-19",
    status: "nueva",
    statusUpdatedAt: "2026-09-11T10:00:00.000Z",
    urgency: "alta",
    company: "Tecnoquímicas S.A.",
    node: NODES[0],
    productLeader: "Claudia Maitee Bahamón Osorio",
    kam: "Felipe Ortiz",
    horas: "80",
    modalidad: "Híbrida",
    participantes: "1 - 5",
    companyNit: "900123456-1",
    companyDireccion: "Calle 23 No. 7-39, Cali",
    companyTelefono: "(602) 882 1000",
    companyCorreo: "contacto@tecnoquimicas.com",
    companyCiiuPrincipal: "2100",
    companyCiiuPrincipalDesc: "Fabricación de productos farmacéuticos y sustancias químicas",
    companyTipo: "Privada",
    companyWeb: "https://www.tecnoquimicas.com",
    contactCargo: "Gerente de Innovación",
    contactArea: "Investigación y Desarrollo",
    contactTelefono: "+57 317 660 3312",
    contactCorreo: "diana.osorio@tecnoquimicas.com",
    necesidad: "Validar la viabilidad de mercado de una nueva línea de suplementos antes del lanzamiento.",
    competencias: "Investigación de mercados, análisis competitivo, segmentación de consumidor",
    resultados: "Informe de viabilidad con recomendación go/no-go",
    formacionPrevia: "No sé",
    observaciones: "Urgente: el cliente quiere decidir el lanzamiento antes de fin de mes.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0149",
    title: "Foro corporativo de innovación abierta",
    applicant: "Camilo Andrés Ríos",
    type: "Proyectos Especiales (Eventos)",
    createdAt: "2026-09-05",
    deadline: "2026-09-30",
    status: "nueva",
    statusUpdatedAt: "2026-09-05T11:00:00.000Z",
    urgency: "media",
    company: "Colombina S.A.",
    node: NODES[4],
    productLeader: "Sebastián Vélez",
    kam: "Andrea Martínez",
    horas: "40",
    modalidad: "Presencial en sede cliente",
    participantes: "Más de 25",
    companyNit: "860007738-9",
    companyDireccion: "Carrera 1 # 24-56, La Paila, Zarzal",
    companyTelefono: "(602) 886 1900",
    companyCorreo: "atencion@colombina.com",
    companyCiiuPrincipal: "1082",
    companyCiiuPrincipalDesc: "Elaboración de cacao, chocolate y confitería",
    companyTipo: "Privada",
    companyWeb: "https://www.colombina.com",
    contactCargo: "Líder de Innovación",
    contactArea: "Dirección de Innovación",
    contactTelefono: "+57 315 440 7789",
    contactCorreo: "camilo.rios@colombina.com",
    necesidad: "Organizar un foro de un día con speakers externos e internos sobre innovación abierta.",
    competencias: "Diseño de eventos corporativos, curaduría de contenido, logística de invitados",
    formacionPrevia: "No",
    observaciones: "Solicitud recién creada, pendiente de asignación de docente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0150",
    title: "Diseño de assessment center para selección gerencial",
    applicant: "Laura Milena Trujillo",
    type: "Otro",
    tipoOtro: "Diseño de assessment center",
    createdAt: "2026-09-14",
    deadline: "2026-10-15",
    status: "nueva",
    statusUpdatedAt: "2026-09-14T08:30:00.000Z",
    urgency: "media",
    company: "Grupo Éxito",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Carlos Riveros",
    horas: "30",
    modalidad: "Presencial en sede cliente",
    participantes: "6 - 10",
    companyNit: "890901672-1",
    companyDireccion: "Carrera 48 # 32B Sur-139, Envigado",
    companyTelefono: "(604) 339 6565",
    companyCorreo: "servicioalcliente@grupo-exito.com",
    companyCiiuPrincipal: "4711",
    companyCiiuPrincipalDesc: "Comercio al por menor en establecimientos no especializados",
    companyTipo: "Privada",
    companyWeb: "https://www.grupoexito.com.co",
    contactCargo: "Analista Senior de Selección",
    contactArea: "Gestión Humana",
    contactTelefono: "+57 300 118 4432",
    contactCorreo: "laura.trujillo@grupo-exito.com",
    necesidad: "Diseñar un assessment center a la medida para el proceso de selección de gerentes de tienda.",
    competencias: "Psicometría, diseño de pruebas situacionales, observación conductual",
    formacionPrevia: "No sé",
    observaciones: "Solicitud recién creada, pendiente de asignación de docente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },

  // --- EN PROCESO POR EXPERTO (docente asignado, sin costeo todavía) ---
  {
    id: "REQ-2026-0151",
    title: "Capacitación en ciberseguridad para equipos de TI",
    applicant: "Mario Andrés Buitrago",
    type: "Capacitación",
    createdAt: "2026-09-09",
    deadline: "2026-10-01",
    status: "en-experto",
    statusUpdatedAt: "2026-09-13T10:00:00.000Z",
    urgency: "alta",
    company: "Bancolombia",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    professor: "Dr. Andrés Lozano",
    professorType: "planta",
    horas: "24",
    modalidad: "Virtual sincrónica",
    participantes: "11 - 15",
    companyNit: "890900608-9",
    companyDireccion: "Carrera 48 # 26-85, Medellín",
    companyTelefono: "(604) 510 9000",
    companyCorreo: "corporativo@bancolombia.com.co",
    companyCiiuPrincipal: "6412",
    companyCiiuPrincipalDesc: "Bancos comerciales",
    companyTipo: "Privada",
    companyWeb: "https://www.bancolombia.com",
    contactCargo: "Líder de Seguridad de la Información",
    contactArea: "Vicepresidencia de Tecnología",
    contactTelefono: "+57 313 660 7789",
    contactCorreo: "mario.buitrago@bancolombia.com.co",
    necesidad: "Actualizar al equipo de TI en amenazas emergentes y respuesta a incidentes.",
    competencias: "Threat hunting, respuesta a incidentes, hardening de infraestructura",
    formacionPrevia: "Sí",
    descFormacion: "Certificación básica en seguridad de la información",
    empresaPrevia: "SANS Institute (virtual)",
    fechaPrevia: "2025",
    observaciones: "El docente está definiendo el cronograma con el cliente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0152",
    title: "Consultoría en gobierno corporativo",
    applicant: "Isabel Cristina Mora",
    type: "Consultoría",
    createdAt: "2026-09-02",
    deadline: "2026-10-10",
    status: "en-experto",
    statusUpdatedAt: "2026-09-12T15:00:00.000Z",
    urgency: "media",
    company: "Carvajal S.A.",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Diana Salcedo",
    professor: "Dra. Lucía Fernández",
    professorType: "externo",
    externalProfessorData: {
      nombre: "Dra. Lucía Fernández",
      identificacion: "CC 52.334.221",
      empresaConsultora: "Fernández Consulting Group",
      correo: "lucia.fernandez@fcg.co",
      telefono: "+57 317 902 4456",
      perfil: "Especialista en gobierno corporativo y juntas directivas familiares",
    },
    horas: "50",
    modalidad: "Híbrida",
    participantes: "1 - 5",
    companyNit: "890300279-4",
    companyDireccion: "Calle 29 Norte # 6A-40, Cali",
    companyTelefono: "(602) 667 5000",
    companyCorreo: "servicioalcliente@carvajal.com",
    companyCiiuPrincipal: "1811",
    companyCiiuPrincipalDesc: "Actividades de impresión",
    companyTipo: "Privada",
    companyWeb: "https://www.carvajal.com",
    contactCargo: "Secretaria General",
    contactArea: "Junta Directiva",
    contactTelefono: "+57 312 556 8890",
    contactCorreo: "isabel.mora@carvajal.com",
    necesidad: "Revisar y modernizar el reglamento de junta directiva y comités de la compañía familiar.",
    competencias: "Gobierno corporativo, protocolo de familia, gestión de comités",
    formacionPrevia: "No sé",
    observaciones: "La asesora externa está formulando la propuesta técnica con el cliente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0153",
    title: "Investigación de satisfacción de cliente farmacéutico",
    applicant: "Andrés Felipe Cárdenas",
    type: "Investigación",
    createdAt: "2026-08-25",
    deadline: "2026-09-20",
    status: "en-experto",
    statusUpdatedAt: "2026-09-08T09:00:00.000Z",
    urgency: "baja",
    company: "Tecnoquímicas S.A.",
    node: NODES[0],
    productLeader: "Claudia Maitee Bahamón Osorio",
    kam: "Felipe Ortiz",
    professor: "Dra. Marcela Rodríguez",
    professorType: "planta",
    horas: "45",
    modalidad: "Virtual sincrónica",
    participantes: "1 - 5",
    companyNit: "900123456-1",
    companyDireccion: "Calle 23 No. 7-39, Cali",
    companyTelefono: "(602) 882 1000",
    companyCorreo: "contacto@tecnoquimicas.com",
    companyCiiuPrincipal: "2100",
    companyCiiuPrincipalDesc: "Fabricación de productos farmacéuticos y sustancias químicas",
    companyTipo: "Privada",
    companyWeb: "https://www.tecnoquimicas.com",
    contactCargo: "Coordinador de Mercadeo",
    contactArea: "Mercadeo",
    contactTelefono: "+57 316 220 9981",
    contactCorreo: "andres.cardenas@tecnoquimicas.com",
    necesidad: "Medir la satisfacción de droguerías distribuidoras con el portafolio actual.",
    competencias: "Diseño de encuestas, análisis estadístico, NPS",
    formacionPrevia: "No",
    // Ejemplo intencional de "cuello de botella": 7 días en la misma fase.
    observaciones: "Lleva varios días esperando que el cliente confirme la muestra de droguerías a encuestar.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0154",
    title: "Mentoría en transición generacional para directivos",
    applicant: "Ricardo Antonio Zea",
    type: "Mentoría",
    createdAt: "2026-09-06",
    deadline: "2026-10-20",
    status: "en-experto",
    statusUpdatedAt: "2026-09-14T13:00:00.000Z",
    urgency: "media",
    company: "Postobón",
    node: NODES[2],
    productLeader: "Diana Carolina Romero Valencia",
    kam: "Diana Salcedo",
    professor: "Mg. Diana Morales",
    professorType: "planta",
    horas: "30",
    modalidad: "Presencial en sede cliente",
    participantes: "1 - 5",
    companyNit: "890903939-1",
    companyDireccion: "Calle 18 Norte # 6N-15, Cali",
    companyTelefono: "(602) 486 6000",
    companyCorreo: "contacto@postobon.com",
    companyCiiuPrincipal: "1104",
    companyCiiuPrincipalDesc: "Elaboración de bebidas no alcohólicas",
    companyTipo: "Privada",
    companyWeb: "https://www.postobon.com",
    contactCargo: "Director de Sucesión y Familia Empresaria",
    contactArea: "Presidencia",
    contactTelefono: "+57 318 774 1123",
    contactCorreo: "ricardo.zea@postobon.com",
    necesidad: "Acompañar el relevo generacional entre la junta actual y la próxima generación directiva.",
    competencias: "Protocolo de familia empresaria, coaching ejecutivo, manejo de conflicto intergeneracional",
    formacionPrevia: "No sé",
    observaciones: "La mentora está coordinando la primera sesión con el cliente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },

  // --- EN PROCESO DE COSTEO (docente + costeo real) ---
  {
    id: "REQ-2026-0155",
    title: "Capacitación en excelencia operativa Lean",
    applicant: "Sandra Milena Zapata",
    type: "Capacitación",
    createdAt: "2026-08-30",
    deadline: "2026-09-22",
    status: "en-costeo",
    statusUpdatedAt: "2026-09-11T10:00:00.000Z",
    urgency: "media",
    company: "Manuelita S.A.",
    node: NODES[2],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    professor: "Dr. Juan Carlos González",
    professorType: "planta",
    totalCostCop: 15_600_000,
    costing: calculateCosting("Capacitación", 15_600_000, 30, 3_600_000),
    horas: "36",
    modalidad: "Presencial en sede cliente",
    participantes: "15 - 20",
    companyNit: "890301884-5",
    companyDireccion: "Km 7 Vía Palmira - El Cerrito, Valle del Cauca",
    companyTelefono: "(602) 270 3000",
    companyCorreo: "contacto@manuelita.com",
    companyCiiuPrincipal: "1072",
    companyCiiuPrincipalDesc: "Elaboración de panela y azúcar",
    companyTipo: "Privada",
    companyWeb: "https://www.manuelita.com",
    contactCargo: "Jefe de Mejora Continua",
    contactArea: "Operaciones",
    contactTelefono: "+57 315 660 2298",
    contactCorreo: "sandra.zapata@manuelita.com",
    necesidad: "Formar a supervisores de planta en herramientas Lean para reducir desperdicios.",
    competencias: "5S, Kaizen, mapeo de flujo de valor",
    formacionPrevia: "No",
    observaciones: "Costeo en elaboración con el docente de planta.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0156",
    title: "Evento de lanzamiento de marca regional",
    applicant: "Camilo Andrés Ríos",
    type: "Proyectos Especiales (Eventos)",
    createdAt: "2026-08-20",
    deadline: "2026-09-18",
    status: "en-costeo",
    statusUpdatedAt: "2026-09-15T06:00:00.000Z",
    urgency: "alta",
    company: "Colombina S.A.",
    node: NODES[4],
    productLeader: "Sebastián Vélez",
    kam: "Andrea Martínez",
    professor: "Dra. Paula Henao",
    professorType: "planta",
    totalCostCop: 10_800_000,
    costing: calculateCosting("Proyectos Especiales (Eventos)", 10_800_000, 28, 2_240_000),
    // Segundo ejemplo de propuesta "devuelta con observaciones" — para
    // probar el banner en más de una tarjeta a la vez.
    clientObservations:
      "El cliente pidió mover el evento a otra sede porque la original ya no está disponible en esa fecha; hay que recotizar el rubro de logística.",
    horas: "16",
    modalidad: "Presencial en sede cliente",
    participantes: "Más de 25",
    companyNit: "860007738-9",
    companyDireccion: "Carrera 1 # 24-56, La Paila, Zarzal",
    companyTelefono: "(602) 886 1900",
    companyCorreo: "atencion@colombina.com",
    companyCiiuPrincipal: "1082",
    companyCiiuPrincipalDesc: "Elaboración de cacao, chocolate y confitería",
    companyTipo: "Privada",
    companyWeb: "https://www.colombina.com",
    contactCargo: "Líder de Innovación",
    contactArea: "Dirección de Innovación",
    contactTelefono: "+57 315 440 7789",
    contactCorreo: "camilo.rios@colombina.com",
    necesidad: "Organizar el evento de lanzamiento de una nueva línea de producto para medios y aliados comerciales.",
    competencias: "Producción de eventos, relacionamiento con prensa, logística de sede",
    formacionPrevia: "No",
    observaciones: "Recotizando logística tras el cambio de sede solicitado por el cliente.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0157",
    title: "Consultoría en trazabilidad de cadena de frío",
    applicant: "Felipe Andrés Gómez",
    type: "Consultoría",
    createdAt: "2026-08-18",
    deadline: "2026-09-16",
    status: "en-costeo",
    statusUpdatedAt: "2026-09-09T10:00:00.000Z",
    urgency: "media",
    company: "Grupo Nutresa",
    node: NODES[1],
    productLeader: "Laura Caicedo",
    kam: "Felipe Ortiz",
    professor: "Ing. Carlos Eduardo Valencia",
    professorType: "externo",
    externalProfessorData: {
      nombre: "Ing. Carlos Eduardo Valencia",
      identificacion: "CC 94.456.789",
      empresaConsultora: "Valencia & Partners Strategic Advisory",
      correo: "carlos.valencia@partnersadvisory.co",
      telefono: "+57 315 789 1234",
      perfil: "Consultor Senior en Transformación Digital y Arquitectura Cloud",
    },
    totalCostCop: 33_750_000,
    costing: calculateCosting("Consultoría", 33_750_000, 35, 8_750_000),
    horas: "70",
    modalidad: "Híbrida",
    participantes: "6 - 10",
    companyNit: "890901382-7",
    companyDireccion: "Calle 8 Sur # 52-01, Medellín",
    companyTelefono: "(604) 365 5600",
    companyCorreo: "contacto@gruponutresa.com",
    companyCiiuPrincipal: "1089",
    companyCiiuPrincipalDesc: "Elaboración de otros productos alimenticios",
    companyTipo: "Privada",
    companyWeb: "https://www.gruponutresa.com",
    contactCargo: "Gerente de Logística",
    contactArea: "Cadena de Suministro",
    contactTelefono: "+57 313 887 5521",
    contactCorreo: "felipe.gomez@gruponutresa.com",
    necesidad: "Implementar trazabilidad IoT en la cadena de frío para reducir pérdidas por temperatura.",
    competencias: "Sensórica IoT, monitoreo en tiempo real, analítica de cadena de frío",
    formacionPrevia: "Sí",
    descFormacion: "Piloto interno de sensores en una sola planta",
    empresaPrevia: "Equipo interno de Grupo Nutresa",
    fechaPrevia: "2025",
    observaciones: "Costeo en elaboración, pendiente de definir alcance final de sensores.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },

  // --- ENTREGADA (cerradas) ---
  {
    id: "REQ-2026-0158",
    title: "Capacitación en gestión de calidad farmacéutica",
    applicant: "Diana Carolina Osorio",
    type: "Capacitación",
    createdAt: "2026-08-05",
    deadline: "2026-08-25",
    status: "entregada",
    statusUpdatedAt: "2026-08-25T10:00:00.000Z",
    urgency: "media",
    company: "Tecnoquímicas S.A.",
    node: NODES[0],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    professorType: "planta",
    totalCostCop: 19_500_000,
    costing: calculateCosting("Capacitación", 19_500_000, 30, 4_500_000, undefined, true),
    horas: "28",
    modalidad: "Presencial en sede cliente",
    participantes: "11 - 15",
    companyNit: "900123456-1",
    companyDireccion: "Calle 23 No. 7-39, Cali",
    companyTelefono: "(602) 882 1000",
    companyCorreo: "contacto@tecnoquimicas.com",
    companyCiiuPrincipal: "2100",
    companyCiiuPrincipalDesc: "Fabricación de productos farmacéuticos y sustancias químicas",
    companyTipo: "Privada",
    companyWeb: "https://www.tecnoquimicas.com",
    contactCargo: "Coordinadora de Calidad",
    contactArea: "Aseguramiento de Calidad",
    contactTelefono: "+57 317 660 3312",
    contactCorreo: "diana.osorio@tecnoquimicas.com",
    necesidad: "Actualizar al equipo de calidad en normativa BPM vigente para plantas farmacéuticas.",
    competencias: "Buenas Prácticas de Manufactura, auditoría interna, gestión documental",
    formacionPrevia: "Sí",
    descFormacion: "Inducción BPM básica",
    empresaPrevia: "INVIMA (curso virtual)",
    fechaPrevia: "2024",
    observaciones: "Entregado — el cliente confirmó recepción del material y certificados.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0159",
    title: "Mentoría para gerentes de zona en expansión comercial",
    applicant: "Marta Isabel Vélez",
    type: "Mentoría",
    createdAt: "2026-07-20",
    deadline: "2026-08-15",
    status: "entregada",
    statusUpdatedAt: "2026-08-15T10:00:00.000Z",
    urgency: "baja",
    company: "Carvajal S.A.",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    professor: "Dra. Paula Henao",
    professorType: "planta",
    totalCostCop: 8_900_000,
    costing: calculateCosting("Mentoría", 8_900_000, 27, 1_836_000, undefined, true),
    horas: "18",
    modalidad: "Virtual sincrónica",
    participantes: "1 - 5",
    companyNit: "890300279-4",
    companyDireccion: "Calle 29 Norte # 6A-40, Cali",
    companyTelefono: "(602) 667 5000",
    companyCorreo: "servicioalcliente@carvajal.com",
    companyCiiuPrincipal: "1811",
    companyCiiuPrincipalDesc: "Actividades de impresión",
    companyTipo: "Privada",
    companyWeb: "https://www.carvajal.com",
    contactCargo: "Directora Comercial Regional",
    contactArea: "Comercial",
    contactTelefono: "+57 314 220 5561",
    contactCorreo: "marta.velez@carvajal.com",
    necesidad: "Preparar a gerentes de zona para liderar la apertura de nuevos mercados regionales.",
    competencias: "Liderazgo comercial, negociación B2B, gestión de equipos remotos",
    formacionPrevia: "No",
    observaciones: "Entregado — ciclo de mentoría cerrado con evaluación positiva de los participantes.",
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
  {
    id: "REQ-2026-0160",
    title: "Consultoría en estrategia de precios",
    applicant: "Camilo Andrés Ríos",
    type: "Consultoría",
    createdAt: "2026-07-10",
    deadline: "2026-08-01",
    status: "entregada",
    statusUpdatedAt: "2026-08-01T10:00:00.000Z",
    urgency: "media",
    company: "Colombina S.A.",
    node: NODES[4],
    productLeader: "Sebastián Vélez",
    kam: "Diana Salcedo",
    professor: "Ing. Carlos Eduardo Valencia",
    professorType: "externo",
    externalProfessorData: {
      nombre: "Ing. Carlos Eduardo Valencia",
      identificacion: "CC 94.456.789",
      empresaConsultora: "Valencia & Partners Strategic Advisory",
      correo: "carlos.valencia@partnersadvisory.co",
      telefono: "+57 315 789 1234",
      perfil: "Consultor Senior en Estrategia Comercial y Pricing",
    },
    totalCostCop: 27_200_000,
    costing: calculateCosting("Consultoría", 27_200_000, 34, 6_800_000, undefined, true),
    horas: "55",
    modalidad: "Híbrida",
    participantes: "1 - 5",
    companyNit: "860007738-9",
    companyDireccion: "Carrera 1 # 24-56, La Paila, Zarzal",
    companyTelefono: "(602) 886 1900",
    companyCorreo: "atencion@colombina.com",
    companyCiiuPrincipal: "1082",
    companyCiiuPrincipalDesc: "Elaboración de cacao, chocolate y confitería",
    companyTipo: "Privada",
    companyWeb: "https://www.colombina.com",
    contactCargo: "Gerente de Categoría",
    contactArea: "Mercadeo",
    contactTelefono: "+57 315 440 7789",
    contactCorreo: "camilo.rios@colombina.com",
    necesidad: "Redefinir la estrategia de precios de la línea de confitería premium.",
    competencias: "Pricing estratégico, elasticidad de demanda, análisis competitivo",
    formacionPrevia: "No sé",
    observaciones: "Entregado — el cliente ya implementó la nueva estructura de precios.",
    clientKamDocuments: [],
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

export function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function formatCompactCop(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1);
    return `$ ${formatted}M COP`;
  }
  return formatCop(amount);
}

/**
 * @deprecated Replaced in KAM views with `formatRelativeTime(createdAt)` in `@/lib/proposal-adapter`.
 * Hardcoded by proposal ID; maintained only for backwards compatibility.
 */
export function getRelativeTime(id: string): string {
  switch (id) {
    case "REQ-2026-0142":
      return "Hace 2 horas";
    case "REQ-2026-0143":
      return "Hace 4 horas";
    case "REQ-2026-0144":
      return "Ayer";
    case "REQ-2026-0138":
      return "Hace 2 días";
    case "REQ-2026-0131":
      return "Hace 4 días";
    case "REQ-2026-0120":
      return "12 mar 2026";
    default:
      return "Reciente";
  }
}
