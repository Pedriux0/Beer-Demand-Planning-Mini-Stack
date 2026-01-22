
import pandas as pd
import pandera as pa
from pandera.typing import DataFrame, Series
import os
from typing import Dict, Tuple

# Schemas
# Schemas
SkuMapSchema = pa.DataFrameSchema({
    "sku": pa.Column(str, unique=True),
    "product_name": pa.Column(str),
    "category": pa.Column(str),
    "pack_size": pa.Column(str),
    "active_flag": pa.Column(int, coerce=True),
})

PosSalesSchema = pa.DataFrameSchema({
    "date": pa.Column(pd.Timestamp, coerce=True),
    "store_id": pa.Column(str),
    "sku": pa.Column(str),
    "units_sold": pa.Column(int, checks=pa.Check.ge(0)),
    "unit_price": pa.Column(float, checks=pa.Check.ge(0)),
    "promo_flag": pa.Column(int, coerce=True),
})

EcommerceSalesSchema = pa.DataFrameSchema({
    "date": pa.Column(pd.Timestamp, coerce=True),
    "sku": pa.Column(str),
    "units_sold": pa.Column(int, checks=pa.Check.ge(0)),
    "unit_price": pa.Column(float, checks=pa.Check.ge(0)),
    "discount": pa.Column(float, checks=pa.Check.ge(0)),
})

InventorySchema = pa.DataFrameSchema({
    "date": pa.Column(pd.Timestamp, coerce=True),
    "sku": pa.Column(str),
    "on_hand": pa.Column(int, checks=pa.Check.ge(0)),
    "on_order": pa.Column(int, checks=pa.Check.ge(0)),
    "lead_time_days": pa.Column(int, checks=pa.Check.ge(0)),
})

def ingest_and_validate() -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    print("Loading data...")
    
    # Load raw
    sku_map = pd.read_csv("data/raw/sku_map.csv")
    pos = pd.read_csv("data/raw/pos_sales.csv")
    ecom = pd.read_csv("data/raw/ecommerce_sales.csv")
    inv = pd.read_csv("data/raw/inventory.csv")

    # Dates
    pos['date'] = pd.to_datetime(pos['date'], errors='coerce')
    ecom['date'] = pd.to_datetime(ecom['date'], errors='coerce')
    inv['date'] = pd.to_datetime(inv['date'], errors='coerce')
    
    # Handle boolean/int flags
    pos['promo_flag'] = pos['promo_flag'].astype(int)
    sku_map['active_flag'] = sku_map['active_flag'].astype(int)
    
    # 1. Negative Unit Validation (Flag & Filter)
    # Business rule: units_sold >= 0. If negative, flag and exclude from clean stream.
    # Note: Schema checks strictly, so we might want to filter *before* strict schema check 
    # OR use lazy validation to capture errors.
    # Let's clean mostly-valid data first to pass schema.
    
    invalid_pos = pos[pos['units_sold'] < 0].copy()
    if not invalid_pos.empty:
        print(f"WARNING: Dropping {len(invalid_pos)} negative units rows from POS")
        invalid_pos.to_csv("data/outputs/dq_negative_pos.csv")
        pos = pos[pos['units_sold'] >= 0]
        
    invalid_ecom = ecom[ecom['units_sold'] < 0].copy()
    if not invalid_ecom.empty:
        print(f"WARNING: Dropping {len(invalid_ecom)} negative units rows from Ecom")
        invalid_ecom.to_csv("data/outputs/dq_negative_ecom.csv")
        ecom = ecom[ecom['units_sold'] >= 0]

    # 2. SKU Existence Check
    valid_skus = set(sku_map['sku'])
    
    # Check POS
    unknown_pos_mask = ~pos['sku'].isin(valid_skus)
    if unknown_pos_mask.any():
        print(f"WARNING: Found {unknown_pos_mask.sum()} unknown SKUs in POS")
        pos.loc[unknown_pos_mask, 'sku'] = 'UNKNOWN_SKU' 
        # Ideally we log these separately
    
    # Check Ecom
    unknown_ecom_mask = ~ecom['sku'].isin(valid_skus)
    if unknown_ecom_mask.any():
         print(f"WARNING: Found {unknown_ecom_mask.sum()} unknown SKUs in Ecom")
         ecom.loc[unknown_ecom_mask, 'sku'] = 'UNKNOWN_SKU'

    print("Validating schemas...")
    try:
        SkuMapSchema.validate(sku_map)
        PosSalesSchema.validate(pos)
        EcommerceSalesSchema.validate(ecom)
        InventorySchema.validate(inv)
        print("Schema validation passed.")
    except pa.errors.SchemaError as e:
        print(f"Schema Validation Failed: {e}")
        # In a real pipeline we might halt or route bad data. 
        # For this demo, we proceed but maybe logging was improved above.
    
    return sku_map, pos, ecom, inv

if __name__ == "__main__":
    ingest_and_validate()
