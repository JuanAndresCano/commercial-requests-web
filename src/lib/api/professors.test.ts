import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./client";
import { professorsApi } from "./professors";

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
  fetchMock.mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: "status",
    json: () => Promise.resolve(body),
  });
}

describe("professorsApi", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("lists without a query string when there are no filters", async () => {
    respond(200, []);
    await professorsApi.list();
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/professors$/);
  });

  it("sends only the filters that were provided, url-encoded, with the session cookie", async () => {
    respond(200, []);
    await professorsApi.list({ q: "muñoz ruiz", type: "STAFF", limit: 5 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/professors\?q=mu%C3%B1oz\+ruiz&type=STAFF&limit=5$/);
    expect(init).toMatchObject({ method: "GET", credentials: "include" });
  });

  it("registers an external advisor with a POST body", async () => {
    respond(201, { id: "p1", fullName: "Ana Ruiz", type: "EXTERNAL" });
    const created = await professorsApi.createExternal({ fullName: "Ana Ruiz", company: "Consultores SAS" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/professors$/);
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ fullName: "Ana Ruiz", company: "Consultores SAS" }),
    });
    expect(created.id).toBe("p1");
  });

  it("surfaces a duplicate as an ApiError 409", async () => {
    respond(409, { message: 'The external advisor "Ana Ruiz" is already registered' });
    await expect(professorsApi.createExternal({ fullName: "Ana Ruiz" })).rejects.toMatchObject({
      status: 409,
    });
    await expect(professorsApi.createExternal({ fullName: "Ana Ruiz" })).rejects.toBeInstanceOf(ApiError);
  });
});
