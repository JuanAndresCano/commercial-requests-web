import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { companiesApi, type Company } from "@/lib/api/companies";
import { CompanyAutocomplete } from "./CompanyAutocomplete";

vi.mock("@/lib/api/companies", () => ({ companiesApi: { search: vi.fn() } }));

const mockedSearch = vi.mocked(companiesApi.search);

const bancolombia: Company = {
  id: "c1",
  name: "Bancolombia S.A.",
  nit: "8909006089",
  description: null,
  website: "https://www.bancolombia.com",
  area: null,
  type: "PRIVADA",
  sector: null,
};

function renderAutocomplete(onSelect = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <CompanyAutocomplete onSelect={onSelect} />
    </QueryClientProvider>,
  );
  return onSelect;
}

const type = (value: string) => fireEvent.change(screen.getByRole("textbox"), { target: { value } });

describe("CompanyAutocomplete", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("searches the backend by what the user types and shows the NIT formatted", async () => {
    mockedSearch.mockResolvedValue([bancolombia]);
    renderAutocomplete();

    type("890900");

    expect(await screen.findByText("Bancolombia S.A.")).toBeInTheDocument();
    expect(screen.getByText("NIT: 890900608-9")).toBeInTheDocument();
    expect(mockedSearch).toHaveBeenCalledWith("890900");
  });

  it("reports the picked company and clears the search", async () => {
    mockedSearch.mockResolvedValue([bancolombia]);
    const onSelect = renderAutocomplete();

    type("banco");
    fireEvent.click(await screen.findByText("Bancolombia S.A."));

    expect(onSelect).toHaveBeenCalledWith(bancolombia);
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("does not hit the backend for a single character", async () => {
    renderAutocomplete();
    type("b");
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("tells the user when nothing matches so they can type the company by hand", async () => {
    mockedSearch.mockResolvedValue([]);
    renderAutocomplete();

    type("zzz");

    expect(await screen.findByText(/Sin coincidencias/)).toBeInTheDocument();
  });

  it("degrades gracefully when the directory cannot be reached", async () => {
    mockedSearch.mockRejectedValue(new Error("network"));
    renderAutocomplete();

    type("banco");

    await waitFor(() => expect(screen.getByText(/No pudimos consultar el directorio/)).toBeInTheDocument());
  });
});
