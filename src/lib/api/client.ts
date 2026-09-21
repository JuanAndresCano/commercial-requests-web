const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Registers the callback fired when an authenticated request comes back 401. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Login itself answers 401 for bad credentials; that must not end a session. */
  skipUnauthorizedHandler?: boolean;
}

/** The session lives in an httpOnly cookie, so every call sends credentials. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, skipUnauthorizedHandler = false } = options;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401 && !skipUnauthorizedHandler) {
      unauthorizedHandler?.();
    }
    const payload: unknown = await response.json().catch(() => null);
    const message =
      payload !== null && typeof payload === "object" && "message" in payload
        ? String((payload as { message: unknown }).message)
        : response.statusText;
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
