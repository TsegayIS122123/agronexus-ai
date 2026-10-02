FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# The image pulls large wheels (torch ~200 MB). On a slow/flaky connection the
# default 15s read timeout aborts mid-download, so allow long stalls and retry.
ENV PIP_DEFAULT_TIMEOUT=300 \
    PIP_RETRIES=10

COPY requirements.txt .

# Install CPU-only PyTorch first. ultralytics depends on torch, and on Linux a
# plain `pip install torch` pulls the full CUDA/cuDNN stack (cuda-toolkit,
# nvidia-*, triton - several GB) that this prototype does not need. Installing
# the CPU wheels up front keeps the image small and the build fast; ultralytics
# still works for CPU inference. requirements.txt then sees torch already
# satisfied and does not reinstall the CUDA build.
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu \
    torch torchvision

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Use --reload with watchfiles support
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
