from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import price_service
from app.services.role_guard import require_role
from app.models.user import User
from datetime import datetime

router = APIRouter(prefix="/api/v1/prices", tags=["Price Prediction"])

@router.get("/forecast")
def get_price_forecast(
    crop: str = Query(..., description="Crop name (e.g., teff, wheat, maize)"),
    region: str = Query(..., description="Region (e.g., shewa, amhara, oromia)"),
    days: int = Query(30, ge=7, le=90, description="Forecast days (7-90)"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get price forecast for a specific crop and region"""
    result = price_service.train_and_predict(crop, region, db, days)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return {
        "success": True,
        "data": result
    }

@router.get("/historical")
def get_historical_prices(
    crop: str = Query(..., description="Crop name"),
    region: str = Query(..., description="Region"),
    limit: int = Query(90, ge=1, le=365, description="Number of days to return"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get historical price data for a crop"""
    from app.models.prediction import PriceHistory
    
    history = db.query(PriceHistory).filter(
        PriceHistory.crop_name == crop,
        PriceHistory.region == region
    ).order_by(PriceHistory.recorded_date.desc()).limit(limit).all()
    
    return {
        "success": True,
        "data": [
            {
                "date": h.recorded_date.isoformat(),
                "price": h.price,
                "market": h.market
            }
            for h in history
        ]
    }

@router.get("/crops")
def get_crops(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get list of available crops"""
    crops = price_service.get_available_crops(db)
    return {
        "success": True,
        "data": crops
    }

@router.get("/regions")
def get_regions(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get list of available regions"""
    regions = price_service.get_available_regions(db)
    return {
        "success": True,
        "data": regions
    }

@router.post("/seed-data")
def seed_price_data(
    user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    """Seed sample price data (Admin only)"""
    from app.models.prediction import PriceHistory
    import random
    from datetime import datetime, timedelta
    
    crops = ["teff", "wheat", "maize", "coffee", "barley"]
    regions = ["shewa", "amhara", "oromia", "tigray"]
    markets = ["addis_ababa", "bahir_dar", "adama", "mekelle"]
    
    base_prices = {
        "teff": 3500,
        "wheat": 2800,
        "maize": 2500,
        "coffee": 12000,
        "barley": 2200
    }
    
    count = 0
    start_date = datetime.now() - timedelta(days=365)
    
    for crop in crops:
        for region in regions:
            base_price = base_prices.get(crop, 3000)
            for i in range(365):
                price = base_price + random.uniform(-500, 500) + (i * random.uniform(-0.5, 0.5))
                price = max(500, price)
                
                hist = PriceHistory(
                    crop_name=crop,
                    region=region,
                    market=random.choice(markets),
                    price=round(price, 2),
                    recorded_date=start_date + timedelta(days=i)
                )
                db.add(hist)
                count += 1
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Seeded {count} price records",
        "crops": crops,
        "regions": regions
    }
