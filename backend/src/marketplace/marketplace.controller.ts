import { Body, Controller, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';

import { MarketplaceService } from './marketplace.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { CurrentUser, Public } from '../auth/public.decorator';
import type { PublicUser } from '../auth/dto/auth.types';

/**
 * Marketplace HTTP surface.
 *
 * Route paths and verbs match ai-service's marketplace router exactly, so the
 * published contract is preserved. Response bodies do NOT: ai-service wrapped
 * everything in { success, data } and the NestJS auth module returns plain
 * objects. Consistency inside the backend wins; the frontend change from
 * response.data.data.listings to response.listings is part of the frontend
 * migration.
 *
 * The global JWT guard applies to every route unless @Public() is present.
 * @CurrentUser() reads the authenticated principal the guard has already
 * attached; it does not re-verify.
 */
@Controller('api/v1/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplace: MarketplaceService) {}

  // ---------------------------------------------------------------- listings

  @Post('listings')
  @HttpCode(201)
  createListing(@CurrentUser() user: PublicUser, @Body() dto: CreateListingDto) {
    return this.marketplace.createListing(user.id, dto);
  }

  /**
   * Public on purpose. A signed-out visitor must be able to browse listings;
   * the roadmap records that /marketplace redirected everyone to sign-in and
   * making the browse endpoint public is how that gets fixed at the data
   * layer rather than papered over in the page.
   */
  @Public()
  @Get('listings')
  listListings(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('min_price') minPrice?: string,
    @Query('max_price') maxPrice?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.marketplace.listListings({
      category,
      region,
      minPrice: minPrice !== undefined ? Number(minPrice) : undefined,
      maxPrice: maxPrice !== undefined ? Number(maxPrice) : undefined,
      search,
      status,
      limit: Math.min(Math.max(Number(limit ?? 20), 1), 100),
      offset: Math.max(Number(offset ?? 0), 0),
    });
  }

  @Public()
  @Get('listings/:id')
  getListing(@Param('id') id: string) {
    return this.marketplace.getListing(id);
  }

  // ------------------------------------------------------------------ orders

  @Post('orders')
  @HttpCode(201)
  createOrder(@CurrentUser() user: PublicUser, @Body() dto: CreateOrderDto) {
    return this.marketplace.createOrder(user.id, dto);
  }

  @Get('orders')
  listOrders(
    @CurrentUser() user: PublicUser,
    @Query('role') role: 'buyer' | 'seller' = 'buyer',
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.marketplace.listOrders(
      user.id,
      role === 'seller' ? 'seller' : 'buyer',
      status,
      Math.min(Math.max(Number(limit ?? 20), 1), 100),
      Math.max(Number(offset ?? 0), 0),
    );
  }

  @Put('orders/:id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: PublicUser,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.marketplace.updateOrderStatus(id, user.id, dto.status);
  }

  @Post('orders/:id/review')
  @HttpCode(201)
  addReview(
    @Param('id') id: string,
    @CurrentUser() user: PublicUser,
    @Body() dto: CreateReviewDto,
  ) {
    return this.marketplace.addReview(id, user.id, dto);
  }

  // -------------------------------------------------------------- reference

  @Public()
  @Get('categories')
  categories() {
    return this.marketplace.categories();
  }

  @Public()
  @Get('regions')
  regions() {
    return this.marketplace.regions();
  }
}
