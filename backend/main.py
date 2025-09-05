import os
import sqlite3
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from jose import jwt, JWTError
from fastapi.responses import StreamingResponse
from backend.app.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_HOURS, ALLOWED_ORIGINS
from backend.app.db import get_db_connection, init_db_if_needed

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
 


init_db_if_needed()


# --- Security / Auth Helpers ---

security = HTTPBearer(auto_error=False)


def create_access_token(payload: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = payload.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return token


def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def require_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    payload = verify_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
    return payload


def admin_required(user: Dict[str, Any] = Depends(require_auth)) -> Dict[str, Any]:
    if user.get("role") != "Admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: Admins only")
    return user


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

@app.post("/api/login")
def login(body: Dict[str, Any]):
    email = (body.get("email") or "").strip().lower()
    password = body.get("password") or ""
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")
    # Basic email validation
    import re
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    import hashlib

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


# --- Me (Profile) ---

@app.get("/api/me")
def get_me(user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    row = conn.execute(
        "SELECT employee_id, full_name, email, role FROM employees WHERE employee_id = ?",
        (user.get("employee_id"),),
    ).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return dict(row)


@app.patch("/api/me")
def update_me(body: Dict[str, Any], user: Dict[str, Any] = Depends(require_auth)):
    fields: List[str] = []
    values: List[Any] = []
    if body.get("full_name"):
        fields.append("full_name = ?"); values.append(body["full_name"])
    if body.get("email"):
        fields.append("email = ?"); values.append(body["email"])
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields provided")
    values.append(user.get("employee_id"))
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?", tuple(values))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already exists")
    conn.close()
    return {"message": "Profile updated"}


@app.post("/api/me/change-password")
def change_password(body: Dict[str, Any], user: Dict[str, Any] = Depends(require_auth)):
    current_password = body.get("current_password") or ""
    new_password = body.get("new_password") or ""
    if not current_password or not new_password:
        raise HTTPException(status_code=400, detail="current_password and new_password are required")
    import hashlib
    conn = get_db_connection()
    try:
        row = conn.execute("SELECT password_hash FROM employees WHERE employee_id = ?", (user.get("employee_id"),)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        cur_hash = row["password_hash"]
        if hashlib.sha256(current_password.encode()).hexdigest() != cur_hash:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        conn.execute("UPDATE employees SET password_hash = ? WHERE employee_id = ?", (new_hash, user.get("employee_id")))
        conn.commit()
    finally:
        conn.close()
    return {"message": "Password updated"}


# --- Admin ---

@app.post("/api/admin/reset-password")
def admin_reset_password(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    email = (body.get("email") or "").strip().lower()
    new_password = body.get("new_password") or ""
    if not email or not new_password:
        raise HTTPException(status_code=400, detail="email and new_password are required")
    import hashlib
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


@app.get("/api/admin/summary")
def admin_summary(_admin: Dict[str, Any] = Depends(admin_required)):
    conn = get_db_connection()
    employee_count = conn.execute('SELECT COUNT(*) as c FROM employees').fetchone()['c']
    active_employee_count = conn.execute('SELECT COUNT(*) as c FROM employees WHERE is_active = 1').fetchone()['c']
    today = datetime.now().strftime('%Y-%m-%d')
    today_attendance = conn.execute(
        "SELECT COUNT(*) as c FROM attendance_records WHERE attendance_date = ? AND clock_in_time IS NOT NULL",
        (today,),
    ).fetchone()['c']
    # keep lateCount behavior as-is (placeholder 0)
    late_count = 0
    conn.close()
    return {
        'employeeCount': employee_count,
        'activeEmployeeCount': active_employee_count,
        'todayAttendanceCount': today_attendance,
        'lateCount': late_count,
    }


# --- Employees ---

@app.post("/api/employees")
def create_employee(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    required = ["name", "email", "role", "salary"]
    if not body or not all(k in body for k in required):
        raise HTTPException(status_code=400, detail="Missing required fields")
    # Validate email
    import re
    email = body.get("email", "").strip().lower()
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    body["email"] = email
    # Validate salary
    try:
        salary = float(body["salary"])
        if salary < 0:
            raise ValueError
        body["salary"] = salary
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid salary")
    import hashlib
    monthly_salary = float(body["salary"])  # already monthly
    password_hash = hashlib.sha256("employee123".encode()).hexdigest()
    date_of_joining = datetime.now().strftime('%Y-%m-%d')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO employees (full_name, email, password_hash, job_title, department, phone_number, gross_monthly_salary, date_of_joining, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (body['name'], body['email'], password_hash, body.get('role', 'Employee'), body.get('department', ''), body.get('phone', ''), monthly_salary, date_of_joining, 'Employee')
        )
        conn.commit()
        new_employee_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already exists")
    conn.close()
    return {"message": "Employee created successfully", "employee_id": new_employee_id}


@app.get("/api/employees")
def get_all_employees(_user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    employees = conn.execute('SELECT employee_id, full_name as name, email, job_title as designation FROM employees WHERE is_active = 1').fetchall()
    conn.close()
    return [dict(emp) for emp in employees]


@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: int, _user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    conn.close()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return dict(employee)


@app.put("/api/employees/{employee_id}")
def update_employee(employee_id: int, body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    fields: List[str] = []
    values: List[Any] = []
    for key, value in body.items():
        if key in ['full_name', 'email', 'phone_number', 'job_title', 'department', 'gross_monthly_salary', 'bank_account_number', 'role', 'is_active']:
            fields.append(f"{key} = ?")
            values.append(value)
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields provided for update")
    values.append(employee_id)
    sql = f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?"
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, tuple(values))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    conn.close()
    return {"message": "Employee updated successfully"}


@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int, _admin: Dict[str, Any] = Depends(admin_required)):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE employees SET is_active = 0 WHERE employee_id = ?", (employee_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    conn.close()
    return {"message": "Employee deactivated successfully"}


# --- Attendance ---

@app.post("/api/attendance/checkin")
def check_in(body: Dict[str, Any], actor: Dict[str, Any] = Depends(require_auth)):
    if 'employee_id' not in body:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    if actor.get('role') not in ('Admin', 'Gate') and actor.get('employee_id') != body.get('employee_id'):
        raise HTTPException(status_code=403, detail="Forbidden")
    employee_id = body['employee_id']
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    record = conn.execute('SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?', (employee_id, current_date)).fetchone()
    if record:
        if record['clock_in_time']:
            conn.close()
            raise HTTPException(status_code=409, detail="Already checked in today")
    else:
        conn.execute('INSERT INTO attendance_records (employee_id, attendance_date, clock_in_time) VALUES (?, ?, ?)', (employee_id, current_date, current_time))
        conn.commit()
    conn.close()
    return {"message": f"Employee {employee_id} checked in at {current_time}"}


@app.post("/api/attendance/checkout")
def check_out(body: Dict[str, Any], actor: Dict[str, Any] = Depends(require_auth)):
    if 'employee_id' not in body:
        raise HTTPException(status_code=400, detail="Employee ID is required")
    if actor.get('role') not in ('Admin', 'Gate') and actor.get('employee_id') != body.get('employee_id'):
        raise HTTPException(status_code=403, detail="Forbidden")
    employee_id = body['employee_id']
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    record = conn.execute('SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?', (employee_id, current_date)).fetchone()
    if not record or not record['clock_in_time']:
        conn.close()
        raise HTTPException(status_code=400, detail="Must check in before checking out")
    if record['clock_out_time']:
        conn.close()
        raise HTTPException(status_code=409, detail="Already checked out today")
    conn.execute('UPDATE attendance_records SET clock_out_time = ? WHERE employee_id = ? AND attendance_date = ?', (current_time, employee_id, current_date))
    conn.commit()
    conn.close()
    return {"message": f"Employee {employee_id} checked out at {current_time}"}


@app.get("/api/attendance/{employee_id}")
def get_attendance_history(employee_id: int, user: Dict[str, Any] = Depends(require_auth), from_: Optional[str] = None, to: Optional[str] = None, limit: Optional[int] = None, offset: Optional[int] = None):
    if user.get('role') not in ('Admin', 'Gate') and user.get('employee_id') != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection()
    employee = conn.execute('SELECT employee_id FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    if not employee:
        conn.close()
        raise HTTPException(status_code=404, detail="Employee not found")
    sql = 'SELECT attendance_date, clock_in_time, clock_out_time, notes FROM attendance_records WHERE employee_id = ?'
    params: List[Any] = [employee_id]
    if from_:
        sql += ' AND attendance_date >= ?'; params.append(from_)
    if to:
        sql += ' AND attendance_date <= ?'; params.append(to)
    sql += ' ORDER BY attendance_date DESC'
    if limit is not None:
        sql += ' LIMIT ?'; params.append(limit)
    if offset is not None:
        sql += ' OFFSET ?'; params.append(offset)
    records = conn.execute(sql, tuple(params)).fetchall()
    conn.close()
    return [dict(rec) for rec in records]


@app.get("/api/attendance/export/csv")
def export_attendance_csv(employee_id: Optional[int] = None, from_: Optional[str] = None, to: Optional[str] = None, _user: Dict[str, Any] = Depends(require_auth)):
    if employee_id and _user.get('role') not in ('Admin', 'Gate') and _user.get('employee_id') != employee_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    conn = get_db_connection()
    sql = "SELECT employee_id, attendance_date, clock_in_time, clock_out_time, notes FROM attendance_records WHERE 1=1"
    params: List[Any] = []
    if employee_id:
        sql += " AND employee_id = ?"; params.append(employee_id)
    if from_:
        sql += " AND attendance_date >= ?"; params.append(from_)
    if to:
        sql += " AND attendance_date <= ?"; params.append(to)
    sql += " ORDER BY attendance_date DESC"
    records = conn.execute(sql, tuple(params)).fetchall()
    conn.close()
    # Build CSV
    headers = ["employee_id", "attendance_date", "clock_in_time", "clock_out_time", "notes"]
    values = [[str(rec[h]) for h in headers] for rec in records]
    csv_text = ",".join(headers) + "\n" + "\n".join([",".join(row) for row in values]) + "\n"
    return StreamingResponse(iter([csv_text]), media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=attendance_report.csv"
    })


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


# --- Payslips ---

def _month_bounds(yyyy_mm: str) -> (str, str, int):
    try:
        year, month = map(int, yyyy_mm.split("-"))
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = datetime(year, month + 1, 1) - timedelta(days=1)
        # total days in month
        total_days = (end - start).days + 1
        return start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d'), total_days
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")


@app.post("/api/payslips/generate")
def generate_payslips(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    month = (body or {}).get("month")
    employee_id = (body or {}).get("employee_id")
    if not month:
        raise HTTPException(status_code=400, detail="month (YYYY-MM) is required")
    start, end, total_days = _month_bounds(month)
    conn = get_db_connection()
    try:
        # target employees
        if employee_id:
            employees = conn.execute('SELECT employee_id, gross_monthly_salary FROM employees WHERE employee_id = ? AND is_active = 1', (employee_id,)).fetchall()
        else:
            employees = conn.execute('SELECT employee_id, gross_monthly_salary FROM employees WHERE is_active = 1').fetchall()
        created_or_updated: List[int] = []
        for emp in employees:
            emp_id = emp['employee_id']
            gross = float(emp['gross_monthly_salary'] or 0)
            days_present = conn.execute(
                "SELECT COUNT(*) as c FROM attendance_records WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND clock_in_time IS NOT NULL",
                (emp_id, start, end),
            ).fetchone()['c']
            payable = round(gross * (days_present / total_days), 2) if total_days else 0.0
            # upsert-like behavior: if exists for same period, update; else insert
            row = conn.execute(
                "SELECT payslip_id FROM payslips WHERE employee_id = ? AND pay_period_start = ? AND pay_period_end = ?",
                (emp_id, start, end),
            ).fetchone()
            if row:
                conn.execute(
                    "UPDATE payslips SET days_present = ?, total_days_in_month = ?, gross_salary_at_time = ?, payable_salary = ?, status = 'Draft' WHERE payslip_id = ?",
                    (days_present, total_days, gross, payable, row['payslip_id']),
                )
                created_or_updated.append(row['payslip_id'])
            else:
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO payslips (employee_id, pay_period_start, pay_period_end, days_present, total_days_in_month, gross_salary_at_time, payable_salary, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft')",
                    (emp_id, start, end, days_present, total_days, gross, payable),
                )
                created_or_updated.append(cur.lastrowid)
        conn.commit()
    finally:
        conn.close()
    return {"message": "Payslips generated", "month": month, "payslip_ids": created_or_updated}


@app.get("/api/payslips")
def list_payslips(employee_id: Optional[int] = None, month: Optional[str] = None, status_q: Optional[str] = None, _user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    sql = "SELECT * FROM payslips WHERE 1=1"
    params: List[Any] = []
    if employee_id is not None:
        sql += " AND employee_id = ?"; params.append(employee_id)
    if month:
        start, end, _ = _month_bounds(month)
        sql += " AND pay_period_start = ? AND pay_period_end = ?"; params.extend([start, end])
    if status_q:
        sql += " AND status = ?"; params.append(status_q)
    sql += " ORDER BY generated_at DESC"
    rows = conn.execute(sql, tuple(params)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.patch("/api/payslips/{payslip_id}")
def update_payslip(payslip_id: int, body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    new_status = (body or {}).get("status")
    if new_status not in ("Draft", "Finalized"):
        raise HTTPException(status_code=400, detail="status must be 'Draft' or 'Finalized'")
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE payslips SET status = ? WHERE payslip_id = ?", (new_status, payslip_id))
    conn.commit()
    updated = cur.rowcount
    conn.close()
    if updated == 0:
        raise HTTPException(status_code=404, detail="Payslip not found")
    return {"message": "Payslip updated"}


@app.get("/api/payslips/{payslip_id}/export")
def export_payslip_csv(payslip_id: int, format: str = "csv", _user: Dict[str, Any] = Depends(require_auth)):
    if format != "csv":
        raise HTTPException(status_code=400, detail="Only CSV export is supported")
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM payslips WHERE payslip_id = ?", (payslip_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Payslip not found")
    # Check if user can access this payslip
    if _user.get("role") != "Admin" and row["employee_id"] != _user.get("employee_id"):
        raise HTTPException(status_code=403, detail="Forbidden: You can only download your own payslips")
    # Build CSV
    headers = [
        "payslip_id","employee_id","pay_period_start","pay_period_end","days_present","total_days_in_month","gross_salary_at_time","payable_salary","status","generated_at"
    ]
    values = [str(row[h]) for h in headers]
    csv_text = ",".join(headers) + "\n" + ",".join(values) + "\n"
    return StreamingResponse(iter([csv_text]), media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=payslip_{payslip_id}.csv"
    })



