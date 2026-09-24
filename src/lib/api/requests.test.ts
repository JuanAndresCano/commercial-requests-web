import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./client";
import { requestsApi } from "./requests";

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: "status",
    json: () => Promise.resolve(body),
  });
}

describe("requestsApi", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches dashboard metrics", async () => {
    respond(200, { total: 10, nuevas: 2, listas: 1, entregadas: 3 });
    const metrics = await requestsApi.getDashboardMetrics();

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/requests\/dashboard\/metrics$/);
    expect(metrics.total).toBe(10);
  });

  it("fetches prioritized requests", async () => {
    respond(200, [{ id: "req-1" }]);
    const list = await requestsApi.getPrioritized();

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/requests\/dashboard\/prioritized$/);
    expect(list).toHaveLength(1);
  });

  it("lists requests with query params", async () => {
    respond(200, []);
    await requestsApi.list({
      q: "bancolombia",
      role: "KAM",
      status: "nueva",
      urgency: "urgente",
      type: "CAPACITACION",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("q=bancolombia");
    expect(String(url)).toContain("role=KAM");
    expect(String(url)).toContain("status=nueva");
    expect(String(url)).toContain("urgency=urgente");
    expect(String(url)).toContain("type=CAPACITACION");
    expect(init).toMatchObject({ method: "GET", credentials: "include" });
  });

  it("gets proposal by ID", async () => {
    respond(200, { id: "req-123", title: "Test" });
    const proposal = await requestsApi.getById("req-123");

    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/requests\/req-123$/);
    expect(proposal.id).toBe("req-123");
  });

  it("creates a proposal", async () => {
    respond(201, { id: "req-new", title: "New Proposal" });
    const payload = {
      companyName: "Acme",
      nodeId: "node-1",
      programName: "Training",
    };
    const created = await requestsApi.create(payload);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/proposals$/);
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify(payload),
    });
    expect(created.id).toBe("req-new");
  });

  it("updates proposal status", async () => {
    respond(200, { id: "req-1", status: "DELIVERED" });
    await requestsApi.updateStatus("req-1", { status: "DELIVERED" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/requests\/req-1\/status$/);
    expect(init).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "DELIVERED" }),
    });
  });

  it("surfaces errors as ApiError instances", async () => {
    respond(403, { message: "Forbidden access" });
    await expect(requestsApi.getById("req-unauthorized")).rejects.toBeInstanceOf(ApiError);
  });
});
