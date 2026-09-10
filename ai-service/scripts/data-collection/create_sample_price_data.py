"""
Create sample Ethiopian price data for testing
Generates realistic price patterns for common Ethiopian crops
"""

import random
from datetime import datetime, timedelta
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.prediction import PriceHistory

def create_sample_data():
    db = SessionLocal()
    
    crops = ['teff', 'wheat', 'maize', 'barley', 'sorghum']
    regions = ['shewa', 'amhara', 'oromia', 'tigray']
    markets = ['addis_ababa', 'bahir_dar', 'adama', 'mekelle', 'hawassa', 'jimma']
    
    # Base prices per crop (in Birr per quintal)
    base_prices = {
        'teff': 3500,
        'wheat': 2800,
        'maize': 2500,
        'barley': 2200,
        'sorghum': 2000
    }
    
    start_date = datetime.now() - timedelta(days=365)
    records_added = 0
    
    print("🌾 Creating sample price data...")
    
    for crop in crops:
        base = base_prices.get(crop, 3000)
        for region in regions:
            for i in range(365):
                # Add realistic price variations
                # Seasonal pattern: prices vary by month
                month = (start_date + timedelta(days=i)).month
                
                # Harvest season (October-January) prices are lower
                if month in [10, 11, 12, 1]:
                    season_factor = random.uniform(-150, -50)
                # Planting season (February-May) prices are higher
                elif month in [2, 3, 4, 5]:
                    season_factor = random.uniform(50, 200)
                # Rainy season (June-September) prices moderate
                else:
                    season_factor = random.uniform(-50, 100)
                
                # Random daily fluctuation
                daily_noise = random.uniform(-200, 200)
                
                # Long-term trend (slight increase over time)
                trend = i * 0.3
                
                price = base + season_factor + daily_noise + trend
                price = max(500, round(price, 2))
                
                record = PriceHistory(
                    crop_name=crop,
                    region=region,
                    market=random.choice(markets),
                    price=price,
                    recorded_date=start_date + timedelta(days=i)
                )
                db.add(record)
                records_added += 1
                
                if records_added % 1000 == 0:
                    print(f"   Created {records_added} records...")
    
    db.commit()
    db.close()
    
    print(f"\n✅ Created {records_added} sample price records!")
    print(f"   🌾 Crops: {crops}")
    print(f"   📍 Regions: {regions}")

if __name__ == "__main__":
    create_sample_data()
