import {
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/**
 * Order creation payload.
 *
 * listingId is validated as a UUID so a malformed value is rejected at the
 * DTO boundary rather than reaching Postgres and producing a driver-level
 * error that reads like a server fault.
 */
export class CreateOrderDto {
  @IsUUID('4')
  listingId: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  deliveryNotes?: string;
}
