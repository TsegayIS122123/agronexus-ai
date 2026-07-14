from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class DiseaseDetection(Base):
    __tablename__ = "disease_detections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farmer_id = Column(UUID(as_uuid=True), ForeignKey("farmers.id"), nullable=True)
    crop_type = Column(String(100), nullable=False)
    image_url = Column(String(500), nullable=True)
    disease_name = Column(String(255), nullable=False)
    confidence = Column(Float, nullable=False)
    treatment_am = Column(Text, nullable=True)
    treatment_en = Column(Text, nullable=True)
    treatment_om = Column(Text, nullable=True)
    treatment_ti = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
