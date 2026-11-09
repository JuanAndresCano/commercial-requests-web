import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SalesTargetsManager } from "./SalesTargetsManager";
import { requestsApi, type SalesTargetsResponse } from "@/lib/api/requests";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

const mockSalesTargetsData: SalesTargetsResponse = {
  year: 2026,
  centerTarget: {
    annualTargetCop: 2000000000,
    annualTargetProposals: 40,
    monthlyTargets: [],
  },
  kamTargets: [
    {
      kamId: "kam-1",
      kamName: "Ana Pérez",
      kamEmail: "ana.perez@icesi.edu.co",
      annualTargetCop: 1000000000,
      annualTargetProposals: 20,
      monthlyTargets: [],
    },
    {
      kamId: "kam-2",
      kamName: "Carlos Gómez",
      kamEmail: "carlos.gomez@icesi.edu.co",
      annualTargetCop: 1000000000,
      annualTargetProposals: 20,
      monthlyTargets: [],
    },
  ],
};

function renderManager(initialData?: SalesTargetsResponse) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SalesTargetsManager year={2026} initialData={initialData ?? mockSalesTargetsData} />
    </QueryClientProvider>,
  );
}

describe("SalesTargetsManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header, center target inputs, balance status and KAM rows", () => {
    renderManager();
    expect(screen.getByText("Gestor de Metas Presupuestales — Dirección Financiera")).toBeInTheDocument();
    expect(screen.getByText("Año 2026")).toBeInTheDocument();
    expect(screen.getByText("100% Asignado")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
  });

  it("splits the center target equally between KAMs when clicking Reparto Equitativo", () => {
    renderManager();
    const equalBtn = screen.getByRole("button", { name: /Reparto Equitativo/i });
    fireEvent.click(equalBtn);

    expect(toast.info).toHaveBeenCalledWith("Meta global distribuida equitativamente entre los KAMs");
  });

  it("updates individual KAM target and recalculates allocation", () => {
    renderManager();
    const anaInput = screen.getByLabelText("Meta para Ana Pérez");
    fireEvent.change(anaInput, { target: { value: "1500000000" } });

    expect(screen.getByText("Desbalance en Asignación")).toBeInTheDocument();
  });

  it("calls upsertSalesTargets and shows success toast when clicking Guardar Metas", async () => {
    const upsertSpy = vi.spyOn(requestsApi, "upsertSalesTargets").mockResolvedValue(mockSalesTargetsData);

    renderManager();
    const saveBtn = screen.getByRole("button", { name: /Guardar Metas/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          year: 2026,
          targets: expect.arrayContaining([expect.objectContaining({ targetCop: 2000000000, kamId: null })]),
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("Metas institucionales actualizadas exitosamente");
    });
  });
});
