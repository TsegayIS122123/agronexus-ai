from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import weather_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/weather", tags=["Weather Alerts"])

@router.get("/current")
def get_current_weather(
    city: str = Query(..., description="City name (e.g., addis_ababa)"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get current weather for a city"""
    result = weather_service.get_current_weather(city)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/forecast")
def get_weather_forecast(
    city: str = Query(..., description="City name (e.g., addis_ababa)"),
    days: int = Query(5, ge=1, le=7, description="Number of days to forecast"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get weather forecast for a city"""
    result = weather_service.get_weather_forecast(city, days)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/alerts")
def get_weather_alerts(
    city: str = Query(..., description="City name (e.g., addis_ababa)"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get severe weather alerts"""
    result = weather_service.get_weather_alerts(city)
    
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    
    return result

@router.get("/advice")
def get_agricultural_advice(
    city: str = Query(..., description="City name (e.g., addis_ababa)"),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get agricultural advice based on weather"""
    weather = weather_service.get_current_weather(city)
    advice = weather_service.get_agricultural_advice(weather)
    
    return {
        "success": True,
        "data": {
            "city": city.capitalize(),
            "advice": advice
        }
    }

@router.get("/cities")
def get_cities(
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get list of supported cities"""
    cities = list(weather_service.ETHIOPIAN_CITIES.keys())
    return {
        "success": True,
        "data": [city.capitalize() for city in cities]
    }
