from typing import Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
import hashlib

from app.db import get_db_connection
from app.security import admin_required

router = APIRouter(prefix="/api", tags=["admin"])


@router.post("/admin/reset-password")
def admin_reset_password(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    email = (body.get("email") or "").strip().lower()
    new_password = body.get("new_password") or ""
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="email and new_password are required")
    password_hash = hashlib.sha256(new_password.encode()).hexdigest()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE employees SET password_hash = ? WHERE lower(email) = ?", (password_hash, email))
    conn.commit()
    updated = cur.rowcount
    conn.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "Password updated"}


@router.get("/admin/summary")
def admin_summary(_admin: Dict[str, Any] = Depends(admin_required)):
    conn = get_db_connection()
    employee_count = conn.execute('SELECT COUNT(*) as c FROM employees').fetchone()['c']
    active_employee_count = conn.execute('SELECT COUNT(*) as c FROM employees WHERE is_active = 1').fetchone()['c']
    today = datetime.now().strftime('%Y-%m-%d')
    today_attendance = conn.execute(
        "SELECT COUNT(*) as c FROM attendance_records WHERE attendance_date = ? AND clock_in_time IS NOT NULL",
        (today,),
    ).fetchone()['c']
    late_count = 0
    conn.close()
    return {
        'employeeCount': employee_count,
        'activeEmployeeCount': active_employee_count,
        'todayAttendanceCount': today_attendance,
        'lateCount': late_count,
    }
