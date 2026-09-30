import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { OtpChannel, OtpPurpose } from './otp.enum';

/**
 * One row per issued one-time code, for either delivery channel.
 *
 * `code_hash` holds bcrypt rather than SHA-256 deliberately: a 6-digit code has
 * only a million combinations, so a fast digest would be brute-forceable from a
 * database dump alone.
 */
@Entity({ name: 'otp_codes' })
@Index('ix_otp_codes_destination_purpose', ['destination', 'purpose'])
export class OtpCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: OtpChannel, enumName: 'otpchannel' })
  channel: OtpChannel;

  @Column({ type: 'varchar', length: 255 })
  destination: string;

  @Column({ name: 'code_hash', type: 'varchar', length: 255 })
  codeHash: string;

  @Column({ type: 'enum', enum: OtpPurpose, enumName: 'otppurpose' })
  purpose: OtpPurpose;

  @Column({ type: 'smallint', default: 0 })
  attempts: number;

  @Column({ name: 'max_attempts', type: 'smallint', default: 5 })
  maxAttempts: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'consumed_at', type: 'timestamptz', nullable: true })
  consumedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
