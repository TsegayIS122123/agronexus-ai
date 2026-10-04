/**
 * Order status values.
 *
 * UPPERCASE for the same reason as ListingStatus: SQLAlchemy's `Enum()` stores
 * the enum member's NAME. The API boundary lowercases before serializing.
 *
 * The valid-transition map in MarketplaceService must use these uppercase
 * values as keys. A dict keyed by lowercase strings would silently never match,
 * which is a bug the Python source has been flirting with — do not reproduce it.
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}
