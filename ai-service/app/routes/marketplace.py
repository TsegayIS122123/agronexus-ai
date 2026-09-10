from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.services import marketplace_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/marketplace", tags=["Marketplace"])

# ========== Request Models ==========

class CreateListingRequest(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    quantity: float
    unit: str = "kg"
    price: float
    region: str
    district: Optional[str] = None
    quality_grade: Optional[str] = None
    certifications: Optional[List[str]] = None
    image_urls: Optional[List[str]] = None
    delivery_options: Optional[dict] = None
    expires_days: int = 30

class CreateOrderRequest(BaseModel):
    listing_id: str
    quantity: float
    delivery_address: Optional[str] = None
    delivery_notes: Optional[str] = None

class UpdateOrderRequest(BaseModel):
    status: str

class CreateReviewRequest(BaseModel):
    rating: int
    comment: Optional[str] = None

# ========== Endpoints ==========

@router.post("/listings")
def create_listing(
    request: CreateListingRequest,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Create a new marketplace listing"""
    try:
        listing = marketplace_service.create_listing(
            db=db,
            seller_id=user.id,
            title=request.title,
            description=request.description,
            category=request.category,
            quantity=request.quantity,
            unit=request.unit,
            price=request.price,
            region=request.region,
            district=request.district,
            quality_grade=request.quality_grade,
            certifications=request.certifications,
            image_urls=request.image_urls,
            delivery_options=request.delivery_options,
            expires_days=request.expires_days
        )
        
        return {
            "success": True,
            "data": {
                "id": str(listing.id),
                "title": listing.title,
                "price": listing.price,
                "quantity": listing.quantity,
                "status": listing.status.value,
                "created_at": listing.created_at.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/listings")
def get_listings(
    category: Optional[str] = Query(None),
    region: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    status: str = Query("active"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get marketplace listings with filters"""
    result = marketplace_service.get_listings(
        db=db,
        category=category,
        region=region,
        min_price=min_price,
        max_price=max_price,
        search=search,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return {
        "success": True,
        "data": {
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"],
            "listings": [
                {
                    "id": str(l.id),
                    "title": l.title,
                    "description": l.description,
                    "category": l.category,
                    "quantity": l.quantity,
                    "unit": l.unit,
                    "price": l.price,
                    "region": l.region,
                    "quality_grade": l.quality_grade,
                    "certifications": l.certifications,
                    "image_urls": l.image_urls,
                    "status": l.status.value,
                    "created_at": l.created_at.isoformat(),
                    "seller_id": str(l.seller_id)
                }
                for l in result["listings"]
            ]
        }
    }

@router.get("/listings/{listing_id}")
def get_listing(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Get a single listing by ID"""
    listing = marketplace_service.get_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    return {
        "success": True,
        "data": {
            "id": str(listing.id),
            "title": listing.title,
            "description": listing.description,
            "category": listing.category,
            "quantity": listing.quantity,
            "unit": listing.unit,
            "price": listing.price,
            "region": listing.region,
            "district": listing.district,
            "quality_grade": listing.quality_grade,
            "certifications": listing.certifications,
            "image_urls": listing.image_urls,
            "delivery_options": listing.delivery_options,
            "status": listing.status.value,
            "created_at": listing.created_at.isoformat()
        }
    }

@router.post("/orders")
def create_order(
    request: CreateOrderRequest,
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Create a new order"""
    try:
        order = marketplace_service.create_order(
            db=db,
            listing_id=request.listing_id,
            buyer_id=user.id,
            quantity=request.quantity,
            delivery_address=request.delivery_address,
            delivery_notes=request.delivery_notes
        )
        
        return {
            "success": True,
            "data": {
                "id": str(order.id),
                "listing_id": str(order.listing_id),
                "quantity": order.quantity,
                "total_price": order.total_price,
                "status": order.status.value,
                "created_at": order.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders")
def get_orders(
    role: str = Query("buyer", regex="^(buyer|seller)$"),
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get user's orders"""
    result = marketplace_service.get_orders(
        db=db,
        user_id=user.id,
        role=role,
        status=status,
        limit=limit,
        offset=offset
    )
    
    return {
        "success": True,
        "data": {
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"],
            "orders": [
                {
                    "id": str(o.id),
                    "listing_id": str(o.listing_id),
                    "quantity": o.quantity,
                    "unit_price": o.unit_price,
                    "total_price": o.total_price,
                    "status": o.status.value,
                    "created_at": o.created_at.isoformat(),
                    "confirmed_at": o.confirmed_at.isoformat() if o.confirmed_at else None,
                    "delivered_at": o.delivered_at.isoformat() if o.delivered_at else None
                }
                for o in result["orders"]
            ]
        }
    }

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    request: UpdateOrderRequest,
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Update order status"""
    try:
        order = marketplace_service.update_order_status(
            db=db,
            order_id=order_id,
            status=request.status,
            user_id=user.id,
            user_role=user.role
        )
        
        return {
            "success": True,
            "data": {
                "id": str(order.id),
                "status": order.status.value,
                "updated_at": order.updated_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/{order_id}/review")
def add_review(
    order_id: str,
    request: CreateReviewRequest,
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Add a review for an order"""
    try:
        if request.rating < 1 or request.rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        review = marketplace_service.add_review(
            db=db,
            order_id=order_id,
            reviewer_id=user.id,
            rating=request.rating,
            comment=request.comment
        )
        
        return {
            "success": True,
            "data": {
                "id": str(review.id),
                "rating": review.rating,
                "comment": review.comment,
                "created_at": review.created_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db)
):
    """Get all listing categories"""
    categories = marketplace_service.get_categories(db)
    return {"success": True, "data": categories}

@router.get("/regions")
def get_regions(
    db: Session = Depends(get_db)
):
    """Get all regions with listings"""
    regions = marketplace_service.get_regions(db)
    return {"success": True, "data": regions}
