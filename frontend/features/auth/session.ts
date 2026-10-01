/**
 * Where the session lives in the browser, and why.
 *
 * The access token is held in a module variable and never written to storage.
 * That means a full page load starts with no access token, and `ensureSession`
 * has to spend one refresh round-trip to get a usable one. That cost is the
 * price of not leaving a bearer token sitting in localStorage where any XSS can
 * read it.
 *
 * The refresh token goes in a SameSite=Lax cookie rather than localStorage for
 * the same reason: it should not be attached to cross-site requests. It is still
 * readable by JavaScript, so it is not a complete defence against XSS.
 *
 * The complete defence is an httpOnly, Secure, SameSite=Strict cookie set by the
 * service, which needs the refresh endpoint to accept a cookie instead of a JSON
 * body. That is a backend change and is tracked for the security hardening phase;
 * it is called out here so this file is not mistaken for the final answer.
 */

import { authApi, type PublicUser, type TokenPair } from "./api";

const REFRESH_COOKIE = "agronexus_refresh";
const ACCESS_TTL_MS = 14 * 60 * 1000;

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let currentUser: PublicUser | null = null;
let inflight: Promise<PublicUser | null> | null = null;

type Listener = (state: { user: PublicUser | null; ready: boolean }) => void;
const listeners = new Set<Listener>();

function notify(ready: boolean) {
  const state = { user: currentUser, ready };
  listeners.forEach((listener) => listener(state));
}

function readRefreshCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${REFRESH_COOKIE}=`));
  return match ? decodeURIComponent(match.slice(REFRESH_COOKIE.length + 1)) : null;
}

function writeRefreshCookie(token: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(token)}; path=/; Max-Age=${ACCESS_TTL_MS / 1000}; SameSite=Lax${secure}`;
}

function clearRefreshCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${REFRESH_COOKIE}=; path=/; Max-Age=0; SameSite=Lax`;
}

function storeTokens(tokens: TokenPair) {
  accessToken = tokens.accessToken;
  accessTokenExpiresAt = Date.now() + tokens.accessTokenExpiresIn * 1000;
  writeRefreshCookie(tokens.refreshToken);
}

export function getAccessToken(): string | null {
  if (accessToken && Date.now() < accessTokenExpiresAt - 30_000) return accessToken;
  return null;
}

export function getUser(): PublicUser | null {
  return currentUser;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function establish(result: { user: PublicUser; tokens: TokenPair }): Promise<PublicUser> {
  storeTokens(result.tokens);
  currentUser = result.user;
  notify(true);
  return result.user;
}

export async function endSession(): Promise<void> {
  const refreshToken = readRefreshCookie();
  clearRefreshCookie();
  accessToken = null;
  accessTokenExpiresAt = 0;
  currentUser = null;
  notify(true);
  if (refreshToken) {
    // The local session is already gone, so a failure here is not worth surfacing.
    await authApi.logout(refreshToken).catch(() => undefined);
  }
}

/**
 * Restores a session on page load by exchanging the refresh cookie. Safe to call
 * from several components: concurrent callers share one round-trip.
 */
export function ensureSession(): Promise<PublicUser | null> {
  if (inflight) return inflight;
  const refreshToken = readRefreshCookie();
  if (!refreshToken) {
    currentUser = null;
    notify(true);
    return Promise.resolve(null);
  }

  inflight = (async () => {
    try {
      const { tokens } = await authApi.refresh(refreshToken);
      storeTokens(tokens);
      const user = await authApi.me(tokens.accessToken);
      currentUser = user;
      notify(true);
      return user;
    } catch {
      // Expired, revoked or malformed cookie: drop it rather than retrying on
      // every navigation, which would hammer a rate-limited endpoint.
      clearRefreshCookie();
      accessToken = null;
      accessTokenExpiresAt = 0;
      currentUser = null;
      notify(true);
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
