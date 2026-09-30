import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  role: string | null;
  verified: boolean;
  typ: 'access';
}

/**
 * Validates the access token signature, then re-reads the user.
 *
 * The DB read is the point: a token minted before verification must stop working
 * the moment `is_verified` flips, and a deactivated account must not keep a
 * valid token until it expires.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException('Account no longer exists');

    // Registration hands back a token pair before the address is confirmed, so
    // this is the only place that can refuse it. Reading is_verified from the
    // database rather than trusting the claim also means a token minted before
    // verification stops working the instant the flag flips.
    if (!user.isVerified) {
      throw new UnauthorizedException('Email address is not verified');
    }

    return {
      userId: user.id,
      role: user.role,
      verified: user.isVerified,
    };
  }
}
