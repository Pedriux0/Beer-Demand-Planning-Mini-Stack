
# Data Dictionary

## Curated Tables (data/curated)

### `dim_product.csv`
- `sku` (String): Unique Product Identifier.
- `product_name` (String): Descriptive name.
- `category` (String): Product category (Beer, etc).
- `pack_size` (String): Packaging configuration (6PK, 4PK).
- `active_flag` (Boolean): 1 if active, 0 if discontinued.

### `fact_sales_daily.csv`
- `date` (Date): Transaction date.
- `channel` (String): Sales channel (Retail, Ecommerce).
- `sku` (String): Product SKU.
- `units_sold` (Integer): Total units sold.
- `revenue` (Float): Total revenue after discounts.
- `promo_flag` (Boolean): 1 if a promotion was active.

### `fact_inventory_daily.csv`
- `date` (Date): Snapshot date.
- `sku` (String): Product SKU.
- `on_hand` (Integer): Physical stock count.
- `on_order` (Integer): Units on order (in transit).
- `lead_time_days` (Integer): Days to replenish.

## Outputs (data/outputs)

### `forecast_daily.csv`
- `date` (Date): Forecast target date.
- `channel` (String): Sales channel.
- `sku` (String): Product SKU.
- `yhat` (Float): Forecasted units.
- `yhat_lower` (Float): Lower bound of confidence interval.
- `yhat_upper` (Float): Upper bound of confidence interval.
- `model_version` (String): Name of model used (Baseline_SMA vs GradientBoosting).

### `production_plan_weekly.csv`
- `week_start` (Date): Start of the planning week.
- `sku` (String): Product SKU.
- `forecast_units` (Integer): Total demand forecast for the week.
- `safety_stock` (Integer): Buffer stock required.
- `target_on_hand` (Integer): Forecast + Safety Stock.
- `suggested_production` (Integer): Net requirement rounded to MOQ.
- `notes` (String): Warnings (e.g., Low Stock, ROI).
