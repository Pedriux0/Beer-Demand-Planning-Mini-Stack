
# Runbook

## Local Development

### Prerequisites
- Python 3.11+
- Node.js 18+

### Setup
1. Install Python deps: `pip install -e .` (or requirements)
2. Install Node deps: `cd dashboard && npm install`

### Running the Pipeline
```bash
# Generate data, clean, forecast, plan
python -m pipeline run-all
```

### Running the Dashboard
```bash
# Publish data to dashboard folder
python -m pipeline publish

# Start dev server
cd dashboard
npm run dev
```

## Troubleshooting

### "SchemaValidationFailure"
- **Cause**: Input CSVs violate strict schema (e.g. negative prices, wrong types).
- **Fix**: Check `data/raw` or the generation script. Invalid rows are usually dropped/flagged but catastrophic structure changes causes crashes.

### "npm install" errors
- **Cause**: File locking or cache issues.
- **Fix**: Delete `node_modules` and runs `npm install` again.

### GitHub Action Failure
- **Check**: Pipeline logs for "Tests failed" or "Missing dependencies".
- **Fix**: Ensure `requirements.txt` or `pyproject.toml` matches imports.
