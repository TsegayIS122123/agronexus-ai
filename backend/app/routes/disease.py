from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
import uuid
from app.database import get_db
from app.services import disease_service

router = APIRouter(prefix="/api/v1/disease", tags=["Disease Detection"])

@router.post("/detect")
async def detect_disease(
    file: UploadFile = File(...),
    farmer_id: Optional[str] = Form(None),
    crop_type: str = Form(...),
    language: str = Form("am"),
    db: Session = Depends(get_db)
):
    """
    Detect disease from uploaded image
    
    - Upload a crop image
    - Get instant disease diagnosis
    - Receive treatment in your language
    """
    try:
        # Read image file
        image_data = await file.read()
        
        # Validate file type
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400,
                detail="File must be an image"
            )
        
        # Convert farmer_id to UUID or None
        farmer_uuid = uuid.UUID(farmer_id) if farmer_id else None
        
        # Detect disease
        result = disease_service.detect_disease(
            db=db,
            farmer_id=farmer_uuid,
            crop_type=crop_type,
            image_data=image_data,
            language=language
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Detection failed")
            )
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@router.get("/history/{farmer_id}")
def get_history(
    farmer_id: str,
    db: Session = Depends(get_db)
):
    """Get disease detection history for a farmer"""
    try:
        farmer_uuid = uuid.UUID(farmer_id)
        history = disease_service.get_detection_history(db, farmer_uuid)
        return {"success": True, "data": history}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid farmer ID")

@router.get("/info/{disease_name}")
def get_disease_info(disease_name: str):
    """Get detailed information about a disease"""
    # This would fetch from a database or static mapping
    from app.services.disease.detector import DISEASE_INFO
    
    # Find disease info
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
