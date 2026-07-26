import bcrypt
from jose import jwt
from datetime import datetime, timedelta
import os
from sqlalchemy.orm import Session
from app.models.farmer import Farmer
from app.schemas.farmer import FarmerRegister

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Convert to bytes
    password_bytes = password.encode('utf-8')
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string for database storage
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        plain_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception as e:
        print(f"Verification error: {e}")
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    
    # Ensure role is in the token
    if "role" not in to_encode:
        to_encode["role"] = "farmer"  # Default fallback
    
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def register_farmer(db: Session, farmer_data: FarmerRegister):
    # Check if email exists
    existing_email = db.query(Farmer).filter(Farmer.email == farmer_data.email).first()
    if existing_email:
        raise ValueError("Email already registered")
    
    # Check if phone exists
    existing_phone = db.query(Farmer).filter(Farmer.phone == farmer_data.phone).first()
    if existing_phone:
        raise ValueError("Phone number already registered")
    
    # Create new farmer
    hashed = hash_password(farmer_data.password)
    new_farmer = Farmer(
        name=farmer_data.name,
        email=farmer_data.email,
        phone=farmer_data.phone,
        password_hash=hashed,
        language=farmer_data.language
    )
    
    db.add(new_farmer)
    db.commit()
    db.refresh(new_farmer)
    return new_farmer

def authenticate_farmer(db: Session, email: str, password: str):
    farmer = db.query(Farmer).filter(Farmer.email == email).first()
    if not farmer:
        return None
    if not verify_password(password, farmer.password_hash):
        return None
    
    # Include role in the returned user object
    return {
        "id": farmer.id,
        "name": farmer.name,
        "email": farmer.email,
        "phone": farmer.phone,
        "language": farmer.language,
        "role": farmer.role,  # ← ADD THIS
        "is_verified": farmer.is_verified,
        "created_at": farmer.created_at
    }
