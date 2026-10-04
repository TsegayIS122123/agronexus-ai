import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/** Header carrying the signed internal token. */
export const INTERNAL_TOKEN_HEADER = 'X-Internal-Service-Token';
/** Header naming the already-authenticated user this call acts for. */
export const INTERNAL_USER_HEADER = 'X-Internal-Service-User';

/**
 * Deliberately short. The token crosses one network hop inside our own
 * infrastructure and is minted immediately before the request, so there is no
 * reason for it to outlive that request by much.
 */
export const INTERNAL_TOKEN_TTL_SECONDS = 60;

/**
 * Distinguishes an internal token from a user access token even if the secrets
 * were ever misconfigured to collide. ai-service requires this exact value.
 */
export const INTERNAL_TOKEN_TYPE = 'internal';

export const MIN_INTERNAL_SECRET_LENGTH = 32;

/**
 * Mints the credential backend presents to ai-service.
 *
 * The problem this solves: ai-service authenticates a browser with its own
 * `access_token` cookie, signed with its own `SECRET_KEY`. The backend holds a
 * bearer session for the user and nothing ai-service would accept, so a proxied
 * call arrives unauthenticated. This service gives the backend a credential of
 * its own instead of sharing a user one.
 *
 * Two properties matter and are enforced here rather than trusted:
 *
 * 1. The key is `INTERNAL_SERVICE_SECRET`, never `JWT_SECRET`. Sharing a key
 *    would make a user's access token a valid service credential.
 * 2. The payload carries no `role`. ai-service re-reads the user row and takes
 *    the role from the database, so a token cannot assert a role.
 */
@Injectable()
export class InternalTokenService {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /**
   * Read per call rather than cached, so a rotated secret takes effect without
   * a restart.
   */
  private secret(): string {
    const value = this.config.get<string>('INTERNAL_SERVICE_SECRET');
    if (!value || value.trim() === '') {
      throw new InternalServerErrorException(
        'INTERNAL_SERVICE_SECRET is not configured, so no backend-to-ai-service ' +
          'call can be authenticated. Set it in backend/.env and use the same ' +
          'value for ai-service.',
      );
    }
    if (value.length < MIN_INTERNAL_SECRET_LENGTH) {
      throw new InternalServerErrorException(
        `INTERNAL_SERVICE_SECRET must be at least ${MIN_INTERNAL_SECRET_LENGTH} characters.`,
      );
    }
    return value;
  }

  /**
   * Mint a token acting for `actingUserId`.
   *
   * `sub` is the acting user is, because ai-service requires a `sub` and
   * resolves the user row from it; the role it authorizes is read from that
   * row, not from this token.
   */
  async mint(actingUserId: string): Promise<string> {
    if (!actingUserId || actingUserId.trim() === '') {
      throw new InternalServerErrorException(
        'An internal service token must name the user it acts for.',
      );
    }

    return this.jwt.signAsync(
      {
        sub: actingUserId,
        typ: INTERNAL_TOKEN_TYPE,
        aud: 'ai-service',
      },
      {
        secret: this.secret(),
        expiresIn: INTERNAL_TOKEN_TTL_SECONDS,
      },
    );
  }

  /**
   * The headers a backend-to-ai-service call must carry.
   *
   * Both are always sent together. The signature is the trust boundary: the
   * user header alone grants nothing, and ai-service rejects a token whose
   * `typ` is not `internal`.
   */
  async headers(actingUserId: string): Promise<Record<string, string>> {
    return {
      [INTERNAL_TOKEN_HEADER]: await this.mint(actingUserId),
      [INTERNAL_USER_HEADER]: actingUserId,
    };
  }
}