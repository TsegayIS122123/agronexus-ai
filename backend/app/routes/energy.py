from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services import energy_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/energy", tags=["Energy Optimization"])

class EnergyRequest(BaseModel):
    monthly_energy_cost: float
    equipment_power_kw: float
    operating_hours: float
    solar_irradiation: float = 5.0
    biofuel_availability: bool = True
    current_fuel_cost: float = 80.0
    solar_installation_cost: float = 50000
    biofuel_installation_cost: float = 30000

@router.post("/optimize")
def optimize_energy(
    request: EnergyRequest,
    user: User = Depends(require_role(["processor", "farmer"])),
    db: Session = Depends(get_db)
):
    """Analyze energy usage and recommend optimization"""
    try:
        if request.monthly_energy_cost <= 0:
            raise ValueError("Monthly energy cost must be greater than 0")
        
        if request.equipment_power_kw <= 0:
            raise ValueError("Equipment power must be greater than 0")
        
        if request.operating_hours <= 0:
            raise ValueError("Operating hours must be greater than 0")
        
        result = energy_service.analyze_energy(
            monthly_energy_cost=request.monthly_energy_cost,
            equipment_power_kw=request.equipment_power_kw,
            operating_hours=request.operating_hours,
            solar_irradiation=request.solar_irradiation,
            biofuel_availability=request.biofuel_availability,
            current_fuel_cost=request.current_fuel_cost,
            solar_installation_cost=request.solar_installation_cost,
            biofuel_installation_cost=request.biofuel_installation_cost
        )
        
        if result["success"]:
            return {
                "success": True,
                "data": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail="Analysis failed")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
