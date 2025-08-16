import React, { useEffect, useMemo, useRef, useState } from 'react';
import { API_BASE_URL, apiRequest, apiRequestAuth } from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

function AuthProviderImpl({ children }) {
  const [token, setToken] = useState(localStorage.getItem('auth_token') || null);
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('auth_user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const employeesCache = useRef(null);

  useEffect(() => {
    if (token) localStorage.setItem('auth_token', token);
    else localStorage.removeItem('auth_token');
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem('auth_user', JSON.stringify(user));
    else localStorage.removeItem('auth_user');
  }, [user]);

  // Real login using backend API
  async function login(email, password) {
    setLoading(true);
    console.log('Login Debug - Email:', email);
    console.log('Login Debug - Password:', password);
    try {
      const response = await apiRequest('/login', {
        method: 'POST',
        body: { email: email.toLowerCase(), password },
      });

      if (!response.ok) {
        throw new Error(response.error || 'Login failed');
      }

      const { token: authToken, user: userData } = response.data;
      setToken(authToken);
      setUser(userData);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error.message || 'Login failed' };
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

  // API methods for data fetching
  async function getEmployees() {
    if (employeesCache.current) {
      return { ok: true, data: employeesCache.current };
    }

    if (!token) return { ok: false, error: 'Not authenticated' };
    const response = await apiRequestAuth('/employees', token);

    if (response.ok) {
      employeesCache.current = response.data;
    }

    return response;
  }

  async function getEmployeeById(id) {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth(`/employees/${id}`, token);
  }

  async function getAttendanceByEmployee(employeeId) {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth(`/attendance/${employeeId}`, token);
  }

  async function getUserProfile() {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth('/me', token);
  }

  async function getAdminSummary() {
    if (!token || user?.role !== 'admin') return { ok: false, error: 'Not authorized' };
    return await apiRequestAuth('/admin/summary', token);
  }

  async function createEmployee(employeeData) {
    if (!token || user?.role !== 'admin') return { ok: false, error: 'Not authorized' };
    return await apiRequestAuth('/employees', token, {
      method: 'POST',
      body: employeeData,
    });
  }

  async function updateEmployee(id, employeeData) {
    if (!token || user?.role !== 'admin') return { ok: false, error: 'Not authorized' };
    return await apiRequestAuth(`/employees/${id}`, token, {
      method: 'PUT',
      body: employeeData,
    });
  }

  async function deleteEmployee(id) {
    if (!token || user?.role !== 'admin') return { ok: false, error: 'Not authorized' };
    return await apiRequestAuth(`/employees/${id}`, token, {
      method: 'DELETE',
    });
  }

  async function checkIn(employeeId) {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth('/attendance/checkin', token, {
      method: 'POST',
      body: { employee_id: employeeId },
    });
  }

  async function checkOut(employeeId) {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth('/attendance/checkout', token, {
      method: 'POST',
      body: { employee_id: employeeId },
    });
  }

  async function changePassword(currentPassword, newPassword) {
    if (!token) return { ok: false, error: 'Not authenticated' };
    return await apiRequestAuth('/me/change-password', token, {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }

  async function resetPassword(employeeId, newPassword) {
    if (!token || user?.role !== 'admin') return { ok: false, error: 'Not authorized' };
    return await apiRequestAuth('/admin/reset-password', token, {
      method: 'POST',
      body: { employee_id: employeeId, new_password: newPassword },
    });
  }

  const value = useMemo(() => ({
    token, 
    user, 
    loading, 
    login, 
    logout, 
    authHeaders, 
    API_BASE_URL,
    // API methods
    getEmployees,
    getEmployeeById,
    getAttendanceByEmployee,
    getUserProfile,
    getAdminSummary,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    checkIn,
    checkOut,
    changePassword,
    resetPassword,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function AuthProvider(props) {
  return <AuthProviderImpl {...props} />;
}
