import { UserRole } from '../../users/user-role.enum';

/** The user shape returned by the API. Never includes passwordHash. */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  language: string | null;
  region: string | null;
  role: UserRole | null;
  isVerified: boolean;
  createdAt: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresIn: number;
}

export interface RegisterResult {
  user: PublicUser;
  tokens: TokenPair;
}

export interface LoginResult {
  user: PublicUser;
  tokens: TokenPair;
}
