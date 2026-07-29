from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserRegister, UserLogin, TokenResponse
from app.services.auth_service import register_user, authenticate_user, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    try:
        user = register_user(db, user_data)
        
        token = create_access_token(data={
            "sub": str(user.id),
            "role": user.role
        })
        
        return TokenResponse(
            access_token=token,
            user={
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
                "language": user.language,
                "role": user.role,
                "is_verified": user.is_verified,
                "created_at": user.created_at
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={
        "sub": str(user["id"]),
        "role": user["role"]
    })
    
    return TokenResponse(
        access_token=token,
        user={
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "phone": user["phone"],
            "language": user["language"],
            "role": user["role"],
            "is_verified": user["is_verified"],
            "created_at": user["created_at"]
        }
    )
