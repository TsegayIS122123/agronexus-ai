/**
 * The one place the frontend talks to the NestJS identity service.
 *
 * This is a real HTTP client, not a stand-in. Every call here maps to a route
 * that exists in `backend/src/auth/auth.controller.ts`, and the status codes
 * asserted in the comments are the ones enforced by
 * `backend/test/auth.e2e-spec.ts`, which runs those routes against real
 * PostgreSQL. If a signature here drifts from the backend, that e2e suite is
 * what will say so.
 *
 * Tokens are not written to localStorage. See ./session.ts for why.
 */

import { post, get, ApiError } from "@/lib/api-client";

/** Re-exported so the screens can branch on the HTTP status without a second import. */
export { ApiError };

export const AUTH_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

/**
 * The identity service reads the access token from the `Authorization` header on
 * its protected routes, so a call without this is anonymous no matter what token
 * the caller happens to be holding. Omitted entirely when there is no token, which
 * lets the service answer 401 rather than being handed `Bearer null`.
 */
function bearerHeaders(accessToken?: string | null): Record<string, string> {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export const API = {
  register: "/api/v1/auth/register",
  login: "/api/v1/auth/login",
  me: "/api/v1/auth/me",
  verifyEmail: "/api/v1/auth/verify-email",
  resendVerification: "/api/v1/auth/resend-verification",
  requestPasswordReset: "/api/v1/auth/request-password-reset",
  resetPassword: "/api/v1/auth/reset-password",
  otpRequest: "/api/v1/auth/otp/request",
  otpVerify: "/api/v1/auth/otp/verify",
  refresh: "/api/v1/auth/refresh",
  logout: "/api/v1/auth/logout",
} as const;

export type Locale4 = "en" | "am" | "om" | "ti";
export type OtpChannel = "email" | "sms";
export type OtpPurpose = "login" | "verify_email" | "verify_phone" | "reset_password";

/** Mirrors `PublicUser` in backend/src/auth/dto/auth.types.ts. Never has a password hash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string | null;
  region: string | null;
  role: "farmer" | "processor" | "consumer" | "admin" | null;
  isVerified: boolean;
  createdAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface AuthResult {
  user: PublicUser;
  tokens: TokenPair;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  language: Locale4;
  region?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Thrown when login is refused because the address is not verified. The backend
 * answers 403 with "Email address is not verified", distinct from the 401 it
 * returns for a bad password, which is what lets the login screen offer to resend
 * instead of telling the user their password is wrong.
 */
export class EmailNotVerifiedError extends Error {
  constructor(public readonly email: string) {
    super("Email address is not verified");
    this.name = "EmailNotVerifiedError";
  }
}

/** 429 from the throttler. The service does not send Retry-After, so we only know it happened. */
export class RateLimitedError extends Error {
  constructor() {
    super("Too many attempts");
    this.name = "RateLimitedError";
  }
}

/**
 * The most specific text available for an error, for matching on and for
 * display. `ApiError.message` carries a "(HTTP nnn)" suffix added for logs,
 * which is noise in front of a user, and the service's own wording lives in
 * `detail`.
 */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.detail ?? error.message;
  return error instanceof Error ? error.message : "";
}

function translate(error: unknown): never {
  if (error instanceof ApiError) {
    if (error.status === 429) throw new RateLimitedError();
    if (error.status === 403 && /not verified/i.test(error.detail ?? "")) {
      throw new EmailNotVerifiedError("");
    }
  }
  throw error;
}

export const authApi = {
  /** 201. Returns an unverified user; the issued token pair cannot reach protected routes yet. */
  register: (input: RegisterInput) =>
    post<AuthResult>(API.register, input, undefined, AUTH_BASE_URL).catch(translate),

  /** 200. 403 if unverified, 401 for a wrong password *and* for an unknown account. */
  login: (input: LoginInput) =>
    post<AuthResult>(API.login, input, undefined, AUTH_BASE_URL).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 403 && /not verified/i.test(error.detail ?? "")) {
        throw new EmailNotVerifiedError(input.email);
      }
      translate(error);
    }),

  me: (accessToken?: string) =>
    get<PublicUser>(API.me, undefined, AUTH_BASE_URL, bearerHeaders(accessToken)).catch(translate),

  /** 200 {verified}. 403 if the token was already consumed. */
  verifyEmail: (token: string) =>
    post<{ verified: boolean }>(API.verifyEmail, { token }, undefined, AUTH_BASE_URL).catch(translate),

  /** 200 {sent} even for an unknown address, on purpose, so this cannot enumerate accounts. */
  resendVerification: (email: string) =>
    post<{ sent: boolean }>(API.resendVerification, { email }, undefined, AUTH_BASE_URL).catch(translate),

  /** 200 {sent} always, for the same reason. */
  requestPasswordReset: (email: string) =>
    post<{ sent: boolean }>(API.requestPasswordReset, { email }, undefined, AUTH_BASE_URL).catch(translate),

  /** 200 {reset}. */
  resetPassword: (token: string, newPassword: string) =>
    post<{ reset: boolean }>(API.resetPassword, { token, newPassword }, undefined, AUTH_BASE_URL).catch(translate),

  otpRequest: (email: string, channel: OtpChannel, purpose: OtpPurpose = "login") =>
    post<{ sent: boolean; expiresIn: number }>(API.otpRequest, { email, channel, purpose }, undefined, AUTH_BASE_URL).catch(translate),

  otpVerify: (email: string, code: string, purpose: OtpPurpose = "login") =>
    post<AuthResult>(API.otpVerify, { email, code, purpose }, undefined, AUTH_BASE_URL).catch(translate),

  /**
   * 200 {user, tokens} with a new pair, same shape as login. The presented token
   * is retired as part of the rotation, so the replacement has to be stored.
   */
  refresh: (refreshToken: string) =>
    post<AuthResult>(API.refresh, { refreshToken }, undefined, AUTH_BASE_URL).catch(translate),

  /** 200 {loggedOut}. The refresh token stops working immediately. */
  logout: (refreshToken: string) =>
    post<{ loggedOut: boolean }>(API.logout, { refreshToken }, undefined, AUTH_BASE_URL).catch(translate),
};

/**
 * `components/AuthProvider.tsx` still imports these names. It is scheduled for
 * replacement once the auth screens are wired into the app shell, and until then
 * the aliases keep it compiling without pretending its old response shape is
 * correct. They will be deleted with that component rather than left as API.
 */
export type LoginRequest = LoginInput;
export type RegisterRequest = RegisterInput & { role?: string };
