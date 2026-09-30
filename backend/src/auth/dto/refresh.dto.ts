import { IsString, Length } from 'class-validator';

export class RefreshDto {
  @IsString()
  @Length(20, 256, { message: 'refreshToken is malformed' })
  refreshToken: string;
}
