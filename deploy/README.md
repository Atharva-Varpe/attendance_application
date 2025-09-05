# Attendance System Deployment Guide

This directory contains deployment scripts and configurations for the attendance application.

## Domain Routing Solutions

### GOOD: Current Setup (Quick Fix)
Your current Docker Compose setup should work! If your domain isn't routing to the frontend:

1. **Check firewall**: `sudo ufw allow 80 && sudo ufw allow 443`
2. **Verify containers**: `docker-compose ps`
3. **Test locally**: `curl -I http://localhost`
4. **Check DNS**: `nslookup your-domain.com`

### BETTER: Enhanced Production Setup
Use the production Docker Compose configuration:

```bash
# Deploy with enhanced configuration
docker-compose -f docker-compose.production.yml up -d

# Monitor logs
docker-compose -f docker-compose.production.yml logs -f nginx
```

Features:
- Dedicated Nginx reverse proxy
- Rate limiting and security headers
- Automatic database backups
- Health checks and monitoring
- Load balancing ready

### BEST: Production with SSL
Full production deployment with HTTPS:

```bash
# 1. Setup SSL certificates
./scripts/ssl-setup.sh your-domain.com your-email@domain.com

# 2. Deploy with SSL configuration
docker-compose -f docker-compose.production.yml up -d

# 3. Update nginx to use SSL config
docker-compose exec nginx cp /etc/nginx/ssl-nginx.conf /etc/nginx/conf.d/default.conf
docker-compose exec nginx nginx -s reload
```

Features:
- HTTPS with Let's Encrypt or self-signed certificates
- HTTP/2 support
- Advanced security headers
- Automatic certificate renewal
- Production-grade performance optimizations

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

## Running Locally (docker-compose)
1. Copy `.env.example` to `.env` and edit as needed:
```bash
cp .env.example .env
# Set SECRET_KEY (any random string) and optionally FREEDNS_UPDATE_URL
```
2. Start the stack:
```bash
docker-compose up -d
```
3. Verify healthchecks:
```bash
docker-compose ps
curl -s http://localhost:5000/healthz | jq .
curl -sI http://localhost/ | head -n1
```

Notes:
- The `ddns` service updates FreeDNS periodically if `FREEDNS_UPDATE_URL` is set in `.env`.
- `backend` persists SQLite data in the `backend-data` volume at `/data/employee.db`.

## Accessing the Application
- Web interface: http://<machine-ip>:80
- API base: http://<machine-ip>:5000
- Health endpoint: GET http://<machine-ip>:5000/healthz (used by compose healthcheck)

### Default credentials
- Admin: `admin@example.com` / `admin123`
- Gate: `gate@example.com` / `gate123`
- New employees: default password `employee123` (change after first login)

### Server time endpoint
- For client time sync: `GET /api/time` returns `{ iso, epochMs, timezone, offsetMinutes }`

## Verification Steps
1. Check running containers:
```bash
docker-compose ps
```

2. Test API health:
```bash
curl http://localhost:5000/healthz
```

3. Check frontend:
```bash
curl -I http://localhost/
docker-compose logs frontend --tail=100
```

## Packaging for Distribution
```bash
# Create deployment archive
tar czvf attendance-system.tar.gz docker-compose.yml frontend/ backend/ deploy/
```

## Developer Tooling

### Pre-commit hooks
Install pre-commit and enable hooks for Python (black, ruff, isort) and frontend (prettier):
```bash
pip install pre-commit
pre-commit install
```

### GitHub Actions CI
CI runs on push/PR to main. It lints the backend with black/ruff/isort, builds the frontend, and builds Docker images.