# 🌱 AgroNexus AI

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green.svg)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-27.3-blue.svg)](https://www.docker.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-8.3-red.svg)](https://ultralytics.com)
[![LangChain](https://img.shields.io/badge/LangChain-0.3-green.svg)](https://python.langchain.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD](https://github.com/TsegayIS122123/agronexus-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/TsegayIS122123/agronexus-ai/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/TsegayIS122123/agronexus-ai/branch/main/graph/badge.svg)](https://codecov.io/gh/TsegayIS122123/agronexus-ai)
[![Twitter Follow](https://img.shields.io/twitter/follow/AgroNexusAI?style=social)](https://twitter.com/AgroNexusAI)

<!-- <p align="center">
  <img src="docs/images/logo.png" alt="AgroNexus AI Logo" width="200"/>
</p> -->

<h3 align="center">
  Connecting Ethiopian Agriculture to Industry Through Artificial Intelligence
</h3>

## 🎯 Overview

**AgroNexus AI** is an end-to-end artificial intelligence platform designed to bridge the critical gap between Ethiopian smallholder farmers and the agro-industrial sector. The platform leverages cutting-edge AI technologies to create a seamless value chain from farm to factory to market.

### Why AgroNexus AI?

Ethiopia's agriculture sector employs over 60% of the population but contributes only 35% to GDP—a massive value leak occurs between production and processing. Farmers face three fundamental challenges:

| Challenge | Impact | Solution |
|-----------|--------|----------|
| **Information Asymmetry** | Farmers lack access to market prices, weather forecasts, and expert advice | AI-powered assistant with real-time data in local languages |
| **Disease & Pest Outbreaks** | 30-50% annual crop loss without early detection | Computer vision models trained on Ethiopian crop diseases |
| **Value Chain Fragmentation** | 40-60% of profits captured by middlemen | Direct B2B marketplace connecting farmers to processors |

### Vision

> *"To transform Ethiopia from a raw material exporter to a manufacturing hub by democratizing access to agricultural intelligence and industrial connections."*

### Mission

1. **Empower 1 million farmers** with AI tools by 2030
2. **Enable 1,000+ local agro-processors** to manufacture finished goods
3. **Reduce food imports by $500M** through import substitution
4. **Create 50,000+ jobs** across the agricultural value chain

### Target Users

| User Group | Pain Point | AgroNexus Solution |
|------------|------------|-------------------|
| **Smallholder Farmers** | No access to expert advice, price information | Mobile app with AI assistant, disease detection, price forecasts |
| **Farmer Cooperatives** | Fragmented selling power | Cooperative formation tools, bulk selling platform |
| **Agro-Processors** | Inconsistent raw material supply, quality issues | Factory advisor, quality control AI, B2B marketplace |
| **Equipment Suppliers** | Limited market reach | Equipment listing and matching platform |
| **Government Agencies** | No agricultural data for policy making | Impact tracker dashboard, regional analytics |
| **NGOs & Development Partners** | Difficulty measuring intervention impact | Impact metrics API, customizable reports |

### Key Differentiators

| Feature | Traditional Solutions | AgroNexus AI |
|---------|----------------------|--------------|
| **Language Support** | English only | Amharic, Oromo, Tigrinya, English |
| **AI Models** | Generic, not locally trained | Fine-tuned on Ethiopian crops and conditions |
| **Connectivity** | Requires constant internet | Offline-first PWA + SMS integration |
| **Value Chain** | Single point solution | End-to-end (farm → factory → market) |
| **Data Ownership** | Farmers lose data rights | Farmer-owned data with blockchain provenance |
| **Cost** | Expensive subscription | Freemium model with government subsidies |

### Success Metrics (2026-2028)

```mermaid
gantt
    title AgroNexus AI Impact Projections
    dateFormat  YYYY-MM
    axisFormat %Y
    
    section Farmers
    Farmers Onboarded : 2026-01, 24M
    10,000 Farmers     : milestone, 2026-06, 1d
    50,000 Farmers     : milestone, 2026-12, 1d
    100,000 Farmers    : milestone, 2027-06, 1d
    500,000 Farmers    : milestone, 2028-01, 1d
    
    section Processors
    Processors Onboarded : 2026-03, 24M
    50 Processors      : milestone, 2026-09, 1d
    200 Processors     : milestone, 2027-03, 1d
    500 Processors     : milestone, 2028-01, 1d
    
    section Economic Impact
    Transaction Volume  : 2026-01, 24M
    $1M                 : milestone, 2026-12, 1d
    $10M                : milestone, 2027-12, 1d
    $50M                : milestone, 2028-12, 1d
```
---

## 📊 **THE PROBLEM**

```mermaid
graph TB
    subgraph "CURRENT SITUATION"
        style FILL1 fill:#f9f9f9,stroke:#333,stroke-width:2px
        
        FARMER["🌾 FARMER<br/>(Raw Materials)"]
        EXPORT["🚢 EXPORT<br/>(Low Value)"]
        MIDDLEMEN["💰 MIDDLEMEN<br/>(Capture 40-60% of value)"]
        PROCESSING["🏭 PROCESSING<br/>(Minimal local capacity)"]
        IMPORTS["📦 IMPORTED GOODS<br/>(Expensive)"]
        
        FARMER --> EXPORT
        FARMER --> MIDDLEMEN
        MIDDLEMEN --> PROCESSING
        PROCESSING --> IMPORTS
        
        style FARMER fill:#c8e6c9,stroke:#2e7d32,stroke-width:2px
        style EXPORT fill:#ffcdd2,stroke:#c62828,stroke-width:2px
        style MIDDLEMEN fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
        style PROCESSING fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
        style IMPORTS fill:#ffcdd2,stroke:#c62828,stroke-width:2px
    end
```

Ethiopia faces a critical **agricultural value chain gap**:

| Challenge | Impact |
|-----------|--------|
| **Crop Diseases** | 30-50% yield loss annually |
| **Price Volatility** | Farmers sell at 40-60% below market value |
| **Middlemen Exploitation** | Capture majority of profits |
| **Minimal Local Processing** | $2B+ spent on food imports |
| **Post-Harvest Loss** | 20-30% of crops wasted |

---

## 🚀 **THE SOLUTION: AGRONEXUS AI**

```mermaid
graph TB
    subgraph "AGRONEXUS AI PLATFORM"
        style PLATFORM fill:#f0f7ff,stroke:#0A2647,stroke-width:3px
        
        subgraph FARMER_ZONE["🌾 FARMER ZONE"]
            FD["Disease Detection<br/>YOLOv8"]
            PP["Price Prophet<br/>Prophet/LSTM"]
            AIA["AI Assistant<br/>LangChain + RAG"]
            WW["Weather Watch<br/>OpenWeather"]
            CH["Cooperative Hub<br/>Recommendations"]
        end
        
        subgraph INDUSTRY_ZONE["⚙️ INDUSTRY ZONE"]
            FA["Factory Advisor<br/>Decision Engine"]
            EM["Equipment Match<br/>Marketplace"]
            QC["Quality Control<br/>Computer Vision"]
            PG["Process Guide<br/>RAG"]
            CC["Cost Calculator<br/>Python"]
        end
        
        subgraph MARKET_ZONE["🤝 MARKET ZONE"]
            B2B["B2B Marketplace<br/>Next.js"]
            LS["Local Shop<br/>E-commerce"]
            EH["Export Hub<br/>Document AI"]
            IT["Impact Tracker<br/>Recharts"]
            CA["Consumer App<br/>PWA"]
        end
        
        subgraph AI_ENGINE["🧠 CROSS-CUTTING AI"]
            SC["Supply Chain Optimizer"]
            MI["Market Intelligence"]
        end
        
        FD --> FA
        PP --> FA
        AIA --> FA
        WW --> FA
        CH --> FA
        
        FA --> B2B
        EM --> B2B
        QC --> LS
        PG --> EH
        CC --> IT
        
        B2B --> SC
        LS --> MI
        EH --> SC
        IT --> MI
        
        SC -.-> B2B
        MI -.-> LS
    end
```

---

## ✨ **KEY FEATURES**

### 🌾 **Farmer Zone**
| Feature | Technology | Impact |
|---------|------------|--------|
| **Crop Disease Detection** | YOLOv8 + PyTorch | 85% accuracy, instant diagnosis |
| **Price Prophet** | Prophet + LSTM | 30-day price forecasts, MAPE < 15% |
| **AI Assistant** | LangChain + RAG + Gemini | 24/7 advice in Amharic/Oromo |
| **Weather Watch** | OpenWeather API | Hyperlocal 5-day forecasts |
| **Cooperative Hub** | Recommendation Engine | Connect farmers automatically |

### ⚙️ **Industry Zone**
| Feature | Technology | Impact |
|---------|------------|--------|
| **Factory Advisor** | Decision Engine | ROI analysis for 20+ products |
| **Equipment Match** | Marketplace | Connect buyers/sellers |
| **Quality Control AI** | Computer Vision | Export-standard grading |
| **Process Guide** | RAG + Video | Step-by-step in local languages |
| **Cost Calculator** | Python + Pandas | Manufacturing cost analysis |

### 🤝 **Market Zone**
| Feature | Technology | Impact |
|---------|------------|--------|
| **B2B Marketplace** | Next.js + PostgreSQL | Direct farmer-processor connection |
| **Local Shop** | E-commerce Platform | Buy Ethiopian products |
| **Export Hub** | Document AI | Auto-fill export forms |
| **Impact Tracker** | Recharts + D3.js | Real-time economic impact |
| **Consumer App** | PWA + Offline-first | Works without internet |

---

## 🏗️ **SYSTEM ARCHITECTURE**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A1["Farmer Web App<br/>Next.js + PWA"]
        A2["Industry Dashboard<br/>React + Tailwind"]
        A3["Consumer Portal<br/>Next.js + Mobile"]
        A4["Admin Dashboard<br/>React + Recharts"]
    end
    
    subgraph "API Gateway Layer"
        B1["API Gateway<br/>FastAPI/NestJS"]
        B2["Authentication<br/>NextAuth/JWT"]
        B3["Rate Limiting<br/>Redis"]
        B4["WebSocket<br/>Socket.io"]
    end
    
    subgraph "Service Layer"
        C1["Farmer Service<br/>Python/FastAPI"]
        C2["Industry Service<br/>Python/FastAPI"]
        C3["Market Service<br/>Node.js/NestJS"]
        C4["AI Service<br/>FastAPI + ML"]
        C5["Notification Service<br/>Celery + Redis"]
    end
    
    subgraph "AI/ML Layer"
        D1["Disease Detection<br/>YOLOv8 + PyTorch"]
        D2["RAG Chatbot<br/>LangChain + FAISS"]
        D3["Price Prediction<br/>Prophet + LSTM"]
        D4["Recommendation Engine<br/>Surprise/Implicit"]
        D5["Quality Grading<br/>Computer Vision"]
    end
    
    subgraph "Data Layer"
        E1[(PostgreSQL<br/>User/Core Data)]
        E2[(TimescaleDB<br/>Time Series)]
        E3[(pgvector<br/>Embeddings)]
        E4[(Redis<br/>Cache/Session)]
        E5[MinIO/S3<br/>Image Storage]
    end
    
    subgraph "DevOps Layer"
        F1[Docker<br/>Containers]
        F2[GitHub Actions<br/>CI/CD]
        F3[Vercel/Render<br/>Hosting]
        F4[Prometheus/Grafana<br/>Monitoring]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    
    B1 --> C1
    B1 --> C2
    B1 --> C3
    B1 --> C4
    B1 --> C5
    
    C1 --> D1
    C1 --> D2
    C1 --> D3
    C2 --> D4
    C3 --> D5
    
    C1 --> E1
    C1 --> E2
    C2 --> E3
    C3 --> E4
    C4 --> E5
    
    D1 --> E2
    D2 --> E3
    D3 --> E2
    D4 --> E1
    D5 --> E5
    
    F1 --> F2
    F2 --> F3
    F3 --> F4
```

---

## 📦 **TECHNOLOGY STACK**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 15, TypeScript, Tailwind CSS | React framework with SSR |
| **Backend** | FastAPI (Python), NestJS (Node) | High-performance APIs |
| **Database** | PostgreSQL, TimescaleDB, pgvector | Primary + time-series + vectors |
| **AI/ML** | YOLOv8, LangChain, Prophet, PyTorch | Computer vision, NLP, forecasting |
| **DevOps** | Docker, GitHub Actions, Vercel | Containerization, CI/CD, hosting |


---

## 📁 **PROJECT STRUCTURE**

```
agronexus-ai/
├── apps/
│   ├── web/                      # Next.js frontend
│   │   ├── app/                   # App router
│   │   ├── components/             # Reusable components
│   │   ├── lib/                    # Utilities, hooks
│   │   └── public/                 # Static assets
│   │
│   ├── api/                       # FastAPI backend
│   │   ├── routes/                 # API endpoints
│   │   ├── models/                 # Database models
│   │   ├── schemas/                # Pydantic schemas
│   │   ├── services/               # Business logic
│   │   └── utils/                  # Helpers
│   │
│   └── mobile/                     # React Native (future)
│
├── packages/
│   ├── database/                   # Shared DB schemas
│   ├── ai-models/                  # ML model code
│   │   ├── disease-detection/       # YOLOv8
│   │   ├── chatbot/                 # LangChain
│   │   └── price-prediction/        # Prophet/LSTM
│   └── shared/                      # Shared utilities
│
├── infrastructure/
│   ├── docker/                      # Dockerfiles
│   ├── kubernetes/                   # K8s configs (future)
│   └── terraform/                    # IaC (future)
│
├── scripts/
│   ├── data-collection/              # Scraping scripts
│   ├── model-training/                # Training pipelines
│   └── deployment/                    # Deploy scripts
│
├── tests/
│   ├── unit/                         # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
│
├── docs/                             # Documentation
│   └── images/                        # Diagrams, screenshots
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       └── deploy.yml                 # CD pipeline
│
├── data/                             # Local data (gitignored)
│   ├── raw/
│   ├── processed/
│   └── models/
│
├── docker-compose.yml
├── .env.example
├── .gitignore
├── pyproject.toml                    # Python project config
├── package.json                       # Node project config
└── README.md
```

## 🚀 **QUICK START**

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- Git

### 1. Clone Repository
```bash
git clone https://github.com/TsegayIS122123/agronexus-ai.git
cd agronexus-ai
```

### 2. Backend Setup (FastAPI)
```bash
cd apps/api

# Create virtual environment with uv (fast alternative to pip)
pip install uv
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r requirements.txt

# Run development server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Setup (Next.js)
```bash
cd apps/web

# Install dependencies
npm install

# Run development server
npm run dev
```

### 4. Docker Setup (Full Stack)
```bash
# From root directory
docker-compose up -d

# View logs
docker-compose logs -f
```

### 5. Environment Variables
```bash
# Copy example env file
cp .env.example .env

# Edit with your values
# - Database URLs
# - API Keys (OpenWeather, Gemini)
# - JWT Secrets
```
---
### Testing Strategy

| Test Type | Tool | Coverage Target | When to Run |
|-----------|------|-----------------|-------------|
| **Unit Tests** | pytest, Jest | 85%+ | Every commit |
| **Integration Tests** | pytest, Supertest | 70%+ | Every PR |
| **E2E Tests** | Playwright, Cypress | Critical paths | Before release |
| **Model Tests** | Custom scripts | 85% accuracy | Weekly |
| **Performance Tests** | Locust, k6 | <200ms response | Monthly |
| **Security Tests** | Bandit, OWASP ZAP | No critical issues | Monthly |

##  **VERIFICATION**

```bash
# Check repository on GitHub
# Open: https://github.com/TsegayIS122123/agronexus-ai

# Test locally
docker-compose up -d
# Open http://localhost:3000 for frontend
# Open http://localhost:8000/docs for API docs
```
## 🤝 Contributing

I warmly welcome contributions from the community! Whether you're fixing a bug, adding a feature, improving documentation, or translating to another Ethiopian language, your help makes AgroNexus AI better for everyone.

### 🌟 Ways to Contribute

| Contribution Type | Examples | Skill Level |
|-------------------|----------|-------------|
| **Code** | Bug fixes, new features, performance improvements | Intermediate/Advanced |
| **Documentation** | README updates, API docs, tutorials | Beginner/Intermediate |
| **Translation** | Amharic, Oromo, Tigrinya translations | Any level |
| **Testing** | Writing tests, reporting bugs | Beginner |
| **Data Collection** | Crop disease images, price data | Any level |
| **Feedback** | Feature requests, usability testing | Any level |


## 👤 **AUTHOR**

### Tsegay Assefa 

**AI/ML Engineer & Full-Stack Developer**

### Connect with Me

| Platform | Link |
|----------|------|
| **GitHub** | [@TsegayIS122123](https://github.com/TsegayIS122123) |
| **LinkedIn** | [tsegay-assefa-95a397336](https://linkedin.com/in/tsegay-assefa-95a397336) |
| **Email** | tsegayassefa27@gmail.com |
| **Twitter/X** | [@AgroNexusAI](https://twitter.com/AgroNexusAI) |
| **Portfolio** | [tsegayassefa.github.io](https://tsegayassefa.github.io) |

### My Journey

- 🎓 **3rd Year Information Science** at Addis Ababa University
- 🤖 **AI/ML Trainee** at 10 Academy (Kifiya KAIM Program)
- 🔒 **Cybersecurity Trainee** at INSA 
- 💻 **Full-Stack Developer** with 11 production projects
---

## 🙏 **ACKNOWLEDGMENTS**

### Educational Institutions

| Institution | Support |
|-------------|---------|
| **Addis Ababa University** | Academic foundation, research resources |
| **10 Academy** | Advanced AI/ML training, project mentorship |
| **Kallamino Special High School** | Early education foundation|
| **INSA Cyber Talent Program** | Cybersecurity training, infrastructure knowledge |

### Tools & Technologies

Special thanks to the open-source communities behind:

| Technology | Why We're Grateful |
|------------|-------------------|
| **YOLOv8 (Ultralytics)** | State-of-the-art computer vision made accessible |
| **LangChain** | RAG chatbot framework that powers our AI assistant |
| **FastAPI** | High-performance API framework |
| **Next.js** | React framework for our frontend |
| **PostgreSQL** | Reliable, feature-rich database |
| **Docker** | Containerization that makes deployment reproducible |
| **PyMC** | Bayesian modeling inspiration |
| **Prophet** | Time series forecasting |

### Data Sources

- **Ethiopian Ministry of Agriculture** - Crop statistics
- **Ethiopian Meteorological Institute** - Weather data
- **OpenWeather API** - Real-time weather forecasts
- **Chapa API** - Ethiopian payment gateway

### Special Thanks

> *To every Ethiopian farmer who wakes before dawn to feed our nation - this is for you.*

---
## ⭐ **SUPPORT**

If you find this project helpful, please give it a ⭐ on GitHub!

<!-- <p align="center">
  <img src="docs/images/agronexus-logo.png" alt="AgroNexus AI Logo" width="150"/>
</p> -->

<p align="center">
  <b>From Soil to Shelf, Powered by AI</b><br>
  <i>Building Ethiopia's Agro-Industrial Future</i>
</p>

<p align="center">
© 2026 AgroNexus AI. All rights reserved. This demo showcases proprietary technology.
Unauthorized reproduction or distribution of this software is prohibited.
<br>Made with ❤️ in Addis Ababa, Ethiopia
</p>
