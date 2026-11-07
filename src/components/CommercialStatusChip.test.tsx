import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposalDetail } from "@/lib/api/requests";
import { commercialStatusApi, type CommercialStatus } from "@/lib/api/commercial-status";
import { COMMERCIAL_STATUS_LABELS } from "@/lib/commercial-status";
import { CommercialStatusChip } from "./CommercialStatusChip";

vi.mock("@/lib/api/commercial-status", () => ({ commercialStatusApi: { update: vi.fn() } }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const STATUSES = Object.keys(COMMERCIAL_STATUS_LABELS) as CommercialStatus[];

function renderChip(props: Partial<React.ComponentProps<typeof CommercialStatusChip>> = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const view = render(
    <QueryClientProvider client={client}>
      <CommercialStatusChip proposalId="proposal-1" status={null} canEdit {...props} />
    </QueryClientProvider>,
  );
  return { client, ...view };
}

// jsdom has no PointerEvent.button, so the menu is opened the way keyboard users do.
const openMenu = (name: RegExp | string) => fireEvent.keyDown(screen.getByRole("button", { name }), { key: "Enter" });

describe("CommercialStatusChip rendering", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(STATUSES)("renders %s with its label and a dot", (status) => {
    renderChip({ status, canEdit: false });
    const label = screen.getByText(COMMERCIAL_STATUS_LABELS[status]);
    expect(label.closest("span[data-commercial-status]")).toHaveAttribute("data-commercial-status", status);
    expect(label.parentElement?.querySelector("[data-slot='dot']")).not.toBeNull();
  });

  it("offers a dashed '+ Asignar estado' chip to the owner when there is no tag", () => {
    renderChip({ status: null });
    const chip = screen.getByRole("button", { name: "Asignar seguimiento comercial" });
    expect(chip).toHaveTextContent("+ Asignar estado");
    expect(chip.className).toContain("border-dashed");
  });

  it("labels the owner's trigger with the current tag for assistive technology", () => {
    renderChip({ status: "INVOICED" });
    expect(screen.getByRole("button", { name: "Cambiar seguimiento comercial: Facturada" })).toBeInTheDocument();
  });

  it("is static for anyone who is not the owner KAM: no button, no menu", () => {
    renderChip({ status: "INVOICED", canEdit: false });
    expect(screen.getByText("Facturada")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows a neutral 'Presentación de propuesta' chip, not an assign prompt, when a non-owner sees no tag", () => {
    renderChip({ status: null, canEdit: false });
    expect(screen.getByText("Presentación de propuesta")).toBeInTheDocument();
    expect(screen.queryByText(/Asignar estado/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("falls back to a visible label for an unknown backend value", () => {
    renderChip({ status: "SOMETHING_NEW" as CommercialStatus, canEdit: false });
    expect(screen.getByText("Etiqueta comercial desconocida")).toBeInTheDocument();
  });
});

describe("CommercialStatusChip menu", () => {
  beforeEach(() => vi.clearAllMocks());

  it("opens with Enter, lists the four tags plus 'Quitar etiqueta' and closes with Escape", async () => {
    renderChip({ status: "INVOICED" });
    fireEvent.keyDown(screen.getByRole("button", { name: /Cambiar seguimiento comercial/ }), { key: "Enter" });
    const menu = await screen.findByRole("menu");
    for (const label of Object.values(COMMERCIAL_STATUS_LABELS)) {
      expect(screen.getByRole("menuitemradio", { name: label })).toBeInTheDocument();
    }
    expect(screen.getByRole("menuitemradio", { name: "Facturada" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitem", { name: "Quitar etiqueta" })).toBeInTheDocument();
    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("opens with Space", async () => {
    renderChip({ status: null });
    fireEvent.keyDown(screen.getByRole("button", { name: "Asignar seguimiento comercial" }), { key: " " });
    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Quitar etiqueta" })).not.toBeInTheDocument();
  });

  it.each(["APPROVED_WITH_CONTRACT", "REJECTED"] as const)(
    "sends %s to the PATCH and reports success",
    async (status) => {
      vi.mocked(commercialStatusApi.update).mockResolvedValue({ commercialStatus: status } as ProposalDetail);
      renderChip({ status: null });
      openMenu("Asignar seguimiento comercial");
      fireEvent.click(await screen.findByRole("menuitemradio", { name: COMMERCIAL_STATUS_LABELS[status] }));
      await waitFor(() => expect(commercialStatusApi.update).toHaveBeenCalledWith("proposal-1", status));
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
    },
  );

  it("sends null when the tag is removed", async () => {
    vi.mocked(commercialStatusApi.update).mockResolvedValue({ commercialStatus: null } as ProposalDetail);
    renderChip({ status: "INVOICED" });
    openMenu(/Cambiar seguimiento comercial/);
    fireEvent.click(await screen.findByRole("menuitem", { name: "Quitar etiqueta" }));
    await waitFor(() => expect(commercialStatusApi.update).toHaveBeenCalledWith("proposal-1", null));
    expect(await screen.findByRole("button", { name: "Asignar seguimiento comercial" })).toBeInTheDocument();
  });

  it("does not call the API when the current tag is picked again", async () => {
    renderChip({ status: "INVOICED" });
    openMenu(/Cambiar seguimiento comercial/);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Facturada" }));
    expect(commercialStatusApi.update).not.toHaveBeenCalled();
  });

  it("updates the chip optimistically, before the server answers", async () => {
    let resolve: (value: ProposalDetail) => void = () => {};
    vi.mocked(commercialStatusApi.update).mockReturnValue(new Promise((r) => (resolve = r)));
    renderChip({ status: "APPROVED_WITHOUT_CONTRACT" });
    openMenu(/Cambiar seguimiento comercial/);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Facturada" }));
    expect(await screen.findByRole("button", { name: "Cambiar seguimiento comercial: Facturada" })).toBeInTheDocument();
    expect(toast.success).not.toHaveBeenCalled();
    await act(async () => resolve({ commercialStatus: "INVOICED" } as ProposalDetail));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Facturada")));
  });

  it("stores the confirmed proposal in the detail cache", async () => {
    const updated = { id: "proposal-1", commercialStatus: "INVOICED" } as ProposalDetail;
    vi.mocked(commercialStatusApi.update).mockResolvedValue(updated);
    const { client } = renderChip({ status: null });
    openMenu("Asignar seguimiento comercial");
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Facturada" }));
    await waitFor(() => expect(client.getQueryData(["requests", "proposal-1"])).toEqual(updated));
  });

  it("reverts the chip and shows an error toast when the server fails", async () => {
    vi.mocked(commercialStatusApi.update).mockRejectedValue(new Error("Network down"));
    renderChip({ status: "APPROVED_WITHOUT_CONTRACT" });
    openMenu(/Cambiar seguimiento comercial/);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Rechazada" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: "Cambiar seguimiento comercial: Aprobación sin contrato" }),
    ).toBeInTheDocument();
  });

  it("follows the server value when the parent passes a new status", () => {
    const { rerender, client } = renderChip({ status: "INVOICED" });
    rerender(
      <QueryClientProvider client={client}>
        <CommercialStatusChip proposalId="proposal-1" status="REJECTED" canEdit />
      </QueryClientProvider>,
    );
    expect(screen.getByRole("button", { name: "Cambiar seguimiento comercial: Rechazada" })).toBeInTheDocument();
  });
});

describe("CommercialStatusChip inside a clickable card", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not trigger the card link when the chip or its menu is clicked", async () => {
    vi.mocked(commercialStatusApi.update).mockResolvedValue({ commercialStatus: "INVOICED" } as ProposalDetail);
    const onCardClick = vi.fn();
    const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <a href="/solicitudes/proposal-1" onClick={onCardClick}>
          <CommercialStatusChip proposalId="proposal-1" status={null} canEdit />
        </a>
      </QueryClientProvider>,
    );
    const trigger = screen.getByRole("button", { name: "Asignar seguimiento comercial" });
    expect(fireEvent.click(trigger)).toBe(false); // default prevented: the anchor does not navigate
    openMenu("Asignar seguimiento comercial");
    const item = await screen.findByRole("menuitemradio", { name: "Facturada" });
    expect(fireEvent.click(item)).toBe(false);
    await waitFor(() => expect(commercialStatusApi.update).toHaveBeenCalled());
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it("does not let a static chip swallow card clicks", () => {
    const onCardClick = vi.fn();
    render(
      <a
        href="/x"
        onClick={(event) => {
          event.preventDefault();
          onCardClick();
        }}
      >
        <CommercialStatusChip proposalId="proposal-1" status="INVOICED" canEdit={false} />
      </a>,
    );
    fireEvent.click(screen.getByText("Facturada"));
    expect(onCardClick).toHaveBeenCalledTimes(1);
  });
});
