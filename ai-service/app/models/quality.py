from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class QualityGrade(Base):
    __tablename__ = "quality_grades"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Product info
    product_name = Column(String(255), nullable=False)
    product_category = Column(String(100), nullable=False)
    
    # Image
    image_url = Column(String(500), nullable=True)
    
    # Grades (0-100)
    overall_grade = Column(Float, nullable=False)
    color_score = Column(Float, nullable=False)
    texture_score = Column(Float, nullable=False)
    size_score = Column(Float, nullable=False)
    moisture_score = Column(Float, nullable=False)
    defects_score = Column(Float, nullable=False)
    
    # Export standards
    export_ready = Column(Boolean, default=False)
    standard_met = Column(String(100), nullable=True)  # ESA, EU, US, etc.
    
    # Defects detected
    defects_detected = Column(JSON, nullable=True)  # List of defects
    
    # Recommendations
    recommendations = Column(JSON, nullable=True)
    
    # Status
    status = Column(String(50), default="pending")  # pending, processed, certified
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ExportStandard(Base):
    __tablename__ = "export_standards"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # ESA, EU, US, etc.
    product_category = Column(String(100), nullable=False)
    min_grade = Column(Float, nullable=False)
    max_moisture = Column(Float, nullable=False)
    max_defects = Column(Integer, nullable=False)
    min_size = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    requirements = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
