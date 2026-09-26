import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("lists with role and status filters url-encoded", async () => {
    respond(200, []);
    await requestsApi.list({ role: "PRODUCT_LEADER", status: "nueva" });
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/requests\?role=PRODUCT_LEADER&status=nueva$/);
  });

  it("advances a status with an optional rejectionReason", async () => {
    respond(200, {});
    await requestsApi.updateStatus("p1", { status: "IN_COSTING" });
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "IN_COSTING" }),
    });

    await requestsApi.updateStatus("p1", { status: "IN_COSTING", rejectionReason: "Client wants a smaller scope" });
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      method: "PATCH",
      body: JSON.stringify({ status: "IN_COSTING", rejectionReason: "Client wants a smaller scope" }),
    });
  });

  it("assigns a directory professor with a PATCH to /professor", async () => {
    respond(200, {});
    await requestsApi.assignProfessor("p1", "prof-1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/requests\/p1\/professor$/);
    expect(init).toMatchObject({ method: "PATCH", body: JSON.stringify({ professorId: "prof-1" }) });
  });

  it("reassigns with a PATCH to /reassign", async () => {
    respond(200, {});
    await requestsApi.reassign("p1", {
      newProductLeaderId: "ldp-2",
      newNodeId: "node-2",
      reason: "WORKLOAD_REDISTRIBUTION",
    });
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/requests\/p1\/reassign$/);
    expect(init).toMatchObject({ method: "PATCH" });
  });

  it("sends only the offered value for minimal costing", async () => {
    respond(200, {});
    await requestsApi.upsertCosting("p1", 30000000);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "PUT",
      body: JSON.stringify({ totalCost: 30000000 }),
    });
  });
});
