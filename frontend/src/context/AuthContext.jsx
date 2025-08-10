import React, { useEffect, useMemo, useState } from 'react';
import { API_BASE_URL } from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

// Seed data: one admin user + five employees with mappings and sample salary/attendance
const seed = (() => {
  const today = new Date();
  const d30 = new Date(today); d30.setDate(today.getDate() - 30);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const employees = [
    { id: 'E1001', name: 'Aarav Sharma', role: 'Software Engineer', department: 'Engineering', email: 'aarav.sharma@example.com', phone: '+91 98765 43210', hireDate: '2023-04-10', salary: 90000, status: 'Active' },
    { id: 'E1002', name: 'Priya Iyer', role: 'HR Specialist', department: 'HR', email: 'priya.iyer@example.com', phone: '+91 98111 22334', hireDate: '2022-11-22', salary: 70000, status: 'Active' },
    { id: 'E1003', name: 'Rohan Gupta', role: 'Accountant', department: 'Finance', email: 'rohan.gupta@example.com', phone: '+91 99220 33445', hireDate: '2021-07-05', salary: 65000, status: 'Active' },
    { id: 'E1004', name: 'Neha Verma', role: 'Product Manager', department: 'Product', email: 'neha.verma@example.com', phone: '+91 90012 34567', hireDate: '2020-02-15', salary: 120000, status: 'Active' },
    { id: 'E1005', name: 'Vikram Singh', role: 'Support Engineer', department: 'Support', email: 'vikram.singh@example.com', phone: '+91 98989 12345', hireDate: '2019-09-01', salary: 55000, status: 'Active' },
  ];

  // simple salary breakdowns and 6 months payslips
  const salary = Object.fromEntries(
    employees.map(e => {
      const base = e.salary;
      const allowances = Math.round(base * 0.2);
      const deductions = Math.round(base * 0.08);
      const net = base + allowances - deductions;
      const payslips = Array.from({ length: 6 }, (_, i) => {
        const dt = new Date(today); dt.setMonth(today.getMonth() - i);
        return { month: dt.toLocaleString('default', { month: 'short', year: 'numeric' }), base, allowances, deductions, net, paidOn: fmt(new Date(dt.getFullYear(), dt.getMonth(), 28)) };
      });
      return [e.id, { base, allowances, deductions, net, payslips }];
    })
  );

  // attendance last 30 days: Mon-Fri Present, random Late, some Leave/Absent on weekends
  const statuses = ['Present', 'Late', 'Leave', 'Absent'];
  const attendance = Object.fromEntries(
    employees.map(e => {
      const days = [];
      const dt = new Date(d30);
      while (dt <= today) {
        const day = dt.getDay();
        let status = 'Present';
        if (day === 0) { status = 'Leave'; }
        else if (day === 6) { status = 'Absent'; }
        else if (Math.random() < 0.15) { status = 'Late'; }

        const checkIn = status === 'Present' || status === 'Late' ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), status === 'Late' ? 10 : 9, status === 'Late' ? 15 : 0).toISOString() : null;
        const checkOut = status === 'Present' || status === 'Late' ? new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 18, 5).toISOString() : null;
        days.push({ date: fmt(dt), status, checkIn, checkOut });
        dt.setDate(dt.getDate() + 1);
      }
      return [e.id, days];
    })
  );

  const users = [
    { id: 'U1', email: 'admin@company.com', password: 'admin123', role: 'admin', name: 'Admin User' },
    ...employees.map((e, idx) => ({ id: `U${idx + 2}`, email: e.email, password: 'employee123', role: 'employee', name: e.name, employeeId: e.id })),
  ];

  const mapUserToEmployee = Object.fromEntries(users.filter(u => u.role === 'employee').map(u => [u.id, u.employeeId]));
  return { employees, salary, attendance, users, mapUserToEmployee };
})();

function AuthProviderImpl({ children }) {
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  // Mock login using seed data; keeps API_BASE_URL flow for future replace
  async function login(email, password) {
    setLoading(true);
    try {
      // Simulate latency
      await new Promise(r => setTimeout(r, 300));
      const found = seed.users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (!found) throw new Error('Invalid credentials');
      const jwt = btoa(`${found.id}:${found.role}`); // mock token
      setToken(jwt);
      setUser({ id: found.id, email: found.email, name: found.name, role: found.role, employeeId: found.employeeId });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Expose seed data as a lightweight data layer for pages
  function getEmployees() {
    return seed.employees;
  }
  function getEmployeeById(id) {
    return seed.employees.find(e => e.id === id) || null;
  }
  function getAttendanceByEmployee(id) {
    return seed.attendance[id] || [];
  }
  function getSalaryByEmployee(id) {
    return seed.salary[id] || null;
  }

  const value = useMemo(() => ({
    token, user, loading, login, logout, authHeaders, API_BASE_URL,
    data: {
      getEmployees,
      getEmployeeById,
      getAttendanceByEmployee,
      getSalaryByEmployee,
    }
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function AuthProvider(props) {
  return <AuthProviderImpl {...props} />;
}
