/**
 * Listing status values.
 *
 * The values are UPPERCASE on purpose. Alembic created the Postgres enum with
 * SQLAlchemy's `Enum(ListingStatus)`, which stores the Python enum's NAME
 * (`ACTIVE`), not its lowercase `.value` (`active`). Round-tripping a lowercase
 * value would fail the DB's enum check.
 *
 * The API boundary lowercases these before serializing, so the frontend
 * contract stays `"active"` and matches what ai-service always returned.
 *
 * Do not "fix" these to lowercase without also changing the Postgres enum.
 */
export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}
