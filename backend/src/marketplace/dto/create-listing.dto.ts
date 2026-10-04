import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Listing creation payload.
 *
 * Mirrors CreateListingRequest in ai-service's marketplace route, minus the
 * subcategory field: the Python service wrote quality_grade into subcategory
 * by accident, and that duplication is not ported here.
 *
 * expiresDays is bounded rather than free. An unbounded value lets a caller
 * create a listing that never expires and never gets cleaned up; the future
 * cleanup job assumes a finite horizon.
 */
export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  category: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(1_000_000)
  quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(100_000_000)
  price: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  region: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  qualityGrade?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(50, { each: true })
  certifications?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  imageUrls?: string[];

  @IsOptional()
  deliveryOptions?: Record<string, boolean>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  expiresDays?: number;
}
