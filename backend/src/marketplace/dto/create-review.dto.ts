import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

/**
 * Review payload.
 *
 * The 1-5 range is enforced HERE, at the DTO boundary, and not inside the
 * service. The Python source validated it inside the handler and then caught
 * its own ValueError under a broad except Exception, which turned a 400 into
 * a 500. Rejecting the value before the service is called is what makes the
 * status code correct rather than incidental.
 *
 * Postgres has no CHECK constraint on rating, so this validator is the only
 * thing standing between a caller and a 0-star or 9-star row.
 */
export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
