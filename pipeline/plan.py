
import pandas as pd
import numpy as np

def generate_production_plan():
    print("Generating production plan...")
    
    # Load inputs
    forecast = pd.read_csv("data/outputs/forecast_daily.csv")
    inventory = pd.read_csv("data/curated/fact_inventory_daily.csv")
    sku_map = pd.read_csv("data/curated/dim_product.csv")
    
    # 1. Aggregate Forecast to Weekly per SKU (ignore channel split for production)
    # We need total demand per sku
    forecast['week_start'] = pd.to_datetime(forecast['date']).dt.to_period('W').apply(lambda r: r.start_time)
    
    # Sum forecast units across channels and days
    weekly_demand = forecast.groupby(['week_start', 'sku'])['yhat'].sum().reset_index()
    weekly_demand.rename(columns={'yhat': 'forecast_units'}, inplace=True)
    
    # 2. Planning Parameters
    # Merge inventory snapshot (assuming inventory is "current" at start of planning)
    # real world: inventory changes over time. here: static snapshot for "Next Week Plan"
    
    # We implement a "First Week Plan" only for the demo
    next_week = weekly_demand['week_start'].min()
    plan = weekly_demand[weekly_demand['week_start'] == next_week].copy()
    
    plan = plan.merge(inventory[['sku', 'on_hand', 'on_order', 'lead_time_days']], on='sku', how='left')
    plan = plan.merge(sku_map[['sku', 'product_name', 'pack_size']], on='sku', how='left')
    
    # 3. Logic
    # Safety Stock (heuristic: 1.65 * sqrt(lead_time_weeks) * std_dev_demand)
    # We don't have std_dev directly here easily without history. 
    # Heuristic: 20% of demand * lead_time factor
    # Let's trust the "forecast" and add 20% buffer.
    
    plan['safety_stock'] = plan['forecast_units'] * 0.2
    plan['target_on_hand'] = plan['forecast_units'] + plan['safety_stock']
    
    # Net Requirements
    plan['net_demand'] = plan['target_on_hand'] - (plan['on_hand'] + plan['on_order'])
    plan['suggested_production'] = plan['net_demand'].apply(lambda x: max(0, x))
    
    # MOQ Constraint
    MOQ = 50
    plan['suggested_production'] = np.ceil(plan['suggested_production'] / MOQ) * MOQ
    
    # Notes
    def get_notes(row):
        notes = []
        if row['suggested_production'] > 0:
            notes.append(f"Rounded to MOQ {MOQ}")
        if row['on_hand'] < row['safety_stock']:
            notes.append("Low Stock")
        return "; ".join(notes)
        
    plan['notes'] = plan.apply(get_notes, axis=1)
    
    # Output
    output_cols = ['week_start', 'sku', 'product_name', 'forecast_units', 'safety_stock', 'on_hand', 'suggested_production', 'notes']
    plan[output_cols].to_csv("data/outputs/production_plan_weekly.csv", index=False)
    
    print("Production plan generated.")
    return plan

if __name__ == "__main__":
    generate_production_plan()
