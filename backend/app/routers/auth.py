from typing import Dict, Any
from fastapi import APIRouter, HTTPException
import re
import hashlib

from app.db import get_db_connection
from app.security import create_access_token

router = APIRouter(prefix="/api", tags=["auth"])


@router.post("/login")
def login(body: Dict[str, Any]):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    conn = get_db_connection()
    try:
        user = conn.execute(
            "SELECT employee_id, email, password_hash, full_name, role, is_active FROM employees WHERE lower(email) = ?",
            (email,),
        ).fetchone()
    finally:
        conn.close()

    if not user or not user["is_active"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    submitted_sha256 = hashlib.sha256(password.encode()).hexdigest()
    if submitted_sha256 != user["password_hash"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({
        "employee_id": user["employee_id"],
        "email": user["email"],
        "role": user["role"],
    })

    return {
        "token": token,
        "user": {
            "employee_id": user["employee_id"],
            "email": user["email"],
            "name": user["full_name"],
            "role": user["role"],
        },
    }
