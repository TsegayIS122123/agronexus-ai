from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.services import cost_calculator_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/cost-calculator", tags=["Cost Calculator"])

class CostRequest(BaseModel):
    product_type: str
    monthly_production: float
    raw_material_cost: float
    labor_cost: float
    utilities_cost: float
    rent_cost: float
    equipment_cost: float
    packaging_cost: float = 0
    transportation_cost: float = 0
    tax_rate: float = 0.15

@router.post("/calculate")
def calculate_costs(
    request: CostRequest,
    user: User = Depends(require_role(["processor", "farmer"])),
    db: Session = Depends(get_db)
):
    """Calculate manufacturing costs and ROI"""
    try:
        if request.monthly_production <= 0:
            raise ValueError("Monthly production must be greater than 0")
        
        if request.raw_material_cost <= 0:
            raise ValueError("Raw material cost must be greater than 0")
        
        result = cost_calculator_service.calculate_costs(
            product_type=request.product_type,
            monthly_production=request.monthly_production,
            raw_material_cost=request.raw_material_cost,
            labor_cost=request.labor_cost,
            utilities_cost=request.utilities_cost,
            rent_cost=request.rent_cost,
            equipment_cost=request.equipment_cost,
            packaging_cost=request.packaging_cost,
            transportation_cost=request.transportation_cost,
            tax_rate=request.tax_rate
        )
        
        if result["success"]:
            return {
                "success": True,
                "data": result["data"]
            }
        else:
            raise HTTPException(status_code=400, detail="Calculation failed")
            
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
