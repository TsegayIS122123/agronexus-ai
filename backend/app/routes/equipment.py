from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.services import equipment_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/equipment", tags=["Equipment Marketplace"])

class CreateEquipmentRequest(BaseModel):
    name: str
    category: str
    description: Optional[str] = None
    price: float
    condition: str = "new"
    location: str
    image_urls: Optional[List[str]] = None
    specs: Optional[dict] = None
    contact_info: Optional[dict] = None

@router.post("/listings")
def create_equipment(
    request: CreateEquipmentRequest,
    user: User = Depends(require_role(["processor", "farmer"])),
    db: Session = Depends(get_db)
):
    """Create a new equipment listing"""
    try:
        listing = equipment_service.create_equipment_listing(
            db=db,
            user_id=user.id,
            name=request.name,
            category=request.category,
            description=request.description,
            price=request.price,
            condition=request.condition,
            location=request.location,
            image_urls=request.image_urls,
            specs=request.specs,
            contact_info=request.contact_info
        )
        
        return {
            "success": True,
            "data": {
                "id": str(listing.id),
                "name": listing.name,
                "price": listing.price,
                "category": listing.category,
                "is_available": listing.is_available,
                "created_at": listing.created_at.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/listings")
def get_equipment(
    category: Optional[str] = Query(None),
    condition: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Get equipment listings with filters"""
    result = equipment_service.get_equipment_listings(
        db=db,
        category=category,
        condition=condition,
        min_price=min_price,
        max_price=max_price,
        search=search,
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
                    "name": l.name,
                    "category": l.category,
                    "description": l.description,
                    "price": l.price,
                    "condition": l.condition,
                    "location": l.location,
                    "image_urls": l.image_urls,
                    "specs": l.specs,
                    "is_available": l.is_available,
                    "created_at": l.created_at.isoformat()
                }
                for l in result["listings"]
            ]
        }
    }

@router.get("/listings/{listing_id}")
def get_equipment_detail(
    listing_id: str,
    db: Session = Depends(get_db)
):
    """Get equipment listing details"""
    listing = equipment_service.get_equipment_listing(db, listing_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    return {
        "success": True,
        "data": {
            "id": str(listing.id),
            "name": listing.name,
            "category": listing.category,
            "description": listing.description,
            "price": listing.price,
            "condition": listing.condition,
            "location": listing.location,
            "image_urls": listing.image_urls,
            "specs": listing.specs,
            "contact_info": listing.contact_info,
            "is_available": listing.is_available,
            "created_at": listing.created_at.isoformat()
        }
    }

@router.get("/categories")
def get_categories(
    db: Session = Depends(get_db)
):
    """Get all equipment categories"""
    categories = equipment_service.get_categories(db)
    return {"success": True, "data": categories}
