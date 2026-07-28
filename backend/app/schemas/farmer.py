from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import uuid
import re

class FarmerRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=13)  # ← Changed
    password: str = Field(..., min_length=6)
    language: str = Field(default="am")
    role: str = Field(default="farmer")
    
    @field_validator('phone')
    def validate_ethiopian_phone(cls, v):
        # Accept both +251XXXXXXXXX (13 chars) and 09XXXXXXXX (10 chars)
        if not re.match(r'^(\+251[0-9]{9}|09[0-9]{8})$', v):
            raise ValueError('Phone must be +251XXXXXXXXX or 09XXXXXXXX')
        return v
    
    @field_validator('language')
    def validate_language(cls, v):
        if v not in ['am', 'om', 'ti', 'en']:
            raise ValueError('Language must be am, om, ti, or en')
        return v
    
    @field_validator('role')
    def validate_role(cls, v):
        if v not in ['farmer', 'processor', 'consumer', 'admin']:
            raise ValueError('Role must be farmer, processor, consumer, or admin')
        return v

class FarmerLogin(BaseModel):
    email: EmailStr
    password: str

class FarmerResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    phone: str
    language: str
    role: str
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: FarmerResponse
