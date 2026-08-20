from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import price_comparison_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/price-comparison", tags=["Price Comparison"])

@router.get("/compare")
def compare_prices(
    crop: str = Query(..., description="Crop name (e.g., teff, wheat)"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Compare local and import prices for a crop"""
    result = price_comparison_service.get_price_comparison(crop)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/all")
def get_all_comparisons(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get price comparison for all crops"""
    return price_comparison_service.get_all_comparisons()

@router.get("/import-substitution")
def get_import_substitution(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get import substitution potential"""
    return price_comparison_service.get_import_substitution_potential()
