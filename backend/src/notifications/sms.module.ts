import { Module, Logger, Injectable } from '@nestjs/common';

export const SMS_DELIVERY = Symbol('SMS_DELIVERY');

export interface SmsDelivery {
  send(input: { to: string; message: string }): Promise<void>;
}

/**
 * Placeholder transport for the SMS channel. Ethiopia's mainstream providers
 * (Ethio Telecom, Airtel, Safaricom) each need an account and a signed request
 * format, so this stays a no-op until one is chosen. Nothing else has to change
 * when it is: AuthService depends on this symbol, not on the provider.
 */
@Injectable()
export class LoggingSmsDelivery implements SmsDelivery {
  private readonly logger = new Logger('SmsDelivery');

  async send(input: { to: string; message: string }): Promise<void> {
    this.logger.log(
      `would send SMS to ${maskPhone(input.to)} (${input.message.length} chars)`,
    );
  }
}

/** Keeps most of the number out of logs. */
export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '***';
  return `${'*'.repeat(phone.length - 4)}${phone.slice(-4)}`;
}

@Module({
  providers: [{ provide: SMS_DELIVERY, useClass: LoggingSmsDelivery }],
  exports: [SMS_DELIVERY],
})
export class SmsModule {}
