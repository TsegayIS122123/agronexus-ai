"""
Pre-defined export standards for Ethiopian agricultural products
"""

EXPORT_STANDARDS = [
    {
        "name": "ESA",
        "product_category": "flour",
        "min_grade": 85.0,
        "max_moisture": 14.0,
        "max_defects": 3,
        "min_size": 0.5,
        "description": "Ethiopian Standards Agency - Flour Quality Standard",
        "requirements": ["Clean color", "Fine texture", "No foreign materials"]
    },
    {
        "name": "ESA",
        "product_category": "oil",
        "min_grade": 80.0,
        "max_moisture": 0.5,
        "max_defects": 2,
        "min_size": 0.0,
        "description": "Ethiopian Standards Agency - Edible Oil Standard",
        "requirements": ["Clear appearance", "Neutral taste", "No rancidity"]
    },
    {
        "name": "EU",
        "product_category": "flour",
        "min_grade": 90.0,
        "max_moisture": 14.5,
        "max_defects": 2,
        "min_size": 0.5,
        "description": "European Union - Flour Import Standard",
        "requirements": ["Premium quality", "No pesticide residue", "Consistent texture"]
    },
    {
        "name": "US",
        "product_category": "flour",
        "min_grade": 88.0,
        "max_moisture": 14.0,
        "max_defects": 3,
        "min_size": 0.5,
        "description": "United States - Flour Import Standard",
        "requirements": ["High quality", "Low moisture", "Good color"]
    },
    {
        "name": "ESA",
        "product_category": "coffee",
        "min_grade": 85.0,
        "max_moisture": 12.5,
        "max_defects": 5,
        "min_size": 15.0,
        "description": "Ethiopian Standards Agency - Coffee Standard",
        "requirements": ["No defects", "Uniform size", "Good color"]
    }
]
