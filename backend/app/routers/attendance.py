from typing import Dict, Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime

from app.db import get_db_connection
from app.security import require_auth, admin_required

router = APIRouter(prefix="/api", tags=["attendance"])


@router.post("/attendance/checkin")
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


@router.post("/attendance/checkout")
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


@router.get("/attendance/{employee_id}")
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


@router.get("/attendance/export/csv")
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
    headers = ["employee_id", "attendance_date", "clock_in_time", "clock_out_time", "notes"]
    values = [[str(rec[h]) for h in headers] for rec in records]
    csv_text = ",".join(headers) + "\n" + "\n".join([",".join(row) for row in values]) + "\n"
    return StreamingResponse(iter([csv_text]), media_type="text/csv", headers={
        "Content-Disposition": f"attachment; filename=attendance_report.csv"
    })
