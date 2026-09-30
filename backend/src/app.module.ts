import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './config/env.validation';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SmsModule } from './notifications/sms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      // Fail fast at boot instead of on the first request that needs a key.
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }] }),
    TypeOrmModule.forRootAsync({
      // TypeORM must never auto-create or alter tables here: ai-service owns the
      // schema through Alembic. This service only reads and writes it.
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5436'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'agronexus'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        // gen_random_uuid() matches the users.id default added by Alembic
        // revision a1b2c3d4e5f6. Leaving this unset makes TypeORM look for
        // uuid-ossp's uuid_generate_v4() instead.
        uuidExtension: 'pgcrypto',
        synchronize: false,
        migrationsRun: false,
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    AuthModule,
    UsersModule,
    NotificationsModule,
    SmsModule,
  ],
  controllers: [AppController],
  providers: [
    // Applied globally so a new controller is protected by default; individual
    // routes opt out with @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Order matters: throttling must reject before authentication runs so
    // brute-force attempts cannot hammer the password comparison.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
