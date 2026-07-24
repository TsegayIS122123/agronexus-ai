from sqlalchemy.orm import Session
from app.models.disease import DiseaseDetection
from app.services.disease.detector import DiseaseDetector
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)

# Initialize detector (singleton)
detector = DiseaseDetector()

def detect_disease(db: Session, farmer_id, crop_type, image_data, language="am"):
    """Detect disease and save result to database"""
    try:
        # Run detection
        result = detector.detect(image_data, crop_type)
        
        if "error" in result:
            return {"success": False, "error": result["error"]}
        
        # Save to database
        detection = DiseaseDetection(
            farmer_id=farmer_id,
            crop_type=crop_type,
            disease_name=result["disease_name"],
            confidence=result["confidence"],
            treatment_am=result["treatment"].get("am", ""),
            treatment_en=result["treatment"].get("en", ""),
            treatment_om=result["treatment"].get("om", ""),
            treatment_ti=result["treatment"].get("ti", ""),
            recommendations=json.dumps(result.get("recommendations", [])),
            created_at=datetime.utcnow()
        )
        
        db.add(detection)
        db.commit()
        db.refresh(detection)
        
        # Prepare response
        response = {
            "success": True,
            "data": {
                "id": str(detection.id),
                "disease_name": result["disease_name"],
                "confidence": result["confidence"],
                "treatment": result["treatment"].get(language, result["treatment"]["en"]),
                "recommendations": result.get("recommendations", []),
                "similar_cases": result.get("similar_cases", 0),
                "created_at": detection.created_at.isoformat()
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Disease detection error: {e}")
        return {"success": False, "error": str(e)}

def get_detection_history(db: Session, farmer_id):
    """Get detection history for a farmer"""
    detections = db.query(DiseaseDetection).filter(
        DiseaseDetection.farmer_id == farmer_id
    ).order_by(DiseaseDetection.created_at.desc()).limit(50).all()
    
    return [
        {
            "id": str(d.id),
            "crop_type": d.crop_type,
            "disease_name": d.disease_name,
            "confidence": d.confidence,
            "created_at": d.created_at.isoformat()
        }
        for d in detections
    ]
