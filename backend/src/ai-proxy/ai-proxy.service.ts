import { BadGatewayException, HttpException, Injectable, Logger } from '@nestjs/common';

import { AiServiceClient } from '../internal/ai-service.client';

/**
 * Forwards browser-originated AI requests to ai-service on the user's behalf.
 *
 * Every method mints a fresh internal service token via AiServiceClient
 * (through InternalTokenService) and attaches it as X-Internal-Service-Token
 * plus X-Internal-Service-User. ai-service's require_internal_role dependency
 * verifies the signature with INTERNAL_SERVICE_SECRET and re-reads the user
 * row to determine the role — so a compromised frontend cannot assert a role
 * it does not hold.
 *
 * Error translation: ai-service answers 4xx with `{detail: "..."}`; NestJS
 * conventions answer with `{statusCode, message, error}`. The service maps
 * the two so the frontend's existing error handling keeps working.
 */
@Injectable()
export class AiProxyService {
  private readonly logger = new Logger(AiProxyService.name);

  constructor(private readonly ai: AiServiceClient) {}

  // ---------------------------------------------------------------- disease

  async detectDisease(
    actingUserId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    cropType: string,
    language: string,
  ) {
    const form = new FormData();
    // Node 18+ has Blob and FormData globals. The multipart body must set its
    // own content-type; AiServiceClient skips that header for FormData.
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    form.append('file', blob, file.originalname);
    form.append('crop_type', cropType);
    form.append('language', language);

    return this.forward('POST', '/internal/ai/v1/disease/detect', actingUserId, {
      body: form,
      timeoutMs: 30_000, // inference is slower than a CRUD hop
    });
  }

  async diseaseHistory(actingUserId: string, farmerId: string) {
    return this.forward(
      'GET',
      `/internal/ai/v1/disease/history/${farmerId}`,
      actingUserId,
    );
  }

  // ----------------------------------------------------------------- prices

  async priceCrops(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/prices/crops', actingUserId);
  }

  async priceRegions(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/prices/regions', actingUserId);
  }

  async priceForecast(
    actingUserId: string,
    query: { crop: string; region: string; days: string },
  ) {
    return this.forward('GET', '/internal/ai/v1/prices/forecast', actingUserId, {
      query: query as unknown as Record<string, string>,
      timeoutMs: 30_000, // Prophet can be slow on first call
    });
  }

  async priceHistorical(
    actingUserId: string,
    query: { crop: string; region: string; limit: string },
  ) {
    return this.forward('GET', '/internal/ai/v1/prices/historical', actingUserId, {
      query: query as unknown as Record<string, string>,
    });
  }

  // ------------------------------------------------------------------- chat

  async chatSessions(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/chat/sessions', actingUserId);
  }

  async chatCreateSession(actingUserId: string, language: string) {
    return this.forward('POST', '/internal/ai/v1/chat/sessions', actingUserId, {
      body: JSON.stringify({ language }),
    });
  }

  async chatMessages(actingUserId: string, sessionId: string) {
    return this.forward(
      'GET',
      `/internal/ai/v1/chat/messages/${sessionId}`,
      actingUserId,
    );
  }

  async chatSendMessage(
    actingUserId: string,
    body: { message: string; session_id: string | null; language: string },
  ) {
    return this.forward('POST', '/internal/ai/v1/chat/messages', actingUserId, {
      body: JSON.stringify(body),
      timeoutMs: 60_000, // LLM call dominates here
    });
  }

  async chatDeleteSession(actingUserId: string, sessionId: string) {
    return this.forward(
      'DELETE',
      `/internal/ai/v1/chat/sessions/${sessionId}`,
      actingUserId,
    );
  }

  // ---------------------------------------------------------------- quality

  async qualityGrade(
    actingUserId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    productName: string,
    productCategory: string,
  ) {
    const form = new FormData();
    const blob = new Blob([new Uint8Array(file.buffer)], { type: file.mimetype });
    form.append('file', blob, file.originalname);
    form.append('product_name', productName);
    form.append('product_category', productCategory);

    return this.forward('POST', '/internal/ai/v1/quality/grade', actingUserId, {
      body: form,
      timeoutMs: 30_000,
    });
  }

  async qualityReports(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/quality/reports', actingUserId);
  }

  async qualityStandards(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/quality/standards', actingUserId);
  }

  // --------------------------------------------------------------- industry

  async industryProducts(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/industry/products', actingUserId);
  }

  async industryReports(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/industry/reports', actingUserId);
  }

  async industryFeasibility(
    actingUserId: string,
    body: {
      product_name: string;
      // Optional because the frontend FeasibilityDto permits omitting it;
      // FastAPI defaults to 'Addis Ababa' when absent.
      location?: string;
      capital: number;
      quantity: number;
    },
  ) {
    return this.forward('POST', '/internal/ai/v1/industry/feasibility', actingUserId, {
      body: JSON.stringify(body),
    });
  }

  // -------------------------------------------------------------- equipment

  async equipmentListings(
    actingUserId: string,
    query: Record<string, string | undefined>,
  ) {
    return this.forward('GET', '/internal/ai/v1/equipment/listings', actingUserId, {
      query: query as unknown as Record<string, string>,
    });
  }

  async equipmentCategories(actingUserId: string) {
    return this.forward('GET', '/internal/ai/v1/equipment/categories', actingUserId);
  }

  // ------------------------------------------------------------- forwarding

  /**
   * The only place AiServiceClient is called. Every public method funnels
   * through here so there is exactly one place to change if the internal
   * contract evolves.
   */
  private async forward<T = unknown>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    actingUserId: string,
    opts: {
      query?: Record<string, string>;
      body?: string | FormData;
      timeoutMs?: number | false;
    } = {},
  ): Promise<T> {
    const result = await this.ai.call<T>({
      path,
      actingUserId,
      method,
      query: opts.query,
      body: opts.body,
      timeoutMs: opts.timeoutMs,
    });

    if (result.ok) {
      return result.data as T;
    }

    // Translate FastAPI's shape to a NestJS HttpException. The `data` field
    // for a 4xx carries `{detail: string | object}`; for a 5xx it may be null.
    const detail = this.extractDetail(result.data);
    if (result.status >= 400 && result.status < 500) {
      throw new HttpException(detail ?? 'Request rejected', result.status);
    }

    this.logger.warn(
      `ai-service ${method} ${path} returned ${result.status}: ${detail ?? '(no detail)'}`,
    );
    throw new BadGatewayException(detail ?? 'Upstream AI service failed');
  }

  private extractDetail(data: unknown): string | null {
    if (!data || typeof data !== 'object') return null;
    const d = data as { detail?: unknown; message?: unknown };
    if (typeof d.detail === 'string') return d.detail;
    if (typeof d.message === 'string') return d.message;
    if (Array.isArray(d.detail)) {
      return (
        d.detail
          .map((item) =>
            typeof item === 'string'
              ? item
              : typeof (item as { msg?: unknown })?.msg === 'string'
                ? (item as { msg: string }).msg
                : '',
          )
          .filter(Boolean)
          .join('. ') || null
      );
    }
    return null;
  }
}
