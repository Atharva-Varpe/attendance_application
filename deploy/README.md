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