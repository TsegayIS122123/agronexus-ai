export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  credentials?: "omit" | "same-origin" | "include";
  /**
   * Origin to resolve relative paths against. Defaults to the page origin so
   * same-origin call sites keep working. The NestJS identity service runs on a
   * different port, so its call sites pass an absolute base.
   */
  baseUrl?: string;
}

function buildUrl(
  base: string,
  query?: Record<string, string | number | boolean | undefined>,
  baseUrl?: string,
): string {
  const url = new URL(base, baseUrl ?? window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, query, credentials = "include", baseUrl } = options;

  const init: RequestInit = {
    method,
    headers: {
      "Accept": "application/json",
      "Content-Type": body !== undefined ? "application/json" : "application/json",
      ...headers,
    },
    credentials,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const response = await fetch(buildUrl(path, query, baseUrl), init);

  if (!response.ok) {
    const detail = await extractErrorMessage(response, method);
    throw new ApiError(response.status, `${detail} (HTTP ${response.status})`, detail);
  }

  const text = await response.text();
  if (text.trim().length === 0) {
    return ({} as T);
  }
  return JSON.parse(text) as T;
}

/**
 * The two services disagree about error shape, and the auth screens show these
 * strings to the user verbatim, so both have to be understood:
 *
 *   FastAPI (ai-service):  { detail: string | object | Array<{msg}> }
 *   NestJS  (identity):    { statusCode, error, message: string | string[] }
 *
 * A ValidationPipe failure arrives as `message` being an array of sentences, one
 * per rejected field. Those are joined rather than surfaced as "[object Object]"
 * or a raw JSON blob.
 */
async function extractErrorMessage(response: Response, method: string): Promise<string> {
  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch {
    return `Request failed with status ${response.status}`;
  }

  const body = parsed as Record<string, unknown> | null;
  if (!body || typeof body !== "object") {
    return `Request failed with status ${response.status}`;
  }

  const message = body.message;
  if (Array.isArray(message)) {
    const joined = message.filter((m): m is string => typeof m === "string").join(". ");
    if (joined) return joined;
  }
  if (typeof message === "string" && message) {
    return message;
  }

  const detail = body.detail;
  if (Array.isArray(detail)) {
    const joined = detail
      .map((item) =>
        typeof item === "string"
          ? item
          : typeof (item as { msg?: unknown })?.msg === "string"
            ? (item as { msg: string }).msg
            : "",
      )
      .filter(Boolean)
      .join(". ");
    if (joined) return joined;
  } else if (typeof detail === "string" && detail) {
    return detail;
  } else if (detail && typeof detail === "object") {
    const nested = (detail as { message?: unknown }).message;
    if (typeof nested === "string" && nested) return nested;
    return JSON.stringify(detail);
  }

  if (response.status === 401) return "Your session has expired. Please sign in again.";
  if (response.status === 403) return "You do not have access to this resource.";
  if (response.status === 429) return "Too many attempts. Please wait a moment and try again.";
  return `${method} request failed with status ${response.status}`;
}

export const get = <T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  baseUrl?: string,
  headers?: Record<string, string>,
) => request<T>(path, { method: "GET", query, baseUrl, headers });

export const post = <T>(path: string, body?: unknown, headers?: Record<string, string>, baseUrl?: string) =>
  request<T>(path, { method: "POST", body, headers, baseUrl });

export const put = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PUT", body });

export const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body });

export const del = <T>(path: string) =>
  request<T>(path, { method: "DELETE" });


/**
 * Wraps request errors into a structured ApiError so callers can inspect the HTTP status and the detail payload.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail: string | undefined
  ) {
    super(message);
    this.name = 'ApiError';
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get statusCode() {
    return this.status;
  }
}