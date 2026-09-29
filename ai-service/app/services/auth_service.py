import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import get_secret_key, get_settings
from app.models.user import User
from app.schemas.user import UserRegister

settings = get_settings()

# Re-exported from app.core.config so existing importers keep working. The
# signing key is resolved per call by get_secret_key(), not frozen at import,
# so a rotated SECRET_KEY is honoured without a restart.
ACCESS_TOKEN_EXPIRE_MINUTES = settings.access_token_expire_minutes
COOKIE_SECURE = settings.cookie_secure


def set_access_cookie(response, token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite="lax",
    )

def hash_password(password: str) -> str:
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
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
    if "role" not in to_encode:
        to_encode["role"] = "farmer"
    return jwt.encode(to_encode, get_secret_key(), algorithm=settings.algorithm)

def register_user(db: Session, user_data: UserRegister):
    # Check if email exists
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise ValueError("Email already registered")
    
    # Check if phone exists
    existing_phone = db.query(User).filter(User.phone == user_data.phone).first()
    if existing_phone:
        raise ValueError("Phone number already registered")
    
    # Use the role from the request
    role = user_data.role if user_data.role else 'farmer'
    
    hashed = hash_password(user_data.password)
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        phone=user_data.phone,
        password_hash=hashed,
        language=user_data.language,
        role=role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "language": user.language,
        "role": user.role,
        "is_verified": user.is_verified,
        "created_at": user.created_at
    }
