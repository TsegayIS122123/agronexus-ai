from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.farmer import FarmerRegister, FarmerLogin, TokenResponse
from app.services.auth_service import register_farmer, authenticate_farmer, create_access_token

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
def register(farmer_data: FarmerRegister, db: Session = Depends(get_db)):
    try:
        farmer = register_farmer(db, farmer_data)
        token = create_access_token(data={"sub": str(farmer.id)})
        
        return TokenResponse(
            access_token=token,
            user={
                "id": farmer.id,
                "name": farmer.name,
                "email": farmer.email,
                "phone": farmer.phone,
                "language": farmer.language,
                "is_verified": farmer.is_verified,
                "created_at": farmer.created_at
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(credentials: FarmerLogin, db: Session = Depends(get_db)):
    farmer = authenticate_farmer(db, credentials.email, credentials.password)
    if not farmer:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": str(farmer.id)})
    
    return TokenResponse(
        access_token=token,
        user={
            "id": farmer.id,
            "name": farmer.name,
            "email": farmer.email,
            "phone": farmer.phone,
            "language": farmer.language,
            "is_verified": farmer.is_verified,
            "created_at": farmer.created_at
        }
    )
