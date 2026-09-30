import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user-role.enum';

/**
 * Maps the existing `users` table. It is NOT created by this service: the schema
 * belongs to ai-service's Alembic revisions. The column set here must stay in
 * step with app/models/user.py, or queries will drift silently.
 */
@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index('ix_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Index('ix_users_phone', { unique: true })
  @Column({ type: 'varchar', length: 20 })
  phone: string;

  // Never serialised to the client.
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  language: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'userrole',
    nullable: true,
  })
  role: UserRole | null;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
