import logging
import requests
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Simulated local prices (in reality, would fetch from database/API)
LOCAL_PRICES = {
    "teff": 3500,
    "wheat": 2800,
    "maize": 2500,
    "coffee": 12000,
    "barley": 2200,
    "sorghum": 2000,
}

# Simulated import prices (would fetch from external API)
IMPORT_PRICES = {
    "teff": 4200,
    "wheat": 3400,
    "maize": 3100,
    "coffee": 15000,
    "barley": 2700,
    "sorghum": 2500,
}

def get_price_comparison(crop: str) -> Dict:
    """Compare local and import prices for a crop"""
    
    local_price = LOCAL_PRICES.get(crop.lower())
    import_price = IMPORT_PRICES.get(crop.lower())
    
    if not local_price or not import_price:
        return {"error": f"Crop '{crop}' not found"}
    
    savings = import_price - local_price
    savings_percentage = (savings / import_price) * 100
    
    return {
        "success": True,
        "data": {
            "crop": crop,
            "local_price": local_price,
            "import_price": import_price,
            "savings": savings,
            "savings_percentage": round(savings_percentage, 2),
            "recommendation": "Buy local" if savings > 0 else "Import may be cheaper",
            "updated_at": datetime.utcnow().isoformat()
        }
    }

def get_all_comparisons() -> Dict:
    """Get price comparison for all crops"""
    
    results = []
    for crop in LOCAL_PRICES.keys():
        result = get_price_comparison(crop)
        if result.get("success"):
            results.append(result["data"])
    
    return {
        "success": True,
        "data": results
    }

def get_import_substitution_potential() -> Dict:
    """Calculate import substitution potential"""
    
    total_local = sum(LOCAL_PRICES.values())
    total_import = sum(IMPORT_PRICES.values())
    
    return {
        "success": True,
        "data": {
            "total_local_value": total_local,
            "total_import_value": total_import,
            "potential_savings": total_import - total_local,
            "savings_percentage": round(((total_import - total_local) / total_import) * 100, 2),
            "top_opportunities": sorted(
                [
                    {"crop": k, "savings": IMPORT_PRICES[k] - LOCAL_PRICES[k]}
                    for k in LOCAL_PRICES.keys()
                ],
                key=lambda x: x["savings"],
                reverse=True
            )[:3]
        }
    }
