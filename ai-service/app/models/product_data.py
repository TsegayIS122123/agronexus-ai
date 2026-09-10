"""
Pre-defined product specifications for Ethiopian crops
"""

PRODUCT_SPECS = [
    {
        "name": "Teff Flour",
        "category": "flour",
        "description": "High-quality teff flour for injera and baking. Ethiopian staple food.",
        "crop_inputs": {"crop": "teff", "ratio": 1.5},
        "min_capital": 50000,
        "max_capital": 200000,
        "min_quantity": 500,
        "equipment_list": [
            "Cleaning machine (10,000 ETB)",
            "Milling machine (30,000 ETB)",
            "Packaging machine (15,000 ETB)"
        ],
        "processing_steps": [
            "Cleaning and sorting teff grains",
            "Milling to fine powder",
            "Sifting and quality check",
            "Packaging and labeling"
        ],
        "avg_roi": 35,
        "payback_months": 18,
        "image_url": "/images/products/teff-flour.jpg"
    },
    {
        "name": "Wheat Flour",
        "category": "flour",
        "description": "Premium wheat flour for bread, pasta, and pastries.",
        "crop_inputs": {"crop": "wheat", "ratio": 1.3},
        "min_capital": 80000,
        "max_capital": 300000,
        "min_quantity": 1000,
        "equipment_list": [
            "Grain cleaner (15,000 ETB)",
            "Roller mill (45,000 ETB)",
            "Sifter (10,000 ETB)",
            "Packaging machine (20,000 ETB)"
        ],
        "processing_steps": [
            "Cleaning and conditioning wheat",
            "Roller milling to extract flour",
            "Sifting and grading",
            "Packaging and storage"
        ],
        "avg_roi": 30,
        "payback_months": 24,
        "image_url": "/images/products/wheat-flour.jpg"
    },
    {
        "name": "Maize Flour",
        "category": "flour",
        "description": "Maize flour for porridge, baking, and animal feed.",
        "crop_inputs": {"crop": "maize", "ratio": 1.2},
        "min_capital": 40000,
        "max_capital": 150000,
        "min_quantity": 800,
        "equipment_list": [
            "Corn sheller (8,000 ETB)",
            "Hammer mill (25,000 ETB)",
            "Packaging machine (12,000 ETB)"
        ],
        "processing_steps": [
            "Shelling and cleaning maize",
            "Hammer milling to flour",
            "Sifting and quality control",
            "Packaging"
        ],
        "avg_roi": 40,
        "payback_months": 12,
        "image_url": "/images/products/maize-flour.jpg"
    },
    {
        "name": "Edible Oil (Sunflower)",
        "category": "oil",
        "description": "Premium sunflower cooking oil, healthy and affordable.",
        "crop_inputs": {"crop": "sunflower", "ratio": 3.5},
        "min_capital": 150000,
        "max_capital": 500000,
        "min_quantity": 1000,
        "equipment_list": [
            "Seed cleaner (20,000 ETB)",
            "Oil expeller (80,000 ETB)",
            "Filter press (25,000 ETB)",
            "Bottling machine (35,000 ETB)"
        ],
        "processing_steps": [
            "Cleaning and drying seeds",
            "Expelling oil (mechanical)",
            "Filtration and refining",
            "Bottling and labeling"
        ],
        "avg_roi": 45,
        "payback_months": 15,
        "image_url": "/images/products/sunflower-oil.jpg"
    },
    {
        "name": "Coffee Roasted Beans",
        "category": "beverage",
        "description": "Premium Ethiopian coffee beans, roasted to perfection.",
        "crop_inputs": {"crop": "coffee", "ratio": 4.5},
        "min_capital": 100000,
        "max_capital": 400000,
        "min_quantity": 500,
        "equipment_list": [
            "Coffee roaster (60,000 ETB)",
            "Grinder (20,000 ETB)",
            "Packaging machine (25,000 ETB)"
        ],
        "processing_steps": [
            "Green coffee sorting",
            "Roasting at optimal temperature",
            "Cooling and grinding",
            "Packaging in airtight bags"
        ],
        "avg_roi": 50,
        "payback_months": 12,
        "image_url": "/images/products/coffee.jpg"
    },
    {
        "name": "Barley Flour",
        "category": "flour",
        "description": "Nutritious barley flour for bread and traditional foods.",
        "crop_inputs": {"crop": "barley", "ratio": 1.4},
        "min_capital": 45000,
        "max_capital": 180000,
        "min_quantity": 600,
        "equipment_list": [
            "Grain cleaner (12,000 ETB)",
            "Mill (28,000 ETB)",
            "Packaging machine (10,000 ETB)"
        ],
        "processing_steps": [
            "Cleaning and dehulling barley",
            "Milling to flour",
            "Sifting",
            "Packaging"
        ],
        "avg_roi": 32,
        "payback_months": 20,
        "image_url": "/images/products/barley-flour.jpg"
    },
    {
        "name": "Fruit Juice (Mango)",
        "category": "juice",
        "description": "Natural mango juice concentrate, no preservatives.",
        "crop_inputs": {"crop": "mango", "ratio": 5.0},
        "min_capital": 120000,
        "max_capital": 450000,
        "min_quantity": 2000,
        "equipment_list": [
            "Juice extractor (40,000 ETB)",
            "Pasteurizer (50,000 ETB)",
            "Bottling line (45,000 ETB)"
        ],
        "processing_steps": [
            "Washing and sorting mangoes",
            "Extracting juice",
            "Pasteurization",
            "Bottling and sealing"
        ],
        "avg_roi": 55,
        "payback_months": 10,
        "image_url": "/images/products/mango-juice.jpg"
    }
]
