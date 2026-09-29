export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  credentials?: "omit" | "same-origin" | "include";
}

function buildUrl(base: string, query?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(base, window.location.origin);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", headers = {}, body, query, credentials = "include" } = options;

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

  const response = await fetch(buildUrl(path, query), init);

  if (!response.ok) {
    let detail = ``;
    try {
      const errorBody = await response.json() as { detail?: string | string[] | object };
      if (Array.isArray(errorBody.detail)) {
        detail = errorBody.detail.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).join('. ');
      } else if (typeof errorBody.detail === 'string') {
        detail = errorBody.detail;
      } else if (errorBody.detail && typeof errorBody.detail === 'object') {
        detail = JSON.stringify(errorBody.detail);
      }
    } catch {
      detail = `Request failed with status ${response.status}`;
    }

    const errorMessage =
      response.status === 401
        ? `Unauthorized. Please log in again.${detail ? ` ${detail}` : ''}`
        : `Request failed with status ${response.status}.${detail ? ` ${detail}` : ''}`;

    throw new ApiError(response.status, errorMessage, detail);
  }

  const text = await response.text();
  if (text.trim().length === 0) {
    return ({} as T);
  }
  return JSON.parse(text) as T;
}

export const get = <T>(path: string, query?: Record<string, string | number | boolean | undefined>) =>
  request<T>(path, { method: "GET", query });

export const post = <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
  request<T>(path, { method: "POST", body, headers });

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