import os
import sqlite3
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from backend.app.routers import auth as auth_router
from backend.app.routers import me as me_router
from backend.app.routers import employees as employees_router
from backend.app.routers import attendance as attendance_router
from backend.app.routers import payslips as payslips_router
from backend.app.routers import admin as admin_router
from backend.app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS, ALLOWED_ORIGINS
from backend.app.db import get_db_connection, init_db_if_needed
from backend.app.security import require_auth, admin_required

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- App and Database Configuration ---

app = FastAPI(title="Attendance Backend", version="1.0.0")

# CORS - restrict to specific origins for security
allowed_origins = ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    import uuid
    request_id = request.headers.get("X-Request-ID") or str(uuid.uuid4())
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={
        "error": exc.detail,
    })

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={
        "error": "Internal Server Error",
    })
 


init_db_if_needed()

# Routers
app.include_router(auth_router.router)
app.include_router(me_router.router)
app.include_router(employees_router.router)
app.include_router(attendance_router.router)
app.include_router(admin_router.router)
app.include_router(payslips_router.router)


# --- Security / Auth Helpers --- (moved to backend.app.security)


# --- Models (Pydantic-lite via dicts) ---

# We keep handlers simple and validate minimally to preserve parity with existing API


# --- Auth API Endpoints ---

@app.get("/healthz")
def healthz():
    """Liveness/readiness probe. Verifies DB connectivity."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        conn.close()
        return {"status": "ok", "database": "ok"}
    except Exception as exc:
        try:
            conn.close()
        except Exception:
            pass
        raise HTTPException(status_code=500, detail=f"healthcheck failed: {exc}")

# login endpoint moved to backend.app.routers.auth


# me endpoints moved to backend.app.routers.me


"""admin endpoints moved to backend.app.routers.admin"""


"""employee endpoints moved to backend.app.routers.employees"""


"""attendance endpoints moved to backend.app.routers.attendance"""


# --- Time endpoint ---

@app.get("/api/time")
def get_server_time():
    now = datetime.now(timezone.utc).astimezone()
    return {
        "iso": now.isoformat(),
        "epochMs": int(now.timestamp() * 1000),
        "timezone": str(now.tzinfo),
        "offsetMinutes": int(now.utcoffset().total_seconds() // 60) if now.utcoffset() else 0,
    }


"""payslips endpoints moved to backend.app.routers.payslips"""



