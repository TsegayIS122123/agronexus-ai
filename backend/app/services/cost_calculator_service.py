import logging
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

def calculate_costs(
    product_type: str,
    monthly_production: float,
    raw_material_cost: float,
    labor_cost: float,
    utilities_cost: float,
    rent_cost: float,
    equipment_cost: float,
    packaging_cost: float,
    transportation_cost: float,
    tax_rate: float = 0.15
) -> Dict:
    """
    Calculate manufacturing costs and ROI
    
    Returns:
    - Total costs breakdown
    - Revenue projections
    - Profit margins
    - ROI and payback period
    """
    
    # Cost breakdown
    total_fixed_costs = rent_cost + equipment_cost
    total_variable_costs = raw_material_cost + labor_cost + utilities_cost + packaging_cost + transportation_cost
    total_monthly_cost = total_fixed_costs + total_variable_costs
    
    # Revenue calculation (based on product type)
    price_per_unit = get_price_per_unit(product_type)
    monthly_revenue = monthly_production * price_per_unit
    
    # Profit calculation
    gross_profit = monthly_revenue - total_variable_costs
    net_profit = gross_profit - total_fixed_costs
    net_profit_margin = (net_profit / monthly_revenue * 100) if monthly_revenue > 0 else 0
    
    # Annual projections
    annual_revenue = monthly_revenue * 12
    annual_net_profit = net_profit * 12
    
    # ROI calculation
    total_investment = equipment_cost + (rent_cost * 3)  # 3 months rent as initial investment
    roi = (annual_net_profit / total_investment * 100) if total_investment > 0 else 0
    
    # Payback period (months)
    if net_profit > 0:
        payback_period = total_investment / net_profit
        payback_period = min(payback_period, 60)  # Max 5 years
    else:
        payback_period = 60  # Never pay back
    
    # Break-even analysis
    break_even_units = total_fixed_costs / (price_per_unit - raw_material_cost) if (price_per_unit - raw_material_cost) > 0 else 0
    
    # Recommendations
    recommendations = generate_cost_recommendations(
        net_profit_margin=net_profit_margin,
        roi=roi,
        payback_period=payback_period,
        break_even_units=break_even_units
    )
    
    return {
        "success": True,
        "data": {
            "cost_breakdown": {
                "raw_material": round(raw_material_cost, 2),
                "labor": round(labor_cost, 2),
                "utilities": round(utilities_cost, 2),
                "rent": round(rent_cost, 2),
                "equipment": round(equipment_cost, 2),
                "packaging": round(packaging_cost, 2),
                "transportation": round(transportation_cost, 2)
            },
            "summary": {
                "total_fixed_costs": round(total_fixed_costs, 2),
                "total_variable_costs": round(total_variable_costs, 2),
                "total_monthly_cost": round(total_monthly_cost, 2),
                "monthly_revenue": round(monthly_revenue, 2),
                "gross_profit": round(gross_profit, 2),
                "net_profit": round(net_profit, 2),
                "net_profit_margin": round(net_profit_margin, 2),
                "annual_revenue": round(annual_revenue, 2),
                "annual_net_profit": round(annual_net_profit, 2)
            },
            "roi": {
                "total_investment": round(total_investment, 2),
                "roi_percentage": round(roi, 2),
                "payback_period_months": round(payback_period, 1)
            },
            "break_even": {
                "units_per_month": round(break_even_units, 2),
                "months_to_break_even": round(break_even_units / (monthly_production / 12) if monthly_production > 0 else 0, 1)
            },
            "recommendations": recommendations,
            "status": get_feasibility_status(roi, payback_period)
        }
    }

def get_price_per_unit(product_type: str) -> float:
    """Get estimated price per unit based on product type"""
    prices = {
        "flour": 50.0,
        "oil": 120.0,
        "juice": 80.0,
        "coffee": 300.0,
        "spice": 150.0,
        "dairy": 100.0,
        "bakery": 60.0,
        "beverage": 45.0,
        "default": 70.0
    }
    return prices.get(product_type.lower(), prices["default"])

def generate_cost_recommendations(
    net_profit_margin: float,
    roi: float,
    payback_period: float,
    break_even_units: float
) -> List[str]:
    """Generate cost optimization recommendations"""
    recs = []
    
    if net_profit_margin < 10:
        recs.append("Reduce raw material costs by sourcing in bulk")
        recs.append("Optimize labor costs through automation")
    elif net_profit_margin < 25:
        recs.append("Explore higher-margin products")
        recs.append("Implement lean manufacturing principles")
    
    if roi < 20:
        recs.append("Consider reducing equipment costs by buying used")
        recs.append("Negotiate better rent terms")
    elif roi < 40:
        recs.append("Increase production volume to improve economies of scale")
    
    if payback_period > 24:
        recs.append("Seek financing options to reduce initial investment burden")
        recs.append("Start with smaller scale to validate market")
    
    if break_even_units > 0:
        recs.append(f"Need to sell {round(break_even_units, 0)} units/month to break even")
    
    recs.append("Regularly review and optimize operational efficiency")
    
    return recs[:5]

def get_feasibility_status(roi: float, payback_period: float) -> str:
    """Get project feasibility status"""
    if roi >= 30 and payback_period <= 18:
        return "highly_feasible"
    elif roi >= 15 and payback_period <= 36:
        return "feasible"
    elif roi >= 5 and payback_period <= 48:
        return "marginally_feasible"
    else:
        return "not_feasible"
