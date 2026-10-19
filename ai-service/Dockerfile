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

COPY requirements.txt /build/requirements.txt
RUN pip install --prefix=/install -r /build/requirements.txt

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
