# Multi-stage build. The first stage installs dependencies (and torch, from
# the PyTorch CPU index so it does not pull several gigabytes of CUDA
# packages this CPU-only prototype never uses). The second stage copies the
# wheel cache and app code into a slimmer runtime image.
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=0 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Build tools for any package that needs them (psycopg2, cffi).
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install torch from the CPU-only index FIRST so the rest of the requirements
# file finds it satisfied rather than resolving to a CUDA wheel.
RUN pip install --prefix=/install \
      --index-url https://download.pytorch.org/whl/cpu \
      torch

# pandas is a 12+ MB wheel and the single layer that keeps timing out on a
# slow connection. Install it first with a long per-chunk timeout so retries
# have room to succeed, then install everything else against the cached wheel.
RUN pip install --prefix=/install --timeout=300 --retries=20 pandas

COPY requirements.txt /build/requirements.txt
# -----------------------------------------------------------------------------
# Split the requirements install into batches. Each RUN is its own cache layer,
# so a network failure on batch N keeps every batch before it cached and only
# re-runs batch N on retry. On a fast link this is roughly the same wall-clock
# time as one install; on a slow link it is the difference between "hours and
# gives up" and "finishes".
#
# The commented requirements.txt still exists in the tree and is still the
# canonical dependency list; the batches below mirror it exactly. When you add
# a package to requirements.txt, add it to the matching batch here.
# -----------------------------------------------------------------------------

# Batch 1 - numerical stack, everything the AI models import first.
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "numpy<2.2,>=1.26" \
      "scipy>=1.11" \
      "python-dateutil>=2.8.2" \
      "pytz>=2020.1" \
      "tzdata>=2022.7"

# Batch 2 - forecasting stack (Prophet and its dependencies).
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "prophet==1.3.0" \
      "matplotlib>=3.7" \
      "cmdstanpy>=1.2" \
      "holidays>=0.25"

# Batch 3 - LLM stack (LangChain and its Google backend).
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "langchain==1.3.14" \
      "langchain-google-genai==4.3.2" \
      "langchain-community==0.4.2"

# Batch 4 - web framework and its direct dependencies. Small wheels.
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "fastapi==0.115.0" \
      "uvicorn[standard]==0.24.0" \
      "starlette>=0.37.2,<0.39.0" \
      "pydantic==2.12.5" \
      "pydantic-settings>=2.7,<3.0" \
      "email-validator==2.3.0" \
      "python-multipart==0.0.20"

# Batch 5 - database, auth, config, and the rest. Smallest wheels last.
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "sqlalchemy==2.0.51" \
      "psycopg2-binary==2.9.11" \
      "alembic>=1.13" \
      "bcrypt==5.0.0" \
      "passlib==1.7.4" \
      "python-jose[cryptography]==3.5.0" \
      "python-dotenv==1.0.0" \
      "watchfiles==0.20.0" \
      "requests>=2.31,<3.0"

# Pre-downloaded wheels for packages that keep timing out on the network. These
# are installed from disk with --no-index so no download is attempted. Each
# wheel is committed under ai-service/wheels/ so a clean clone can build
# offline.
COPY wheels/ /wheels/

# opencv first, from the local wheel. ultralytics' install below would
# otherwise try to pull a 63 MB wheel over the network every retry.
RUN pip install --prefix=/install --no-deps --no-index --find-links=/wheels "opencv-python-headless" \
    || (echo "No opencv-python-headless wheel present; ultralytics will fetch it from PyPI" && true)

# Batch 6 - ultralytics (YOLO). Its own layer because it drags in opencv and
# a few heavy wheels; isolating it means a timeout here does not touch the
# five batches that succeeded before it.
RUN pip install --prefix=/install --timeout=300 --retries=20 \
      "ultralytics==8.3.0"


# ---------------------------------------------------------------------------

FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Runtime library for psycopg2.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# Non-root user. Files in /app are owned by this user so nothing runs as root.
RUN groupadd --system --gid 1001 app \
    && useradd --system --uid 1001 --gid app --create-home app

COPY --from=builder /install /usr/local
WORKDIR /app
COPY --chown=app:app . /app

USER app

# /health returns the FastAPI health document. Docker's healthcheck uses it
# so dependent services (backend) wait for readiness, not just startup.
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -fsS http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
