from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, disease, prices
from app.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AgroNexus AI API",
    description="AI-powered platform for Ethiopian agriculture",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(disease.router)  
app.include_router(prices.router)


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
