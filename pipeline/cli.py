
import click
from pipeline.ingest import ingest_and_validate
from pipeline.transform import run_transform
from pipeline.forecast import train_forecast_model
from pipeline.plan import generate_production_plan
from pipeline import generate_data
import shutil
import os
import json
from datetime import datetime

@click.group()
def cli():
    """Beer Demand Planning Pipeline CLI"""
    pass

@cli.command()
def ingest():
    """Ingest and validate data"""
    ingest_and_validate()

@cli.command()
def transform():
    """Run cleaning and transformation"""
    run_transform()

@cli.command()
def forecast():
    """Run forecasting models"""
    df, _, _ = run_transform() # ensure we have latest curated
    train_forecast_model(df)

@cli.command()
def plan():
    """Generate production plan"""
    generate_production_plan()

@cli.command()
def run_all():
    """Run the full pipeline end-to-end"""
    start = datetime.now()
    print("Starting full pipeline run...")
    
    # 0. Generate Data (for demo purposes we regen to keep it fresh or ensure existence)
    # in real prod we wouldn't regen, but this is a self-contained demo
    os.system("python pipeline/generate_data.py")
    
    # 1. Ingest & Validate
    ingest_and_validate()
    
    # 2. Transform
    df, _, _ = run_transform()
    
    # 3. Forecast
    train_forecast_model(df)
    
    # 4. Plan
    generate_production_plan()
    
    # 5. Report
    end = datetime.now()
    duration = (end - start).total_seconds()
    
    report = {
        "status": "success",
        "runtime_seconds": duration,
        "timestamp": start.isoformat(),
        "steps": ["generate", "ingest", "transform", "forecast", "plan"]
    }
    
    with open("data/outputs/pipeline_report.json", "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"Pipeline finished in {duration:.2f} seconds.")

@cli.command()
def publish():
    """Publish outputs to dashboard data directory"""
    print("Publishing data to dashboard...")
    dest_dir = "dashboard/public/data"
    os.makedirs(dest_dir, exist_ok=True)
    
    # Copy all outputs
    src_dir = "data/outputs"
    for f in os.listdir(src_dir):
        shutil.copy(os.path.join(src_dir, f), dest_dir)
        
    # Copy curated helpers if needed
    shutil.copy("data/curated/dim_product.csv", dest_dir)
    pass

if __name__ == "__main__":
    cli()
