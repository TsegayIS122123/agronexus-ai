import { get } from "@/lib/api-client";

export const consumerApi = {
  dashboard: () => get<{ stats: unknown; recent_activity: unknown[] }>("/consumer/dashboard"),
};
