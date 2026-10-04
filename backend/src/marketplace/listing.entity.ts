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

import { ListingStatus } from './listing-status.enum';

/**
 * Maps the existing `marketplace_listings` table.
 *
 * The table is owned by ai-service's Alembic revisions, NOT by this service.
 * `synchronize` is false app-wide, and the column set here must stay in step
 * with `ai-service/app/models/marketplace.py` or queries drift silently.
 *
 * Two details are load-bearing and easy to get wrong:
 *
 * 1. `id` has no database default. `users.id` had this same gap and every
 *    insert failed with `null value in column "id"` until it was fixed in the
 *    migration and the datasource. That fix does not extend to these tables,
 *    so the UUID is generated here in TypeScript via `@BeforeInsert`.
 *    `@PrimaryGeneratedColumn('uuid')` would compile and fail at runtime.
 *
 * 2. `price` is a float, not an integer minor unit. `docs/04-database-design.md`
 *    specifies integer minor units, but the shipped schema uses float. The
 *    type here matches what is actually in Postgres; converting the column is
 *    a separate Alembic migration recorded in the roadmap, not something to
 *    fake at the ORM layer.
 */
@Entity({ name: 'marketplace_listings' })
export class MarketplaceListing {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = randomUUID();
  }

  @Index('ix_marketplace_listings_seller_id')
  @Column({ type: 'uuid', name: 'seller_id' })
  sellerId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 100 })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string | null;

  @Column({ type: 'float' })
  quantity: number;

  @Column({ type: 'varchar', length: 50, default: 'kg' })
  unit: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'varchar', length: 10, default: 'ETB' })
  currency: string;

  @Index('ix_marketplace_listings_region')
  @Column({ type: 'varchar', length: 100 })
  region: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  district: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'quality_grade' })
  qualityGrade: string | null;

  @Column({ type: 'json', nullable: true })
  certifications: string[] | null;

  @Column({ type: 'json', nullable: true, name: 'image_urls' })
  imageUrls: string[] | null;

  @Column({
    type: 'json',
    nullable: true,
    name: 'delivery_options',
  })
  deliveryOptions: Record<string, boolean> | null;

  @Index('ix_marketplace_listings_status')
  @Column({
    type: 'enum',
    enum: ListingStatus,
    enumName: 'listingstatus',
    default: ListingStatus.ACTIVE,
  })
  status: ListingStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'expires_at' })
  expiresAt: Date | null;
}
