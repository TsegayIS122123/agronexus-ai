import { IsEmail, IsIn, IsOptional, IsString, Length, Matches } from 'class-validator';
import { UserRole } from '../../users/user-role.enum';

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

  @IsOptional()
  @IsIn(Object.values(UserRole))
  role?: UserRole;
}
