import logging
import math
import random
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from app.models.industry import FeasibilityReport, ProductSpec, EquipmentListing
from app.models.product_data import PRODUCT_SPECS

logger = logging.getLogger(__name__)

def get_product_specs():
    """Get all available product specifications"""
    return PRODUCT_SPECS

def get_product_spec(product_name: str):
    """Get specific product specification"""
    for spec in PRODUCT_SPECS:
        if spec["name"].lower() == product_name.lower():
            return spec
    return None

def calculate_feasibility(
    product_name: str,
    location: str,
    capital: float,
    quantity: float
) -> Dict:
    """Calculate feasibility score for a product"""
    
    # Get product spec
    spec = get_product_spec(product_name)
    if not spec:
        return {"error": f"Product '{product_name}' not found"}
    
    # Check minimum requirements
    if capital < spec["min_capital"]:
        return {
            "error": f"Minimum capital required is {spec['min_capital']} ETB",
            "required": spec["min_capital"],
            "provided": capital
        }
    
    if quantity < spec["min_quantity"]:
        return {
            "error": f"Minimum quantity required is {spec['min_quantity']} kg",
            "required": spec["min_quantity"],
            "provided": quantity
        }
    
    # Calculate scores
    # Capital adequacy score (0-100)
    capital_ratio = capital / spec["min_capital"]
    capital_score = min(100, (capital_ratio - 0.8) / 2.0 * 100) if capital_ratio > 0.8 else 0
    capital_score = max(0, min(100, capital_score))
    
    # Quantity adequacy score
    quantity_ratio = quantity / spec["min_quantity"]
    quantity_score = min(100, (quantity_ratio - 0.8) / 3.0 * 100) if quantity_ratio > 0.8 else 0
    quantity_score = max(0, min(100, quantity_score))
    
    # Location factor (simplified: distance to market)
    location_score = 70 + random.randint(0, 30)  # Simulated
    
    # Resource availability (simplified)
    resource_score = 65 + random.randint(0, 35)  # Simulated
    
    # Market demand (simplified)
    market_score = 60 + random.randint(0, 40)  # Simulated
    
    # Financial score
    financial_score = (capital_score * 0.4 + quantity_score * 0.3 + resource_score * 0.3)
    financial_score = max(0, min(100, financial_score))
    
    # Overall feasibility score
    feasibility_score = (
        financial_score * 0.5 + 
        market_score * 0.25 + 
        location_score * 0.25
    )
    feasibility_score = max(0, min(100, feasibility_score))
    
    # Calculate financial projections
    monthly_capacity = quantity / 12  # Assuming monthly production
    selling_price = monthly_capacity * 150  # Average price per kg
    cost_price = monthly_capacity * 80  # Average cost per kg
    monthly_revenue = selling_price
    monthly_cost = cost_price + (capital * 0.01)  # +1% capital maintenance
    
    monthly_profit = monthly_revenue - monthly_cost
    annual_profit = monthly_profit * 12
    
    # ROI calculation
    roi = (annual_profit / capital) * 100 if capital > 0 else 0
    
    # Payback period (months)
    if monthly_profit > 0:
        payback_period = capital / monthly_profit
        payback_period = min(payback_period, 60)  # Max 5 years
    else:
        payback_period = 60
    
    # Generate recommendations
    recommendations = []
    if feasibility_score < 60:
        recommendations.append("Consider increasing capital investment")
        recommendations.append("Start with a smaller scale to reduce risk")
        recommendations.append("Seek government subsidies for agri-processing")
    elif feasibility_score < 80:
        recommendations.append("Improve operational efficiency")
        recommendations.append("Consider cooperative ownership to share costs")
        recommendations.append("Invest in marketing for better market access")
    else:
        recommendations.append("Proceed with implementation")
        recommendations.append("Consider expanding production capacity")
        recommendations.append("Explore export opportunities")
    
    # Generate risks
    risks = [
        "Price volatility of raw materials",
        "Competition from imported products",
        "Quality control challenges"
    ]
    
    if feasibility_score < 60:
        risks.append("High financial risk due to capital constraints")
    
    return {
        "success": True,
        "product_name": product_name,
        "location": location,
        "capital": capital,
        "quantity": quantity,
        "scores": {
            "feasibility_score": round(feasibility_score, 2),
            "financial_score": round(financial_score, 2),
            "market_score": round(market_score, 2),
            "resource_score": round(resource_score, 2),
            "location_score": round(location_score, 2)
        },
        "financials": {
            "estimated_roi": round(roi, 2),
            "payback_period": round(payback_period, 1),
            "monthly_revenue": round(monthly_revenue, 2),
            "monthly_cost": round(monthly_cost, 2),
            "monthly_profit": round(monthly_profit, 2),
            "annual_profit": round(annual_profit, 2)
        },
        "recommendations": recommendations[:4],
        "risks": risks[:3],
        "product_spec": {
            "name": spec["name"],
            "category": spec["category"],
            "description": spec["description"],
            "equipment": spec["equipment_list"],
            "steps": spec["processing_steps"],
            "avg_roi": spec["avg_roi"],
            "payback_months": spec["payback_months"]
        },
        "status": "approved" if feasibility_score >= 70 else "review"
    }

def save_feasibility_report(
    db: Session,
    user_id: str,
    crop_type: str,
    product_type: str,
    location: str,
    capital: float,
    quantity: float,
    result: Dict
) -> FeasibilityReport:
    """Save feasibility report to database"""
    
    scores = result["scores"]
    financials = result["financials"]
    
    report = FeasibilityReport(
        user_id=user_id,
        crop_type=crop_type,
        product_type=product_type,
        location=location,
        capital=capital,
        quantity=quantity,
        feasibility_score=scores["feasibility_score"],
        market_score=scores["market_score"],
        resource_score=scores["resource_score"],
        financial_score=scores["financial_score"],
        estimated_roi=financials["estimated_roi"],
        payback_period=financials["payback_period"],
        monthly_revenue=financials["monthly_revenue"],
        monthly_cost=financials["monthly_cost"],
        recommendations=result.get("recommendations", []),
        risks=result.get("risks", []),
        status="approved" if scores["feasibility_score"] >= 70 else "review"
    )
    
    db.add(report)
    db.commit()
    db.refresh(report)
    
    return report

def get_reports(db: Session, user_id: str):
    """Get feasibility reports for a user"""
    return db.query(FeasibilityReport).filter(
        FeasibilityReport.user_id == user_id
    ).order_by(FeasibilityReport.created_at.desc()).all()
