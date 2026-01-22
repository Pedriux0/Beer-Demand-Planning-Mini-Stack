
# Architecture

```mermaid
graph TD
    subgraph "Data Pipeline (Python)"
        A[Raw CSVs] -->|Ingest| B(Validation / Pandera)
        B -->|Clean| C(Curated Tables)
        C -->|Transform| D(Feature Engineering)
        D -->|Train/Predict| E(Forecasting Models)
        E -->|Plan| F(Production Plan)
        F --> G[Pipeline Outputs]
    end

    subgraph "Dashboard (React/Vite)"
        G -->|Publish| H[Public Data Dir]
        H -->|Fetch| I(Overview Page)
        H -->|Fetch| J(Forecast Page)
        H -->|Fetch| K(Planning Page)
    end

    subgraph "Automation (GitHub Actions)"
        L[Git Push / Schedule] --> M{Run Pipeline}
        M -->|Success| N{Build Dashboard}
        N -->|Deploy| O[GitHub Pages]
    end
```

## Flow
1. **Ingestion**: Raw sales and inventory CSVs are read. Invalid rows (negative values, unknown SKUs) are flagged.
2. **Transformation**: Data is aggregated to daily level. Features (lags, rolling means) are computed.
3. **Forecasting**:
   - **Baseline**: Moving Average (SMA7).
   - **ML**: GradientBoostingRegressor trained per SKU.
   - Best model is selected based on MAPE using walk-forward validation.
4. **Planning**:
   - Safety stock calculated dynamically.
   - Production needed = Target Stock - Current Stock.
   - Values rounded to MOQ.
5. **Dashboard**: Static React site fetches the generated CSV/JSON files to visualize results.
