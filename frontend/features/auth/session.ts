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

import { useEffect, useState } from "react";

import { authApi, type PublicUser, type TokenPair } from "./api";

const REFRESH_COOKIE = "agronexus_refresh";

/**
 * How long the browser keeps the refresh cookie before it stops offering it.
 *
 * This is deliberately not the access token's lifetime. The cookie carries a
 * refresh token, and tying the cookie to the 14-minute access token signed people
 * out every 14 minutes even though their refresh token was still valid for days.
 *
 * It is also not a claim to know how long the token lives: that is the service's
 * decision, and the service is the only thing that gets to enforce it. This value
 * is just an upper bound on how long the browser bothers to ask. If it outlives
 * the token, `ensureSession` gets a rejection from the service, clears the cookie
 * and carries on signed out. Being wrong here costs one wasted request, never
 * access, so the guess is safe in the direction that matters.
 */
const REFRESH_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

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
  document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(token)}; path=/; Max-Age=${REFRESH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
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
      // The service returns {user, tokens} here, the same shape as login. The user
      // comes back with the tokens, so there is no reason to spend a second request
      // asking /me who they are.
      const { user, tokens } = await authApi.refresh(refreshToken);
      storeTokens(tokens);
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

/**
 * React binding for the module-level session.
 *
 * `session.ts` deliberately holds its state in module variables rather than
 * React context: the access token must exist outside the component tree so that
 * plain API callers can read it, and so that a page reload can restore the
 * session before anything renders. That leaves no context provider for a
 * component to consume, which is what this hook is for.
 *
 * `loading` stays true until the one refresh round-trip has settled, so a
 * component that needs to know who the user is must not read `user` before then.
 * Resolving to `null` means signed out; it is not an error state.
 */
export function useSession(): { user: PublicUser | null; loading: boolean; refresh: () => void } {
  const [state, setState] = useState<{ user: PublicUser | null; ready: boolean }>(() => ({
    user: currentUser,
    // Until the first notify() arrives we cannot claim to be signed out; the
    // refresh round-trip may still be about to restore a session.
    ready: currentUser !== null,
  }));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => subscribe(setState), []);

  useEffect(() => {
    if (getUser() !== null) return;
    // ensureSession() always calls notify() on every path, so the subscription
    // above flips `ready` whether the round-trip succeeds or fails. There is no
    // separate setLoading here to get out of step with it.
    void ensureSession();
  }, [attempt]);

  return { user: state.user, loading: !state.ready, refresh: () => setAttempt((n) => n + 1) };
}
