from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import quality_service
from app.services.role_guard import require_role
from app.models.user import User

router = APIRouter(prefix="/api/v1/quality", tags=["Quality Control AI"])

@router.post("/grade")
async def grade_product(
    file: UploadFile = File(...),
    product_name: str = Form(...),
    product_category: str = Form(...),
    user: User = Depends(require_role(["processor", "farmer"])),
    db: Session = Depends(get_db)
):
    """Grade product quality from image"""
    try:
        # Read image
        image_data = await file.read()
        
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Analyze image
        analysis = quality_service.analyze_image(image_data)
        
        if not analysis["success"]:
            raise HTTPException(status_code=400, detail=analysis.get("error", "Analysis failed"))
        
        # Save report
        report = quality_service.save_quality_report(
            db=db,
            user_id=user.id,
            product_name=product_name,
            product_category=product_category,
            analysis=analysis,
            image_data=image_data
        )
        
        # Get standards
        standards = quality_service.get_standards(product_category)
        
        # Prepare response
        grade_letter = get_grade_letter(analysis["overall_grade"])
        
        return {
            "success": True,
            "data": {
                "report_id": str(report.id),
                "overall_grade": analysis["overall_grade"],
                "grade_letter": grade_letter,
                "scores": {
                    "color": analysis["color_score"],
                    "texture": analysis["texture_score"],
                    "size": analysis["size_score"],
                    "moisture": analysis["moisture_score"],
                    "defects": analysis["defects_score"]
                },
                "defects": analysis.get("defects", []),
                "export_ready": report.export_ready,
                "standard_met": report.standard_met,
                "recommendations": report.recommendations,
                "status": report.status,
                "created_at": report.created_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_grade_letter(score: float) -> str:
    """Convert score to grade letter"""
    if score >= 90:
        return "A+"
    elif score >= 85:
        return "A"
    elif score >= 80:
        return "A-"
    elif score >= 75:
        return "B+"
    elif score >= 70:
        return "B"
    elif score >= 65:
        return "B-"
    elif score >= 60:
        return "C+"
    elif score >= 55:
        return "C"
    else:
        return "D"

@router.get("/reports")
def get_reports(
    user: User = Depends(require_role(["processor", "farmer"])),
    db: Session = Depends(get_db)
):
    """Get quality reports for the user"""
    reports = quality_service.get_reports(db, user.id)
    
    return {
        "success": True,
        "data": [
            {
                "id": str(r.id),
                "product_name": r.product_name,
                "product_category": r.product_category,
                "overall_grade": r.overall_grade,
                "grade_letter": get_grade_letter(r.overall_grade),
                "export_ready": r.export_ready,
                "standard_met": r.standard_met,
                "status": r.status,
                "created_at": r.created_at.isoformat()
            }
            for r in reports
        ]
    }

@router.get("/standards")
def get_standards(
    product_category: Optional[str] = None,
    user: User = Depends(require_role(["processor", "farmer", "consumer"]))
):
    """Get export standards"""
    standards = quality_service.get_standards(product_category)
    return {
        "success": True,
        "data": standards
    }
