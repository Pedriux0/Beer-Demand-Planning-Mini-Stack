# Beer Demand Planning Mini-Stack — Internet-Sourced Data Pack (Collective Arts focus)

## What the app does (merged with data sources)
Demand forecasting for beer production using historical sales plus public market signals. The app combines:
- Brand catalog and product detail snapshots (Collective Arts collections and product pages).
- Retail price snapshots for competitive pricing signals (e.g., Loblaws, DrinkDash).
- Interest signals (Untappd ratings/check-ins) and availability proxies (Beer Store community API).
- Optional authorized sales and inventory feeds (LCBO Sale of Data or producer exports).

The dashboard visualizes:
- Past sales trends (line and bar charts).
- Forecasted demand with confidence intervals.
- KPIs: sell-through, stock-out risk, forecast accuracy.
- Scenario analysis to test price or marketing changes.

This design supports a public-signal baseline today and upgrades to true sales when authorized.

**Last verified:** 2026-01-21 (America/Toronto)  
**Primary objective:** Stand up an implementable data contract + seed datasets using **public internet signals** and an upgrade path to **true sales** through authorized channels.

---

## 0) Executive framing (what you can and can’t get from the internet)

### What you *can* reliably source from the open web (high coverage)
- **Product catalog**: name, “price from”, review counts, sold-out flags
- **Product detail enrichment**: ABV, description, pack variants (where visible)
- **Retail price snapshots**: shelf/online price + package size from major retailers
- **Signal-based demand proxies**:
  - Interest: ratings/check-ins (e.g., Untappd)
  - Availability: store availability feeds (official pages vary; community API exists)

### What you generally *cannot* get legally/consistently from the open web (high fidelity)
- **True POS sales** (units sold, net sales, store-level sell-through)
- **Wholesale shipment volumes**
- **Accurate inventory positions across channels**

**Upgrade path to real sales:** LCBO Sale of Data (SOD) for authorized stakeholders, and/or direct exports from the producer/agent.

---

## 1) Source registry (URLs you can ingest right now)

### 1.1 Collective Arts — core catalog surfaces (public)
- Beer & Cider collection (product cards: price-from, reviews, sold-out)
  - https://collectiveartscreativity.com/collections/beer-cider
- IPA collection (useful for focused SKU subsets)
  - https://collectiveartscreativity.com/collections/ipa
- New Release collection (new SKU detection + launch timing proxy)
  - https://collectiveartscreativity.com/collections/new-release
- “All products” (broader index; includes beer and non-beer SKUs)
  - https://collectiveartscreativity.com/collections/all

### 1.2 Collective Arts — product detail pages (public)
Use these to enrich ABV + descriptions + variant pack pricing where present:
- Life in the Clouds NEIPA
  - https://collectiveartscreativity.com/products/life-in-the-clouds-ipa
- Ransack the Universe West Coast Style IPA
  - https://collectiveartscreativity.com/products/ransack-the-universe-ipa
- Collective Lager
  - https://collectiveartscreativity.com/products/collective-lager

Optional: “Core Beer” editorial page (ABV list + marketing descriptions; good enrichment baseline)
- https://collectiveartscreativity.com/pages/core-beer

### 1.3 Retail price snapshots (public)
These are “price intelligence” signals — not sales.
- Loblaws — Life in the Clouds (example product page with pack size + price)
  - https://www.loblaws.ca/en/life-in-the-clouds-beer-id-required-at-pick-up/p/21396996_C04
- DrinkDash — Collective Arts Lager (example product page with size, ABV, in-stock, price)
  - https://drinkdash.ca/shop/31512-collective-arts-lager-7745

### 1.4 LCBO — real sales/inventory access (gated, authorized)
- LCBO Doing Business: Sale of Data program overview
  - https://www.doingbusinesswithlcbo.com/content/dbwl/en/basepage/home/new-supplier-agent/demo/SaleOfData.html
- SOD portal landing
  - https://sod.lcbo.com/
- SOD FAQ (PDF; describes weekly sales/inventory package contents)
  - https://sod.lcbo.com/downloads/reference_doc/SOD_FAQ.pdf
- SOD renewal notice (example of subscription renewal gating)
  - https://www.doingbusinesswithlcbo.com/content/dbwl/en/basepage/home/updates/2025-26-sale-of-data-program-and-renewal.html

### 1.5 Untappd — interest signal + API governance (public docs)
- Untappd API docs (rate limiting)
  - https://untappd.com/api/docs
- Untappd Business docs (session/token usage warning; don’t call sessions every request)
  - https://docs.business.untappd.com/
- API terms of use (compliance constraints)
  - https://untappd.com/terms/api

### 1.6 The Beer Store — availability intelligence (community + optional)
- Community “Beer Store API” repo (crawls product/store/availability; not official)
  - https://github.com/CDyWeb/beer-store-api

### 1.7 Location context (Hamilton anchor; useful for region dimension)
- Collective Arts Hamilton page (address and positioning)
  - https://collectiveartscreativity.com/pages/hamilton

---

## 2) Data governance (non-negotiables)

### 2.1 Classification
- **Public catalog + prices**: OK for analytics as “market signals”
- **True sales data**: usually **restricted** and contract-bound (LCBO SOD; producer/agent exports)

### 2.2 Rate limiting & platform health
- Untappd is rate-limited; default API access is limited per hour per key (per docs). Implement caching and backoff.
- If using Untappd Business token flows: don’t call `/sessions` for every request; fetch token once and reuse.

### 2.3 Terms & redistribution risk
- Treat platform ToS as your compliance perimeter (especially if you plan to publish dashboards publicly).
- For SOD: assume strict restrictions; keep outputs aggregated unless you have explicit rights.

---

## 3) Canonical data contract (you implement this once)

### 3.1 Dimensions (stable)
#### `dim_product`
- `product_id` (internal stable ID; slug or hash)
- `brand` (e.g., “Collective Arts”)
- `product_name`
- `style` (NEIPA, West Coast IPA, Lager, Sour, etc.)
- `abv` (number)
- `package_ml` (number; nullable)
- `pack_size` (number; nullable)
- `source_urls` (array)

#### `dim_geo`
- `geo_id` (e.g., “ON-Hamilton”, “ON-GTA”)
- `region_name`
- `notes`

#### `dim_channel`
- `channel_id` (e.g., “DTC”, “Taproom”, “Retail”, “LCBO”, “BeerStore”)
- `channel_name`

### 3.2 Facts (time-variant)
#### `fact_catalog_snapshot` (daily)
Captures what the brand is currently merchandising online.
- `snapshot_date`
- `product_id`
- `price_from_cad`
- `review_count`
- `sold_out` (boolean)
- `collection` (beer-cider / ipa / new-release / all)
- `source_url`

#### `fact_product_detail_snapshot` (weekly)
- `snapshot_date`
- `product_id`
- `abv`
- `description`
- `variant_prices` (optional JSON)
- `source_url`

#### `fact_retail_price_snapshot` (daily/weekly)
- `snapshot_date`
- `retailer` (Loblaws, DrinkDash, etc.)
- `product_name_raw`
- `package_raw`
- `price_cad`
- `in_stock` (nullable; if provided)
- `source_url`

#### `fact_interest_signal` (daily/weekly; optional)
- `as_of_date`
- `product_id`
- `signal_type` (e.g., “untappd_rating”, “untappd_checkins”)
- `signal_value`
- `source_url` or `api_endpoint`

#### `fact_availability_signal` (daily/weekly; optional)
- `as_of_date`
- `product_id`
- `geo_id`
- `channel_id` (BeerStore, Retail)
- `availability_rate` (0..1) or store counts
- `source_url` or `api_endpoint`

#### `fact_sales` (only if authorized)
- `date`
- `product_sku`
- `geo_id`
- `channel_id`
- `units_sold`
- `net_sales_cad`
- `promo_flag`

---

## 4) KPI layer (forecast-adjacent, dashboard-ready)

### 4.1 “Sell-through” (two operating modes)
**Mode A (real inventory available):**
- `sell_through = units_sold / (units_sold + ending_on_hand_units)`

**Mode B (no inventory — proxy mode):**
- `velocity = rolling_avg(units_sold_proxy, 7/14 days)`
- `sell_through_proxy = normalize(velocity) * normalize(availability_rate)`

### 4.2 Stock-out risk (two modes)
**Mode A (inventory + lead time av**
