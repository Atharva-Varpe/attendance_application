/**
 * Custom React hooks for API interactions
 * Provides loading states, error handling, and data management
 */

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService.js';

// Generic hook for API calls with loading and error states
export function useApiCall(apiFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFunction(...args);
      if (response.ok) {
        setData(response.data);
        return response;
      } else {
        setError(response.error || 'An error occurred');
        return response;
      }
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      return { ok: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, dependencies);

  return { data, loading, error, execute, setData, setError };
}

// Hook for employees data
export function useEmployees() {
  const { data: employees, loading, error, execute: refetch } = useApiCall(
    apiService.getEmployees.bind(apiService)
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  const createEmployee = useCallback(async (employeeData) => {
    const response = await apiService.createEmployee(employeeData);
    if (response.ok) {
      refetch(); // Refresh the list
    }
    return response;
  }, [refetch]);

  const updateEmployee = useCallback(async (id, employeeData) => {
    const response = await apiService.updateEmployee(id, employeeData);
    if (response.ok) {
      refetch(); // Refresh the list
    }
    return response;
  }, [refetch]);

  const deleteEmployee = useCallback(async (id) => {
    const response = await apiService.deleteEmployee(id);
    if (response.ok) {
      refetch(); // Refresh the list
    }
    return response;
  }, [refetch]);

  return {
    employees,
    loading,
    error,
    refetch,
    createEmployee,
    updateEmployee,
    deleteEmployee
  };
}

// Hook for attendance data
export function useAttendance(employeeId) {
  const { data: attendance, loading, error, execute: refetch } = useApiCall(
    apiService.getAttendance.bind(apiService),
    [employeeId]
  );

  useEffect(() => {
    if (employeeId) {
      refetch(employeeId);
    }
  }, [employeeId, refetch]);

  const checkIn = useCallback(async (empId = employeeId) => {
    const response = await apiService.checkIn(empId);
    if (response.ok) {
      refetch(empId); // Refresh attendance data
    }
    return response;
  }, [employeeId, refetch]);

  const checkOut = useCallback(async (empId = employeeId) => {
    const response = await apiService.checkOut(empId);
    if (response.ok) {
      refetch(empId); // Refresh attendance data
    }
    return response;
  }, [employeeId, refetch]);

  return {
    attendance,
    loading,
    error,
    refetch,
    checkIn,
    checkOut
  };
}

// Hook for admin dashboard data
export function useAdminSummary() {
  const { data: summary, loading, error, execute: refetch } = useApiCall(
    apiService.getAdminSummary.bind(apiService)
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, error, refetch };
}

// Hook for payslips
export function usePayslips(params = {}) {
  const { data: payslips, loading, error, execute: refetch } = useApiCall(
    apiService.getPayslips.bind(apiService),
    [JSON.stringify(params)]
  );

  useEffect(() => {
    refetch(params);
  }, [refetch, JSON.stringify(params)]);

  const generatePayslips = useCallback(async (month, employeeId = null) => {
    const response = await apiService.generatePayslips(month, employeeId);
    if (response.ok) {
      refetch(params); // Refresh the list
    }
    return response;
  }, [refetch, params]);

  const updatePayslipStatus = useCallback(async (payslipId, status) => {
    const response = await apiService.updatePayslipStatus(payslipId, status);
    if (response.ok) {
      refetch(params); // Refresh the list
    }
    return response;
  }, [refetch, params]);

  return {
    payslips,
    loading,
    error,
    refetch,
    generatePayslips,
    updatePayslipStatus
  };
}


// Hook for user profile
export function useProfile() {
  const { data: profile, loading, error, execute: refetch } = useApiCall(
    apiService.getProfile.bind(apiService)
  );

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateProfile = useCallback(async (profileData) => {
    const response = await apiService.updateProfile(profileData);
    if (response.ok) {
      refetch(); // Refresh profile data
    }
    return response;
  }, [refetch]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return await apiService.changePassword(currentPassword, newPassword);
  }, []);

  return {
    profile,
    loading,
    error,
    refetch,
    updateProfile,
    changePassword
  };
}
