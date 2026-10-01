import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

/**
 * Roles a person may pick for themselves when signing up.
 *
 * `admin` is deliberately absent. Letting the registration form offer it would
 * mean anyone who can reach `/auth/register` could create themselves an
 * administrator, and the value is accepted by the database, so nothing further
 * down would stop it. A role has to be granted by someone who already holds a
 * higher one, which is a decision this endpoint is not entitled to make on their
 * behalf.
 *
 * Not optional. A user with no role reaches the product and finds an empty
 * dashboard, because every tool in it is filed under a role, and they cannot tell
 * which ones were meant for them. Making the choice at signup costs one question
 * and saves that dead end. It is a plain string, so anyone who wants a different
 * role can change it later, and anyone who wants to grant a role to somebody else
 * can do that without asking the person to re-register.
 */
export const SELF_ASSIGNABLE_ROLES = [UserRole.FARMER, UserRole.PROCESSOR, UserRole.CONSUMER] as const;

export class RegisterDto {
  @IsString()
  @Length(2, 255)
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^\+?[0-9]{7,20}$/, { message: 'phone must be a valid international number' })
  phone: string;

  @IsString()
  @Length(8, 128, { message: 'password must be 8-128 characters' })
  password: string;

  @IsOptional()
  @IsIn(['en', 'am', 'om', 'ti'])
  language?: string;

  @IsOptional()
  @IsString()
  @Length(0, 100)
  region?: string;

  @IsIn(SELF_ASSIGNABLE_ROLES, {
    message: `role must be one of ${SELF_ASSIGNABLE_ROLES.join(', ')}`,
  })
  role: UserRole;
}
