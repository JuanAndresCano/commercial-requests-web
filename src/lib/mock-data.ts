export type RequestStatus = "nueva" | "lista" | "borrador" | "entregada";
export type RequestType = "Capacitación" | "Consultoría" | "Mentoría";
export type Urgency = "alta" | "media" | "baja";

export interface RequestItem {
  id: string;
  title: string;
  applicant: string;
  type: RequestType;
  createdAt: string; // ISO
  deadline?: string; // ISO
  status: RequestStatus;
  urgency: Urgency;
  company: string;
  node: string;
  productLeader: string;
  kam: string;
  professor?: string;
  totalCostCop?: number;
}

export const NODES = [
  "Biotecnología, Bioeconomía y Sostenibilidad",
  "Inteligencia Artificial y Tecnologías Digitales",
  "Innovación Educativa, Bienestar Social, Innovación Pública",
  "Competitividad Organizacional, Economías Creativas",
  "Salud Global, Calidad de Vida",
];

export const KAMS = ["Andrea Martínez", "Carlos Riveros", "Diana Salcedo", "Felipe Ortiz"];
export const PRODUCT_LEADERS = ["Jhon Doe", "María Camila Restrepo", "Sebastián Vélez", "Laura Caicedo"];
export const PROFESSORS = ["Dr. Ricardo Mejía", "Dra. Paula Henao", "Dr. Andrés Lozano"];

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
    productLeader: "Jhon Doe",
    kam: "Andrea Martínez",
  },
  {
    id: "REQ-2026-0143",
    title: "Consultoría en transformación digital",
    applicant: "Mariana López",
    type: "Consultoría",
    createdAt: "2026-03-26",
    deadline: "2026-03-30",
    status: "nueva",
    urgency: "media",
    company: "Grupo Éxito",
    node: NODES[3],
    productLeader: "María Camila Restrepo",
    kam: "Carlos Riveros",
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
    productLeader: "Sebastián Vélez",
    kam: "Diana Salcedo",
  },
  {
    id: "REQ-2026-0138",
    title: "Desarrollo de nueva funcionalidad",
    applicant: "Camila Ríos",
    type: "Capacitación",
    createdAt: "2026-03-15",
    deadline: "2026-05-04",
    status: "lista",
    urgency: "media",
    company: "Sura",
    node: NODES[1],
    productLeader: "Jhon Doe",
    kam: "Andrea Martínez",
    professor: "Dr. Ricardo Mejía",
    totalCostCop: 4_000_000,
  },
  {
    id: "REQ-2026-0131",
    title: "Programa analítica de datos",
    applicant: "Felipe Naranjo",
    type: "Capacitación",
    createdAt: "2026-03-10",
    status: "borrador",
    urgency: "baja",
    company: "Nutresa",
    node: NODES[1],
    productLeader: "Laura Caicedo",
    kam: "Felipe Ortiz",
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
    totalCostCop: 12_500_000,
  },
];

export const STATUS_META: Record<RequestStatus, { label: string; tone: string; dot: string }> = {
  nueva: { label: "Nueva", tone: "bg-accent/10 text-accent border-accent/20", dot: "bg-accent" },
  lista: { label: "Lista para entregar", tone: "bg-info/10 text-info border-info/20", dot: "bg-info" },
  borrador: { label: "Borrador", tone: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground" },
  entregada: { label: "Entregada", tone: "bg-success/10 text-success border-success/20", dot: "bg-success" },
};

export const URGENCY_META: Record<Urgency, { label: string; tone: string }> = {
  alta: { label: "Alta", tone: "text-destructive bg-destructive/10 border-destructive/20" },
  media: { label: "Media", tone: "text-warning bg-warning/10 border-warning/20" },
  baja: { label: "Baja", tone: "text-muted-foreground bg-muted border-border" },
};

export function formatCop(amount: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
}
