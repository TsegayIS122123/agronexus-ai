import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { VerificationPurpose } from './verification-purpose.enum';

/**
 * One row per issued email-verification token.
 *
 * Only the SHA-256 hash of the token is stored. A database leak therefore does
 * not hand an attacker working verification links.
 */
@Entity({ name: 'email_verifications' })
@Index('ix_email_verifications_user_purpose', ['userId', 'purpose'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash: string;

  @Column({ type: 'enum', enum: VerificationPurpose, enumName: 'verificationpurpose' })
  purpose: VerificationPurpose;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
