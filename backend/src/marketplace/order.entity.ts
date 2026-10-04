import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { randomUUID } from 'node:crypto';

import { OrderStatus } from './order-status.enum';

/**
 * One message in an order's conversation.
 *
 * The Python model stores this inside a JSON column as
 * `{sender_id, message, timestamp}`. The snake_case key names are preserved
 * here because they are already written into existing rows: renaming them in
 * TypeScript would silently produce objects that do not match what is stored.
 */
export interface OrderMessageRecord {
  sender_id: string;
  message: string;
  timestamp: string;
}

/**
 * Maps the existing `marketplace_orders` table.
 *
 * Same ownership rules as MarketplaceListing: Alembic owns the schema,
 * `synchronize` is false, and `id` has no database default so it is generated
 * via `@BeforeInsert`.
 *
 * Deliberately NOT declared here:
 *
 * - Relations to MarketplaceListing or User. The FK constraints already exist
 *   in Postgres. Adding `@ManyToOne` now would force an eager/lazy loading
 *   decision that belongs to the service layer, where the query shape is
 *   actually known. Plain UUID columns until then.
 *
 * - An enum for `payment_status`. The Python model uses a plain `String(50)`
 *   with values like `pending` / `paid` / `failed`. There is no Postgres enum
 *   to map onto, so inventing one here would either fail on write or accept
 *   values the database does not constrain.
 */
@Entity({ name: 'marketplace_orders' })
export class MarketplaceOrder {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = randomUUID();
  }

  @Index('ix_marketplace_orders_listing_id')
  @Column({ type: 'uuid', name: 'listing_id' })
  listingId: string;

  @Index('ix_marketplace_orders_buyer_id')
  @Column({ type: 'uuid', name: 'buyer_id' })
  buyerId: string;

  @Index('ix_marketplace_orders_seller_id')
  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'float', name: 'unit_price' })
  unitPrice: number;

  @Column({ type: 'float', name: 'total_price' })
  totalPrice: number;

  @Column({ type: 'json', nullable: true })
  messages: OrderMessageRecord[] | null;

  @Index('ix_marketplace_orders_status')
  @Column({
    type: 'enum',
    enum: OrderStatus,
    enumName: 'orderstatus',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'text', nullable: true, name: 'delivery_address' })
  deliveryAddress: string | null;

  @Column({ type: 'text', nullable: true, name: 'delivery_notes' })
  deliveryNotes: string | null;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
    name: 'payment_status',
  })
  paymentStatus: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'payment_method' })
  paymentMethod: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'confirmed_at' })
  confirmedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'delivered_at' })
  deliveredAt: Date | null;
}
