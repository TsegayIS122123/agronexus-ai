import { get, post, put, del } from "@/lib/api-client";

export interface ListingSummary {
  id: string;
  title: string;
  crop_type: string;
  price_minor: number;
}

export const marketplaceApi = {
  list: (query?: Record<string, string | number | boolean | undefined>) =>
    get<{ listings: ListingSummary[] }>("/marketplace", query),
  detail: (id: string) => get<{ listing: unknown }>(`/marketplace/listings/${id}`),
  create: (body: unknown) => post<{ listing: unknown }>("/marketplace/listings/new", body),
  orders: () => get<{ orders: unknown[] }>("/marketplace/orders"),
  cancelOrder: (orderId: string) => del<{ ok: boolean }>(`/marketplace/orders/${orderId}`),
};
