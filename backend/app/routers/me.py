from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db_connection
from app.security import require_auth

router = APIRouter(prefix="/api", tags=["me"])


@router.get("/me")
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


@router.patch("/me")
def update_me(body: Dict[str, Any], user: Dict[str, Any] = Depends(require_auth)):
    fields: List[str] = []
    values: List[Any] = []  # type: ignore[name-defined]
    if body.get("full_name"):
        fields.append("full_name = ?"); values.append(body["full_name"])  # type: ignore[arg-type]
    if body.get("email"):
        fields.append("email = ?"); values.append(body["email"])  # type: ignore[arg-type]
    if not fields:
        raise HTTPException(status_code=400, detail="No valid fields provided")
    values.append(user.get("employee_id"))
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?", tuple(values))
        conn.commit()
    except Exception as e:
        # likely IntegrityError (duplicate email)
        conn.close()
        raise HTTPException(status_code=409, detail="Email already exists")
    conn.close()
    return {"message": "Profile updated"}


@router.post("/me/change-password")
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
