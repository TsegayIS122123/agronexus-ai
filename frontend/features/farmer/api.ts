import { get, post } from "@/lib/api-client";

export interface DiseaseUploadResult {
  disease_name: string;
  disease_key: string;
  confidence: number;
  fallback_mode: boolean;
  model_version: string;
  treatment: Record<string, string>;
  recommendations: string[];
}

export const farmerApi = {
  dashboard: () => get<{ stats: unknown; recent_activity: unknown[] }>("/farmer/dashboard"),
  chat: (sessionId: string) => get<{ messages: unknown[] }>(`/farmer/chat/${sessionId}`),
  diseaseScan: (imageBase64: string, cropType: string) =>
    post<DiseaseUploadResult>("/disease/scan", { image: imageBase64, crop_type: cropType }),
  prices: () => get<{ prices: unknown[] }>("/prices"),
};
