import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import os

# Configuration
START_DATE = datetime.now() - timedelta(days=365)
END_DATE = datetime.now()
DAYS = (END_DATE - START_DATE).days
STORES = [f"S{i:03d}" for i in range(1, 6)]
CHANNELS = ["Retail", "Ecommerce"]
SKUS = {
    "BEER_LAGER_6PK": {"name": "Classic Lager 6-Pack", "cat": "Beer", "price": 10.99, "lead_time": 7},
    "BEER_IPA_4PK": {"name": "Hoppy IPA 4-Pack", "cat": "Beer", "price": 12.99, "lead_time": 14},
    "BEER_STOUT_6PK": {"name": "Midnight Stout 6-Pack", "cat": "Beer", "price": 11.99, "lead_time": 10},
    "ALE_PALE_6PK": {"name": "Sunny Pale Ale 6-Pack", "cat": "Beer", "price": 10.49, "lead_time": 7},
    "UNKNOWN_SKU_999": {"name": "Discontinued Brew", "cat": "Legacy", "price": 5.00, "lead_time": 30}, # For testing DQ
}

np.random.seed(42)

def generate_sku_map():
    data = []
    for sku, info in SKUS.items():
        data.append({
            "sku": sku,
            "product_name": info["name"],
            "category": info["cat"],
            "pack_size": "6PK" if "6PK" in sku else "4PK",
            "active_flag": True if "UNKNOWN" not in sku else False
        })
    df = pd.DataFrame(data)
    df.to_csv("data/raw/sku_map.csv", index=False)
    print("Generated sku_map.csv")

def generate_pos_sales():
    data = []
    # Dates
    dates = [START_DATE + timedelta(days=i) for i in range(DAYS)]
    
    for date in dates:
        # Seasonality: higher in summer (months 6-8) and Dec (12)
        seasonality = 1.0
        if date.month in [6, 7, 8]: seasonality = 1.3
        if date.month == 12: seasonality = 1.2
        if date.weekday() >= 5: seasonality *= 1.5 # Weekends higher
        
        for store in STORES:
            for sku, info in SKUS.items():
                if "UNKNOWN" in sku and random.random() > 0.05: continue # Rare unknown sku
                
                # Base demand
                lambda_val = 5 * seasonality
                units = np.random.poisson(lambda_val)
                
                # Messy Data: Negatives
                if random.random() < 0.01: units = -1 * units
                
                # Messy Data: Promo
                promo = random.choice([True, False]) if random.random() < 0.1 else False
                if promo and units > 0: units =int(units * 1.5)
                
                if units != 0:
                    data.append({
                        "date": date.strftime("%Y-%m-%d"),
                        "store_id": store,
                        "sku": sku,
                        "units_sold": units,
                        "unit_price": info["price"] if not promo else info["price"] * 0.8,
                        "promo_flag": promo
                    })
    
    # Introduce duplicates
    data.extend(random.sample(data, 20))
    
    df = pd.DataFrame(data)
    df.to_csv("data/raw/pos_sales.csv", index=False)
    print(f"Generated pos_sales.csv with {len(df)} rows")

def generate_ecommerce_sales():
    data = []
    dates = [START_DATE + timedelta(days=i) for i in range(DAYS)]
    
    for date in dates:
        for sku, info in SKUS.items():
            if "UNKNOWN" in sku: continue
            
            # Ecommerce is more volatile
            if random.random() < 0.3: continue # Not sold every day
            
            units = np.random.randint(1, 20)
            discount = 0.0
            if random.random() < 0.05: discount = info["price"] * 0.1
            
            data.append({
                "date": date.strftime("%Y-%m-%d"),
                "sku": sku,
                "units_sold": units,
                "unit_price": info["price"],
                "discount": discount
            })
            
    df = pd.DataFrame(data)
    df.to_csv("data/raw/ecommerce_sales.csv", index=False)
    print(f"Generated ecommerce_sales.csv with {len(df)} rows")

def generate_inventory():
    data = []
    # Only need current inventory really, but let's generate a snapshot
    for sku, info in SKUS.items():
        data.append({
            "date": END_DATE.strftime("%Y-%m-%d"),
            "sku": sku,
            "on_hand": np.random.randint(0, 200),
            "on_order": np.random.randint(0, 100) if random.random() > 0.5 else 0,
            "lead_time_days": info["lead_time"]
        })
    df = pd.DataFrame(data)
    df.to_csv("data/raw/inventory.csv", index=False)
    print("Generated inventory.csv")

if __name__ == "__main__":
    os.makedirs("data/raw", exist_ok=True)
    generate_sku_map()
    generate_pos_sales()
    generate_ecommerce_sales()
    generate_inventory()
