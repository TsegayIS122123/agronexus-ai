from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from app.database import get_db
from app.services import disease_service
from app.services.role_guard import require_role
from app.models.farmer import Farmer

router = APIRouter(prefix="/api/v1/disease", tags=["Disease Detection"])

@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    user: Farmer = Depends(require_role(["farmer", "processor"])),
    crop_type: str = Form(...),
    language: str = Form("am"),
    db: Session = Depends(get_db)
):
    """Detect disease from uploaded image - Farmer/Processor only"""
    try:
        image_data = await file.read()
        
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Use user.id from authenticated user (not farmer_id param)
        result = disease_service.detect_disease(
            db=db,
            farmer_id=user.id,  # ← FIXED: use user.id
            crop_type=crop_type,
            image_data=image_data,
            language=language
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result.get("error", "Detection failed"))
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/history/{farmer_id}")
def get_history(
    farmer_id: str,
    user: Farmer = Depends(require_role(["farmer", "processor"])),
    db: Session = Depends(get_db)
):
    """Get disease detection history - Users can only see their own"""
    try:
        # Users can only see their own history
        if str(user.id) != farmer_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        farmer_uuid = uuid.UUID(farmer_id)
        history = disease_service.get_detection_history(db, farmer_uuid)
        return {"success": True, "data": history}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")

@router.get("/info/{disease_name}")
def get_disease_info(disease_name: str):
    """Get detailed information about a disease"""
    from app.services.disease.detector import DISEASE_INFO
    
    for key, info in DISEASE_INFO.items():
        if info["name"].lower() == disease_name.lower():
            return {
                "success": True,
                "data": {
                    "name": info["name"],
                    "treatment": info["treatment"],
                    "recommendations": info.get("recommendations", [])
                }
            }
    
    raise HTTPException(status_code=404, detail="Disease not found")
