from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from app.database import get_db
from app.services import industry_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/industry", tags=["Industry Zone"])

class FeasibilityRequest(BaseModel):
    product_name: str
    location: str
    capital: float
    quantity: float
    crop_type: Optional[str] = None

@router.get("/products")
def get_products(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    category: Optional[str] = Query(None, description="Filter by category")
):
    """Get available products for processing"""
    products = industry_service.get_product_specs()
    
    if category:
        products = [p for p in products if p["category"] == category]
    
    return {
        "success": True,
        "data": [
            {
                "name": p["name"],
                "category": p["category"],
                "description": p["description"],
                "min_capital": p["min_capital"],
                "max_capital": p["max_capital"],
                "min_quantity": p["min_quantity"],
                "avg_roi": p["avg_roi"],
                "payback_months": p["payback_months"],
                "image_url": p.get("image_url")
            }
            for p in products
        ]
    }

@router.get("/products/{product_name}")
def get_product_detail(
    product_name: str,
    user: User = Depends(require_role(["farmer", "processor", "consumer"]))
):
    """Get detailed product information"""
    spec = industry_service.get_product_spec(product_name)
    if not spec:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {
        "success": True,
        "data": {
            "name": spec["name"],
            "category": spec["category"],
            "description": spec["description"],
            "crop_inputs": spec["crop_inputs"],
            "min_capital": spec["min_capital"],
            "max_capital": spec["max_capital"],
            "min_quantity": spec["min_quantity"],
            "equipment": spec["equipment_list"],
            "processing_steps": spec["processing_steps"],
            "avg_roi": spec["avg_roi"],
            "payback_months": spec["payback_months"]
        }
    }

@router.post("/feasibility")
def analyze_feasibility(
    request: FeasibilityRequest,
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Analyze factory feasibility for a product"""
    
    # Validate inputs
    if request.capital <= 0:
        raise HTTPException(status_code=400, detail="Capital must be greater than 0")
    
    if request.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    # Calculate feasibility
    result = industry_service.calculate_feasibility(
        request.product_name,
        request.location,
        request.capital,
        request.quantity
    )
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    # Save report
    crop_type = request.crop_type or request.product_name.split()[0]
    report = industry_service.save_feasibility_report(
        db=db,
        user_id=user.id,
        crop_type=crop_type,
        product_type=request.product_name,
        location=request.location,
        capital=request.capital,
        quantity=request.quantity,
        result=result
    )
    
    return {
        "success": True,
        "data": {
            "report_id": str(report.id),
            "feasibility": result,
            "saved_at": report.created_at.isoformat()
        }
    }

@router.get("/reports")
def get_reports(
    user: User = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Get user's feasibility reports"""
    reports = industry_service.get_reports(db, user.id)
    
    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "product_type": r.product_type,
                "crop_type": r.crop_type,
                "feasibility_score": r.feasibility_score,
                "estimated_roi": r.estimated_roi,
                "payback_period": r.payback_period,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
    }

@router.get("/equipment")
def get_equipment(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db)
):
    """Get available equipment listings"""
    query = db.query(industry_service.EquipmentListing).filter(
        industry_service.EquipmentListing.is_available == True
    )
    
    if category:
        query = query.filter(industry_service.EquipmentListing.category == category)
    
    equipment = query.all()
    
    return {
        "success": True,
        "data": [
            {
                "id": str(e.id),
                "name": e.name,
                "category": e.category,
                "description": e.description,
                "price": e.price,
                "condition": e.condition,
                "location": e.location,
                "image_urls": e.image_urls,
                "created_at": e.created_at.isoformat()
            }
            for e in equipment
        ]
    }
