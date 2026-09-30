import { Logger, Module } from '@nestjs/common';

export const EMAIL_DELIVERY = Symbol('EMAIL_DELIVERY');

/**
 * Delivery is an interface so tests never need a real provider, and so the
 * choice of provider is a configuration decision rather than a code change.
 */
export interface EmailDelivery {
  send(input: { to: string; subject: string; body: string }): Promise<void>;
}

/**
 * Default used in development and tests: logs instead of sending. It never
 * prints a live verification or reset token, because those logs are exactly
 * what an attacker with log access is looking for.
 */
export class LoggingEmailDelivery implements EmailDelivery {
  private readonly logger = new Logger('EmailDelivery');

  async send(input: { to: string; subject: string; body: string }): Promise<void> {
    this.logger.log(
      `would send "${input.subject}" to ${input.to} (${input.body.length} chars)`,
    );
  }
}

@Module({
  providers: [{ provide: EMAIL_DELIVERY, useClass: LoggingEmailDelivery }],
  exports: [EMAIL_DELIVERY],
})
export class NotificationsModule {}
