import logging
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)

def analyze_energy(
    monthly_energy_cost: float,
    equipment_power_kw: float,
    operating_hours: float,
    solar_irradiation: float = 5.0,  # kWh/m²/day average in Ethiopia
    biofuel_availability: bool = True,
    current_fuel_cost: float = 80.0,  # ETB per liter
    solar_installation_cost: float = 50000,  # ETB per kW
    biofuel_installation_cost: float = 30000  # ETB per kW
) -> Dict:
    """
    Analyze energy usage and recommend optimization
    
    Returns:
    - Energy usage breakdown
    - Solar recommendations
    - Biofuel recommendations
    - ROI for each option
    """
    
    # Current energy usage
    monthly_energy_kwh = equipment_power_kw * operating_hours * 30  # 30 days
    monthly_energy_usage = {
        "kwh_per_month": round(monthly_energy_kwh, 2),
        "cost_per_kwh": round(monthly_energy_cost / monthly_energy_kwh, 2) if monthly_energy_kwh > 0 else 0,
        "monthly_cost": monthly_energy_cost,
        "annual_cost": monthly_energy_cost * 12
    }
    
    # Solar analysis
    solar_analysis = analyze_solar(
        monthly_energy_kwh=monthly_energy_kwh,
        solar_irradiation=solar_irradiation,
        solar_installation_cost=solar_installation_cost
    )
    
    # Biofuel analysis
    biofuel_analysis = analyze_biofuel(
        monthly_energy_kwh=monthly_energy_kwh,
        current_fuel_cost=current_fuel_cost,
        biofuel_installation_cost=biofuel_installation_cost,
        biofuel_availability=biofuel_availability
    )
    
    # Recommendations
    recommendations = generate_energy_recommendations(
        monthly_energy_kwh=monthly_energy_kwh,
        solar_analysis=solar_analysis,
        biofuel_analysis=biofuel_analysis
    )
    
    return {
        "success": True,
        "data": {
            "current_energy_usage": monthly_energy_usage,
            "solar": solar_analysis,
            "biofuel": biofuel_analysis,
            "recommendations": recommendations,
            "summary": get_energy_summary(solar_analysis, biofuel_analysis)
        }
    }

def analyze_solar(
    monthly_energy_kwh: float,
    solar_irradiation: float,
    solar_installation_cost: float
) -> Dict:
    """Analyze solar energy potential"""
    
    # Solar panel efficiency
    panel_efficiency = 0.15  # 15% efficiency
    required_kw = monthly_energy_kwh / 30 / (solar_irradiation * panel_efficiency)
    required_kw = max(required_kw, 1)  # Minimum 1 kW
    
    # Cost calculation
    installation_cost = required_kw * solar_installation_cost
    maintenance_cost = installation_cost * 0.02  # 2% annual maintenance
    annual_savings = monthly_energy_kwh * 0.8 * 12 * (monthly_energy_kwh / 1000)  # Estimated
    
    # ROI
    if annual_savings > 0:
        payback_years = installation_cost / annual_savings
        roi = (annual_savings / installation_cost) * 100
    else:
        payback_years = 0
        roi = 0
    
    return {
        "required_kw": round(required_kw, 2),
        "installation_cost": round(installation_cost, 2),
        "annual_maintenance": round(maintenance_cost, 2),
        "annual_savings": round(annual_savings, 2),
        "payback_years": round(payback_years, 1),
        "roi_percentage": round(roi, 1),
        "feasibility": "highly_feasible" if roi > 30 else "feasible" if roi > 15 else "marginal"
    }

def analyze_biofuel(
    monthly_energy_kwh: float,
    current_fuel_cost: float,
    biofuel_installation_cost: float,
    biofuel_availability: bool
) -> Dict:
    """Analyze biofuel energy potential"""
    
    if not biofuel_availability:
        return {
            "available": False,
            "message": "Biofuel is not available in this area"
        }
    
    # Biofuel efficiency (assume 30% efficiency)
    biofuel_efficiency = 0.30
    required_liters = (monthly_energy_kwh / biofuel_efficiency) / 10  # Rough conversion
    required_kw = required_liters * 0.5  # Rough conversion
    
    # Cost calculation
    installation_cost = required_kw * biofuel_installation_cost
    annual_fuel_cost = required_liters * 12 * (current_fuel_cost * 0.7)
    current_annual_cost = monthly_energy_kwh * 12 * (monthly_energy_kwh / 1000)  # Estimate
    
    annual_savings = current_annual_cost - annual_fuel_cost
    
    if annual_savings > 0:
        payback_years = installation_cost / annual_savings
        roi = (annual_savings / installation_cost) * 100
    else:
        payback_years = 0
        roi = 0
    
    return {
        "available": True,
        "required_liters": round(required_liters, 2),
        "installation_cost": round(installation_cost, 2),
        "annual_fuel_cost": round(annual_fuel_cost, 2),
        "annual_savings": round(annual_savings, 2),
        "payback_years": round(payback_years, 1),
        "roi_percentage": round(roi, 1),
        "feasibility": "highly_feasible" if roi > 25 else "feasible" if roi > 10 else "marginal"
    }

def generate_energy_recommendations(
    monthly_energy_kwh: float,
    solar_analysis: Dict,
    biofuel_analysis: Dict
) -> List[str]:
    """Generate energy optimization recommendations"""
    recs = []
    
    # General recommendations
    if monthly_energy_kwh > 500:
        recs.append("High energy consumption detected. Consider energy-efficient equipment.")
    
    # Solar recommendations
    if solar_analysis.get("feasibility") == "highly_feasible":
        recs.append(f"Solar power is highly recommended. Installation: {solar_analysis['required_kw']} kW, ROI: {solar_analysis['roi_percentage']}%")
    elif solar_analysis.get("feasibility") == "feasible":
        recs.append(f"Solar power is recommended. Installation: {solar_analysis['required_kw']} kW, ROI: {solar_analysis['roi_percentage']}%")
    
    # Biofuel recommendations
    if biofuel_analysis.get("available") and biofuel_analysis.get("feasibility") in ["highly_feasible", "feasible"]:
        recs.append(f"Biofuel is a viable option. Annual savings: {biofuel_analysis['annual_savings']:.0f} ETB")
    
    # Efficiency recommendations
    recs.append("Implement energy monitoring and management system")
    recs.append("Schedule regular equipment maintenance for optimal efficiency")
    
    return recs

def get_energy_summary(solar_analysis: Dict, biofuel_analysis: Dict) -> Dict:
    """Get energy summary"""
    return {
        "solar_feasible": solar_analysis.get("feasibility") in ["highly_feasible", "feasible"],
        "biofuel_feasible": biofuel_analysis.get("available") and biofuel_analysis.get("feasibility") in ["highly_feasible", "feasible"],
        "best_option": "solar" if solar_analysis.get("roi_percentage", 0) > biofuel_analysis.get("roi_percentage", 0) else "biofuel",
        "recommended_roi": max(solar_analysis.get("roi_percentage", 0), biofuel_analysis.get("roi_percentage", 0))
    }
