from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from app.database import get_db
from app.services import cooperative_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/cooperatives", tags=["Cooperative Formation"])

class CreateCooperativeRequest(BaseModel):
    name: str
    description: str
    location: str
    region: str
    district: Optional[str] = None
    crops: Optional[List[str]] = None
    goals: Optional[List[str]] = None
    max_members: int = 50

class JoinCooperativeRequest(BaseModel):
    cooperative_id: str
    farm_size: Optional[float] = None
    crops_grown: Optional[List[str]] = None

@router.post("/create")
def create_cooperative(
    request: CreateCooperativeRequest,
    user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Create a new cooperative"""
    try:
        cooperative = cooperative_service.create_cooperative(
            db=db,
            founder_id=user.id,
            name=request.name,
            description=request.description,
            location=request.location,
            region=request.region,
            district=request.district,
            crops=request.crops,
            goals=request.goals,
            max_members=request.max_members
        )
        
        return {
            "success": True,
            "data": {
                "id": str(cooperative.id),
                "name": cooperative.name,
                "member_count": cooperative.member_count,
                "created_at": cooperative.created_at.isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/join")
def join_cooperative(
    request: JoinCooperativeRequest,
    user: User = Depends(require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Join a cooperative"""
    try:
        member = cooperative_service.join_cooperative(
            db=db,
            cooperative_id=request.cooperative_id,
            user_id=user.id,
            farm_size=request.farm_size,
            crops_grown=request.crops_grown
        )
        
        return {
            "success": True,
            "data": {
                "cooperative_id": str(member.cooperative_id),
                "role": member.role,
                "joined_at": member.joined_at.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
def get_cooperatives(
    region: Optional[str] = Query(None),
    crop: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(require_role(["farmer", "processor", "consumer"])),
    db: Session = Depends(get_db)
):
    """Get cooperatives with filters"""
    result = cooperative_service.get_cooperatives(
        db=db,
        region=region,
        crop=crop,
        limit=limit,
        offset=offset
    )
    
    return {
        "success": True,
        "data": {
            "total": result["total"],
            "limit": result["limit"],
            "offset": result["offset"],
            "cooperatives": [
                {
                    "id": str(c.id),
                    "name": c.name,
                    "description": c.description,
                    "location": c.location,
                    "region": c.region,
                    "member_count": c.member_count,
                    "crops": c.crops,
                    "status": c.status,
                    "created_at": c.created_at.isoformat()
                }
                for c in result["cooperatives"]
            ]
        }
    }
