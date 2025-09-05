from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from backend.app.db import get_db_connection
from backend.app.security import require_auth, admin_required

router = APIRouter(prefix="/api", tags=["payslips"])


def _month_bounds(yyyy_mm: str) -> Tuple[str, str, int]:
    try:
        year, month = map(int, yyyy_mm.split("-"))
        start = datetime(year, month, 1)
        if month == 12:
            end = datetime(year + 1, 1, 1) - timedelta(days=1)
        else:
            end = datetime(year, month + 1, 1) - timedelta(days=1)
        total_days = (end - start).days + 1
        return start.strftime('%Y-%m-%d'), end.strftime('%Y-%m-%d'), total_days
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid month format. Use YYYY-MM")


@router.post("/payslips/generate")
def generate_payslips(body: Dict[str, Any], _admin: Dict[str, Any] = Depends(admin_required)):
    month = (body or {}).get("month")
    employee_id = (body or {}).get("employee_id")
    if not month:
        raise HTTPException(status_code=400, detail="month (YYYY-MM) is required")
    start, end, total_days = _month_bounds(month)
    conn = get_db_connection()
    try:
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


@router.get("/payslips")
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


@router.patch("/payslips/{payslip_id}")
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


@router.get("/payslips/{payslip_id}/export")
def export_payslip_csv(payslip_id: int, format: str = "csv", _user: Dict[str, Any] = Depends(require_auth)):
    if format != "csv":
        raise HTTPException(status_code=400, detail="Only CSV export is supported")
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM payslips WHERE payslip_id = ?", (payslip_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Payslip not found")
    if _user.get("role") != "Admin" and row["employee_id"] != _user.get("employee_id"):
        raise HTTPException(status_code=403, detail="Forbidden: You can only download your own payslips")
    headers = [
        "payslip_id","employee_id","pay_period_start","pay_period_end","days_present","total_days_in_month","gross_salary_at_time","payable_salary","status","generated_at"
    ]
    values = [str(row[h]) for h in headers]
    csv_text = ",".join(headers) + "\n" + ",".join(values) + "\n"
    return StreamingResponse(iter([csv_text]), media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=payslip_{payslip_id}.csv"
    })
