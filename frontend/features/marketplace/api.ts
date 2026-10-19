/**
 * The one place the frontend talks to the marketplace domain.
 *
 * Every call here maps to a route in
 * backend/src/marketplace/marketplace.controller.ts. The previous version of
 * this file called /marketplace (not /api/v1/marketplace/listings), typed the
 * price as price_minor and the category as crop_type — neither field exists in
 * the schema — and was imported nowhere. It is replaced, not extended.
 *
 * Response shape: NestJS returns plain objects and arrays. There is no
 * { success, data } wrapper the way ai-service had one.
 *
 * Enum statuses are lowercase strings even though the database stores
 * uppercase. The backend lowercases on serialization.
 */

import { get, post, put } from '@/lib/api-client';

export const MARKETPLACE_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

function bearerHeaders(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export type ListingStatusApi =
  | 'active'
  | 'pending'
  | 'sold'
  | 'expired'
  | 'cancelled';

export type OrderStatusApi =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface MarketplaceListing {
  id: string;
  title: string;
  description: string | null;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  region: string;
  qualityGrade: string | null;
  certifications: string[] | null;
  imageUrls: string[] | null;
  status: ListingStatusApi;
  createdAt: string;
  sellerId: string;
  district?: string | null;
  deliveryOptions?: Record<string, boolean> | null;
}

export interface MarketplaceOrder {
  id: string;
  listingId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatusApi;
  paymentStatus: string;
  createdAt: string;
  confirmedAt: string | null;
  deliveredAt: string | null;
}

export interface ListingListResult {
  total: number;
  limit: number;
  offset: number;
  listings: MarketplaceListing[];
}

export interface OrderListResult {
  total: number;
  limit: number;
  offset: number;
  orders: MarketplaceOrder[];
}

export interface ListingFilters {
  category?: string;
  region?: string;
  min_price?: string | number;
  max_price?: string | number;
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export interface CreateListingInput {
  title: string;
  description?: string;
  category: string;
  quantity: number;
  unit?: string;
  price: number;
  region: string;
  district?: string;
  qualityGrade?: string;
  certifications?: string[];
  imageUrls?: string[];
  deliveryOptions?: Record<string, boolean>;
  expiresDays?: number;
}

export interface CreateOrderInput {
  listingId: string;
  quantity: number;
  deliveryAddress?: string;
  deliveryNotes?: string;
}

export const marketplaceApi = {
  listListings: (filters: ListingFilters = {}) =>
    get<ListingListResult>(
      '/api/v1/marketplace/listings',
      filters as Record<string, string | number | undefined>,
      MARKETPLACE_BASE_URL,
    ),

  getListing: (id: string) =>
    get<MarketplaceListing>(
      `/api/v1/marketplace/listings/${id}`,
      undefined,
      MARKETPLACE_BASE_URL,
    ),

  createListing: (body: CreateListingInput, accessToken: string | null) =>
    post<MarketplaceListing>(
      '/api/v1/marketplace/listings',
      body,
      bearerHeaders(accessToken),
      MARKETPLACE_BASE_URL,
    ),

  listOrders: (
    role: 'buyer' | 'seller',
    status: string | undefined,
    accessToken: string | null,
  ) =>
    get<OrderListResult>(
      '/api/v1/marketplace/orders',
      { role, status } as Record<string, string | undefined>,
      MARKETPLACE_BASE_URL,
      bearerHeaders(accessToken),
    ),

  createOrder: (body: CreateOrderInput, accessToken: string | null) =>
    post<MarketplaceOrder>(
      '/api/v1/marketplace/orders',
      body,
      bearerHeaders(accessToken),
      MARKETPLACE_BASE_URL,
    ),

  updateOrderStatus: (
    orderId: string,
    status: OrderStatusApi,
    accessToken: string | null,
  ) =>
    put<MarketplaceOrder>(
      `/api/v1/marketplace/orders/${orderId}/status`,
      { status },
      bearerHeaders(accessToken),
      MARKETPLACE_BASE_URL,
    ),

  addReview: (
    orderId: string,
    rating: number,
    comment: string | undefined,
    accessToken: string | null,
  ) =>
    post<{
      id: string;
      rating: number;
      comment: string | null;
      createdAt: string;
    }>(
      `/api/v1/marketplace/orders/${orderId}/review`,
      { rating, comment },
      bearerHeaders(accessToken),
      MARKETPLACE_BASE_URL,
    ),

  categories: () =>
    get<string[]>(
      '/api/v1/marketplace/categories',
      undefined,
      MARKETPLACE_BASE_URL,
    ),

  regions: () =>
    get<string[]>(
      '/api/v1/marketplace/regions',
      undefined,
      MARKETPLACE_BASE_URL,
    ),
};
