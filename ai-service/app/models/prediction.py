from sqlalchemy import Column, String, Float, DateTime, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class PriceHistory(Base):
    __tablename__ = "price_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    market = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)
    recorded_date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PricePrediction(Base):
    __tablename__ = "price_predictions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    crop_name = Column(String(100), nullable=False)
    region = Column(String(100), nullable=False)
    predicted_price = Column(Float, nullable=False)
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    forecast_date = Column(Date, nullable=False)
    model_version = Column(String(50), default="prophet_v1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
