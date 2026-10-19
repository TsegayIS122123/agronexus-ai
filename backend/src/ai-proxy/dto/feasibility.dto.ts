import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FeasibilityDto {
  @IsString()
  @MaxLength(100)
  product_name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @IsNumber()
  @Min(1)
  @Max(1_000_000_000)
  capital: number;

  @IsNumber()
  @Min(1)
  @Max(10_000_000)
  quantity: number;
}
