import { BadGatewayException, HttpException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AiProxyService } from './ai-proxy.service';
import { AiServiceClient } from '../internal/ai-service.client';

describe('AiProxyService', () => {
  let service: AiProxyService;
  let client: { call: jest.Mock };

  beforeEach(async () => {
    client = {
      call: jest.fn().mockResolvedValue({ ok: true, status: 200, data: {} }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [AiProxyService, { provide: AiServiceClient, useValue: client }],
    }).compile();

    service = moduleRef.get(AiProxyService);
  });

  it('forwards disease history with the acting user id', async () => {
    await service.diseaseHistory('user-42', 'farmer-7');

    expect(client.call).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        path: '/internal/ai/v1/disease/history/farmer-7',
        actingUserId: 'user-42',
      }),
    );
  });

  it('forwards chat create-session as a JSON body', async () => {
    await service.chatCreateSession('user-42', 'am');

    const args = client.call.mock.calls[0][0];
    expect(args.path).toBe('/internal/ai/v1/chat/sessions');
    expect(args.body).toBe(JSON.stringify({ language: 'am' }));
  });

  it('translates a 4xx into an HttpException with the FastAPI detail', async () => {
    client.call.mockResolvedValueOnce({
      ok: false,
      status: 403,
      data: { detail: 'Access denied. Required role: [processor]' },
    });

    // Call once and inspect the rejected promise, rather than calling twice.
    // mockResolvedValueOnce supplies a single response; a second invocation
    // would fall through to the default mock (ok: true) and never throw.
    const promise = service.industryFeasibility('user-42', {
      product_name: 'Teff flour',
      capital: 100000,
      quantity: 1000,
    });

    await expect(promise).rejects.toBeInstanceOf(HttpException);
    await expect(promise).rejects.toMatchObject({
      status: 403,
      message: 'Access denied. Required role: [processor]',
    });
  });  it('translates a 5xx into BadGatewayException', async () => {
    client.call.mockResolvedValueOnce({
      ok: false,
      status: 500,
      data: { detail: 'Internal server error' },
    });

    await expect(service.priceCrops('user-42')).rejects.toBeInstanceOf(
      BadGatewayException,
    );
  });

  it('passes query parameters through for price forecast', async () => {
    await service.priceForecast('user-42', {
      crop: 'teff',
      region: 'shewa',
      days: '30',
    });

    const args = client.call.mock.calls[0][0];
    expect(args.path).toBe('/internal/ai/v1/prices/forecast');
    expect(args.query).toEqual({ crop: 'teff', region: 'shewa', days: '30' });
  });
});
