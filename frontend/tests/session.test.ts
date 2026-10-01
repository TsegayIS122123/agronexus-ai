/**
 * `session.ts` against a mocked `fetch`, rather than a mocked `authApi`.
 *
 * The reason is that the screen tests replace the whole client, so they can only
 * ever prove the screens call it. They cannot notice what the client does with a
 * response, and that is where the two bugs this file now guards actually lived:
 * `/me` was called without the access token it had been handed, and the flat
 * refresh response was read as though it were wrapped in `tokens`. Both were
 * types the compiler had no reason to doubt.
 *
 * Mocking the network keeps this honest about the shape of the wire without
 * needing the service running. The declared response shapes still have to agree
 * with `backend/src/auth/dto/auth.types.ts`; that agreement is the part a reader
 * has to keep true by hand.
 */

type SessionModule = typeof import("@/features/auth/session");

const ACCESS = "access-token-from-refresh";
const REFRESH = "refresh-token-from-refresh";

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => "application/json" },
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function publicUser() {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Tsegaye Assefa",
    email: "tsegayassefa27@gmail.com",
    phone: "+251911000000",
    language: "en",
    region: null,
    role: "farmer",
    isVerified: true,
    createdAt: "2026-10-01T00:00:00.000Z",
  };
}

/** Loads a fresh copy so module state does not leak between tests. */
async function loadSession(): Promise<SessionModule> {
  let mod!: SessionModule;
  await jest.isolateModulesAsync(async () => {
    mod = (await import("@/features/auth/session")) as SessionModule;
  });
  return mod;
}

function setRefreshCookie(value: string) {
  document.cookie = `agronexus_refresh=${value}; path=/; SameSite=Lax`;
}

beforeEach(() => {
  document.cookie = "agronexus_refresh=; path=/; Max-Age=0";
  jest.restoreAllMocks();
});

describe("session restore", () => {
  it("reads the refresh response as {user, tokens}, the shape the service sends", async () => {
    setRefreshCookie("stale-refresh");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          user: publicUser(),
          tokens: {
            accessToken: ACCESS,
            refreshToken: REFRESH,
            accessTokenExpiresIn: 900,
          },
        }),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const session = await loadSession();
    const user = await session.ensureSession();

    expect(user?.email).toBe("tsegayassefa27@gmail.com");
    expect(session.getAccessToken()).toBe(ACCESS);
    expect(session.getUser()?.id).toBe(publicUser().id);
    // The rotated token has to be kept, or the next page load has nothing to use.
    expect(document.cookie).toContain(`agronexus_refresh=${REFRESH}`);
    // The service already told us who this is; asking again would be a wasted call.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends the access token to /me, which is the only thing that call accepts", async () => {
    // Called directly rather than through ensureSession: /me takes a token as an
    // argument, and accepting an argument is not the same as using it. This one
    // used to accept the token, drop it, and get a 401 for its trouble.
    let mod!: typeof import("@/features/auth/api");
    await jest.isolateModulesAsync(async () => {
      mod = (await import("@/features/auth/api")) as typeof import("@/features/auth/api");
    });

    const fetchMock = jest.fn().mockResolvedValueOnce(jsonResponse(publicUser()));
    global.fetch = fetchMock as unknown as typeof fetch;

    const user = await mod.authApi.me(ACCESS);

    expect(user.email).toBe("tsegayassefa27@gmail.com");
    expect(String(fetchMock.mock.calls[0][0])).toContain("/api/v1/auth/me");
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${ACCESS}`);
  });

  it("omits the Authorization header entirely when there is no token", async () => {
    let mod!: typeof import("@/features/auth/api");
    await jest.isolateModulesAsync(async () => {
      mod = (await import("@/features/auth/api")) as typeof import("@/features/auth/api");
    });

    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(jsonResponse({ statusCode: 401, message: "Unauthorized" }, 401));
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(mod.authApi.me()).rejects.toThrow();

    // `Bearer null` or `Bearer undefined` would read as a malformed credential
    // rather than an anonymous request, and the service would answer 401 either
    // way, which hides the real problem.
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it("gives up cleanly when the service rejects the refresh token", async () => {
    setRefreshCookie("revoked-refresh");
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ statusCode: 401, message: "Refresh token is invalid or has expired" }, 401),
      );
    global.fetch = fetchMock as unknown as typeof fetch;

    const session = await loadSession();
    const user = await session.ensureSession();

    expect(user).toBeNull();
    expect(session.getAccessToken()).toBeNull();
    // Leaving a rejected cookie in place means asking again on every navigation.
    expect(document.cookie).not.toContain("revoked-refresh");
  });

  it("does not call the service at all when there is no cookie", async () => {
    const fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const session = await loadSession();
    const user = await session.ensureSession();

    expect(user).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
