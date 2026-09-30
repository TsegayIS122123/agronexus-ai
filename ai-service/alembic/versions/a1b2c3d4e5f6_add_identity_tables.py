"""add identity verification, password reset, otp and refresh token tables

Revision ID: a1b2c3d4e5f6
Revises: f6d50714db20
Create Date: 2026-09-30 10:30:00.000000

The existing `users` table already carried an `is_verified` column, but nothing
ever set it and there was no storage for a verification link, a password reset,
a one-time code, or a refresh token. This revision adds only those four tables,
so it is purely additive and leaves the 15 pre-existing tables untouched.

Security notes that drove the column choices:
  * every token column stores a hash, never the value handed to the user;
  * verification and reset tokens use SHA-256 because they are 256-bit random
    values, while otp_codes uses bcrypt because a 6-digit code is only ~20 bits
    and would be trivially reversible from a fast digest;
  * consumed_at gives single use; expiry is enforced in application code so the
    row survives long enough to be audited after it expires.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'f6d50714db20'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # The pre-existing `users` table was created with a bare `sa.UUID()` primary
    # key, so it has no database-side default. SQLAlchemy generated the value in
    # Python, but the NestJS/TypeORM service expects Postgres to supply it via
    # @PrimaryGeneratedColumn('uuid'). Without a default every insert from the
    # backend fails with a not-null violation, so the column default is added
    # here. gen_random_uuid() comes from pgcrypto, which is created if missing.
    op.execute('CREATE EXTENSION IF NOT EXISTS pgcrypto')
    op.alter_column(
        'users',
        'id',
        server_default=sa.text('gen_random_uuid()'),
        existing_type=sa.UUID(),
        existing_nullable=False,
    )

    op.create_table(
        'email_verifications',
        # Server-side default so the NestJS/TypeORM service can rely on
        # @PrimaryGeneratedColumn('uuid') instead of supplying the value.
        sa.Column(
            'id',
            sa.UUID(),
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column(
            'purpose',
            sa.Enum('verify_email', name='verificationpurpose'),
            nullable=False,
        ),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_email_verifications_user_purpose',
        'email_verifications',
        ['user_id', 'purpose'],
    )
    op.create_index(
        'ix_email_verifications_token_hash',
        'email_verifications',
        ['token_hash'],
        unique=True,
    )
    op.create_foreign_key(
        'fk_email_verifications_user_id',
        'email_verifications',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    op.create_table(
        'password_reset_tokens',
        # Server-side default so the NestJS/TypeORM service can rely on
        # @PrimaryGeneratedColumn('uuid') instead of supplying the value.
        sa.Column(
            'id',
            sa.UUID(),
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('request_ip', sa.String(length=64), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_password_reset_tokens_token_hash',
        'password_reset_tokens',
        ['token_hash'],
        unique=True,
    )
    op.create_index(
        'ix_password_reset_tokens_user_id',
        'password_reset_tokens',
        ['user_id'],
    )
    op.create_foreign_key(
        'fk_password_reset_tokens_user_id',
        'password_reset_tokens',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    op.create_table(
        'otp_codes',
        # Server-side default so the NestJS/TypeORM service can rely on
        # @PrimaryGeneratedColumn('uuid') instead of supplying the value.
        sa.Column(
            'id',
            sa.UUID(),
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('channel', sa.Enum('email', 'sms', name='otpchannel'), nullable=False),
        sa.Column('destination', sa.String(length=255), nullable=False),
        # bcrypt digest: 60 chars, unlike the 64-char SHA-256 above.
        sa.Column('code_hash', sa.String(length=255), nullable=False),
        sa.Column(
            'purpose',
            sa.Enum(
                'login',
                'verify_email',
                'verify_phone',
                'reset_password',
                name='otppurpose',
            ),
            nullable=False,
        ),
        sa.Column('attempts', sa.SmallInteger(), server_default='0', nullable=False),
        sa.Column('max_attempts', sa.SmallInteger(), server_default='5', nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_otp_codes_destination_purpose',
        'otp_codes',
        ['destination', 'purpose'],
    )
    op.create_index('ix_otp_codes_user_id', 'otp_codes', ['user_id'])
    op.create_foreign_key(
        'fk_otp_codes_user_id',
        'otp_codes',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )

    op.create_table(
        'refresh_tokens',
        # Server-side default so the NestJS/TypeORM service can rely on
        # @PrimaryGeneratedColumn('uuid') instead of supplying the value.
        sa.Column(
            'id',
            sa.UUID(),
            server_default=sa.text('gen_random_uuid()'),
            nullable=False,
        ),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('replaced_by_id', sa.UUID(), nullable=True),
        sa.Column('request_ip', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.String(length=512), nullable=True),
        sa.Column(
            'created_at',
            sa.DateTime(timezone=True),
            server_default=sa.text('(CURRENT_TIMESTAMP)'),
            nullable=True,
        ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(
        'ix_refresh_tokens_user_revoked',
        'refresh_tokens',
        ['user_id', 'revoked_at'],
    )
    op.create_index(
        'ix_refresh_tokens_token_hash',
        'refresh_tokens',
        ['token_hash'],
        unique=True,
    )
    op.create_foreign_key(
        'fk_refresh_tokens_user_id',
        'refresh_tokens',
        'users',
        ['user_id'],
        ['id'],
        ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_refresh_tokens_replaced_by_id',
        'refresh_tokens',
        'refresh_tokens',
        ['replaced_by_id'],
        ['id'],
        ondelete='SET NULL',
    )


def downgrade() -> None:
    # Reverse creation order so the self-referencing FK drops first.
    op.alter_column(
        'users',
        'id',
        server_default=None,
        existing_type=sa.UUID(),
        existing_nullable=False,
    )

    op.drop_constraint('fk_refresh_tokens_replaced_by_id', 'refresh_tokens')
    op.drop_constraint('fk_refresh_tokens_user_id', 'refresh_tokens')
    op.drop_index('ix_refresh_tokens_token_hash', table_name='refresh_tokens')
    op.drop_index('ix_refresh_tokens_user_revoked', table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_constraint('fk_otp_codes_user_id', 'otp_codes')
    op.drop_index('ix_otp_codes_user_id', table_name='otp_codes')
    op.drop_index('ix_otp_codes_destination_purpose', table_name='otp_codes')
    op.drop_table('otp_codes')
    sa.Enum(name='otpchannel').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='otppurpose').drop(op.get_bind(), checkfirst=True)

    op.drop_constraint('fk_password_reset_tokens_user_id', 'password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_user_id', table_name='password_reset_tokens')
    op.drop_index('ix_password_reset_tokens_token_hash', table_name='password_reset_tokens')
    op.drop_table('password_reset_tokens')

    op.drop_constraint('fk_email_verifications_user_id', 'email_verifications')
    op.drop_index('ix_email_verifications_token_hash', table_name='email_verifications')
    op.drop_index('ix_email_verifications_user_purpose', table_name='email_verifications')
    op.drop_table('email_verifications')
    sa.Enum(name='verificationpurpose').drop(op.get_bind(), checkfirst=True)
