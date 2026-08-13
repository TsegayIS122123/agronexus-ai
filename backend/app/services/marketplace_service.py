import logging
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from app.models.marketplace import MarketplaceListing, MarketplaceOrder, MarketplaceReview
from app.models.marketplace import ListingStatus, OrderStatus
from app.models.user import User

logger = logging.getLogger(__name__)

def create_listing(
    db: Session,
    seller_id: str,
    title: str,
    description: str,
    category: str,
    quantity: float,
    unit: str,
    price: float,
    region: str,
    district: str = None,
    quality_grade: str = None,
    certifications: List[str] = None,
    image_urls: List[str] = None,
    delivery_options: Dict = None,
    expires_days: int = 30
) -> MarketplaceListing:
    """Create a new marketplace listing"""
    
    listing = MarketplaceListing(
        seller_id=seller_id,
        title=title,
        description=description,
        category=category,
        subcategory=quality_grade,
        quantity=quantity,
        unit=unit,
        price=price,
        region=region,
        district=district,
        quality_grade=quality_grade,
        certifications=certifications or [],
        image_urls=image_urls or [],
        delivery_options=delivery_options or {"pickup": True, "delivery": False},
        status=ListingStatus.ACTIVE,
        expires_at=datetime.utcnow() + timedelta(days=expires_days)
    )
    
    db.add(listing)
    db.commit()
    db.refresh(listing)
    
    return listing

def get_listings(
    db: Session,
    category: str = None,
    region: str = None,
    min_price: float = None,
    max_price: float = None,
    search: str = None,
    status: str = "active",
    limit: int = 20,
    offset: int = 0
) -> Dict:
    """Get marketplace listings with filters"""
    
    query = db.query(MarketplaceListing)
    
    # Filter by status
    if status == "active":
        query = query.filter(MarketplaceListing.status == ListingStatus.ACTIVE)
    
    # Filter by category
    if category:
        query = query.filter(MarketplaceListing.category == category)
    
    # Filter by region
    if region:
        query = query.filter(MarketplaceListing.region == region)
    
    # Filter by price range
    if min_price:
        query = query.filter(MarketplaceListing.price >= min_price)
    if max_price:
        query = query.filter(MarketplaceListing.price <= max_price)
    
    # Search in title and description
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                MarketplaceListing.title.ilike(search_term),
                MarketplaceListing.description.ilike(search_term)
            )
        )
    
    # Get total count
    total = query.count()
    
    # Get listings with pagination
    listings = query.order_by(desc(MarketplaceListing.created_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "listings": listings
    }

def get_listing(db: Session, listing_id: str) -> Optional[MarketplaceListing]:
    """Get a single listing by ID"""
    return db.query(MarketplaceListing).filter(
        MarketplaceListing.id == listing_id
    ).first()

def create_order(
    db: Session,
    listing_id: str,
    buyer_id: str,
    quantity: float,
    delivery_address: str = None,
    delivery_notes: str = None
) -> MarketplaceOrder:
    """Create a new order for a listing"""
    
    listing = get_listing(db, listing_id)
    if not listing:
        raise ValueError("Listing not found")
    
    if listing.status != ListingStatus.ACTIVE:
        raise ValueError("Listing is not active")
    
    if quantity > listing.quantity:
        raise ValueError(f"Requested quantity exceeds available ({listing.quantity})")
    
    total_price = quantity * listing.price
    
    order = MarketplaceOrder(
        listing_id=listing_id,
        buyer_id=buyer_id,
        seller_id=listing.seller_id,
        quantity=quantity,
        unit_price=listing.price,
        total_price=total_price,
        delivery_address=delivery_address,
        delivery_notes=delivery_notes,
        status=OrderStatus.PENDING
    )
    
    db.add(order)
    db.commit()
    db.refresh(order)
    
    return order

def get_orders(
    db: Session,
    user_id: str,
    role: str = "buyer",  # buyer or seller
    status: str = None,
    limit: int = 20,
    offset: int = 0
) -> Dict:
    """Get orders for a user"""
    
    query = db.query(MarketplaceOrder)
    
    if role == "buyer":
        query = query.filter(MarketplaceOrder.buyer_id == user_id)
    else:
        query = query.filter(MarketplaceOrder.seller_id == user_id)
    
    if status:
        query = query.filter(MarketplaceOrder.status == status)
    
    total = query.count()
    orders = query.order_by(desc(MarketplaceOrder.created_at)).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "orders": orders
    }

def update_order_status(
    db: Session,
    order_id: str,
    status: str,
    user_id: str,
    user_role: str
) -> MarketplaceOrder:
    """Update order status"""
    
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order:
        raise ValueError("Order not found")
    
    # Verify permissions
    if user_role == "buyer" and order.buyer_id != user_id:
        raise ValueError("Not authorized")
    if user_role == "seller" and order.seller_id != user_id:
        raise ValueError("Not authorized")
    
    # Status transitions
    valid_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["processing", "cancelled"],
        "processing": ["shipped", "cancelled"],
        "shipped": ["delivered"],
        "delivered": [],
        "cancelled": []
    }
    
    if status not in valid_transitions.get(order.status, []):
        raise ValueError(f"Invalid status transition from {order.status} to {status}")
    
    order.status = status
    
    if status == "confirmed":
        order.confirmed_at = datetime.utcnow()
    elif status == "delivered":
        order.delivered_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    return order

def add_review(
    db: Session,
    order_id: str,
    reviewer_id: str,
    rating: int,
    comment: str = None
) -> MarketplaceReview:
    """Add a review for an order"""
    
    order = db.query(MarketplaceOrder).filter(MarketplaceOrder.id == order_id).first()
    if not order:
        raise ValueError("Order not found")
    
    if order.buyer_id != reviewer_id and order.seller_id != reviewer_id:
        raise ValueError("Not authorized to review this order")
    
    if order.status != OrderStatus.DELIVERED:
        raise ValueError("Order must be delivered to review")
    
    review = MarketplaceReview(
        order_id=order_id,
        reviewer_id=reviewer_id,
        reviewed_id=order.seller_id if reviewer_id == order.buyer_id else order.buyer_id,
        rating=rating,
        comment=comment
    )
    
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return review

def get_categories(db: Session) -> List[str]:
    """Get all listing categories"""
    categories = db.query(MarketplaceListing.category).distinct().all()
    return [c[0] for c in categories]

def get_regions(db: Session) -> List[str]:
    """Get all regions with listings"""
    regions = db.query(MarketplaceListing.region).distinct().all()
    return [r[0] for r in regions]
