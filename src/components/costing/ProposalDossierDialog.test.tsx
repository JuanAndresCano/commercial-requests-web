import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProposalDossierDialog } from "./ProposalDossierDialog";
import type { RequestItem, ProposalDocument } from "@/lib/mock-data";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockDocs: ProposalDocument[] = [
  {
    id: "doc-1",
    name: "Terminos_Referencia_Sura.pdf",
    type: "pdf",
    category: "client_kam",
    date: "10/11/2026",
    size: "2.4 MB",
    downloadable: true,
  },
  {
    id: "doc-2",
    name: "Especificacion_Tecnica.docx",
    type: "doc",
    category: "client_kam",
    date: "11/11/2026",
    size: "1.1 MB",
    downloadable: true,
  },
];

const mockRequest: RequestItem = {
  id: "req-12345678",
  code: "REQ-2026-0042",
  officialNumber: "CP 2026-0169",
  title: "Programa Avanzado de Analítica de Datos",
  applicant: "Carlos Martínez",
  contactCargo: "Gerente de Talento Humano",
  contactCorreo: "cmartinez@sura.com.co",
  contactTelefono: "3123456789",
  company: "Demo Sura S.A.",
  companyNit: "890903407",
  companyCiiuPrincipalDesc: "Actividades de seguros generales",
  type: "Capacitación",
  createdAt: "2026-11-01T10:00:00Z",
  status: "en-experto",
  urgency: "media",
  modalidad: "Híbrida",
  horas: "40",
  participantes: "20 - 25",
  areaParticipantes: "Dirección de TI y Analítica",
  necesidad: "Fortalecer habilidades en Python, SQL y modelado predictivo.",
  competencias: "Machine learning aplicado, limpieza de datos masivos y storytelling con datos.",
  resultados: "Modelos predictivos aplicados a casos reales de siniestralidad.",
  exito: "Evaluación docente superior a 4.5 y proyectos aplicados viables.",
  alimentacion: "Refrigerios para sesiones presenciales",
  formacionPrevia: "Sí",
  descFormacion: "Curso básico de Excel avanzado",
  empresaPrevia: "Universidad Javeriana",
  node: "Nodo Tecnología e Innovación",
  productLeader: "Laura Gómez",
  kam: "Juan Pablo Pérez",
  professor: "Dra. Paula Henao",
  professorType: "planta",
  center: "Centro de Analítica",
  costCenter: "CENCO-7701",
  clientKamDocuments: mockDocs,
  totalCostCop: 42_000_000,
  costing: {
    totalOfferedCop: 42_000_000,
    expectedMarginPercent: 35,
    marginAmountCop: 14_700_000,
    proCulturaTaxPercent: 1.5,
    proCulturaTaxAmount: 630_000,
    readyForKam: true,
  },
};

describe("ProposalDossierDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders proposal academic dossier dialog with complete details", () => {
    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={mockRequest} onDownloadDocument={vi.fn()} />,
    );

    expect(screen.getByText("Ficha Técnica para Docente")).toBeInTheDocument();
    expect(screen.getAllByText("REQ-2026-0042").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("CP 2026-0169").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Programa Avanzado de Analítica de Datos")).toBeInTheDocument();
    expect(screen.getByText(/Demo Sura S\.A\./)).toBeInTheDocument();
    expect(screen.getByText("Dra. Paula Henao")).toBeInTheDocument();
    expect(screen.getByText(/Docente de Planta/)).toBeInTheDocument();
    expect(screen.getByText("Nodo Tecnología e Innovación")).toBeInTheDocument();
    expect(screen.getByText(/40 horas estimadas/)).toBeInTheDocument();
    expect(screen.getByText("20 - 25 personas")).toBeInTheDocument();
    expect(screen.getByText(/Fortalecer habilidades en Python/)).toBeInTheDocument();

    // Verify section titles are clean and do not include unparsed icon ligatures
    expect(screen.getByText("1. Contexto Empresarial (Cliente)")).toBeInTheDocument();
    expect(screen.getByText("2. Equipo y Ficha de Asignación Académica")).toBeInTheDocument();
    expect(screen.getByText("3. Especificación Pedagógica del Programa")).toBeInTheDocument();
    expect(screen.getByText("4. Reto Empresarial, Objetivos y Competencias")).toBeInTheDocument();
    expect(screen.getByText("5. Requerimientos Logísticos y Antecedentes")).toBeInTheDocument();
  });

  it("strictly enforces confidentiality: does NOT render financial margins or costing numbers", () => {
    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={mockRequest} onDownloadDocument={vi.fn()} />,
    );

    // Ensure profit margins and internal costing math are excluded from the teacher's dossier
    expect(screen.queryByText(/35%/)).not.toBeInTheDocument();
    expect(screen.queryByText(/14\.700\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/27\.300\.000/)).not.toBeInTheDocument();
    expect(screen.queryByText(/totalOfferedCop/i)).not.toBeInTheDocument();
  });

  it("allows switching to support attachments tab and downloads files", () => {
    const onDownload = vi.fn();
    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={mockRequest} onDownloadDocument={onDownload} />,
    );

    // Switch to attachments tab
    const attachmentsTab = screen.getByRole("tab", { name: /Archivos de Soporte/i });
    fireEvent.mouseDown(attachmentsTab, { button: 0 });

    expect(screen.getByText("Terminos_Referencia_Sura.pdf")).toBeInTheDocument();
    expect(screen.getByText("Especificacion_Tecnica.docx")).toBeInTheDocument();

    const downloadButtons = screen.getAllByRole("button", { name: /Descargar$/i });
    expect(downloadButtons.length).toBe(2);

    fireEvent.click(downloadButtons[0]);
    expect(onDownload).toHaveBeenCalledWith(mockDocs[0]);
  });

  it("handles empty documents gracefully", () => {
    const emptyDocRequest: RequestItem = {
      ...mockRequest,
      clientKamDocuments: [],
    };

    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={emptyDocRequest} onDownloadDocument={vi.fn()} />,
    );

    const attachmentsTab = screen.getByRole("tab", { name: /Archivos de Soporte/i });
    fireEvent.mouseDown(attachmentsTab, { button: 0 });

    expect(screen.getByText(/No hay archivos adjuntos en esta propuesta/i)).toBeInTheDocument();
  });

  it("handles optional fields gracefully when data is minimal or empty", () => {
    const minimalRequest: RequestItem = {
      id: "req-minimal",
      code: "REQ-2026-0999",
      title: "Asesoría Rápida",
      type: "Consultoría",
      status: "en-experto",
      urgency: "alta",
      company: "Empresa Sin Datos SAS",
      applicant: "",
      productLeader: "Laura Gómez",
      kam: "Juan Pablo Pérez",
      node: null,
      professor: "Profesor Prueba",
      professorType: "externo",
      createdAt: "2026-11-01T10:00:00Z",
    };

    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={minimalRequest} onDownloadDocument={vi.fn()} />,
    );

    // Verify graceful fallback texts
    expect(screen.getByText(/Asignación directa \/ Sin nodo asignado/i)).toBeInTheDocument();
    expect(screen.getByText(/Por concertar con el cliente/i)).toBeInTheDocument();
    expect(screen.getByText(/A convenir con el docente/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Información de diagnóstico y objetivos pedagógicos en concertación con el cliente/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/No requiere servicio de alimentación/i)).toBeInTheDocument();
    expect(screen.getByText(/Sin registro de capacitaciones previas/i)).toBeInTheDocument();
  });

  it("handles print button click without throwing", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(
      <ProposalDossierDialog isOpen={true} onClose={vi.fn()} request={mockRequest} onDownloadDocument={vi.fn()} />,
    );

    const printButton = screen.getByRole("button", { name: /Imprimir \/ Guardar PDF/i });
    expect(printButton).toBeInTheDocument();

    // Clicking print should not crash
    expect(() => fireEvent.click(printButton)).not.toThrow();

    printSpy.mockRestore();
  });
});
