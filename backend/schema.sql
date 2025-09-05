-- Drop tables if they exist to ensure a clean slate on re-initialization
DROP TABLE IF EXISTS payslips;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS employees;

-- =================================================================
-- Table: employees
-- =================================================================
CREATE TABLE employees (
    employee_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_facing_employee_id TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    phone_number TEXT,
    job_title TEXT NOT NULL,
    department TEXT,
    date_of_joining TEXT NOT NULL,
    gross_monthly_salary REAL NOT NULL,
    bank_account_number TEXT,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Employee', 'Gate')) DEFAULT 'Employee',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default users
-- Admin (email: admin@example.com, password: admin123)
-- Gate (email: gate@example.com, password: gate123)
INSERT OR IGNORE INTO employees (full_name, email, password_hash, job_title, department, date_of_joining, gross_monthly_salary, role, is_active)
VALUES
(
    'System Administrator',
    'admin@example.com',
    '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
    'Administrator',
    'IT',
    DATE('now'),
    0,
    'Admin',
    1
),
(
    'Gate Entry',
    'gate@example.com',
    '5f3d598f993c6e6a8f2318dbe8b2e2a55bbef7a9b28a07d0c5a0a8ad7e0d5e33', -- sha256('gate123')
    'Security',
    'Operations',
    DATE('now'),
    0,
    'Gate',
    1
);

-- Trigger to automatically update the 'updated_at' timestamp
CREATE TRIGGER update_employees_updated_at
AFTER UPDATE ON employees
FOR EACH ROW
BEGIN
    UPDATE employees SET updated_at = CURRENT_TIMESTAMP WHERE employee_id = OLD.employee_id;
END;

-- =================================================================
-- Table: attendance_records
-- =================================================================
CREATE TABLE attendance_records (
    attendance_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    attendance_date TEXT NOT NULL,
    clock_in_time TEXT,
    clock_out_time TEXT,
    notes TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE,
    UNIQUE (employee_id, attendance_date)
);

-- =================================================================
-- Table: payslips
-- =================================================================
CREATE TABLE payslips (
    payslip_id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    pay_period_start TEXT NOT NULL,
    pay_period_end TEXT NOT NULL,
    days_present INTEGER NOT NULL,
    total_days_in_month INTEGER NOT NULL,
    gross_salary_at_time REAL NOT NULL,
    payable_salary REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Draft', 'Finalized')) DEFAULT 'Draft',
    generated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_role ON employees(role);
CREATE INDEX idx_employees_is_active ON employees(is_active);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);
CREATE INDEX idx_attendance_date ON attendance_records(attendance_date);
CREATE INDEX idx_payslips_employee ON payslips(employee_id);
CREATE INDEX idx_payslips_period ON payslips(pay_period_start, pay_period_end);
