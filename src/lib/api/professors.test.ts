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

  it("creates a professor of either kind with a POST body and reports it was created", async () => {
    respond(201, { id: "p1", fullName: "Ana Ruiz", type: "EXTERNAL", reused: false });
    const created = await professorsApi.create({ fullName: "Ana Ruiz", type: "EXTERNAL", company: "Consultores SAS" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/professors$/);
    expect(init).toMatchObject({
      method: "POST",
      body: JSON.stringify({ fullName: "Ana Ruiz", type: "EXTERNAL", company: "Consultores SAS" }),
    });
    expect(created).toMatchObject({ id: "p1", reused: false });
  });

  it("tells when the backend reused an existing professor (200) instead of creating it", async () => {
    respond(200, { id: "s1", fullName: "Nohra Villegas", type: "STAFF", reused: true });
    const saved = await professorsApi.create({ fullName: "nohra villegas", type: "STAFF" });
    expect(saved.reused).toBe(true);
  });

  it("surfaces a validation error as an ApiError 400", async () => {
    respond(400, { message: "fullName should not be empty" });
    await expect(professorsApi.create({ fullName: "", type: "STAFF" })).rejects.toMatchObject({ status: 400 });
    await expect(professorsApi.create({ fullName: "", type: "STAFF" })).rejects.toBeInstanceOf(ApiError);
  });
});
