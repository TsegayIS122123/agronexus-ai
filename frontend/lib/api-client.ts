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
      ...headers,
    },
    credentials,
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers["Content-Type"] = "application/json";
  }

  const response = await fetch(buildUrl(path, query), init);

  if (!response.ok) {
    const errorMessage =
      response.status === 401
        ? "Unauthorized. Please log in again."
        : `Request failed with status ${response.status}`;

    throw new Error(errorMessage);
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
