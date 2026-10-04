import { IsIn, IsString } from 'class-validator';

/**
 * The six statuses an order can hold, in the lowercase form the API uses.
 *
 * The DTO accepts lowercase because that is what the frontend sends and what
 * the published contract says. The service maps to the UPPERCASE enum the
 * database stores before any comparison or write.
 *
 * Valid-transition rules live in the service, not here: a transition is only
 * meaningful relative to the order's current status, which this DTO cannot see.
 */
export const ORDER_STATUS_VALUES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export type OrderStatusValue = (typeof ORDER_STATUS_VALUES)[number];

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(ORDER_STATUS_VALUES)
  status: OrderStatusValue;
}
