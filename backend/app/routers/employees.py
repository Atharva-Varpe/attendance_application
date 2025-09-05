from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException

from backend.app.db import get_db_connection
from backend.app.security import admin_required, require_auth

router = APIRouter(prefix="/api", tags=["employees"])


@router.post("/employees")
def create_employee(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    required = ["name", "email", "role", "salary"]
    if not body or not all(k in body for k in required):
        raise HTTPException(status_code=400, detail="Missing required fields")
    import re
    email = body.get("email", "").strip().lower()
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        raise HTTPException(status_code=400, detail="Invalid email format")
    body["email"] = email
    try:
        salary = float(body["salary"])  # type: ignore[arg-type]
        if salary < 0:
            raise ValueError
        body["salary"] = salary
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid salary")
    import hashlib
    monthly_salary = float(body["salary"])  # already monthly
    password_hash = hashlib.sha256("employee123".encode()).hexdigest()
    from datetime import datetime
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
    except Exception:
        conn.close()
        raise HTTPException(status_code=409, detail="Email already exists")
    conn.close()
    return {"message": "Employee created successfully", "employee_id": new_employee_id}


@router.get("/employees")
def get_all_employees(_user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    employees = conn.execute('SELECT employee_id, full_name as name, email, job_title as designation FROM employees WHERE is_active = 1').fetchall()
    conn.close()
    return [dict(emp) for emp in employees]


@router.get("/employees/{employee_id}")
def get_employee(employee_id: int, _user: Dict[str, Any] = Depends(require_auth)):
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    conn.close()
    if employee is None:
        raise HTTPException(status_code=404, detail="Employee not found")
    return dict(employee)


@router.put("/employees/{employee_id}")
def update_employee(employee_id: int, body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    fields: List[str] = []
    values: List[Any] = []  # type: ignore[name-defined]
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


@router.delete("/employees/{employee_id}")
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
