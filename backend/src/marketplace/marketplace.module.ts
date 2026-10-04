import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MarketplaceListing } from './listing.entity';
import { MarketplaceOrder } from './order.entity';
import { MarketplaceReview } from './review.entity';

/**
 * Marketplace domain.
 *
 * The entities map onto Alembic-owned tables; this module never alters them.
 * `synchronize` is false in the root TypeORM config and must stay that way.
 *
 * Controllers and the service are added in Prompt 2. The module is not yet
 * registered in `AppModule` — registering a module with no controller exposes
 * no route, and doing it twice invites a mismatch between the two edits.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceListing, MarketplaceOrder, MarketplaceReview]),
  ],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class MarketplaceModule {}
