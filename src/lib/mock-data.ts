export type RequestStatus = "nueva" | "en-experto" | "en-costeo" | "entregada";
export type RequestType =
  | "Capacitación"
  | "Consultoría"
  | "Mentoría"
  | "Investigación"
  | "Proyectos Especiales (Eventos)"
  | "Otro";
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

export interface ProposalCosting {
  requiresExternalAdvisor: boolean;
  externalAdvisorDetails?: string;
  baseCostCop: number;
  expectedMarginPercent: number; // e.g. 30 (%)
  proCulturaTaxPercent: number; // 1.5% if Capacitación, 0% otherwise
  proCulturaTaxAmount: number;
  suggestedTotalCop: number;
  totalOfferedCop: number; // Editable Valor Total Ofertado (COP)
  negotiationNotes?: string;
}

export interface RequestItem {
  id: string;
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

export function calculateCosting(
  type: RequestType,
  baseCostCop: number,
  expectedMarginPercent: number,
  customOffered?: number,
  requiresExternalAdvisor: boolean = false,
  externalAdvisorDetails?: string,
  negotiationNotes?: string
): ProposalCosting {
  const isCapacitacion = type === "Capacitación";
  const proCulturaTaxPercent = isCapacitacion ? 1.5 : 0;
  const marginAmount = baseCostCop * (expectedMarginPercent / 100);
  const proCulturaTaxAmount = isCapacitacion ? Math.round(baseCostCop * 0.015) : 0;
  const suggestedTotalCop = Math.round(baseCostCop + marginAmount + proCulturaTaxAmount);
  const totalOfferedCop = customOffered !== undefined && customOffered !== null ? customOffered : suggestedTotalCop;

  return {
    requiresExternalAdvisor,
    externalAdvisorDetails,
    baseCostCop,
    expectedMarginPercent,
    proCulturaTaxPercent,
    proCulturaTaxAmount,
    suggestedTotalCop,
    totalOfferedCop,
    negotiationNotes,
  };
}

export const MOCK_REQUESTS: RequestItem[] = [
  {
    id: "REQ-2026-0142",
    title: "Capacitación interna - Marketing",
    applicant: "Juan Pérez",
    type: "Capacitación",
    createdAt: "2026-03-26",
    deadline: "2026-03-27",
    status: "nueva",
    urgency: "alta",
    company: "Bancolombia",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    totalCostCop: 18_410_000,
    costing: calculateCosting("Capacitación", 14_000_000, 30, 18_410_000, false),
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
    totalCostCop: 29_800_000,
    costing: calculateCosting(
      "Consultoría",
      22_000_000,
      35,
      29_800_000,
      true,
      "Asesor externo experto en Cloud & Data Architecture (Valencia & Partners)",
      "Valor comercial aprobado de $29.800.000 COP tras validación y aprobación de costeo por Líder de Producto"
    ),
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
    internalCostingDocuments: [
      {
        id: "doc-int-3",
        name: "Matriz_Costeo_Consultores_Externos.xlsx",
        size: "2.1 MB",
        date: "26/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "María Camila Restrepo",
        tag: "Matriz de Costeo",
      },
      {
        id: "doc-int-4",
        name: "Contrato_Minuta_Honorarios_Valencia.pdf",
        size: "860 KB",
        date: "26/03/2026",
        type: "pdf",
        category: "internal_costing",
        uploadedBy: "María Camila Restrepo",
        tag: "Contrato",
      },
    ],
  },
  {
    id: "REQ-2026-0144",
    title: "Mentoría liderazgo ejecutivo",
    applicant: "Roberto Castaño",
    type: "Mentoría",
    createdAt: "2026-03-26",
    deadline: "2026-04-06",
    status: "nueva",
    urgency: "baja",
    company: "Postobón",
    node: NODES[2],
    productLeader: "Diana Carolina Romero Valencia",
    kam: "Diana Salcedo",
    totalCostCop: 15_600_000,
    costing: calculateCosting("Mentoría", 12_000_000, 30, 15_600_000, false),
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
    internalCostingDocuments: [
      {
        id: "doc-int-5",
        name: "Presupuesto_Mentoria_Sesiones.xlsx",
        size: "820 KB",
        date: "26/03/2026",
        type: "excel",
        category: "internal_costing",
        uploadedBy: "Diana Carolina Romero",
        tag: "Matriz de Costeo",
      },
    ],
  },
  {
    id: "REQ-2026-0138",
    title: "Desarrollo de nueva funcionalidad",
    applicant: "Camila Ríos",
    type: "Capacitación",
    createdAt: "2026-03-15",
    deadline: "2026-05-04",
    status: "en-costeo",
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
      18_500_000,
      30,
      24_000_000,
      false,
      undefined,
      "Acuerdo de descuento del 1.3% por volumen de horas con SURA"
    ),
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
    status: "en-experto",
    urgency: "baja",
    company: "Nutresa",
    node: NODES[1],
    productLeader: "Laura Caicedo",
    kam: "Felipe Ortiz",
    totalCostCop: 21_040_000,
    costing: calculateCosting("Capacitación", 16_000_000, 30, 21_040_000, false),
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
    urgency: "media",
    company: "Cementos Argos",
    node: NODES[0],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
    professor: "Dra. Paula Henao",
    professorType: "planta",
    totalCostCop: 12_500_000,
    costing: calculateCosting("Consultoría", 9_500_000, 31.5, 12_500_000, false),
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
    urgency: "media",
    company: "Gases de Occidente",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    professorType: "planta",
    totalCostCop: 34_500_000,
    costing: calculateCosting("Capacitación", 26_000_000, 30, 34_500_000, false),
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
    urgency: "alta",
    company: "Gases de Occidente",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    professor: "Ing. Carlos Eduardo Valencia",
    professorType: "externo",
    totalCostCop: 42_000_000,
    costing: calculateCosting(
      "Consultoría",
      31_000_000,
      35,
      42_000_000,
      true,
      "Experto externo en analítica de redes de gas"
    ),
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
    urgency: "media",
    company: "Gases de Occidente",
    node: NODES[1],
    productLeader: "Juan Pablo Corrales Arenas",
    kam: "Andrea Martínez",
    totalCostCop: 28_000_000,
    costing: calculateCosting("Capacitación", 21_000_000, 30, 28_000_000, false),
    clientKamDocuments: [],
    internalCostingDocuments: [],
  },
];

export const STATUS_META: Record<RequestStatus, { label: string; tone: string; dot: string; headerBg: string; borderTone: string }> = {
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

export function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}

export function formatCompactCop(amount: number): string {
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const formatted = Number.isInteger(millions) ? millions.toString() : millions.toFixed(1);
    return `$ ${formatted}M COP`;
  }
  return formatCop(amount);
}

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

