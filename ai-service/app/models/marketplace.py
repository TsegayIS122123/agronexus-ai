from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON, Text, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base

class ListingStatus(str, enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"
    EXPIRED = "expired"
    CANCELLED = "cancelled"

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class MarketplaceListing(Base):
    __tablename__ = "marketplace_listings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Product info
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)  # crop, processed, equipment
    subcategory = Column(String(100), nullable=True)
    
    # Listing details
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="kg")  # kg, ton, piece, liter
    price = Column(Float, nullable=False)
    currency = Column(String(10), default="ETB")
    
    # Location
    region = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    
    # Quality
    quality_grade = Column(String(50), nullable=True)  # A, B, C, Premium, Standard
    certifications = Column(JSON, nullable=True)  # ["organic", "fair-trade", etc.]
    
    # Images
    image_urls = Column(JSON, nullable=True)
    
    # Status
    status = Column(SQLEnum(ListingStatus), default=ListingStatus.ACTIVE)
    
    # Delivery
    delivery_options = Column(JSON, nullable=True)  # {"pickup": true, "delivery": true}
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

class MarketplaceOrder(Base):
    __tablename__ = "marketplace_orders"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    listing_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_listings.id"), nullable=False)
    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    seller_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    
    # Buyer/seller messages
    messages = Column(JSON, nullable=True)  # [{sender_id, message, timestamp}]
    
    # Status
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    
    # Delivery
    delivery_address = Column(Text, nullable=True)
    delivery_notes = Column(Text, nullable=True)
    
    # Payment
    payment_status = Column(String(50), default="pending")  # pending, paid, failed
    payment_method = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)

class MarketplaceReview(Base):
    __tablename__ = "marketplace_reviews"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("marketplace_orders.id"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reviewed_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
