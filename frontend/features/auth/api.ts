import { post, get } from "@/lib/api-client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  language: "en" | "am";
  role: "farmer" | "processor" | "consumer";
}

export const authApi = {
  login: (body: LoginRequest) => post<{ access_token: string; user: unknown }>("/auth/login", body),
  register: (body: RegisterRequest) => post<{ access_token: string; user: unknown }>("/auth/register", body),
  me: () => get<{ user: unknown }>("/auth/me"),
};
