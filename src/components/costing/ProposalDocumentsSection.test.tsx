import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ProposalDocumentsSection } from "./ProposalDocumentsSection";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const onUploadFile = vi.fn();

function renderSection() {
  return render(
    <ProposalDocumentsSection
      clientKamDocuments={[]}
      internalCostingDocuments={[]}
      onUploadFile={onUploadFile}
      onRemoveDocument={vi.fn()}
      onDownloadDocument={vi.fn()}
      userRole="lider-producto"
    />,
  );
}

function xlsmFile() {
  return new File(["macro workbook"], "Costeo.xlsm", {
    type: "application/vnd.ms-excel.sheet.macroEnabled.12",
  });
}

function fileInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="file"]'));
}

describe("ProposalDocumentsSection .xlsm handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads an .xlsm from the internal repository tab", () => {
    const { container } = renderSection();
    fireEvent.mouseDown(screen.getByRole("tab", { name: /Repositorio Interno/ }), { button: 0 });

    const internalInput = fileInputs(container).find((input) => input.accept.includes(".xlsm"));
    expect(internalInput).toBeDefined();
    const file = xlsmFile();
    fireEvent.change(internalInput as HTMLInputElement, { target: { files: [file] } });

    expect(toast.error).not.toHaveBeenCalled();
    expect(onUploadFile).toHaveBeenCalledWith(file, "internal_costing", "Matriz de Costeo");
  });

  it("rejects an .xlsm in the client-facing tab", () => {
    const { container } = renderSection();

    const [clientInput] = fileInputs(container);
    expect(clientInput.accept).not.toContain(".xlsm");
    fireEvent.change(clientInput, { target: { files: [xlsmFile()] } });

    expect(onUploadFile).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("La Propuesta Comercial requiere formato Word (.docx) o PDF (.pdf)");
  });

  it("renders read-only audit mode for administrator role (no file inputs or dropzones)", () => {
    const { container } = render(
      <ProposalDocumentsSection
        clientKamDocuments={[
          {
            id: "doc-1",
            category: "client_kam",
            name: "Propuesta_Comercial.pdf",
            type: "pdf",
            size: "1.2 MB",
            date: "10/02/2026",
            canDelete: true,
          },
        ]}
        internalCostingDocuments={[]}
        onUploadFile={onUploadFile}
        onRemoveDocument={vi.fn()}
        onDownloadDocument={vi.fn()}
        userRole="administrador"
      />,
    );

    // Shows audit badge
    expect(screen.getByText(/Auditoría · Solo lectura/i)).toBeInTheDocument();

    // No file input or upload dropzones
    expect(fileInputs(container).length).toBe(0);

    // No delete buttons
    expect(screen.queryByTitle("Eliminar archivo")).not.toBeInTheDocument();

    // Allows viewing/downloading document
    expect(screen.getByText("Propuesta_Comercial.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Descargar/i })).toBeInTheDocument();
  });
});
