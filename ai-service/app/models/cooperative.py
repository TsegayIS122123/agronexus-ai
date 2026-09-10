from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.database import Base

class Cooperative(Base):
    __tablename__ = "cooperatives"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String(255), nullable=False)
    region = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    
    # Leader/founder
    founder_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Members
    member_count = Column(Integer, default=0)
    max_members = Column(Integer, default=50)
    
    # Crops
    crops = Column(JSON, default=[])  # List of crops grown
    
    # Goals
    goals = Column(JSON, default=[])  # Shared goals
    
    # Status
    status = Column(String(50), default="active")  # active, inactive, dissolved
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class CooperativeMember(Base):
    __tablename__ = "cooperative_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cooperative_id = Column(UUID(as_uuid=True), ForeignKey("cooperatives.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="member")  # member, admin, leader
    
    # Contribution
    contribution = Column(Float, default=0)  # Financial contribution
    
    # Farm details
    farm_size = Column(Float, nullable=True)
    crops_grown = Column(JSON, default=[])
    
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
