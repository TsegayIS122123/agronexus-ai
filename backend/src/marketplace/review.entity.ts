import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { randomUUID } from 'node:crypto';

/**
 * Maps the existing `marketplace_reviews` table.
 *
 * Same ownership and UUID rules as the other two marketplace entities: Alembic
 * owns the table, `synchronize` is false, and `id` has no database default so
 * it is generated in TypeScript.
 *
 * `rating` is an int in Postgres with no CHECK constraint. The 1–5 range is
 * enforced by the DTO in the service layer (Prompt 2), not by the database.
 * That means a bug that bypasses the DTO could still write a 0 or a 9 — worth
 * knowing rather than assuming the DB stops it.
 */
@Entity({ name: 'marketplace_reviews' })
export class MarketplaceReview {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @BeforeInsert()
  generateId(): void {
    if (!this.id) this.id = randomUUID();
  }

  @Index('ix_marketplace_reviews_order_id')
  @Column({ type: 'uuid', name: 'order_id' })
  orderId: string;

  @Index('ix_marketplace_reviews_reviewer_id')
  @Column({ type: 'uuid', name: 'reviewer_id' })
  reviewerId: string;

  @Column({ type: 'uuid', name: 'reviewed_id' })
  reviewedId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
