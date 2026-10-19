import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsUUID('4')
  session_id?: string | null;

  @IsString()
  @MaxLength(10)
  language: string;
}
