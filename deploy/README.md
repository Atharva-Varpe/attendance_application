# Attendance System Deployment Guide

## Requirements
- Docker 20.10+
- docker-compose 1.29+
- Node.js 18+ (for development only)

## Publishing to Docker Hub
1. Replace 'theirusername' in docker-compose.yml with your Docker Hub username
2. Build and push images:
```bash
cd deploy
./publish.sh
```

## Installation (Using Docker Hub)
1. Create docker-compose.yml with:
```yaml
version: '3.8'

services:
  frontend:
    image: yourusername/attendance-frontend:latest
    ports: ["80:80"]
    networks: ["app-network"]

  backend:
    image: yourusername/attendance-backend:latest
    ports: ["5000:5000"]
    volumes: ["backend-data:/data"]
    environment:
      - SECRET_KEY=your-production-secret
    networks: ["app-network"]

volumes:
  backend-data:

networks:
  app-network:
    driver: bridge
```
2. Run deployment:
```bash
# Make setup script executable
chmod +x deploy/setup.sh

# Start the containers
./deploy/setup.sh
```

## Accessing the Application
- Web interface: http://<machine-ip>:80
- API endpoints: http://<machine-ip>:5000/api

## Verification Steps
1. Check running containers:
```bash
docker-compose ps
```

2. Test API health:
```bash
curl http://localhost:5000/api/me
```

3. Check frontend logs:
```bash
docker-compose logs frontend
```

## Packaging for Distribution
```bash
# Create deployment archive
tar czvf attendance-system.tar.gz docker-compose.yml frontend/ backend/ deploy/