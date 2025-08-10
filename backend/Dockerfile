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

# Use gunicorn as production server
ENV FLASK_APP=app.py
ENV FLASK_ENV=production
ENV SECRET_KEY=your-production-secret
ENV DATABASE=/data/employee.db

EXPOSE 5000

# Create data directory and ensure the DB exists
RUN mkdir -p /data && \
    if [ -f employee.db ]; then cp employee.db /data/; fi

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "app:app"]