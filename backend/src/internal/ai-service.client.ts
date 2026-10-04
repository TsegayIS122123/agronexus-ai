import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { InternalTokenService } from './internal-token.service';

/** A pre-serialized JSON string, or multipart form data.
 *
 * Typed explicitly rather than via the DOM `BodyInit` global, because this
 * package compiles without the DOM lib and the multipart body is genuinely a
 * distinct case (it must set its own boundary, so we never add a content-type).
 */
export type AiServiceBody = string | FormData;

export interface AiServiceCallOptions {
  /** Path under ai-service, e.g. `/api/v1/disease/detect`. */
  path: string;
  /** The user the backend has already authenticated. */
  actingUserId: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Record<string, string | number | undefined>;
  /** `FormData` is passed through untouched so it can set its own boundary. */
  body?: AiServiceBody;
  /** Milliseconds before the call is aborted, or `false` to disable. */
  timeoutMs?: number | false;
}

export interface AiServiceResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
}

/** Generous, but finite: a hung ai-service must not hold a backend request open. */
export const DEFAULT_AI_SERVICE_TIMEOUT_MS = 15_000;

/**
 * Thin HTTP client for the one hop from backend to ai-service.
 *
 * Every call mints a fresh internal token, so the credential's lifetime is the
 * request's lifetime and nothing is cached across users. This is the only place
 * in the backend that knows how to address ai-service.
 *
 * Deliberately not done yet, and tracked rather than implied: retries, backoff,
 * and circuit breaking (roadmap Phase 6). A timeout is in place because a hung
 * dependency is a correctness problem, not a nicety.
 */
@Injectable()
export class AiServiceClient {
  private readonly logger = new Logger(AiServiceClient.name);

  constructor(
    private readonly config: ConfigService,
    private readonly tokens: InternalTokenService,
  ) {}

  baseUrl(): string {
    return this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  /**
   * Resolves with `{ ok, status, data }` instead of throwing on a non-2xx, so
   * the caller decides how a domain failure maps onto its own HTTP response.
   */
  async call<T = unknown>(options: AiServiceCallOptions): Promise<AiServiceResult<T>> {
    const {
      path,
      actingUserId,
      method = 'GET',
      query,
      body,
      timeoutMs = DEFAULT_AI_SERVICE_TIMEOUT_MS,
    } = options;

    const url = this.buildUrl(path, query);
    const headers = await this.buildHeaders(actingUserId, body);

    const controller = new AbortController();
    const timer =
      timeoutMs === false ? null : setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T) : null;

      if (!response.ok) {
        this.logger.warn(`ai-service ${method} ${path} responded ${response.status}`);
      }

      return { ok: response.ok, status: response.status, data };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private async buildHeaders(
    actingUserId: string,
    body?: AiServiceBody,
  ): Promise<Record<string, string>> {
    const headers = await this.tokens.headers(actingUserId);

    // `FormData` must set its own multipart boundary, so content-type is only
    // asserted for a pre-serialized string body.
    if (typeof body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  private buildUrl(
    path: string,
    query?: Record<string, string | number | undefined>,
  ): string {
    const base = this.baseUrl().replace(/\/+$/, '');
    const suffix = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${base}${suffix}`);

    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    return url.toString();
  }
}