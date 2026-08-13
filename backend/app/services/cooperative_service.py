import logging
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Dict, List, Optional
from app.models.cooperative import Cooperative, CooperativeMember
from app.models.user import User

logger = logging.getLogger(__name__)

def create_cooperative(
    db: Session,
    founder_id: str,
    name: str,
    description: str,
    location: str,
    region: str,
    district: str = None,
    crops: List[str] = None,
    goals: List[str] = None,
    max_members: int = 50
) -> Cooperative:
    """Create a new cooperative"""
    
    cooperative = Cooperative(
        founder_id=founder_id,
        name=name,
        description=description,
        location=location,
        region=region,
        district=district,
        crops=crops or [],
        goals=goals or [],
        max_members=max_members,
        member_count=1  # Founder is the first member
    )
    
    db.add(cooperative)
    db.commit()
    db.refresh(cooperative)
    
    # Add founder as member
    member = CooperativeMember(
        cooperative_id=cooperative.id,
        user_id=founder_id,
        role="leader"
    )
    db.add(member)
    db.commit()
    
    return cooperative

def join_cooperative(
    db: Session,
    cooperative_id: str,
    user_id: str,
    role: str = "member",
    farm_size: float = None,
    crops_grown: List[str] = None
) -> CooperativeMember:
    """Join a cooperative"""
    
    cooperative = db.query(Cooperative).filter(Cooperative.id == cooperative_id).first()
    if not cooperative:
        raise ValueError("Cooperative not found")
    
    if cooperative.member_count >= cooperative.max_members:
        raise ValueError("Cooperative is full")
    
    # Check if already a member
    existing = db.query(CooperativeMember).filter(
        CooperativeMember.cooperative_id == cooperative_id,
        CooperativeMember.user_id == user_id
    ).first()
    
    if existing:
        raise ValueError("Already a member of this cooperative")
    
    member = CooperativeMember(
        cooperative_id=cooperative_id,
        user_id=user_id,
        role=role,
        farm_size=farm_size,
        crops_grown=crops_grown or []
    )
    
    db.add(member)
    cooperative.member_count += 1
    db.commit()
    db.refresh(member)
    
    return member

def get_cooperatives(
    db: Session,
    region: str = None,
    crop: str = None,
    status: str = "active",
    limit: int = 20,
    offset: int = 0
) -> Dict:
    """Get cooperatives with filters"""
    
    query = db.query(Cooperative).filter(Cooperative.status == status)
    
    if region:
        query = query.filter(Cooperative.region == region)
    
    if crop:
        query = query.filter(Cooperative.crops.contains([crop]))
    
    total = query.count()
    cooperatives = query.offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "cooperatives": cooperatives
    }

def get_cooperative_detail(db: Session, cooperative_id: str) -> Dict:
    """Get cooperative details with members"""
    
    cooperative = db.query(Cooperative).filter(Cooperative.id == cooperative_id).first()
    if not cooperative:
        return None
    
    members = db.query(CooperativeMember).filter(
        CooperativeMember.cooperative_id == cooperative_id
    ).all()
    
    return {
        "cooperative": cooperative,
        "members": members
    }

def get_user_cooperatives(db: Session, user_id: str) -> List[Cooperative]:
    """Get cooperatives a user is a member of"""
    
    memberships = db.query(CooperativeMember).filter(
        CooperativeMember.user_id == user_id
    ).all()
    
    cooperative_ids = [m.cooperative_id for m in memberships]
    
    return db.query(Cooperative).filter(Cooperative.id.in_(cooperative_ids)).all()
