import { get } from "@/lib/api-client";

export const processorApi = {
  dashboard: () => get<{ stats: unknown; recent_activity: unknown[] }>("/processor/dashboard"),
  equipment: () => get<{ equipment: unknown[] }>("/processor/equipment"),
  feasibility: (listingId: string) => get<{ assessment: unknown }>(`/processor/feasibility/${listingId}`),
  quality: (submissionId: string) => get<{ report: unknown }>(`/processor/quality/${submissionId}`),
};
