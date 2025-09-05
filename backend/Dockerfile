FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment
ENV SECRET_KEY=your-production-secret
ENV DATABASE=/data/employee.db

EXPOSE 5000

# Create data directory and ensure the DB exists
RUN mkdir -p /data && \
    if [ -f employee.db ]; then cp employee.db /data/; fi

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]