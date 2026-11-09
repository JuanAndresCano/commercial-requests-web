import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ProposalDetail } from "@/lib/api/requests";
import { customerApi } from "@/lib/api/customer";
import { ApiError } from "@/lib/api/client";
import { CustomerInfoEditor } from "./CustomerInfoEditor";

vi.mock("@/lib/api/customer", () => ({ customerApi: { update: vi.fn() } }));

const proposal = {
  id: "proposal-1",
  company: {
    id: "company-1",
    name: "Empresa S.A.",
    nit: null,
    phone: null,
    email: "empresa@cliente.co",
    address: null,
    type: null,
    ciiuSecondary: ["8559", "7020"],
  },
  contact: { name: "Ana", email: "ana@cliente.co", phone: "3155551234" },
} as unknown as ProposalDetail;

const legacyProposal = {
  ...proposal,
  company: { ...proposal.company, email: null, phone: null },
  contact: { name: "Ana", email: null, phone: null },
} as unknown as ProposalDetail;
const MISSING_CHANNEL_NOTE = "Falta un teléfono o correo válido; lo necesitarás para enviar la propuesta al cliente.";

function mount(target: ProposalDetail = proposal) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CustomerInfoEditor proposal={target} />
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Editar empresa y contacto" }));
  return client;
}

describe("proposal-scoped customer editing", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends only customer changes to the dedicated API, never technical proposal fields", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155559999" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { contactPhone: "3155559999" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lets the KAM complete the legal nature and sends only that change", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    expect(screen.getByLabelText("Naturaleza jurídica")).toHaveValue("");
    fireEvent.change(screen.getByLabelText("Naturaleza jurídica"), { target: { value: "PRIVADA" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { companyType: "PRIVADA" }));
  });

  it("edits the secondary CIIU codes as a list and leaves them out when untouched", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    expect(screen.getByLabelText("CIIU secundarios")).toHaveValue("8559, 7020");
    fireEvent.change(screen.getByLabelText("CIIU secundarios"), { target: { value: "8559, 7020 ,, 6201" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() =>
      expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { ciiuSecondary: ["8559", "7020", "6201"] }),
    );
  });

  it("clears the secondary CIIU codes with an empty list when the field is emptied or marked Pendiente", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    fireEvent.change(screen.getByLabelText("CIIU secundarios"), { target: { value: "Pendiente" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { ciiuSecondary: [] }));
  });

  describe("CIIU (exactly four digits)", () => {
    const CIIU_MESSAGE = /El CIIU debe tener exactamente 4 dígitos/;
    const withCiiu = (ciiuCode: string | null, ciiuSecondary: string[]) =>
      ({ ...proposal, company: { ...proposal.company, ciiuCode, ciiuSecondary } }) as unknown as ProposalDetail;
    const save = () => fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));

    it.each(["854", "85445", "4845858858558", "85a4"])(
      "blocks the principal CIIU «%s» with an error on the field",
      async (value) => {
        mount();
        fireEvent.change(screen.getByLabelText("CIIU principal"), { target: { value } });
        save();
        expect(await screen.findByText(CIIU_MESSAGE)).toBeInTheDocument();
        expect(screen.getByLabelText("CIIU principal")).toHaveAttribute("aria-invalid", "true");
        expect(customerApi.update).not.toHaveBeenCalled();
      },
    );

    it("sends a valid principal CIIU trimmed", async () => {
      vi.mocked(customerApi.update).mockResolvedValue(proposal);
      mount(withCiiu("8544", []));
      fireEvent.change(screen.getByLabelText("CIIU principal"), { target: { value: " 6201 " } });
      save();
      await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { ciiuCode: "6201" }));
    });

    it("clears the principal CIIU (null) when it is marked Pendiente", async () => {
      vi.mocked(customerApi.update).mockResolvedValue(proposal);
      mount(withCiiu("8544", []));
      fireEvent.change(screen.getByLabelText("CIIU principal"), { target: { value: "Pendiente" } });
      save();
      await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { ciiuCode: null }));
    });

    it("blocks a secondary CIIU that is not four digits and names it on the field", async () => {
      mount();
      fireEvent.change(screen.getByLabelText("CIIU secundarios"), { target: { value: "8559, 70, 4845858858558" } });
      save();
      expect(await screen.findByText(/El CIIU debe tener exactamente 4 dígitos \(«70»\)/)).toBeInTheDocument();
      expect(screen.getByLabelText("CIIU secundarios")).toHaveAttribute("aria-invalid", "true");
      expect(customerApi.update).not.toHaveBeenCalled();
    });

    it("blocks more than twenty secondary codes", async () => {
      mount();
      const many = Array.from({ length: 21 }, (_, i) => String(1000 + i)).join(", ");
      fireEvent.change(screen.getByLabelText("CIIU secundarios"), { target: { value: many } });
      save();
      expect(await screen.findByText("Máximo 20 CIIU secundarios.")).toBeInTheDocument();
      expect(customerApi.update).not.toHaveBeenCalled();
    });

    it("normalizes the list: trims, drops blanks, repeats and the one equal to the principal", async () => {
      vi.mocked(customerApi.update).mockResolvedValue(proposal);
      mount(withCiiu("8544", ["8559"]));
      fireEvent.change(screen.getByLabelText("CIIU secundarios"), {
        target: { value: "8559, 7020 ,, 6201, 7020, 8544, Pendiente" },
      });
      save();
      await waitFor(() =>
        expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { ciiuSecondary: ["8559", "7020", "6201"] }),
      );
    });

    it("does not let an inherited invalid CIIU, left untouched, block other changes", async () => {
      vi.mocked(customerApi.update).mockResolvedValue(proposal);
      mount(withCiiu("4845858858558", ["70"]));
      expect(screen.getByLabelText("CIIU principal")).toHaveValue("4845858858558");
      fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155559999" } });
      save();
      await waitFor(() =>
        expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { contactPhone: "3155559999" }),
      );
    });

    it("still blocks the inherited invalid CIIU as soon as the user edits it into another invalid value", async () => {
      mount(withCiiu("4845858858558", []));
      fireEvent.change(screen.getByLabelText("CIIU principal"), { target: { value: "484585885855" } });
      save();
      expect(await screen.findByText(CIIU_MESSAGE)).toBeInTheDocument();
      expect(customerApi.update).not.toHaveBeenCalled();
    });
  });

  it("does not let pending or empty data erase the last available channel", async () => {
    mount();
    fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Correo del contacto"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    expect(await screen.findByText(/Deja al menos un teléfono o correo válido/)).toBeInTheDocument();
    expect(customerApi.update).not.toHaveBeenCalled();
  });

  it.each(["5551234", "3001234567890", "300+1234567"])(
    "blocks the phone «%s» with the Spanish rule on the field and never calls the API",
    async (phone) => {
      mount();
      fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: phone } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
      expect(await screen.findByText("El teléfono debe tener 10 dígitos (puede iniciar con +57)")).toBeInTheDocument();
      expect(screen.getByLabelText("Teléfono del contacto")).toHaveAttribute("aria-invalid", "true");
      expect(customerApi.update).not.toHaveBeenCalled();
    },
  );

  it("accepts a 10-digit phone with +57 and separators", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    fireEvent.change(screen.getByLabelText("Teléfono corporativo"), { target: { value: "+57 (300) 123-4567" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() =>
      expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { companyPhone: "+57 (300) 123-4567" }),
    );
  });

  it("shows a server 400 about contactability in Spanish, never the English text", async () => {
    vi.mocked(customerApi.update).mockRejectedValue(new ApiError(400, "Deja al menos un teléfono o correo válido"));
    mount();
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155559999" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    expect(await screen.findByText("Deja al menos un teléfono o correo válido")).toBeInTheDocument();
    expect(screen.queryByText(/At least one valid/)).not.toBeInTheDocument();
  });

  it("tells the KAM in Spanish that the NIT belongs to another company, keeps the values and does not close", async () => {
    vi.mocked(customerApi.update).mockRejectedValue(new ApiError(409, "Ya existe otra empresa registrada con ese NIT"));
    mount();
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155559999" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    expect(await screen.findByText("Ya existe otra empresa registrada con ese NIT")).toBeInTheDocument();
    expect(screen.queryByText(/No se pudieron guardar los datos/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono del contacto")).toHaveValue("3155559999");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows save failure while preserving the user's values for retry", async () => {
    vi.mocked(customerApi.update).mockRejectedValue(new Error("network unavailable"));
    mount();
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155559999" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    expect(
      await screen.findByText("No se pudieron guardar los datos. Tus cambios siguen disponibles para reintentar."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Teléfono del contacto")).toHaveValue("3155559999");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not show the missing-channel note when the request already has a valid channel", () => {
    mount();
    expect(screen.queryByText(MISSING_CHANNEL_NOTE)).not.toBeInTheDocument();
  });

  it("lets the KAM remove one channel when another valid one remains", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Correo del contacto"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() =>
      expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { companyEmail: null, contactEmail: null }),
    );
  });

  it("lets the KAM replace the last channel with another valid one in the same save", async () => {
    vi.mocked(customerApi.update).mockResolvedValue(proposal);
    mount();
    fireEvent.change(screen.getByLabelText("Correo corporativo"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "Pendiente" } });
    fireEvent.change(screen.getByLabelText("Correo del contacto"), { target: { value: "nuevo@cliente.co" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
    await waitFor(() => expect(customerApi.update).toHaveBeenCalled());
    expect(screen.queryByText(/Deja al menos un teléfono o correo válido/)).not.toBeInTheDocument();
  });

  describe("inherited request without any valid channel", () => {
    it("warns without blocking and saves the other fields", async () => {
      vi.mocked(customerApi.update).mockResolvedValue(legacyProposal);
      mount(legacyProposal);
      expect(screen.getByText(MISSING_CHANNEL_NOTE)).toBeInTheDocument();
      fireEvent.change(screen.getByLabelText("Naturaleza jurídica"), { target: { value: "PRIVADA" } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
      await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { companyType: "PRIVADA" }));
      expect(screen.queryByText(/Deja al menos un teléfono o correo válido/)).not.toBeInTheDocument();
    });

    it("saves an unrelated field even when the inherited contact phone is malformed text the KAM never touched", async () => {
      const inheritedText = {
        ...legacyProposal,
        contact: { name: "Ana", email: null, phone: "Sin dato" },
      } as unknown as ProposalDetail;
      vi.mocked(customerApi.update).mockResolvedValue(inheritedText);
      mount(inheritedText);
      fireEvent.change(screen.getByLabelText("Naturaleza jurídica"), { target: { value: "PRIVADA" } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
      await waitFor(() => expect(customerApi.update).toHaveBeenCalledWith("proposal-1", { companyType: "PRIVADA" }));
      expect(screen.queryByText(/El teléfono debe tener 10 dígitos/)).not.toBeInTheDocument();
    });

    it("hides the note once the KAM types a valid channel", () => {
      mount(legacyProposal);
      fireEvent.change(screen.getByLabelText("Teléfono del contacto"), { target: { value: "3155551234" } });
      expect(screen.queryByText(MISSING_CHANNEL_NOTE)).not.toBeInTheDocument();
    });

    it("still rejects a malformed channel the KAM types", async () => {
      mount(legacyProposal);
      fireEvent.change(screen.getByLabelText("Correo del contacto"), { target: { value: "mal-correo" } });
      fireEvent.click(screen.getByRole("button", { name: "Guardar empresa y contacto" }));
      expect(await screen.findByText(/Ingresa un correo válido/)).toBeInTheDocument();
      expect(customerApi.update).not.toHaveBeenCalled();
    });
  });
});
