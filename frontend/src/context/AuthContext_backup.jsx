import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { API_BASE_URL, apiRequest, apiRequestAuth, isTokenExpired, clearAuthData } from '../lib/api.js';
import { AuthContext } from './AuthContext.js';

/**
 * Provides authentication state and API methods to the entire application.
 * Manages user session, token storage, and provides memoized functions for interacting
 * with the backend API.
 */
function AuthProviderImpl({ children }) {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const employeesCache = useRef(null);

  // On initial load, check localStorage for a valid session.
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken && !isTokenExpired(storedToken)) {
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } else {
        // If token is expired or doesn't exist, clear any lingering data
        clearAuthData();
      }
    } catch (error) {
      console.error("Failed to initialize auth state from storage:", error);
      clearAuthData();
    } finally {
      setLoading(false); // Stop loading after initial check
    }
  }, []);

  // Sync token and user state with localStorage whenever they change.
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('auth_user');
    }
  }, [user]);

  /**
   * Memoized logout function. Clears all authentication state and cached data.
   */
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    employeesCache.current = null;
    clearAuthData();
    // Optional: Redirect or show a notification
    window.dispatchEvent(new CustomEvent('auth:logged-out'));
  }, []);
  
  // Set up an event listener to handle session expiration triggered elsewhere.
  useEffect(() => {
    const handleSessionExpired = () => {
      console.log('Session expired, logging out...');
      logout();
      window.dispatchEvent(new CustomEvent('auth:session-expired-toast', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
    };
    
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('auth:session-expired', handleSessionExpired);
    };
  }, [logout]);

  // Periodically check if the token has expired.
  useEffect(() => {
    if (!token) return;
    
    const validateToken = () => {
      if (isTokenExpired(token)) {
        console.log('Token expired during periodic check.');
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
      }
    };
    
    const interval = setInterval(validateToken, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [token]);


  /**
   * A centralized, memoized wrapper for making authenticated API requests.
   * It handles token validation, authorization checks, and reduces boilerplate.
   * @param {string} endpoint - The API endpoint to call.
   * @param {object} options - Options for the apiRequestAuth function (method, body, etc.).
   * @param {{ role?: 'admin' }} [config] - Optional configuration, e.g., required user role.
   * @returns {Promise<object>} The response from the API call.
   */
  const makeAuthenticatedRequest = useCallback(async (endpoint, options, config) => {
    if (!token || isTokenExpired(token)) {
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return { ok: false, error: 'Session expired. Please log in again.' };
    }
    
    if (config?.role && user?.role?.toLowerCase() !== config.role) {
      return { ok: false, error: 'Not authorized for this action.' };
    }
    
    return await apiRequestAuth(endpoint, token, options);
  }, [token, user]);

  // --- API Methods ---

  const login = useCallback(async (email, password) => {
    setLoading(true);
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
      return { ok: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const getEmployees = useCallback(async () => {
    if (employeesCache.current) {
      return { ok: true, data: employeesCache.current };
    }
    const response = await makeAuthenticatedRequest('/employees');
    if (response.ok) {
      employeesCache.current = response.data;
    }
    return response;
  }, [makeAuthenticatedRequest]);

  const createEmployee = useCallback(async (employeeData) => {
    const response = await makeAuthenticatedRequest('/employees', { method: 'POST', body: employeeData }, { role: 'admin' });
    if (response.ok) employeesCache.current = null; // Invalidate cache
    return response;
  }, [makeAuthenticatedRequest]);

  const updateEmployee = useCallback(async (id, employeeData) => {
    const response = await makeAuthenticatedRequest(`/employees/${id}`, { method: 'PUT', body: employeeData }, { role: 'admin' });
    if (response.ok) employeesCache.current = null; // Invalidate cache
    return response;
  }, [makeAuthenticatedRequest]);

  const deleteEmployee = useCallback(async (id) => {
    const response = await makeAuthenticatedRequest(`/employees/${id}`, { method: 'DELETE' }, { role: 'admin' });
    if (response.ok) employeesCache.current = null; // Invalidate cache
    return response;
  }, [makeAuthenticatedRequest]);
  
  const getEmployeeById = useCallback((id) => makeAuthenticatedRequest(`/employees/${id}`), [makeAuthenticatedRequest]);
  const getAttendanceByEmployee = useCallback((employeeId) => makeAuthenticatedRequest(`/attendance/${employeeId}`), [makeAuthenticatedRequest]);
  const getUserProfile = useCallback(() => makeAuthenticatedRequest('/me'), [makeAuthenticatedRequest]);
  const getAdminSummary = useCallback(() => makeAuthenticatedRequest('/admin/summary', null, { role: 'admin' }), [makeAuthenticatedRequest]);
  const checkIn = useCallback((employeeId) => makeAuthenticatedRequest('/attendance/checkin', { method: 'POST', body: { employee_id: employeeId } }), [makeAuthenticatedRequest]);
  const checkOut = useCallback((employeeId) => makeAuthenticatedRequest('/attendance/checkout', { method: 'POST', body: { employee_id: employeeId } }), [makeAuthenticatedRequest]);

  const changePassword = useCallback((currentPassword, newPassword) => {
    return makeAuthenticatedRequest('/me/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword },
    });
  }, [makeAuthenticatedRequest]);
  
  const resetPassword = useCallback((employeeId, newPassword) => {
    return makeAuthenticatedRequest('/admin/reset-password', {
      method: 'POST',
      body: { employee_id: employeeId, new_password: newPassword },
    }, { role: 'admin' });
  }, [makeAuthenticatedRequest]);

  // Memoize the context value to prevent unnecessary re-renders in consumers.
  const value = useMemo(() => ({
    token, 
    user, 
    loading,
    API_BASE_URL,
    login, 
    logout, 
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
  }), [
    token, user, loading, login, logout, getEmployees, getEmployeeById, 
    getAttendanceByEmployee, getUserProfile, getAdminSummary, createEmployee, 
    updateEmployee, deleteEmployee, checkIn, checkOut, changePassword, resetPassword
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default function AuthProvider(props) {
  return <AuthProviderImpl {...props} />;
}
