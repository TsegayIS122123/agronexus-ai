/**
 * Must stay in sync with app/models/user.py's UserRole and with the `userrole`
 * Postgres enum created in Alembic revision f6d50714db20.
 */
export enum UserRole {
  FARMER = 'farmer',
  PROCESSOR = 'processor',
  CONSUMER = 'consumer',
  ADMIN = 'admin',
}
