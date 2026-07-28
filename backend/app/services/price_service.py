import pandas as pd
import numpy as np
from prophet import Prophet
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import logging
from app.models.prediction import PriceHistory, PricePrediction

logger = logging.getLogger(__name__)

def train_and_predict(crop_name: str, region: str, db: Session, forecast_days: int = 30):
    """Train Prophet model and generate price forecast"""
    try:
        # Get historical data
        historical = db.query(PriceHistory).filter(
            PriceHistory.crop_name == crop_name,
            PriceHistory.region == region
        ).order_by(PriceHistory.recorded_date).all()
        
        if len(historical) < 30:
            return {
                "error": "Insufficient historical data. Need at least 30 records.",
                "available": len(historical)
            }
        
        # Prepare data for Prophet
        df = pd.DataFrame([
            {"ds": h.recorded_date, "y": h.price}
            for h in historical
        ])
        
        # Train Prophet model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            changepoint_prior_scale=0.05
        )
        model.fit(df)
        
        # Make future predictions
        future = model.make_future_dataframe(periods=forecast_days)
        forecast = model.predict(future)
        
        # Get last `forecast_days` predictions
        predictions = forecast.tail(forecast_days)
        
        # Save predictions to database
        saved_predictions = []
        for _, row in predictions.iterrows():
            pred = PricePrediction(
                crop_name=crop_name,
                region=region,
                predicted_price=float(row['yhat']),
                confidence_lower=float(row['yhat_lower']),
                confidence_upper=float(row['yhat_upper']),
                forecast_date=row['ds'].date(),
                model_version="prophet_v1"
            )
            db.add(pred)
            saved_predictions.append(pred)
        
        db.commit()
        
        return {
            "success": True,
            "crop": crop_name,
            "region": region,
            "forecast_days": forecast_days,
            "predictions": [
                {
                    "date": p.forecast_date.isoformat(),
                    "price": p.predicted_price,
                    "lower": p.confidence_lower,
                    "upper": p.confidence_upper
                }
                for p in saved_predictions
            ],
            "summary": {
                "min_price": round(min(p.predicted_price for p in saved_predictions), 2),
                "max_price": round(max(p.predicted_price for p in saved_predictions), 2),
                "avg_price": round(sum(p.predicted_price for p in saved_predictions) / len(saved_predictions), 2),
                "trend": "up" if saved_predictions[-1].predicted_price > saved_predictions[0].predicted_price else "down"
            }
        }
        
    except Exception as e:
        logger.error(f"Price prediction error: {e}")
        db.rollback()
        return {"error": str(e)}

def get_latest_predictions(crop_name: str, region: str, db: Session):
    """Get the latest predictions for a crop and region"""
    predictions = db.query(PricePrediction).filter(
        PricePrediction.crop_name == crop_name,
        PricePrediction.region == region
    ).order_by(PricePrediction.forecast_date.desc()).limit(30).all()
    
    return [
        {
            "date": p.forecast_date.isoformat(),
            "price": p.predicted_price,
            "lower": p.confidence_lower,
            "upper": p.confidence_upper
        }
        for p in predictions
    ]

def get_available_crops(db: Session):
    """Get list of crops with historical data"""
    crops = db.query(PriceHistory.crop_name).distinct().all()
    return [c[0] for c in crops]

def get_available_regions(db: Session):
    """Get list of regions with historical data"""
    regions = db.query(PriceHistory.region).distinct().all()
    return [r[0] for r in regions]
