import sqlite3
import os
from flask import Flask, request, jsonify, send_from_directory
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired
from datetime import datetime
import hashlib

# --- App and Database Configuration ---

# Initialize Flask App
app = Flask(__name__, static_folder='../static')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
token_serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

# Simple CORS handler
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response
# Define base dir and absolute paths for SQLite database and schema
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Prefer DATABASE path from environment, fallback to local file
DATABASE = os.environ.get('DATABASE', os.path.join(BASE_DIR, 'employee.db'))
SCHEMA_PATH = os.path.join(BASE_DIR, 'schema.sql')

import logging

# Configure logging for auth diagnostics

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("auth")
from typing import Optional, Dict

def generate_token(payload: dict) -> str:
    return token_serializer.dumps(payload)

def verify_token(token: str, max_age_seconds: int = 60 * 60 * 8) -> Optional[Dict]:
    try:
        data = token_serializer.loads(token, max_age=max_age_seconds)
        return data
    except SignatureExpired:
        logger.warning("Token expired")
        return None
    except BadSignature:
        logger.warning("Invalid token signature")
        return None

# --- Database Initialization ---

def get_db_connection():
    """Creates a database connection. The connection will return rows that behave like dictionaries."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database by reading and executing the schema.sql file."""
    conn = get_db_connection()
    # Open the schema.sql file and read its contents from absolute path
    with open(SCHEMA_PATH, 'r', encoding='utf-8') as f:
        sql_script = f.read()
    # Execute the SQL script from the file
    cursor = conn.cursor()
    cursor.executescript(sql_script)
    conn.commit()
    conn.close()
    print(f"Database initialized from {SCHEMA_PATH}.")

def ensure_schema():
    """Ensure required tables exist; initialize if missing."""
    need_init = False
    if not os.path.exists(DATABASE):
        need_init = True
    else:
        try:
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='employees';")
            row = cur.fetchone()
            conn.close()
            if not row:
                need_init = True
        except sqlite3.Error:
            # On any error probing the DB, re-init
            need_init = True
    if need_init:
        init_db()

# Ensure DB file and schema are present at startup
ensure_schema()

# --- Static File Routes ---

@app.route('/')
def serve_index():
    """Serve the main HTML page."""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/healthz', methods=['GET'])
def healthz():
    """Simple health check that verifies DB connectivity and returns 200 if healthy."""
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT 1")
        cur.fetchone()
        conn.close()
        return jsonify({
            'status': 'ok',
            'database': 'ok',
        }), 200
    except Exception as exc:
        try:
            conn.close()
        except Exception:
            pass
        return jsonify({'status': 'error', 'message': str(exc)}), 500

@app.route('/<path:filename>')
def serve_static(filename):
    """Serve static files."""
    return send_from_directory(app.static_folder, filename)


# --- Auth API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    """
    Login endpoint
    Accepts JSON or form: { "email": "...", "password": "..." }
    Returns bearer token if valid. Adds diagnostic logging for common 401 causes.
    """
    # Parse body robustly
    data = {}
    if request.is_json:
        try:
            data = request.get_json(silent=True) or {}
        except Exception:
            data = {}
    else:
        # Fallback to form-encoded
        data = {
            'email': request.form.get('email'),
            'password': request.form.get('password')
        }

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        logger.info("Login 400 - missing fields is_json=%s content_type=%s", request.is_json, request.content_type)
        return jsonify({'error': 'Email and password are required'}), 400

    # Query user
    conn = get_db_connection()
    try:
        user = conn.execute(
            'SELECT employee_id, email, password_hash, full_name, role, is_active FROM employees WHERE lower(email) = ?',
            (email,)
        ).fetchone()
    finally:
        conn.close()

    if not user:
        logger.info("Login 401 - user not found email=%s", email)
        return jsonify({'error': 'Invalid credentials'}), 401

    if not user['is_active']:
        logger.info("Login 401 - user inactive email=%s", email)
        return jsonify({'error': 'Invalid credentials'}), 401

    # Password verification (accepts existing sha256 hashes for compatibility)
    submitted_sha256 = hashlib.sha256(password.encode()).hexdigest()

    if submitted_sha256 != user['password_hash']:
        logger.info("Login 401 - bad password email=%s submitted_sha256_prefix=%s stored_prefix=%s", email, submitted_sha256[:8], str(user['password_hash'])[:8])
        return jsonify({'error': 'Invalid credentials'}), 401

    token = generate_token({'employee_id': user['employee_id'], 'email': user['email'], 'role': user['role']})
    logger.info("Login 200 - success email=%s role=%s", email, user['role'])
    return jsonify({
        'token': token,
        'user': {
            'employee_id': user['employee_id'],
            'email': user['email'],
            'name': user['full_name'],
            'role': user['role']
        }
    })

def require_auth(func):
    """Decorator to guard endpoints with bearer token auth."""
    from functools import wraps
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.info("Auth 401 - missing/invalid Authorization header")
            return jsonify({'error': 'Unauthorized'}), 401
        token = auth_header.split(' ', 1)[1].strip()
        payload = verify_token(token)
        if not payload:
            logger.info("Auth 401 - token invalid/expired")
            return jsonify({'error': 'Unauthorized'}), 401
        request.user = payload  # contains employee_id, email, role
        return func(*args, **kwargs)
    return wrapper


def admin_required(func):
    """Decorator that requires an authenticated Admin user."""
    from functools import wraps
    @wraps(func)
    @require_auth
    def wrapper(*args, **kwargs):
        user = getattr(request, 'user', None)
        if not user or user.get('role') != 'Admin':
            return jsonify({'error': 'Forbidden: Admins only'}), 403
        return func(*args, **kwargs)
    return wrapper

# --- Employee API Endpoints ---

@app.route('/api/employees', methods=['POST'])
@admin_required
def create_employee():
    """Creates a new employee record."""
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'email', 'role', 'salary']):
        return jsonify({'error': 'Missing required fields'}), 400

    # Use the monthly salary directly from frontend
    monthly_salary = float(data['salary'])
    
    # Create a simple password hash
    password = 'employee123'  # Default password
    password_hash = hashlib.sha256(password.encode()).hexdigest()
    
    date_of_joining = datetime.now().strftime('%Y-%m-%d')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO employees (full_name, email, password_hash, job_title, department, phone_number, gross_monthly_salary, date_of_joining, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (data['name'], data['email'], password_hash, data.get('role', 'Employee'), data.get('department', ''), data.get('phone', ''), monthly_salary, date_of_joining, 'Employee')
        )
        conn.commit()
        new_employee_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    finally:
        conn.close()

    return jsonify({'message': 'Employee created successfully', 'employee_id': new_employee_id}), 201

@app.route('/api/employees', methods=['GET'])
@require_auth
def get_all_employees():
    """Retrieves a list of all active employees."""
    # Allow read-only listing for Admin and Gate; regular Employees also can view list if needed
    conn = get_db_connection()
    employees = conn.execute('SELECT employee_id, full_name as name, email, job_title as designation FROM employees WHERE is_active = 1').fetchall()
    conn.close()
    return jsonify([dict(emp) for emp in employees])

@app.route('/api/employees/<int:employee_id>', methods=['GET'])
@require_auth
def get_employee(employee_id):
    """Retrieves a single employee's details."""
    conn = get_db_connection()
    employee = conn.execute('SELECT * FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    conn.close()
    if employee is None:
        return jsonify({'error': 'Employee not found'}), 404
    return jsonify(dict(employee))

@app.route('/api/employees/<int:employee_id>', methods=['PUT'])
@admin_required
def update_employee(employee_id):
    """Updates an existing employee's details."""
    data = request.get_json()
    
    fields = []
    values = []
    for key, value in data.items():
        if key in ['full_name', 'email', 'phone_number', 'job_title', 'department', 'gross_monthly_salary', 'bank_account_number', 'role', 'is_active']:
            fields.append(f"{key} = ?")
            values.append(value)
    
    if not fields:
        return jsonify({'error': 'No valid fields provided for update'}), 400

    values.append(employee_id)
    
    sql = f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?"
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(sql, tuple(values))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404
        
    conn.close()
    return jsonify({'message': 'Employee updated successfully'})

@app.route('/api/employees/<int:employee_id>', methods=['DELETE'])
@admin_required
def delete_employee(employee_id):
    """Deactivates an employee (soft delete)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE employees SET is_active = 0 WHERE employee_id = ?", (employee_id,))
    conn.commit()
    
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404
        
    conn.close()
    return jsonify({'message': 'Employee deactivated successfully'})


# --- Attendance API Endpoints ---

@app.route('/api/attendance/checkin', methods=['POST'])
@require_auth
def check_in():
    """Records an employee's check-in time."""
    data = request.get_json()
    if 'employee_id' not in data:
        return jsonify({'error': 'Employee ID is required'}), 400

    # Authorization: allow Admin and Gate to mark any employee; Employee can only mark self
    actor = getattr(request, 'user', {})
    if actor.get('role') not in ('Admin', 'Gate') and actor.get('employee_id') != data.get('employee_id'):
        return jsonify({'error': 'Forbidden'}), 403

    employee_id = data['employee_id']
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    
    record = conn.execute('SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?', (employee_id, current_date)).fetchone()

    if record:
        if record['clock_in_time']:
            conn.close()
            return jsonify({'error': 'Already checked in today'}), 409
    else:
        conn.execute(
            'INSERT INTO attendance_records (employee_id, attendance_date, clock_in_time) VALUES (?, ?, ?)',
            (employee_id, current_date, current_time)
        )
        conn.commit()

    conn.close()
    return jsonify({'message': f'Employee {employee_id} checked in at {current_time}'}), 200

@app.route('/api/attendance/checkout', methods=['POST'])
@require_auth
def check_out():
    """Records an employee's check-out time for the current day."""
    data = request.get_json()
    if 'employee_id' not in data:
        return jsonify({'error': 'Employee ID is required'}), 400

    # Authorization: allow Admin and Gate to mark any employee; Employee can only mark self
    actor = getattr(request, 'user', {})
    if actor.get('role') not in ('Admin', 'Gate') and actor.get('employee_id') != data.get('employee_id'):
        return jsonify({'error': 'Forbidden'}), 403

    employee_id = data['employee_id']
    current_date = datetime.now().strftime('%Y-%m-%d')
    current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    conn = get_db_connection()
    
    record = conn.execute('SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?', (employee_id, current_date)).fetchone()

    if not record or not record['clock_in_time']:
        conn.close()
        return jsonify({'error': 'Must check in before checking out'}), 400
    
    if record['clock_out_time']:
        conn.close()
        return jsonify({'error': 'Already checked out today'}), 409

    conn.execute(
        'UPDATE attendance_records SET clock_out_time = ? WHERE employee_id = ? AND attendance_date = ?',
        (current_time, employee_id, current_date)
    )
    conn.commit()
    conn.close()

    return jsonify({'message': f'Employee {employee_id} checked out at {current_time}'}), 200

@app.route('/api/attendance/<int:employee_id>', methods=['GET'])
@require_auth
def get_attendance_history(employee_id):
    """Retrieves the attendance history for a specific employee."""
    # Allow employee to view only their own records unless Admin or Gate
    user = getattr(request, 'user', None)
    if user and user.get('role') not in ('Admin', 'Gate') and user.get('employee_id') != employee_id:
        return jsonify({'error': 'Forbidden'}), 403

    conn = get_db_connection()
    
    employee = conn.execute('SELECT employee_id FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    if not employee:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404

    records = conn.execute(
        'SELECT attendance_date, clock_in_time, clock_out_time, notes FROM attendance_records WHERE employee_id = ? ORDER BY attendance_date DESC',
        (employee_id,)
    ).fetchall()
    conn.close()
    
    return jsonify([dict(rec) for rec in records])
    """Retrieves the attendance history for a specific employee."""
    conn = get_db_connection()
    
    employee = conn.execute('SELECT employee_id FROM employees WHERE employee_id = ?', (employee_id,)).fetchone()
    if not employee:
        conn.close()
        return jsonify({'error': 'Employee not found'}), 404

    records = conn.execute(
        'SELECT attendance_date, clock_in_time, clock_out_time, notes FROM attendance_records WHERE employee_id = ? ORDER BY attendance_date DESC',
        (employee_id,)
    ).fetchall()
    conn.close()
    
    return jsonify([dict(rec) for rec in records])


# --- Me (Profile) API Endpoints ---

@app.route('/api/me', methods=['GET'])
@require_auth
def get_me():
    """Return current user's profile."""
    user = getattr(request, 'user', {})
    conn = get_db_connection()
    row = conn.execute(
        "SELECT employee_id, full_name, email, role FROM employees WHERE employee_id = ?",
        (user.get('employee_id'),)
    ).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(dict(row))

@app.route('/api/me', methods=['PATCH'])
@require_auth
def update_me():
    """
    Update current user's full_name and/or email.
    Body: { full_name?: string, email?: string }
    """
    user = getattr(request, 'user', {})
    data = request.get_json() or {}
    fields, values = [], []

    if 'full_name' in data and data['full_name']:
        fields.append("full_name = ?"); values.append(data['full_name'])
    if 'email' in data and data['email']:
        fields.append("email = ?"); values.append(data['email'])

    if not fields:
        return jsonify({'error': 'No valid fields provided'}), 400

    values.append(user.get('employee_id'))
    conn = get_db_connection()
    try:
        conn.execute(f"UPDATE employees SET {', '.join(fields)} WHERE employee_id = ?", tuple(values))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Email already exists'}), 409
    conn.close()
    return jsonify({'message': 'Profile updated'})

@app.route('/api/me/change-password', methods=['POST'])
@require_auth
def change_password():
    """
    Change password for current user.
    Body: { current_password: string, new_password: string }
    """
    user = getattr(request, 'user', {})
    data = request.get_json() or {}
    current_password = data.get('current_password') or ''
    new_password = data.get('new_password') or ''
    if not current_password or not new_password:
        return jsonify({'error': 'current_password and new_password are required'}), 400

    conn = get_db_connection()
    try:
        row = conn.execute("SELECT password_hash FROM employees WHERE employee_id = ?", (user.get('employee_id'),)).fetchone()
        if not row:
            return jsonify({'error': 'User not found'}), 404
        cur_hash = row['password_hash']
        if hashlib.sha256(current_password.encode()).hexdigest() != cur_hash:
            return jsonify({'error': 'Current password is incorrect'}), 400
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        conn.execute("UPDATE employees SET password_hash = ? WHERE employee_id = ?", (new_hash, user.get('employee_id')))
        conn.commit()
    finally:
        conn.close()
    return jsonify({'message': 'Password updated'})

# --- Admin API Endpoints ---

@app.route('/api/admin/reset-password', methods=['POST'])
@admin_required
def admin_reset_password():
    """
    Admin-only: reset a user's password by email.
    Body: { "email": "user@example.com", "new_password": "..." }
    Uses sha256 hashing to remain compatible with existing storage.
    """
    data = request.get_json() or {}
    email = (data.get('email') or '').strip().lower()
    new_password = data.get('new_password') or ''
    if not email or not new_password:
        return jsonify({'error': 'email and new_password are required'}), 400
    password_hash = hashlib.sha256(new_password.encode()).hexdigest()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("UPDATE employees SET password_hash = ? WHERE lower(email) = ?", (password_hash, email))
    conn.commit()
    updated = cur.rowcount
    conn.close()
    if updated == 0:
        return jsonify({'error': 'User not found'}), 404
    logger.info("Admin reset password for %s", email)
    return jsonify({'message': 'Password updated'}), 200

@app.route('/api/admin/summary', methods=['GET'])
@admin_required
def admin_summary():
    """Provide high-level metrics for admin dashboard."""
    conn = get_db_connection()
    employee_count = conn.execute('SELECT COUNT(*) as c FROM employees').fetchone()['c']
    active_employee_count = conn.execute('SELECT COUNT(*) as c FROM employees WHERE is_active = 1').fetchone()['c']
    today = datetime.now().strftime('%Y-%m-%d')
    today_attendance = conn.execute(
        "SELECT COUNT(*) as c FROM attendance_records WHERE attendance_date = ? AND clock_in_time IS NOT NULL",
        (today,)
    ).fetchone()['c']
    # Placeholder: compute "late" if you have shift start; currently 0
    late_count = 0
    conn.close()
    return jsonify({
        'employeeCount': employee_count,
        'activeEmployeeCount': active_employee_count,
        'todayAttendanceCount': today_attendance,
        'lateCount': late_count
    })


# --- Main execution ---
if __name__ == '__main__':
    app.run(debug=True)
