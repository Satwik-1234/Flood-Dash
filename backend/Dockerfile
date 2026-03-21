FROM python:3.11-slim

WORKDIR /app

# System dependencies for scientific Python stack
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (layer cache)
COPY requirements.txt .

# Install the full ML stack — no disk constraints inside Docker
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

# Run FastAPI with hot-reload for development
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
