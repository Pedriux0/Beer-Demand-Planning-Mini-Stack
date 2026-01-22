
# Beer Demand Planning Mini-Stack 🍺

A lightweight, end-to-end demand planning and production scheduling system.
Built with **Python (Pandas/Scikit-Learn)** for the pipeline and **React (Vite)** for the dashboard.
Automated via **GitHub Actions** and hosted on **GitHub Pages**.

![Architecture](docs/architecture.png) *See docs/ARCHITECTURE.md for diagram*

## Features
- **Data Ingestion**: Validates messy CSVs (schema checks, outlier detection).
- **Forecasting**: Competes Baseline (SMA) vs ML (Gradient Boosting) per SKU.
- **Production Planning**: Generates weekly supply plans respecting Safety Stock & MOQs.
- **Dashboard**: Serverless static site visualizing forecasts and KPIs.

## Quickstart

### 1. Run Pipeline
```bash
pip install pandas pandera scikit-learn click openpyxl pytest ruff
python -m pipeline run-all
```

### 2. Run Dashboard
```bash
cd dashboard
npm install
npm run dev
```

## Documentation
- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/RUNBOOK.md)
- [Data Dictionary](docs/DATA_DICTIONARY.md)

## Screenshots
*(Screenshots would go here)*

## Live Demo
[Link to GitHub Pages]
