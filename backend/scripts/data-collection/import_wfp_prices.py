"""
Import WFP Food Price Data into AgroNexus AI
Handles the actual WFP CSV format
"""

import pandas as pd
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app.models.prediction import PriceHistory

def import_wfp_data(csv_path: str, limit: int = 5000):
    """Import WFP data into database"""
    db = SessionLocal()
    
    try:
        # Read CSV with proper delimiter
        df = pd.read_csv(csv_path, encoding='utf-8', on_bad_lines='skip')
        print(f"📊 Loaded {len(df)} records from CSV")
        print(f"📋 Columns: {list(df.columns)}")
        
        # Try to find the right columns
        # WFP data often has: country, region, market, commodity, price, date
        column_mapping = {}
        
        # Map columns based on names
        for col in df.columns:
            col_lower = col.lower()
            if 'country' in col_lower or 'adm0' in col_lower:
                column_mapping['country'] = col
            elif 'region' in col_lower or 'adm1' in col_lower:
                column_mapping['region'] = col
            elif 'market' in col_lower:
                column_mapping['market'] = col
            elif 'commodity' in col_lower or 'item' in col_lower:
                column_mapping['commodity'] = col
            elif 'price' in col_lower:
                column_mapping['price'] = col
            elif 'date' in col_lower:
                column_mapping['date'] = col
        
        print(f"📋 Column mapping: {column_mapping}")
        
        # Ethiopian crops mapping
        crop_map = {
            'teff': ['teff', 'tef'],
            'wheat': ['wheat'],
            'maize': ['maize', 'corn'],
            'barley': ['barley'],
            'sorghum': ['sorghum'],
            'coffee': ['coffee'],
        }
        
        def map_crop(commodity):
            if pd.isna(commodity):
                return None
            comm_lower = str(commodity).lower()
            for crop, synonyms in crop_map.items():
                if any(syn in comm_lower for syn in synonyms):
                    return crop
            return None
        
        imported = 0
        skipped = 0
        
        for idx, row in df.iterrows():
            if idx >= limit:
                break
                
            try:
                # Get data from mapped columns
                country = row.get(column_mapping.get('country', ''), '')
                if country and 'ethiopia' not in str(country).lower():
                    continue
                
                region = str(row.get(column_mapping.get('region', ''), '')).lower()
                if not region:
                    continue
                
                market = str(row.get(column_mapping.get('market', ''), ''))[:100]
                commodity = str(row.get(column_mapping.get('commodity', ''), ''))
                crop = map_crop(commodity)
                if not crop:
                    skipped += 1
                    continue
                
                price = row.get(column_mapping.get('price', ''))
                if pd.isna(price) or price <= 0:
                    continue
                
                date_val = row.get(column_mapping.get('date', ''))
                if pd.isna(date_val):
                    continue
                
                # Parse date
                try:
                    date = pd.to_datetime(date_val)
                except:
                    continue
                
                # Create record
                record = PriceHistory(
                    crop_name=crop,
                    region=region,
                    market=market,
                    price=float(price),
                    recorded_date=date.date()
                )
                db.add(record)
                imported += 1
                
                if imported % 100 == 0:
                    print(f"   Imported {imported} records...")
                    
            except Exception as e:
                skipped += 1
                continue
        
        db.commit()
        
        print(f"\n✅ Import complete!")
        print(f"   📊 Imported: {imported} records")
        print(f"   ⏭️  Skipped: {skipped} records")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    csv_path = "../data/raw/food_prices_ethiopia.csv"
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    import_wfp_data(csv_path)
