import logging
import random
import base64
import io
from PIL import Image
import numpy as np
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from datetime import datetime
from app.models.quality import QualityGrade, ExportStandard
from app.models.standard_data import EXPORT_STANDARDS

logger = logging.getLogger(__name__)

def analyze_image(image_data: bytes) -> Dict:
    """Analyze product image for quality metrics"""
    try:
        # Convert to image
        img = Image.open(io.BytesIO(image_data))
        
        # Convert to numpy array for analysis
        img_array = np.array(img)
        
        # Simulate quality analysis
        # In production, this would use YOLOv8 or other computer vision models
        
        # Color analysis
        if len(img_array.shape) == 3:
            avg_color = np.mean(img_array, axis=(0, 1))
            # Score based on color uniformity and vibrancy
            color_score = min(100, max(50, 100 - (np.std(img_array) / 10)))
        else:
            color_score = 75.0
        
        # Texture analysis (simulated)
        texture_score = min(100, max(50, 80 + random.uniform(-15, 15)))
        
        # Size analysis (simulated)
        size_score = min(100, max(50, 85 + random.uniform(-15, 15)))
        
        # Moisture (simulated)
        moisture_score = min(100, max(50, 90 - random.uniform(0, 20)))
        
        # Defects (simulated)
        defect_count = random.randint(0, 5)
        defects_score = max(0, 100 - (defect_count * 15))
        
        # Overall grade
        overall_grade = (color_score * 0.25 + 
                        texture_score * 0.20 + 
                        size_score * 0.15 + 
                        moisture_score * 0.20 + 
                        defects_score * 0.20)
        
        # Defects detected
        defects = []
        if defect_count > 0:
            defect_types = ["Discoloration", "Surface imperfection", "Size variation", "Moisture issue", "Foreign material"]
            for i in range(defect_count):
                defects.append(random.choice(defect_types))
        
        return {
            "overall_grade": round(overall_grade, 2),
            "color_score": round(color_score, 2),
            "texture_score": round(texture_score, 2),
            "size_score": round(size_score, 2),
            "moisture_score": round(moisture_score, 2),
            "defects_score": round(defects_score, 2),
            "defects": defects[:3],
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Image analysis error: {e}")
        return {"error": str(e), "success": False}

def check_export_standards(grade: float, product_category: str) -> Dict:
    """Check if product meets export standards"""
    results = []
    for standard in EXPORT_STANDARDS:
        if standard["product_category"] == product_category:
            meets = grade >= standard["min_grade"]
            results.append({
                "standard": standard["name"],
                "min_grade": standard["min_grade"],
                "meets": meets,
                "requirements": standard.get("requirements", [])
            })
    
    # Determine if export ready
    export_ready = any(r["meets"] for r in results) if results else False
    best_standard = max(results, key=lambda x: x["min_grade"]) if results else None
    
    return {
        "export_ready": export_ready,
        "best_standard": best_standard["standard"] if best_standard else None,
        "standards": results,
        "recommendations": generate_recommendations(grade, results)
    }

def generate_recommendations(grade: float, standards: List) -> List:
    """Generate quality improvement recommendations"""
    recs = []
    
    if grade < 60:
        recs.append("Significant quality improvement needed. Review processing methods.")
    elif grade < 75:
        recs.append("Improve quality control during processing.")
    
    for std in standards:
        if not std["meets"]:
            recs.append(f"Work to meet {std['standard']} standard (required: {std['min_grade']}%)")
    
    recs.append("Regular quality monitoring is recommended")
    recs.append("Maintain consistent processing conditions")
    
    return recs[:4]

def save_quality_report(
    db: Session,
    user_id: str,
    product_name: str,
    product_category: str,
    analysis: Dict,
    image_data: bytes = None
) -> QualityGrade:
    """Save quality report to database"""
    
    # Check export standards
    standard_check = check_export_standards(
        analysis["overall_grade"], 
        product_category
    )
    
    report = QualityGrade(
        user_id=user_id,
        product_name=product_name,
        product_category=product_category,
        overall_grade=analysis["overall_grade"],
        color_score=analysis["color_score"],
        texture_score=analysis["texture_score"],
        size_score=analysis["size_score"],
        moisture_score=analysis["moisture_score"],
        defects_score=analysis["defects_score"],
        defects_detected=analysis.get("defects", []),
        export_ready=standard_check["export_ready"],
        standard_met=standard_check["best_standard"],
        recommendations=standard_check["recommendations"],
        status="processed"
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

def get_reports(db: Session, user_id: str):
    """Get quality reports for a user"""
    return db.query(QualityGrade).filter(
        QualityGrade.user_id == user_id
    ).order_by(QualityGrade.created_at.desc()).all()

def get_standards(product_category: str = None):
    """Get export standards"""
    if product_category:
        return [s for s in EXPORT_STANDARDS if s["product_category"] == product_category]
    return EXPORT_STANDARDS
