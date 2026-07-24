# 🌱 **AgroNexus AI**

<p align="center">
  <b>AI Operating System for Ethiopia's Agricultural Value Chain</b>
</p>

<p align="center">
  <i>From Soil to Shelf — Powered by Artificial Intelligence</i>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/Python-3.11-blue.svg" alt="Python"/></a>
  <a href="#"><img src="https://img.shields.io/badge/FastAPI-0.115-green.svg" alt="FastAPI"/></a>
  <a href="#"><img src="https://img.shields.io/badge/NestJS-10-red.svg" alt="NestJS"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Next.js-15-black.svg" alt="Next.js"/></a>
  <a href="#"><img src="https://img.shields.io/badge/PostgreSQL-16-blue.svg" alt="PostgreSQL"/></a>
  <a href="#"><img src="https://img.shields.io/badge/Docker-27.3-blue.svg" alt="Docker"/></a>
  <a href="#"><img src="https://img.shields.io/badge/YOLOv8-8.3-red.svg" alt="YOLOv8"/></a>
  <a href="#"><img src="https://img.shields.io/badge/LangChain-0.3-green.svg" alt="LangChain"/></a>
  <a href="#"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"/></a>
</p>

---

## 📖 **Table of Contents**

- [Overview](#-overview)
- [Why This Project Exists](#-why-this-project-exists)
- [The Problem We Solve](#-the-problem-we-solve)
- [Our Solution](#-our-solution)
- [System Architecture](#-system-architecture)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [API Documentation](#-api-documentation)
- [Database Design](#-database-design)
- [AI Models](#-ai-models)
- [Deployment](#-deployment)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [Authors](#-authors)
- [License](#-license)

---

## 🎯 **Overview**

**AgroNexus AI** is a production-grade artificial intelligence platform that bridges the critical gap between Ethiopian smallholder farmers and the agro-industrial sector. It creates a seamless value chain from **Agriculture → Industry → Markets** by democratizing access to AI-powered agricultural intelligence.

### **Our Vision**

> *"Transform Ethiopia from a raw material exporter to a manufacturing hub by making agricultural intelligence accessible to every farmer and connecting them directly to industry."*

### **Our Mission**

1. **Empower 1 million farmers** with AI tools by 2030
2. **Enable 1,000+ local agro-processors** to manufacture finished goods
3. **Reduce food imports by $500M** through import substitution
4. **Create 50,000+ jobs** across the agricultural value chain

---

## 🔥 **Why This Project Exists**

### **My Story**

I am Tsegay Assefa, a 3rd-year Information Science student at Addis Ababa University. Growing up in Ethiopia, I witnessed firsthand the struggles of smallholder farmers who form the backbone of our economy. I saw:

- Farmers losing 30-50% of their harvest to preventable diseases
- Families selling crops at rock-bottom prices while buying expensive imported goods
- Young people leaving agriculture because it offered no path to prosperity
- Billions of dollars leaving the country for food we could produce ourselves

### **The Gap I Identified**

Ethiopia's agriculture sector employs over **60% of the population** but contributes only **35% to GDP**. This massive value leak occurs because:

- **Information is trapped** - Farmers have no access to expert advice, market prices, or weather forecasts
- **Diseases go undetected** - Without early detection, diseases destroy entire harvests
- **Value is captured by middlemen** - 40-60% of profits never reach the farmer
- **Processing is minimal** - Raw materials are exported cheaply, finished goods are imported expensively

**This is not just an economic problem. It is a human problem.**

### **Why I Built This**

I built AgroNexus AI because:

1. **Technology can bridge the gap** - AI can detect diseases, predict prices, and connect people
2. **Every farmer deserves access** - Not just those near cities or with smartphones
3. **Ethiopia deserves self-sufficiency** - We have the resources, we need the intelligence
4. **This is my contribution** - Using AI engineering to solve real problems in my country

This project represents my commitment to using technology for social impact while building skills that will serve me throughout my career.

---

## 📊 **The Problem We Solve**

### **The Current Reality**

```mermaid
graph LR
    subgraph Current["Current Reality"]
        FARMER[("🌾 Farmer<br/>Raw Materials")]
        EXPORT[("🚢 Export<br/>Low Value")]
        MIDDLEMEN[("💰 Middlemen<br/>40-60% Capture")]
        PROCESSING[("🏭 Processing<br/>Minimal")]
        IMPORTS[("📦 Imports<br/>$2B+")]
        
        FARMER --> EXPORT
        FARMER --> MIDDLEMEN
        MIDDLEMEN --> PROCESSING
        PROCESSING --> IMPORTS
    end
```

### **The Three Gaps**

| Gap | The Problem | The Impact |
|-----|-------------|------------|
| **Information Gap** | Farmers lack access to market prices, weather data, and expert advice | Farmers make decisions in the dark, losing money and harvests |
| **Disease Gap** | Without early detection, crop diseases spread unchecked | 30-50% of harvests lost annually to preventable diseases |
| **Value Chain Gap** | Farmers sell to middlemen who capture most of the value | 40-60% of profits never reach the farmer |

### **The Human Cost**

- **A farmer in rural Ethiopia**: Watches their teff crop die from rust because they couldn't identify it in time
- **A mother in Addis Ababa**: Buys expensive imported wheat flour because local processing doesn't exist
- **A young graduate**: Leaves the country because agriculture offers no future

**These are the problems AgroNexus AI exists to solve.**

---

## 🚀 **Our Solution**

### **The AgroNexus AI Platform**

```mermaid
graph LR
    subgraph Vision["Our Solution"]
        FARMER[("🌾 Farmer")]
        INTELLIGENCE[("🧠 AI Intelligence")]
        INDUSTRY[("🏭 Industry")]
        MARKET[("🤝 Market")]
        COMMUNITY[("👨‍👩‍👧‍👦 Community")]
        
        FARMER --> INTELLIGENCE
        INTELLIGENCE --> INDUSTRY
        INDUSTRY --> MARKET
        MARKET --> COMMUNITY
    end
```

### **How We Solve It**

| Problem | Our Solution | Technology |
|---------|--------------|------------|
| **Crop Diseases** | Instant diagnosis via photo upload | YOLOv8 Computer Vision |
| **Information Gap** | 24/7 AI assistant in local languages | LangChain + RAG + Gemini |
| **Price Volatility** | 30-day price forecasts | Prophet + LSTM |
| **Middlemen** | Direct farmer-processor marketplace | B2B Platform |
| **Import Dependency** | Local processing advisory | Factory Feasibility AI |
| **Data Gap** | Real-time economic dashboards | Impact Tracker |

---

## 🏗️ **System Architecture**

### **Overall System Design**

```mermaid
flowchart TB
    subgraph Frontend["Frontend Layer"]
        WEB["Next.js Web App"]
        DASH["Industry Dashboard"]
        ADMIN["Admin Portal"]
        MOBILE["PWA Mobile App"]
    end

    subgraph Gateway["API Gateway Layer (NestJS)"]
        AUTH["Authentication Service"]
        RATE["Rate Limiter"]
        WS["WebSocket Gateway"]
        VALID["Request Validation"]
    end

    subgraph Services["Business Services (NestJS)"]
        FARM["Farmer Service"]
        INDUSTRY["Industry Service"]
        MARKET["Marketplace Service"]
        NOTIFY["Notification Service"]
        ANALYTICS["Analytics Service"]
    end

    subgraph AI["AI Services (FastAPI)"]
        VISION["Computer Vision<br/>YOLOv8"]
        NLP["NLP + RAG<br/>LangChain"]
        FORECAST["Forecasting<br/>Prophet"]
        REC["Recommendation<br/>Engine"]
    end

    subgraph Data["Data Layer"]
        PG[(PostgreSQL)]
        TS[(TimescaleDB)]
        VEC[(pgvector)]
        CACHE[(Redis)]
        S3[(MinIO/S3)]
    end

    subgraph DevOps["DevOps Layer"]
        DOCKER["Docker"]
        CI["GitHub Actions"]
        MONITOR["Prometheus/Grafana"]
    end

    WEB --> AUTH
    DASH --> AUTH
    ADMIN --> AUTH
    MOBILE --> AUTH
    
    AUTH --> VALID
    VALID --> RATE
    RATE --> WS
    
    WS --> FARM
    WS --> INDUSTRY
    WS --> MARKET
    WS --> NOTIFY
    WS --> ANALYTICS
    
    FARM --> VISION
    FARM --> NLP
    INDUSTRY --> FORECAST
    MARKET --> REC
    
    FARM --> PG
    INDUSTRY --> TS
    MARKET --> VEC
    NOTIFY --> CACHE
    ANALYTICS --> S3
    
    DOCKER --> CI
    CI --> MONITOR
```
## 🗄️ **Database Design**

### **ER Diagram**

```mermaid
erDiagram
    Farmers ||--o{ Crops : grows
    Farmers ||--o{ DiseaseDetections : has
    Farmers ||--o{ ChatHistory : has
    Farmers ||--o{ MarketListings : creates
    Farmers ||--o{ Orders : places
    Farmers ||--o{ Cooperatives : joins
    
    Processors ||--o{ MarketListings : creates
    Processors ||--o{ Orders : receives
    Processors ||--o{ Products : manufactures
    
    Crops ||--o{ PriceHistory : has
    Crops ||--o{ DiseaseDetections : has
    Crops ||--o{ Predictions : has
    
    Cooperatives ||--o{ Farmers : has
    
    MarketListings ||--o{ Orders : contains
    Orders ||--o{ Payments : has
    
    Products ||--o{ QualityReports : has
    
    Farmers {
        uuid id PK
        string name
        string email
        string phone
        string password_hash
        string language
        geometry location
        decimal farm_size
        jsonb crops
        uuid cooperative_id FK
        boolean is_verified
        timestamp created_at
        timestamp updated_at
    }
    
    Processors {
        uuid id PK
        string name
        string type
        decimal capacity
        decimal current_load
        array crops_accepted
        array services
        decimal price_per_kg
        geometry location
        string energy_source
        integer jobs_created
        boolean verified
        timestamp created_at
    }
    
    Crops {
        uuid id PK
        string name
        string variety
        string season
        decimal min_price
        decimal max_price
        text image_url
        array disease_tags
        timestamp created_at
    }
    
    DiseaseDetections {
        uuid id PK
        uuid farmer_id FK
        uuid crop_id FK
        text image_url
        string disease_name
        decimal confidence
        text treatment_am
        text treatment_en
        text treatment_om
        text treatment_ti
        jsonb recommendations
        timestamp created_at
    }
    
    PriceHistory {
        timestamp time PK
        uuid crop_id FK
        string region
        decimal price
        string market
    }
    
    MarketListings {
        uuid id PK
        uuid farmer_id FK
        uuid processor_id FK
        uuid crop_id FK
        decimal quantity
        decimal price
        string quality_grade
        string status
        timestamp created_at
    }
    
    Orders {
        uuid id PK
        uuid listing_id FK
        uuid buyer_id FK
        decimal quantity
        decimal total_price
        string status
        timestamp created_at
    }
    
    ChatHistory {
        uuid id PK
        uuid farmer_id FK
        text query
        text response
        string language
        timestamp created_at
    }
    
    Predictions {
        uuid id PK
        uuid crop_id FK
        decimal predicted_price
        decimal confidence_lower
        decimal confidence_upper
        date forecast_date
        timestamp created_at
    }
    
    Products {
        uuid id PK
        uuid processor_id FK
        string name
        text description
        string category
        decimal price
        integer stock
        string quality_grade
        array images
        timestamp created_at
    }
```
---

## ✨ **Features**

### 🌾 **Farmer Zone**

#### **1. Crop Disease Detection**
- **What it does**: Upload a photo of any crop → Instant AI diagnosis → Treatment recommendations
- **Technology**: YOLOv8 + PyTorch
- **Languages**: Amharic, Oromo, Tigrinya, English
- **Accuracy Target**: 85%+ mAP
- **Why it matters**: Farmers can detect diseases before they destroy entire harvests
### **Request Flow: Disease Detection**

```mermaid
sequenceDiagram
    participant Farmer
    participant Frontend as Next.js
    participant Gateway as NestJS Gateway
    participant AI as FastAPI AI
    participant YOLO as YOLOv8
    participant DB as PostgreSQL
    participant S3 as MinIO

    Farmer->>Frontend: Upload Disease Image
    Frontend->>Gateway: POST /api/v1/disease/detect
    Gateway->>Gateway: Validate JWT Token
    Gateway->>S3: Upload Image
    S3-->>Gateway: Image URL
    Gateway->>AI: Forward Request
    AI->>YOLO: Run Inference
    YOLO-->>AI: Disease Classified
    AI->>DB: Save Result
    AI-->>Gateway: Detection Result
    Gateway->>Gateway: Add Treatment Info
    Gateway-->>Frontend: Complete Response
    Frontend-->>Farmer: Display Diagnosis
```

#### **2. AI Farming Assistant**
- **What it does**: Ask any farming question in your language → Contextual AI response with sources
- **Technology**: LangChain + RAG + Gemini
- **Knowledge Base**: Agricultural manuals, research papers, expert guidelines
- **Why it matters**: Every farmer gets expert advice, regardless of location
### **Request Flow: AI Chat Assistant**

```mermaid
sequenceDiagram
    participant Farmer
    participant Frontend as Next.js
    participant Gateway as NestJS Gateway
    participant AI as FastAPI AI
    participant Vector as pgvector
    participant LLM as Gemini

    Farmer->>Frontend: Ask Question (Amharic)
    Frontend->>Gateway: POST /api/v1/assistant/chat
    Gateway->>Gateway: Validate JWT
    Gateway->>AI: Forward Query
    AI->>AI: Generate Embedding
    AI->>Vector: Search Similar
    Vector-->>AI: Context Documents
    AI->>LLM: Generate Response
    LLM-->>AI: Answer
    AI->>AI: Translate to Amharic
    AI-->>Gateway: Response
    Gateway-->>Frontend: Answer
    Frontend-->>Farmer: Display
```

#### **3. Price Forecasting**
- **What it does**: Get 30-day price forecasts for 50+ crops → Know when to sell for maximum profit
- **Technology**: Prophet + LSTM ensemble
- **Accuracy**: MAPE < 15%
- **Why it matters**: Farmers can time their sales for maximum income

#### **4. Weather Intelligence**
- **What it does**: Hyperlocal 5-day weather forecasts → Planting and harvesting guidance
- **Technology**: OpenWeather API
- **Features**: Temperature, rainfall, wind speed, humidity
- **Why it matters**: Farmers can plan activities around weather patterns

#### **5. Cooperative Formation**
- **What it does**: Connect with nearby farmers → Form buying/selling cooperatives automatically
- **Technology**: Recommendation Engine
- **Why it matters**: Collective bargaining power increases farmer income

### ⚙️ **Industry Zone**

#### **6. Factory Feasibility Advisor**
- **What it does**: Enter crop type, quantity, location, capital → Get feasibility score, ROI estimate
- **Technology**: Decision Engine
- **Products**: 20+ processed products (flour, oil, juice, etc.)
- **Why it matters**: Entrepreneurs can confidently start processing businesses

#### **7. Equipment Marketplace**
- **What it does**: List or find equipment → Match buyers with sellers automatically
- **Technology**: Marketplace Platform
- **Why it matters**: Local equipment becomes accessible and affordable

#### **8. Quality Control AI**
- **What it does**: Upload product images → Automatic grading to export standards
- **Technology**: Computer Vision
- **Standards**: Ethiopian Standards Agency + International Export Standards
- **Why it matters**: Ethiopian products can meet export quality requirements

#### **9. Processing Guidelines**
- **What it does**: Step-by-step video/text guides in local languages → Best practices
- **Technology**: RAG + CMS
- **Why it matters**: Knowledge transfer to new processors

#### **10. Cost Calculator**
- **What it does**: Calculate manufacturing costs → ROI analysis
- **Technology**: Python + Pandas
- **Why it matters**: Informed business decisions

### 🤝 **Market Zone**

#### **11. B2B Marketplace**
- **What it does**: Farmers list products → Processors find and buy directly
- **Technology**: Next.js + PostgreSQL + WebSockets
- **Features**: Listings, search, chat, payments
- **Why it matters**: Middlemen are eliminated, farmers get better prices

#### **12. Local Product Catalog**
- **What it does**: Discover and buy Ethiopian-made products
- **Technology**: E-commerce Platform
- **Why it matters**: Support local manufacturing

#### **13. Export Documentation**
- **What it does**: Auto-fill export forms → AI-assisted certification
- **Technology**: Document AI
- **Why it matters**: Reduce export barriers

#### **14. Impact Tracker**
- **What it does**: Real-time dashboards showing economic impact
- **Technology**: Recharts + D3.js
- **Metrics**: Jobs created, income increase, import substitution
- **Why it matters**: Evidence-based policy making

#### **15. Consumer Portal**
- **What it does**: Buy local products online → Works offline
- **Technology**: PWA + Offline-first
- **Why it matters**: Connect consumers directly to producers

---

## 📦 **Technology Stack**

### **Frontend**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 15 + TypeScript | React with SSR |
| Styling | Tailwind CSS + shadcn/ui | Utility-first UI |
| State | Zustand + TanStack Query | Client + Server state |
| Forms | React Hook Form + Zod | Form validation |
| Charts | Recharts + D3.js | Data visualization |
| Maps | Mapbox GL / Leaflet | Location services |
| Mobile | PWA + React Native | Cross-platform |
| i18n | react-i18next | Amharic, Oromo, Tigrinya |

### **Backend Business (NestJS)**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | NestJS 10 | Enterprise backend |
| ORM | Prisma | Type-safe database |
| Auth | JWT + RBAC | Authentication & authorization |
| Validation | class-validator + Zod | Input validation |
| Queues | BullMQ + Redis | Background jobs |
| Real-time | WebSockets + Socket.io | Chat & notifications |
| API Docs | Swagger/OpenAPI | Interactive documentation |

### **AI Services (FastAPI)**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | FastAPI | High-performance API |
| Vision | YOLOv8 + PyTorch + OpenCV | Object detection |
| NLP | LangChain + FAISS + Gemini | RAG chatbot |
| Forecasting | Prophet + LSTM | Time series |
| MLOps | MLflow + DVC | Model tracking |
| Serving | ONNX Runtime | Model optimization |

### **Database**

| Database | Purpose | Technology |
|----------|---------|------------|
| Primary | User data, transactions | PostgreSQL 16 |
| Time-Series | Price data, forecasts | TimescaleDB |
| Vector | Embeddings for RAG | pgvector |
| Cache | Sessions, rate limiting | Redis |
| Storage | Images, documents | MinIO / S3 |

### **DevOps**

| Layer | Technology | Purpose |
|-------|------------|---------|
| Containerization | Docker + Compose | Environment consistency |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Hosting | Vercel / Render / AWS | Application hosting |
| Monitoring | Prometheus + Grafana | Observability |
| Logging | ELK Stack | Centralized logging |

---

## 📁 **Project Structure**

```
agronexus-ai/
│
├── backend/                          # 🐍 FastAPI AI Service
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # Application entry point
│   │   ├── database.py              # Database connection & session
│   │   ├── models/                  # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── farmer.py            # Farmer user model
│   │   │   ├── disease.py           # Disease detection model
│   │   │   ├── industry.py          # Industry/Processor model
│   │   │   ├── marketplace.py       # Marketplace listings model
│   │   │   ├── order.py             # Order model
│   │   │   ├── product.py           # Product model
│   │   │   ├── prediction.py        # Price prediction model
│   │   │   └── chat.py              # Chat history model
│   │   ├── schemas/                 # Pydantic schemas
│   │   │   ├── __init__.py
│   │   │   ├── farmer.py
│   │   │   ├── industry.py
│   │   │   ├── marketplace.py
│   │   │   └── prediction.py
│   │   ├── routes/                  # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── disease.py
│   │   │   ├── industry.py
│   │   │   ├── marketplace.py
│   │   │   ├── prediction.py
│   │   │   ├── chat.py
│   │   │   └── analytics.py
│   │   ├── services/                # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── disease_service.py
│   │   │   ├── industry_service.py
│   │   │   ├── marketplace_service.py
│   │   │   ├── prediction_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── analytics_service.py
│   │   │   └── disease/
│   │   │       └── detector.py      # YOLOv8 model loader
│   │   └── utils/                   # Utility functions
│   │       ├── __init__.py
│   │       ├── helpers.py
│   │       └── validators.py
│   ├── models/                      # Trained ML models
│   │   ├── disease_detection.pt     # YOLOv8 trained weights
│   │   ├── price_forecast.pkl       # Prophet model
│   │   ├── recommendation.pkl       # Recommendation engine
│   │   └── quality_grading.pt       # Quality control model
│   ├── pipelines/                   # AI pipelines
│   │   ├── training/
│   │   │   ├── disease_train.py
│   │   │   ├── forecast_train.py
│   │   │   └── quality_train.py
│   │   └── inference/
│   │       ├── disease_inference.py
│   │       └── forecast_inference.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
├── frontend/                         # 🎨 Next.js Application
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Homepage
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   ├── farmer/                  # 🌾 Farmer Zone
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── disease/
│   │   │   │   └── page.tsx
│   │   │   ├── chat/
│   │   │   │   └── page.tsx
│   │   │   ├── prices/
│   │   │   │   └── page.tsx
│   │   │   ├── weather/
│   │   │   │   └── page.tsx
│   │   │   └── cooperative/
│   │   │       └── page.tsx
│   │   ├── industry/                # ⚙️ Industry Zone
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── feasibility/
│   │   │   │   └── page.tsx
│   │   │   ├── equipment/
│   │   │   │   └── page.tsx
│   │   │   ├── quality/
│   │   │   │   └── page.tsx
│   │   │   └── cost-calculator/
│   │   │       └── page.tsx
│   │   ├── market/                  # 🤝 Market Zone
│   │   │   ├── marketplace/
│   │   │   │   └── page.tsx
│   │   │   ├── products/
│   │   │   │   └── page.tsx
│   │   │   ├── export/
│   │   │   │   └── page.tsx
│   │   │   ├── impact/
│   │   │   │   └── page.tsx
│   │   │   └── consumer/
│   │   │       └── page.tsx
│   │   ├── admin/                   # 🔐 Admin Panel
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── users/
│   │   │   │   └── page.tsx
│   │   │   └── reports/
│   │   │       └── page.tsx
│   │   └── components/
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       ├── DiseaseCard.tsx
│   │       ├── PriceChart.tsx
│   │       ├── MarketplaceCard.tsx
│   │       └── shared/
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts
│   │   │   ├── disease.ts
│   │   │   ├── industry.ts
│   │   │   └── marketplace.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── types/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── Dockerfile
│
├── data/                             # 📊 Dataset (gitignored)
│   └── dataset/
│       ├── disease/                 # Disease detection dataset
│       │   ├── images/
│       │   │   ├── train/
│       │   │   ├── val/
│       │   │   └── test/
│       │   └── labels/
│       │       ├── train/
│       │       ├── val/
│       │       └── test/
│       ├── quality/                 # Quality control dataset
│       │   └── images/
│       ├── prices/                  # Price history data
│       │   └── historical.csv
│       └── knowledge/               # Knowledge base for RAG
│           ├── manuals/
│           ├── research/
│           └── guidelines/
│
├── docs/                             # 📚 Documentation
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── farmer-zone.md
│   │   ├── industry-zone.md
│   │   ├── market-zone.md
│   │   ├── ai-engine.md
│   │   └── database.md
│   ├── api/
│   │   ├── authentication.md
│   │   ├── endpoints.md
│   │   ├── farmer-api.md
│   │   ├── industry-api.md
│   │   └── market-api.md
│   ├── ai/
│   │   ├── disease-detection.md
│   │   ├── rag-chatbot.md
│   │   ├── forecasting.md
│   │   ├── recommendation.md
│   │   └── quality-control.md
│   └── deployment/
│       ├── docker.md
│       └── production.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 **Quick Start**

### **Prerequisites**

```bash
# Required versions
Python 3.11+
Node.js 18+
Docker & Docker Compose
Git
PostgreSQL 16+ (or use Docker)
```

### **Clone & Setup**

```bash
# Clone repository
git clone https://github.com/TsegayIS122123/agronexus-ai.git
cd agronexus-ai

# Copy environment variables
cp .env.example .env

# Edit .env with your values
# DATABASE_URL=postgresql://user:password@localhost:5432/agronexus
# SECRET_KEY=your-secret-key-minimum-32-characters
# GEMINI_API_KEY=your-google-ai-key
# OPENWEATHER_API_KEY=your-weather-api-key
```

### **Start Services**

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for database to be ready (5-10 seconds)
sleep 10
```

### **Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create database tables
python -c "
from app.database import engine
from app.models import Base
Base.metadata.create_all(bind=engine)
print('✅ Database tables created!')
"

# Start development server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### **Frontend Setup**

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### **Verify Installation**

```bash
# Backend health check
curl http://localhost:8000/health
# Expected: {"status":"healthy"}

# API Documentation
open http://localhost:8000/docs

# Frontend
open http://localhost:3000
```

---

## 📚 **API Documentation**

### **Authentication**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new farmer |
| `POST` | `/api/v1/auth/login` | Login to existing account |
| `POST` | `/api/v1/auth/refresh` | Refresh JWT token |
| `POST` | `/api/v1/auth/logout` | Logout user |

### **Farmer**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/farmers/profile` | Get farmer profile |
| `PUT` | `/api/v1/farmers/profile` | Update farmer profile |
| `GET` | `/api/v1/farmers/crops` | Get farmer's crops |
| `POST` | `/api/v1/farmers/crops` | Add crop to farmer |
| `GET` | `/api/v1/farmers/transactions` | Get transaction history |

### **Disease Detection**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/disease/detect` | Detect disease from image |
| `GET` | `/api/v1/disease/history/{farmer_id}` | Get detection history |
| `GET` | `/api/v1/disease/info/{disease_name}` | Get disease information |

### **AI Assistant**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/assistant/chat` | Chat with AI assistant |
| `GET` | `/api/v1/assistant/history` | Get chat history |
| `POST` | `/api/v1/assistant/voice` | Voice query input |

### **Market**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/prices/current/{crop_id}` | Get current price |
| `GET` | `/api/v1/prices/forecast/{crop_id}` | Get price forecast |
| `GET` | `/api/v1/weather/current/{location}` | Get current weather |
| `GET` | `/api/v1/weather/forecast/{location}` | Get weather forecast |

### **Marketplace**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/market/products` | List products |
| `POST` | `/api/v1/market/listings` | Create listing |
| `GET` | `/api/v1/market/orders` | Get orders |
| `POST` | `/api/v1/market/negotiate` | Negotiate price |

---

## 🤖 **AI Models**

### **1. Disease Detection (YOLOv8)**

| Parameter | Specification |
|-----------|---------------|
| **Model** | YOLOv8n (nano) for mobile, YOLOv8m for server |
| **Dataset** | Custom Ethiopian crop disease dataset |
| **Classes** | 20+ diseases across 10 crops |
| **Input** | 640x640 RGB image |
| **Output** | Bounding boxes, class labels, confidence |
| **Accuracy Target** | mAP@0.5 > 0.85 |
| **Inference Speed** | < 100ms on GPU, < 500ms on CPU |

**Training Pipeline:**

```mermaid
flowchart LR
    A[Dataset] --> B[Data Augmentation]
    B --> C[YOLOv8 Model]
    C --> D[Training]
    D --> E[Validation]
    E --> F{Accuracy > 85%?}
    F -->|Yes| G[Model Saved]
    F -->|No| H[Adjust Hyperparameters]
    H --> D
```

### **2. RAG Chatbot (LangChain + FAISS)**

| Parameter | Specification |
|-----------|---------------|
| **Embeddings** | sentence-transformers/all-MiniLM-L6-v2 |
| **Vector DB** | FAISS / pgvector |
| **LLM** | Gemini API / Llama 3 |
| **Knowledge Base** | Agricultural manuals, research papers |
| **Languages** | Amharic, Oromo, Tigrinya, English |
| **Context Window** | 2000 tokens |
| **Response Time** | < 2 seconds |

**RAG Pipeline:**

```mermaid
flowchart LR
    A[User Query] --> B[Embedding]
    B --> C[Vector Search]
    C --> D[Retrieve Context]
    D --> E[LLM Generation]
    E --> F[Response]
```

### **3. Price Prediction (Prophet + LSTM)**

| Parameter | Specification |
|-----------|---------------|
| **Models** | Prophet + LSTM ensemble |
| **Features** | Historical prices, season, region, weather |
| **Forecast Horizon** | 30 days |
| **Accuracy** | MAPE < 15% |
| **Update Frequency** | Daily retraining |

**Forecast Pipeline:**

```mermaid
flowchart LR
    A[Historical Prices] --> B[Data Cleaning]
    B --> C[Feature Engineering]
    C --> D[Prophet Model]
    C --> E[LSTM Model]
    D --> F[Ensemble]
    E --> F
    F --> G[Forecast]
```

---

## 🚀 **Deployment**

### **Local Development**

```bash
# Start all services
docker-compose up -d

# Or individually:
docker-compose up -d postgres redis  # Database
cd backend && python -m uvicorn app.main:app --reload  # Backend
cd frontend && npm run dev  # Frontend
```

### **Production Deployment**

```bash
# Build Docker images
docker build -t agronexus-backend ./backend
docker build -t agronexus-frontend ./frontend

# Deploy to cloud providers
# Frontend: Vercel / Netlify
# Backend: Render.com / Railway / AWS
# Database: Neon / Supabase / AWS RDS
# Storage: AWS S3 / Cloudinary / MinIO
```

---

## 🗺️ **Roadmap**

### **Phase 1: MVP (Current)**

```
✅ Authentication (JWT)
✅ Disease Detection (YOLOv8)
✅ PostgreSQL Database
✅ Docker Setup
✅ Frontend Dashboard
✅ Multi-language Support
```

### **Phase 2: AI Expansion**

```
🚧 AI Chat Assistant (LangChain + RAG)
🚧 Price Prediction (Prophet + LSTM)
🚧 Weather Integration
🚧 Model Training Pipeline
🚧 MLflow Tracking
```

### **Phase 3: Industry Integration**

```
📋 Factory Feasibility Advisor
📋 Equipment Marketplace
📋 Quality Control AI
📋 Cost Calculator
```

### **Phase 4: Market & Scale**

```
📋 B2B Marketplace
📋 Consumer Portal (PWA)
📋 Export Documentation
📋 Impact Tracker
📋 Mobile App (React Native)
```

### **Phase 5: Enterprise**

```
📋 Payment Integration
📋 Government Dashboard
📋 API Monetization
📋 Partner Integrations
📋 Advanced Analytics
```

---

## 🤝 **Contributing**

### **Ways to Contribute**

| Type | Examples |
|------|----------|
| **Code** | Bug fixes, features, performance improvements |
| **Documentation** | README, API docs, tutorials |
| **Translation** | Amharic, Oromo, Tigrinya translations |
| **Testing** | Writing tests, reporting bugs |
| **Data** | Crop disease images, price data |
| **Feedback** | Feature requests, usability testing |

### **Contribution Process**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Commit Convention**

```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (formatting)
refactor: Code refactoring
test:     Adding tests
chore:    Maintenance tasks
```

---

## 👤 **Author**

### **Tsegay Assefa**

**AI/ML Engineer | Full-Stack Developer**  
📍 Addis Ababa, Ethiopia

### **Connect**

| Platform | Link |
|----------|------|
| **GitHub** | [@TsegayIS122123](https://github.com/TsegayIS122123) |
| **LinkedIn** | [tsegay-assefa-95a397336](https://linkedin.com/in/tsegay-assefa-95a397336) |
| **Email** | tsegayassefa27@gmail.com |

### **My Journey**

- 🎓 **3rd Year Information Science** at Addis Ababa University
- 🤖 **AI/ML Trainee** at 10 Academy (Kifiya KAIM Program)
- 🔒 **Cybersecurity Trainee** at INSA Cyber Talent Program
- 💻 **Full-Stack Developer** with 11 production projects

### **Why I Built This**

This project represents my commitment to using technology for social impact. Ethiopia's agricultural challenges are personal to me—I've seen family and friends struggle with the problems this platform addresses. By combining AI engineering with a deep understanding of the local context, I aim to contribute to Ethiopia's economic transformation.

---

## 🙏 **Acknowledgments**

### **Institutions**

| Institution | Support |
|-------------|---------|
| **Addis Ababa University** | Academic foundation, research resources |
| **10 Academy** | Advanced AI/ML training, mentorship |
| **INSA Cyber Talent Program** | Cybersecurity training, infrastructure |

### **Tools & Technologies**

| Technology | Why We're Grateful |
|------------|-------------------|
| **YOLOv8 (Ultralytics)** | State-of-the-art computer vision |
| **LangChain** | RAG chatbot framework |
| **FastAPI** | High-performance API framework |
| **Next.js** | React framework |
| **PostgreSQL** | Reliable, feature-rich database |
| **Docker** | Reproducible deployments |

### **Data Sources**

- Ethiopian Ministry of Agriculture
- Ethiopian Meteorological Institute
- OpenWeather API
- PlantVillage Dataset

### **Special Thanks**

> *To every Ethiopian farmer who wakes before dawn to feed our nation—this is for you.*

---

## 📄 **License**

This project is licensed under the MIT License.

---

<p align="center">
  <b>🌾 From Soil to Shelf, Powered by AI</b><br>
  <i>Building Ethiopia's Agro-Industrial Future</i>
</p>

<p align="center">
  <sub>Made with ❤️ in Addis Ababa, Ethiopia</sub>
</p>