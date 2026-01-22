# Beer Demand Planning Mini-Stack - Overview

## What the app does
Demand forecasting for beer production based on historical sales, seasonality, and promotional events. The dashboard visualizes:
- Past sales trends (line charts, bar graphs).
- Forecasted demand with confidence intervals.
- KPIs such as sell-through rate, stock-out risk, and forecast accuracy.
- Scenario analysis so users can adjust inputs (price changes, marketing spend) and see forecast impact.
- Export and share to CSV/PNG or a shareable link.

## How it works (high-level flow)
1. Data ingestion: static CSV/JSON files (future API) load into the client-side store at app start.
2. Pre-processing: clean data, interpolate missing values, generate time-series features (month, week-of-year, holidays).
3. Modeling: a lightweight ARIMA/Prophet-style algorithm (JavaScript) runs in the browser to produce forecasts and bounds.
4. Visualization: charts render with Vite + React and Chart.js.
5. User interaction: sliders and dropdowns update model parameters in real time; charts re-render automatically.

## Data sources and signals (from DATA_SOURCES.md)
This project is designed around public internet signals with a path to authorized sales data.

### Public catalog and product detail sources
- Collective Arts Beer and Cider collection: https://collectiveartscreativity.com/collections/beer-cider
- Collective Arts IPA collection: https://collectiveartscreativity.com/collections/ipa
- Collective Arts New Release collection: https://collectiveartscreativity.com/collections/new-release
- Collective Arts All products collection: https://collectiveartscreativity.com/collections/all
- Product details (examples):
  - https://collectiveartscreativity.com/products/life-in-the-clouds-ipa
  - https://collectiveartscreativity.com/products/ransack-the-universe-ipa
  - https://collectiveartscreativity.com/products/collective-lager
- Core Beer editorial page (ABV and descriptions): https://collectiveartscreativity.com/pages/core-beer

### Retail price snapshots (public, not sales)
- Loblaws product page: https://www.loblaws.ca/en/life-in-the-clouds-beer-id-required-at-pick-up/p/21396996_C04
- DrinkDash product page: https://drinkdash.ca/shop/31512-collective-arts-lager-7745

### Interest and availability signals
- Untappd API docs: https://untappd.com/api/docs
- Untappd Business docs: https://docs.business.untappd.com/
- Untappd API terms: https://untappd.com/terms/api
- Beer Store community API (availability, unofficial): https://github.com/CDyWeb/beer-store-api

### Location context
- Collective Arts Hamilton page: https://collectiveartscreativity.com/pages/hamilton

### Authorized sales and inventory (gated)
- LCBO Sale of Data program: https://www.doingbusinesswithlcbo.com/content/dbwl/en/basepage/home/new-supplier-agent/demo/SaleOfData.html
- LCBO SOD portal: https://sod.lcbo.com/
- LCBO SOD FAQ: https://sod.lcbo.com/downloads/reference_doc/SOD_FAQ.pdf

## Data governance and constraints
- Public catalog and prices are market signals, not sales.
- True sales data is restricted and contract-bound (LCBO SOD or producer exports).
- Untappd is rate-limited; use caching and backoff, and avoid per-request session creation.
- Follow platform terms for redistribution; aggregate outputs if rights are limited.

## Canonical data contract
### Dimensions
- dim_product: product_id, brand, product_name, style, abv, package_ml, pack_size, source_urls
- dim_geo: geo_id, region_name, notes
- dim_channel: channel_id, channel_name

### Facts
- fact_catalog_snapshot (daily): snapshot_date, product_id, price_from_cad, review_count, sold_out, collection, source_url
- fact_product_detail_snapshot (weekly): snapshot_date, product_id, abv, description, variant_prices, source_url
- fact_retail_price_snapshot (daily/weekly): snapshot_date, retailer, product_name_raw, package_raw, price_cad, in_stock, source_url
- fact_interest_signal (daily/weekly, optional): as_of_date, product_id, signal_type, signal_value, source_url or api_endpoint
- fact_availability_signal (daily/weekly, optional): as_of_date, product_id, geo_id, channel_id, availability_rate, source_url or api_endpoint
- fact_sales (authorized only): date, product_sku, geo_id, channel_id, units_sold, net_sales_cad, promo_flag

## KPI layer
- Sell-through (real inventory): units_sold / (units_sold + ending_on_hand_units)
- Sell-through proxy (no inventory): normalize(rolling_avg(units_sold_proxy)) * normalize(availability_rate)
- Stock-out risk and forecast accuracy should follow the same dual-mode approach once inventory or proxy signals are available.

## What is already implemented
- Project scaffolding: Vite + TypeScript project generated; npm run dev works.
- Styling: src/index.css provides a dark-mode-ready design system (CSS variables, gradients, glassmorphism cards).
- Data layer: src/data contains sample sales CSVs and a loader utility.
- Forecast engine: src/forecast implements a moving-average baseline and a lightweight ARIMA-like model.
- Dashboard UI: src/components includes ChartPanel, KPIBar, ScenarioControls wired to the forecast engine.
- Routing: single-page app with home (/) and scenario (/scenario) routes.
- Build and dev scripts: vite.config.ts and postcss.config.js configured for HMR and CSS processing.
- Package metadata: package.json lists react, react-dom, chart.js, typescript, and vite.

## Technical stack
- Core: HTML + vanilla CSS design system + React (JSX) for UI.
- Language: TypeScript (strict typing).
- Build tool: Vite.
- Styling pipeline: PostCSS.
- Charts: Chart.js.
- Version control: Git.
