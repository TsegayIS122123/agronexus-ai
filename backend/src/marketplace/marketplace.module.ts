import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MarketplaceListing } from './listing.entity';
import { MarketplaceOrder } from './order.entity';
import { MarketplaceReview } from './review.entity';

/**
 * Marketplace domain.
 *
 * The entities map onto Alembic-owned tables; this module never alters them.
 * synchronize is false in the root TypeORM config and stays that way.
 *
 * AiServiceClient is deliberately NOT injected here. Marketplace is pure CRUD
 * against tables NestJS reads and writes directly; the internal service token
 * bridge exists for AI-backed domains (disease, prices, chat), not for this.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceListing, MarketplaceOrder, MarketplaceReview]),
  ],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService, TypeOrmModule],
})
export class MarketplaceModule {}
