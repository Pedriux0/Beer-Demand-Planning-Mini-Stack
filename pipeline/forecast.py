
import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.metrics import mean_absolute_percentage_error
from pipeline.transform import run_transform
from datetime import timedelta

def train_forecast_model(df: pd.DataFrame):
    print("Training forecast models...")
    
    # Target
    target = 'units_sold'
    features = ['day_of_week', 'month', 'promo_flag', 'lag_7', 'lag_14', 'rolling_mean_7']
    
    # Split: Train (history) vs Future (we don't have future features yet except calendar)
    # Actually, for "forecasting" we usually forecast the NEXT period.
    # For this demo, we'll walk-forward on the last 30 days to evaluate, then refit on full history to forecast next 7 days.
    
    results = []
    
    # Per SKU/Channel
    groups = df.groupby(['channel', 'sku'])
    
    output_forecasts = []
    
    for (channel, sku), group in groups:
        group = group.sort_values('date')
        if len(group) < 30:
            continue # specific logic for new products?
            
        # 1. Baseline: Seasonal Naive (7 days ago) or SMA
        # Let's use SMA 7 as baseline forecast for next day
        group['baseline_forecast'] = group['units_sold'].rolling(7).mean().shift(1)
        
        # 2. ML Model
        # Train/Test Split (Last 14 days as test)
        test_size = 14
        train = group.iloc[:-test_size]
        test = group.iloc[-test_size:]
        
        X_train = train[features]
        y_train = train[target]
        X_test = test[features]
        y_test = test[target]
        
        model = GradientBoostingRegressor(n_estimators=50, max_depth=3, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        y_pred = np.maximum(y_pred, 0) # No negative forecasts
        
        # Evaluate
        # Handle zero divisor for MAPE
        y_test_safe = y_test.replace(0, 1) 
        mape_ml = mean_absolute_percentage_error(y_test_safe, y_pred)
        
        # Baseline eval
        baseline_preds = test['baseline_forecast'].fillna(method='bfill').fillna(0)
        mape_baseline = mean_absolute_percentage_error(y_test_safe, baseline_preds)
        
        # Select best
        best_model = "ML" if mape_ml < mape_baseline else "Baseline"
        
        results.append({
            "channel": channel,
            "sku": sku,
            "mape_ml": mape_ml,
            "mape_baseline": mape_baseline,
            "best_model": best_model
        })
        
        # 3. Forecast Next 7 Days
        # We need future features.
        last_date = group['date'].max()
        future_dates = [last_date + timedelta(days=i) for i in range(1, 8)]
        
        future_df = pd.DataFrame({'date': future_dates})
        future_df['channel'] = channel
        future_df['sku'] = sku
        future_df['day_of_week'] = future_df['date'].dt.dayofweek
        future_df['month'] = future_df['date'].dt.month
        # Heuristic for features: assumption or separate creation
        # For demo: assume no promo, and use recent lags
        future_df['promo_flag'] = 0 
        
        # Recursive forecasting for lags? Or just static?
        # Simple approach: Use last known values for lags (Naive) or iteratively predict.
        # Iterative is better but complex. Let's use static recent values for simplicity of demo code.
        last_rows = group.iloc[-14:] # Get enough history
        
        # We only really need to forecast 1 week.
        # Just use the model trained on FULL data
        model.fit(group[features], group[target])
        
        # Construct features for future (Approximate)
        # We can't easily do rolling/lags for future without strict loop.
        # Hack for demo: Use the last observed values for rolling/lags constant
        # OR just use the ML model which might rely heavily on day_of_week
        last_lag_7 = group['units_sold'].iloc[-7] 
        last_lag_14 = group['units_sold'].iloc[-14]
        last_rolling = group['units_sold'].rolling(7).mean().iloc[-1]
        
        future_df['lag_7'] = last_lag_7
        future_df['lag_14'] = last_lag_14
        future_df['rolling_mean_7'] = last_rolling
        
        if best_model == "ML":
            preds = model.predict(future_df[features])
            preds = np.maximum(preds, 0)
            future_df['yhat'] = preds
            # Confidence intervals (fake fixed width for demo as GBR checks are complex)
            future_df['yhat_lower'] = preds * 0.8
            future_df['yhat_upper'] = preds * 1.2
            future_df['model_version'] = 'GradientBoosting'
        else:
            # Baseline forecast (Moving Average check)
            val = group['units_sold'].rolling(7).mean().iloc[-1]
            future_df['yhat'] = val
            future_df['yhat_lower'] = val * 0.9
            future_df['yhat_upper'] = val * 1.1
            future_df['model_version'] = 'Baseline_SMA'
            
        output_forecasts.append(future_df)

    # Save outputs
    metrics_df = pd.DataFrame(results)
    metrics_df.to_csv("data/outputs/forecast_metrics.csv", index=False)
    
    forecast_df = pd.concat(output_forecasts, ignore_index=True)
    forecast_df.to_csv("data/outputs/forecast_daily.csv", index=False)
    
    print("Forecasting complete.")
    return forecast_df

if __name__ == "__main__":
    df, _, _ = run_transform()
    train_forecast_model(df)
