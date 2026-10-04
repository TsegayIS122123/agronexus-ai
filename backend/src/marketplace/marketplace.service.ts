import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MarketplaceListing } from './listing.entity';
import { MarketplaceOrder } from './order.entity';
import { MarketplaceReview } from './review.entity';
import { ListingStatus } from './listing-status.enum';
import { OrderStatus } from './order-status.enum';
import { CreateListingDto } from './dto/create-listing.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import type { OrderStatusValue } from './dto/update-order-status.dto';

/**
 * Status transitions, keyed by the UPPERCASE value the database stores.
 *
 * The Python source used lowercase string keys against an OrderStatus enum
 * member. Because SQLAlchemy's enum subclasses str this happened to work, but
 * it is fragile and reads as a bug. Keying by the exact enum value here removes
 * the ambiguity: a typo becomes a compile error rather than a silent
 * no-transition-allowed.
 */
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * The lowercase form the API returns.
 *
 * Kept as a function so the mapping lives in one place; a missed conversion is
 * what shows up as a raw ACTIVE badge rendered in a UI.
 */
function toApiStatus(status: ListingStatus | OrderStatus): string {
  return status.toLowerCase();
}

@Injectable()
export class MarketplaceService {
  constructor(
    @InjectRepository(MarketplaceListing)
    private readonly listings: Repository<MarketplaceListing>,
    @InjectRepository(MarketplaceOrder)
    private readonly orders: Repository<MarketplaceOrder>,
    @InjectRepository(MarketplaceReview)
    private readonly reviews: Repository<MarketplaceReview>,
  ) {}

  // ---------------------------------------------------------------- listings

  async createListing(sellerId: string, dto: CreateListingDto) {
    const listing = this.listings.create({
      sellerId,
      title: dto.title,
      description: dto.description ?? null,
      category: dto.category,
      // subcategory is deliberately NOT set from qualityGrade. The Python
      // source wrote the same value to both columns by accident; that
      // duplication is not ported.
      subcategory: null,
      quantity: dto.quantity,
      unit: dto.unit ?? 'kg',
      price: dto.price,
      region: dto.region,
      district: dto.district ?? null,
      qualityGrade: dto.qualityGrade ?? null,
      certifications: dto.certifications ?? null,
      imageUrls: dto.imageUrls ?? null,
      deliveryOptions: dto.deliveryOptions ?? { pickup: true, delivery: false },
      status: ListingStatus.ACTIVE,
      expiresAt: new Date(Date.now() + (dto.expiresDays ?? 30) * 24 * 60 * 60 * 1000),
    });

    const saved = await this.listings.save(listing);
    return this.serializeListing(saved);
  }

  async listListings(filters: {
    category?: string;
    region?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    status?: string;
    limit: number;
    offset: number;
  }) {
    const qb = this.listings.createQueryBuilder('l');

    // The Python source hardcoded status == active and ignored anything else
    // the caller passed. This version honours the value, defaulting to active
    // only when the caller did not supply one.
    const status = (filters.status ?? 'active').toUpperCase() as ListingStatus;
    if (Object.values(ListingStatus).includes(status)) {
      qb.andWhere('l.status = :status', { status });
    }

    if (filters.category) {
      qb.andWhere('l.category = :category', { category: filters.category });
    }
    if (filters.region) {
      qb.andWhere('l.region = :region', { region: filters.region });
    }
    if (filters.minPrice !== undefined && Number.isFinite(filters.minPrice)) {
      qb.andWhere('l.price >= :minPrice', { minPrice: filters.minPrice });
    }
    if (filters.maxPrice !== undefined && Number.isFinite(filters.maxPrice)) {
      qb.andWhere('l.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }
    if (filters.search) {
      qb.andWhere('(l.title ILIKE :search OR l.description ILIKE :search)', {
        search: `%${filters.search}%`,
      });
    }

    const [rows, total] = await qb
      .orderBy('l.created_at', 'DESC')
      .skip(filters.offset)
      .take(filters.limit)
      .getManyAndCount();

    return {
      total,
      limit: filters.limit,
      offset: filters.offset,
      listings: rows.map((row) => this.serializeListing(row)),
    };
  }

  async getListing(id: string) {
    const listing = await this.listings.findOne({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    return this.serializeListing(listing, { detail: true });
  }

  // ------------------------------------------------------------------ orders

  async createOrder(buyerId: string, dto: CreateOrderDto) {
    const listing = await this.listings.findOne({
      where: { id: dto.listingId },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('Listing is not active');
    }
    if (dto.quantity > listing.quantity) {
      throw new BadRequestException(
        `Requested quantity exceeds available (${listing.quantity})`,
      );
    }

    const order = this.orders.create({
      listingId: listing.id,
      buyerId,
      sellerId: listing.sellerId,
      quantity: dto.quantity,
      unitPrice: listing.price,
      totalPrice: dto.quantity * listing.price,
      deliveryAddress: dto.deliveryAddress ?? null,
      deliveryNotes: dto.deliveryNotes ?? null,
      status: OrderStatus.PENDING,
      paymentStatus: 'pending',
      paymentMethod: null,
      messages: null,
      confirmedAt: null,
      deliveredAt: null,
    });

    const saved = await this.orders.save(order);
    return this.serializeOrder(saved);
  }

  async listOrders(
    userId: string,
    role: 'buyer' | 'seller',
    status: string | undefined,
    limit: number,
    offset: number,
  ) {
    const qb = this.orders.createQueryBuilder('o');
    qb.andWhere(role === 'buyer' ? 'o.buyer_id = :userId' : 'o.seller_id = :userId', {
      userId,
    });

    if (status) {
      // Convert the lowercase API value to the uppercase enum the DB stores.
      // Comparing an enum column directly against a lowercase string would
      // never match: the same class of bug the Python source flirted with.
      const upper = status.toUpperCase() as OrderStatus;
      if (Object.values(OrderStatus).includes(upper)) {
        qb.andWhere('o.status = :status', { status: upper });
      }
    }

    const [rows, total] = await qb
      .orderBy('o.created_at', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      total,
      limit,
      offset,
      orders: rows.map((row) => this.serializeOrder(row)),
    };
  }

  async updateOrderStatus(
    orderId: string,
    userId: string,
    newStatusLower: OrderStatusValue,
  ) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    // Authorization by the authenticated user's relationship to the order,
    // not by role name. The Python source had this right after a fix; this
    // ports that logic unchanged.
    if (userId !== order.buyerId && userId !== order.sellerId) {
      throw new ForbiddenException('Not authorized');
    }

    const target = newStatusLower.toUpperCase() as OrderStatus;
    const allowed = VALID_TRANSITIONS[order.status] ?? [];
    if (allowed.indexOf(target) === -1) {
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${target}`,
      );
    }

    order.status = target;
    if (target === OrderStatus.CONFIRMED) order.confirmedAt = new Date();
    if (target === OrderStatus.DELIVERED) order.deliveredAt = new Date();

    const saved = await this.orders.save(order);
    return this.serializeOrder(saved);
  }

  // ----------------------------------------------------------------- reviews

  async addReview(orderId: string, reviewerId: string, dto: CreateReviewDto) {
    const order = await this.orders.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (reviewerId !== order.buyerId && reviewerId !== order.sellerId) {
      throw new ForbiddenException('Not authorized to review this order');
    }
    if (order.status !== OrderStatus.DELIVERED) {
      throw new BadRequestException('Order must be delivered to review');
    }

    // The rating range is enforced by the DTO before this method is reached,
    // so no additional check is needed here: and deliberately no broad
    // try/catch, which is how the Python source turned a 400 into a 500.
    const review = this.reviews.create({
      orderId,
      reviewerId,
      reviewedId: reviewerId === order.buyerId ? order.sellerId : order.buyerId,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    const saved = await this.reviews.save(review);
    return {
      id: saved.id,
      rating: saved.rating,
      comment: saved.comment,
      createdAt: saved.createdAt,
    };
  }

  // -------------------------------------------------------------- reference

  async categories(): Promise<string[]> {
    const rows = await this.listings
      .createQueryBuilder('l')
      .select('DISTINCT l.category', 'category')
      .getRawMany<{ category: string }>();
    return rows.map((r) => r.category).filter(Boolean);
  }

  async regions(): Promise<string[]> {
    const rows = await this.listings
      .createQueryBuilder('l')
      .select('DISTINCT l.region', 'region')
      .getRawMany<{ region: string }>();
    return rows.map((r) => r.region).filter(Boolean);
  }

  // ----------------------------------------------------------- serialization

  /**
   * Lowercase every enum on the way out, so the frontend contract is
   * active / pending even though the DB stores uppercase.
   */
  private serializeListing(listing: MarketplaceListing, opts?: { detail: boolean }) {
    const base = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      quantity: listing.quantity,
      unit: listing.unit,
      price: listing.price,
      region: listing.region,
      qualityGrade: listing.qualityGrade,
      certifications: listing.certifications,
      imageUrls: listing.imageUrls,
      status: toApiStatus(listing.status),
      createdAt: listing.createdAt,
      sellerId: listing.sellerId,
    };
    if (opts?.detail !== true) return base;
    return {
      ...base,
      district: listing.district,
      deliveryOptions: listing.deliveryOptions,
    };
  }

  private serializeOrder(order: MarketplaceOrder) {
    return {
      id: order.id,
      listingId: order.listingId,
      quantity: order.quantity,
      unitPrice: order.unitPrice,
      totalPrice: order.totalPrice,
      status: toApiStatus(order.status),
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      confirmedAt: order.confirmedAt,
      deliveredAt: order.deliveredAt,
    };
  }
}
