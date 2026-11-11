import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SalesTargetsManager, formatNumberWithDots, parseDotsToNumber } from "./SalesTargetsManager";
import { requestsApi, type SalesTargetsResponse } from "@/lib/api/requests";
import { toast } from "sonner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
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

  it("formats numbers with dots and parses them correctly", () => {
    expect(formatNumberWithDots(2516000000)).toBe((2516000000).toLocaleString("es-CO"));
    expect(formatNumberWithDots(0)).toBe("0");
    expect(parseDotsToNumber("2.516.000.000")).toBe(2516000000);
    expect(parseDotsToNumber("0")).toBe(0);
  });

  it("renders header, center target inputs, balance status and KAM rows", () => {
    renderManager();
    expect(screen.getByText("Gestor de Metas Presupuestales — Dirección Financiera")).toBeInTheDocument();
    expect(screen.getByText("Año 2026")).toBeInTheDocument();
    expect(screen.getByText("100% Asignado")).toBeInTheDocument();
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
  });

  it("splits the center target equally between KAMs without leaving remainders", () => {
    // 3 KAMs and 40 proposals: 40 / 3 = 13 with remainder 1 (so 14, 13, 13)
    const unevenData: SalesTargetsResponse = {
      ...mockSalesTargetsData,
      centerTarget: {
        annualTargetCop: 3000000000,
        annualTargetProposals: 40,
        monthlyTargets: [],
      },
      kamTargets: [
        {
          kamId: "kam-1",
          kamName: "Ana Pérez",
          kamEmail: "ana@icesi.edu.co",
          annualTargetCop: 0,
          annualTargetProposals: 0,
          monthlyTargets: [],
        },
        {
          kamId: "kam-2",
          kamName: "Carlos Gómez",
          kamEmail: "carlos@icesi.edu.co",
          annualTargetCop: 0,
          annualTargetProposals: 0,
          monthlyTargets: [],
        },
        {
          kamId: "kam-3",
          kamName: "Diana Martínez",
          kamEmail: "diana@icesi.edu.co",
          annualTargetCop: 0,
          annualTargetProposals: 0,
          monthlyTargets: [],
        },
      ],
    };

    renderManager(unevenData);
    const equalBtn = screen.getByRole("button", { name: /Reparto Equitativo/i });
    fireEvent.click(equalBtn);

    expect(toast.info).toHaveBeenCalledWith("Meta global distribuida equitativamente entre los KAMs");

    // The inputs should now have exactly 14, 13, 13 proposals (sum = 40)
    expect(screen.getByLabelText("Propuestas meta para Ana Pérez")).toHaveValue("14");
    expect(screen.getByLabelText("Propuestas meta para Carlos Gómez")).toHaveValue("13");
    expect(screen.getByLabelText("Propuestas meta para Diana Martínez")).toHaveValue("13");
  });

  it("allows setting target via percentage input and recalculates COP", () => {
    renderManager();
    // Ana has 50% originally. Change to 30%: 30% of 2.000.000.000 = 600.000.000
    const pctInput = screen.getByLabelText("Porcentaje de meta para Ana Pérez");
    fireEvent.change(pctInput, { target: { value: "30" } });

    const expectedCop = (600000000).toLocaleString("es-CO");
    expect(screen.getByLabelText("Meta para Ana Pérez")).toHaveValue(expectedCop);
    expect(screen.getByText("Desbalance en Asignación")).toBeInTheDocument();
  });

  it("shows warning toast before saving when there is an allocation imbalance", async () => {
    vi.spyOn(requestsApi, "upsertSalesTargets").mockResolvedValue(mockSalesTargetsData);

    renderManager();
    const anaInput = screen.getByLabelText("Meta para Ana Pérez");
    // Change to cause imbalance
    fireEvent.change(anaInput, { target: { value: "1.500.000.000" } });

    const saveBtn = screen.getByRole("button", { name: /Guardar Metas/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(toast.warning).toHaveBeenCalledWith(expect.stringContaining("Atención: Desbalance en metas"));
      expect(toast.success).toHaveBeenCalledWith("Metas institucionales actualizadas exitosamente");
    });
  });

  it("supports fuzzy search filtering and clears search", () => {
    renderManager();
    const searchInput = screen.getByPlaceholderText(/buscar por nombre o correo/i);

    fireEvent.change(searchInput, { target: { value: "Perez" } });
    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();
    expect(screen.queryByText("Carlos Gómez")).not.toBeInTheDocument();

    const clearBtn = screen.getByTitle("Limpiar búsqueda");
    fireEvent.click(clearBtn);
    expect(screen.getByText("Carlos Gómez")).toBeInTheDocument();
  });
});
