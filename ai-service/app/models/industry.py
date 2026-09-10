from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON, Text, Boolean, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum
from app.database import Base

class ProductCategory(str, enum.Enum):
    FLOUR = "flour"
    OIL = "oil"
    JUICE = "juice"
    SPICE = "spice"
    PULSE = "pulse"
    DAIRY = "dairy"
    BAKERY = "bakery"
    BEVERAGE = "beverage"

class FeasibilityReport(Base):
    __tablename__ = "feasibility_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # ← Changed from farmers.id
    crop_type = Column(String(100), nullable=False)
    product_type = Column(String(100), nullable=False)
    location = Column(String(200), nullable=False)
    capital = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    
    feasibility_score = Column(Float, nullable=False)
    market_score = Column(Float, nullable=False)
    resource_score = Column(Float, nullable=False)
    financial_score = Column(Float, nullable=False)
    
    estimated_roi = Column(Float, nullable=False)
    payback_period = Column(Float, nullable=False)
    monthly_revenue = Column(Float, nullable=False)
    monthly_cost = Column(Float, nullable=False)
    
    recommendations = Column(JSON, nullable=True)
    risks = Column(JSON, nullable=True)
    
    status = Column(String(50), default="pending")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ProductSpec(Base):
    __tablename__ = "product_specs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    category = Column(SQLEnum(ProductCategory), nullable=False)
    description = Column(Text, nullable=True)
    crop_inputs = Column(JSON, nullable=False)
    min_capital = Column(Float, nullable=False)
    max_capital = Column(Float, nullable=False)
    min_quantity = Column(Float, nullable=False)
    equipment_list = Column(JSON, nullable=True)
    processing_steps = Column(JSON, nullable=True)
    avg_roi = Column(Float, nullable=False)
    payback_months = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class EquipmentListing(Base):
    __tablename__ = "equipment_listings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)  # ← Changed from farmers.id
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    condition = Column(String(50), default="new")
    location = Column(String(200), nullable=False)
    image_urls = Column(JSON, nullable=True)
    specs = Column(JSON, nullable=True)
    contact_info = Column(JSON, nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
