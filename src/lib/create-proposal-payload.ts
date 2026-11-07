import type {
  AdditionalContactPayload,
  CompanyType,
  CreateProposalPayload,
  ProgramModality,
  ProposalPriority,
  RequestType as ApiRequestType,
} from "@/lib/api/requests";
import type { ClientContact } from "@/lib/mock-data";
import type { RequestFormData } from "@/views/NewRequest";
import { cateringToPayload } from "@/lib/catering";
import { MAX_SECONDARY_CIIU, normalizeCiiuList, parseCiiu } from "@/lib/ciiu";
import { parseNit } from "@/lib/nit";
import { pendingValue, phoneValue } from "@/lib/customer-contact";

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

/**
 * Keeps only the keys that have a value, so an empty contact field is simply not sent.
 * A phone goes only when valid (10 digits): the wizard blocks an invalid one, and if one slips through it is dropped.
 */
function toContactPayload(contact: ClientContact): AdditionalContactPayload | undefined {
  const payload: AdditionalContactPayload = {
    name: pendingValue(contact.nombre),
    role: pendingValue(contact.cargo),
    area: pendingValue(contact.area),
    phone: phoneValue(contact.telefono),
    email: pendingValue(contact.correo),
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
  const mainName = pendingValue(data.contactoNombre);
  const hasPrimaryData = [
    data.contactoNombre,
    data.correo,
    data.telefono,
    data.cargo,
    data.area,
    data.telefonoSecundario,
    data.correoAlternativo,
  ].some((value) => Boolean(pendingValue(value)));
  // Promote an additional contact only when no primary contact data would be lost.
  const promoted =
    !hasPrimaryData && pendingValue(data.contactosAdicionales[0]?.nombre) ? data.contactosAdicionales[0] : undefined;
  const additional = (promoted ? data.contactosAdicionales.slice(1) : data.contactosAdicionales)
    .map(toContactPayload)
    .filter((contact): contact is AdditionalContactPayload => contact !== undefined);

  const primary = hasPrimaryData
    ? {
        name: mainName,
        email: pendingValue(data.correo),
        phone: phoneValue(data.telefono),
        role: pendingValue(data.cargo),
        area: pendingValue(data.area),
        secondaryPhone: phoneValue(data.telefonoSecundario),
        alternativeEmail: pendingValue(data.correoAlternativo),
      }
    : promoted
      ? {
          name: pendingValue(promoted.nombre),
          email: pendingValue(promoted.correo),
          phone: phoneValue(promoted.telefono),
          role: pendingValue(promoted.cargo),
          area: pendingValue(promoted.area),
          secondaryPhone: undefined,
          alternativeEmail: undefined,
        }
      : undefined;

  const catering = cateringToPayload(data.alimentacion);
  // Ten digits only. The wizard blocks an invalid NIT before this runs; if one slips through it is not sent.
  const nit = parseNit(pendingValue(data.nit) ?? "");
  // Exactly four digits, like the NIT: the wizard blocks an invalid CIIU, and if one slips through it is not sent.
  const principalCiiu = parseCiiu(data.ciiuPrincipal);
  const ciiuCode = principalCiiu.ok && principalCiiu.code ? principalCiiu.code : undefined;
  const secondaryCiiu = normalizeCiiuList(data.ciiusSecundarios, ciiuCode)
    .filter((code) => parseCiiu(code).ok)
    .slice(0, MAX_SECONDARY_CIIU);

  return {
    companyName: data.empresaNombre.trim() || "Empresa Aliada",
    companyNit: nit.ok && nit.nit ? nit.nit : undefined,
    companyDescription: pendingValue(data.descripcion),
    companyType: data.tipoEmpresa ? COMPANY_TYPE_MAP[data.tipoEmpresa] : undefined,
    sector: pendingValue(data.ciiuPrincipalDesc),
    website: pendingValue(data.web),
    companyAddress: pendingValue(data.direccion),
    companyPhone: phoneValue(data.telefonoEmpresa),
    companyEmail: pendingValue(data.correoEmpresa),
    ciiuCode,
    ciiuSecondary: secondaryCiiu.length ? secondaryCiiu : undefined,
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
