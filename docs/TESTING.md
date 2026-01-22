
# Testing Guide - Beer Demand Planning Mini-Stack

Follow these steps to verify the end-to-end functionality of the project.

## 1. Test the Data Pipeline (Python)

The pipeline is the core "brain" of the project. It handles data generation, cleaning, forecasting, and planning.

### Run the full pipeline
This command executes all steps: Synthetic Data Generation -> Ingestion -> Transformation -> Forecasting -> Production Planning.
```bash
python -m pipeline run-all
```
**Verification**: Check that the `data/outputs` folder contains:
- `forecast_daily.csv`
- `forecast_metrics.csv`
- `production_plan_weekly.csv`
- `pipeline_report.json`

### Run Unit Tests
Verify the mathematical and logic parts of the pipeline:
```bash
pytest tests/test_pipeline.py
```

## 2. Test the Dashboard (React)

The dashboard allows you to visualize the pipeline results.

### Prepare Data
Copy the latest pipeline results into the dashboard folder:
```bash
python -m pipeline publish
```

### Start Local Development Server
```bash
cd dashboard
npm install
npm run dev
```
**Verification**: Open the URL displayed in the terminal (usually `http://localhost:5173`).
- **Overview Page**: Should show a MAPE percentage and "Success" status.
- **Forecast Page**: Select an SKU from the dropdown to see the chart.
- **Planning Page**: Should show the production table with "Suggested Production" values.

## 3. Deployment (CI/CD)

The project is configured to run automatically on GitHub.
- **Trigger**: Push a change to the `main` branch.
- **Action**: Check the "Actions" tab in your GitHub repository.
- **Result**: The dashboard will be deployed to your GitHub Pages URL.
