from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings

# Validate configuration before importing routes, so a missing or weak
# SECRET_KEY fails here with an actionable message instead of on first request.
settings = get_settings()

from app.routes import (
    auth, disease, prices, chat, industry, quality,
    equipment, cost_calculator, energy, marketplace,
    weather, cooperative, price_comparison
)
app = FastAPI(
    title="AgroNexus AI API",
    description="AI-powered platform for Ethiopian agriculture",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(disease.router)
app.include_router(prices.router)
app.include_router(chat.router)
app.include_router(industry.router)
app.include_router(quality.router)
app.include_router(equipment.router)
app.include_router(cost_calculator.router)
app.include_router(energy.router)
app.include_router(marketplace.router)
app.include_router(weather.router)          
app.include_router(cooperative.router)       
app.include_router(price_comparison.router)  

@app.get("/")
def root():
    return {
        "message": "Welcome to AgroNexus AI API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
