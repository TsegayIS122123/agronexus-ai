import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, List, Optional
from app.models.industry import EquipmentListing
from app.models.user import User

logger = logging.getLogger(__name__)

def create_equipment_listing(
    db: Session,
    user_id: str,
    name: str,
    category: str,
    description: str,
    price: float,
    condition: str,
    location: str,
    image_urls: List[str] = None,
    specs: Dict = None,
    contact_info: Dict = None
) -> EquipmentListing:
    """Create a new equipment listing"""
    
    listing = EquipmentListing(
        user_id=user_id,
        name=name,
        category=category,
        description=description,
        price=price,
        condition=condition,
        location=location,
        image_urls=image_urls or [],
        specs=specs or {},
        contact_info=contact_info or {},
        is_available=True
    )
    
    db.add(listing)
    db.commit()
    db.refresh(listing)
    
    return listing

def get_equipment_listings(
    db: Session,
    category: str = None,
    condition: str = None,
    min_price: float = None,
    max_price: float = None,
    search: str = None,
    limit: int = 20,
    offset: int = 0
) -> Dict:
    """Get equipment listings with filters"""
    
    query = db.query(EquipmentListing).filter(EquipmentListing.is_available == True)
    
    if category:
        query = query.filter(EquipmentListing.category == category)
    
    if condition:
        query = query.filter(EquipmentListing.condition == condition)
    
    if min_price:
        query = query.filter(EquipmentListing.price >= min_price)
    if max_price:
        query = query.filter(EquipmentListing.price <= max_price)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                EquipmentListing.name.ilike(search_term),
                EquipmentListing.description.ilike(search_term)
            )
        )
    
    total = query.count()
    listings = query.order_by(EquipmentListing.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "listings": listings
    }

def get_equipment_listing(db: Session, listing_id: str) -> Optional[EquipmentListing]:
    """Get a single equipment listing"""
    return db.query(EquipmentListing).filter(EquipmentListing.id == listing_id).first()

def update_availability(db: Session, listing_id: str, is_available: bool) -> Optional[EquipmentListing]:
    """Update equipment availability"""
    listing = get_equipment_listing(db, listing_id)
    if listing:
        listing.is_available = is_available
        db.commit()
        db.refresh(listing)
    return listing

def get_categories(db: Session) -> List[str]:
    """Get all equipment categories"""
    categories = db.query(EquipmentListing.category).distinct().all()
    return [c[0] for c in categories if c[0]]
