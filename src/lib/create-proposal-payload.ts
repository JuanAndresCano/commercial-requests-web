import type {
  AdditionalContactPayload,
  CompanyType,
  CreateProposalPayload,
  ProgramModality,
  ProposalPriority,
  RequestType as ApiRequestType,
} from "@/lib/api/requests";
import type { ClientContact } from "@/lib/mock-data";
import type { RequestFormData } from "@/pages/NewRequest";
import { cateringToPayload } from "@/lib/catering";
import { parseNit } from "@/lib/nit";

const COMPANY_TYPE_MAP: Record<string, CompanyType> = {
  Pública: "PUBLICA",
  Privada: "PRIVADA",
  Mixta: "MIXTA",
  "Sin ánimo de lucro": "SIN_ANIMO_LUCRO",
  PUBLICA: "PUBLICA",
  PRIVADA: "PRIVADA",
  MIXTA: "MIXTA",
  SIN_ANIMO_LUCRO: "SIN_ANIMO_LUCRO",
};

const PRIORITY_MAP: Record<string, ProposalPriority> = {
  alta: "ALTA",
  media: "MEDIA",
  baja: "BAJA",
  ALTA: "ALTA",
  MEDIA: "MEDIA",
  BAJA: "BAJA",
};

const REQUEST_TYPE_MAP: Record<string, ApiRequestType> = {
  Capacitación: "CAPACITACION",
  Consultoría: "CONSULTORIA",
  Mentoría: "MENTORIA",
  Investigación: "INVESTIGACION",
  "Proyectos Especiales (Eventos)": "SPECIAL_PROJECTS",
  Otro: "OTHER",
};

const MODALITY_MAP: Record<string, ProgramModality> = {
  "Presencial en campus Icesi": "PRESENCIAL_ICESI",
  "Presencial en sede cliente": "PRESENCIAL_CLIENTE",
  "Virtual sincrónica": "VIRTUAL",
  Híbrida: "HIBRIDA",
};

const text = (value: string | undefined) => value?.trim() || undefined;

/** Keeps only the keys that have a value, so an empty contact field is simply not sent. */
function toContactPayload(contact: ClientContact): AdditionalContactPayload | undefined {
  const payload: AdditionalContactPayload = {
    name: text(contact.nombre),
    role: text(contact.cargo),
    area: text(contact.area),
    phone: text(contact.telefono),
    email: text(contact.correo),
  };
  const filled = Object.entries(payload).filter(([, value]) => value !== undefined);
  return filled.length > 0 ? (Object.fromEntries(filled) as AdditionalContactPayload) : undefined;
}

interface PayloadContext {
  title: string;
  /** Optional: only when the KAM picked a node. */
  nodeId?: string;
  /** Mandatory: the leader decides where the request goes. */
  productLeaderId: string;
}

/**
 * Turns what the KAM filled in the wizard into the body of POST /proposals. Every field the wizard collects
 * is sent: whatever is left out here is lost for good, because files are the only thing uploaded afterwards.
 */
export function buildCreateProposalPayload(data: RequestFormData, context: PayloadContext): CreateProposalPayload {
  const mainName = text(data.contactoNombre);
  // Without a main contact, the first named additional contact takes its place (it is the one the request keeps).
  const promoted = !mainName && data.contactosAdicionales[0]?.nombre.trim() ? data.contactosAdicionales[0] : undefined;
  const additional = (promoted ? data.contactosAdicionales.slice(1) : data.contactosAdicionales)
    .map(toContactPayload)
    .filter((contact): contact is AdditionalContactPayload => contact !== undefined);

  const primary = mainName
    ? {
        name: mainName,
        email: text(data.correo),
        phone: text(data.telefono),
        role: text(data.cargo),
        area: text(data.area),
        secondaryPhone: text(data.telefonoSecundario),
        alternativeEmail: text(data.correoAlternativo),
      }
    : promoted
      ? {
          name: text(promoted.nombre),
          email: text(promoted.correo),
          phone: text(promoted.telefono),
          role: text(promoted.cargo),
          area: text(promoted.area),
          secondaryPhone: undefined,
          alternativeEmail: undefined,
        }
      : undefined;

  const catering = cateringToPayload(data.alimentacion);
  // Ten digits only. The wizard blocks an invalid NIT before this runs; if one slips through it is not sent.
  const nit = parseNit(data.nit);

  return {
    companyName: data.empresaNombre.trim() || "Empresa Aliada",
    companyNit: nit.ok && nit.nit ? nit.nit : undefined,
    companyDescription: text(data.descripcion),
    companyType: data.tipoEmpresa ? COMPANY_TYPE_MAP[data.tipoEmpresa] : undefined,
    sector: text(data.ciiuPrincipalDesc),
    website: text(data.web),
    companyAddress: text(data.direccion),
    companyPhone: text(data.telefonoEmpresa),
    companyEmail: text(data.correoEmpresa),
    ciiuCode: text(data.ciiuPrincipal),
    ciiuSecondary: data.ciiusSecundarios.length > 0 ? data.ciiusSecundarios : undefined,
    nodeId: context.nodeId,
    productLeaderId: context.productLeaderId,
    priority: data.urgencia ? PRIORITY_MAP[data.urgencia] : undefined,
    contactName: primary?.name,
    contactEmail: primary?.email,
    contactPhone: primary?.phone,
    contactRole: primary?.role,
    contactArea: primary?.area,
    contactSecondaryPhone: primary?.secondaryPhone,
    contactAlternativeEmail: primary?.alternativeEmail,
    additionalContacts: additional.length > 0 ? additional : undefined,
    requestType: data.tipoReq ? REQUEST_TYPE_MAP[data.tipoReq] : undefined,
    requestTypeOther: data.tipoReq === "Otro" ? text(data.tipoReqOtro) : undefined,
    participantRange: text(data.participantes),
    programName: context.title,
    needDescription: text(data.necesidad),
    estimatedHours: data.horas ? parseInt(data.horas, 10) || undefined : undefined,
    modality: data.modalidad ? MODALITY_MAP[data.modalidad] : undefined,
    requiresCatering: catering.requiresCatering,
    cateringNotes: catering.cateringNotes ?? undefined,
    expectedResults: text(data.resultados),
    successMetrics: text(data.exito),
    competencies: text(data.competencias),
    participantArea: text(data.areaParticipantes),
    hasPreviousTraining: data.formacionPrevia === "Sí",
    previousTraining: data.formacionPrevia || undefined,
    previousTrainingDescription: text(data.descFormacion),
    previousTrainingCompany: text(data.empresaPrevia),
    previousTrainingDate: text(data.fechaPrevia),
    observations: text(data.observaciones),
    // Files are not part of the create payload: they are uploaded right after it.
  };
}
