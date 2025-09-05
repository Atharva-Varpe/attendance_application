/**
 * Enhanced REST API Service Layer
 * Provides a comprehensive interface for all backend API interactions
 */

import { API_BASE_URL, apiRequest, apiRequestAuth, withAuth } from '../lib/api.js';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth token
  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  // Helper method to make authenticated requests
  async makeAuthRequest(endpoint, options = {}) {
    const token = this.getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return apiRequestAuth(endpoint, token, options);
  }

  // --- Authentication APIs ---
  async login(email, password) {
    return apiRequest('/login', {
      method: 'POST',
      body: { email: email.toLowerCase(), password }
    });
  }

  async logout() {
    // Clear local storage and notify backend if needed
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    return { ok: true };
  }

  async getProfile() {
    return this.makeAuthRequest('/me');
  }

  async updateProfile(profileData) {
    return this.makeAuthRequest('/me', {
      method: 'PATCH',
      body: profileData
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.makeAuthRequest('/me/change-password', {
      method: 'POST',
      body: { current_password: currentPassword, new_password: newPassword }
    });
  }

  // --- Employee APIs ---
  async getEmployees() {
    return this.makeAuthRequest('/employees');
  }

  async getEmployee(id) {
    return this.makeAuthRequest(`/employees/${id}`);
  }

  async createEmployee(employeeData) {
    return this.makeAuthRequest('/employees', {
      method: 'POST',
      body: employeeData
    });
  }

  async updateEmployee(id, employeeData) {
    return this.makeAuthRequest(`/employees/${id}`, {
      method: 'PUT',
      body: employeeData
    });
  }

  async deleteEmployee(id) {
    return this.makeAuthRequest(`/employees/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Attendance APIs ---
  async checkIn(employeeId) {
    return this.makeAuthRequest('/attendance/checkin', {
      method: 'POST',
      body: { employee_id: employeeId }
    });
  }

  async checkOut(employeeId) {
    return this.makeAuthRequest('/attendance/checkout', {
      method: 'POST',
      body: { employee_id: employeeId }
    });
  }

  async getAttendance(employeeId) {
    return this.makeAuthRequest(`/attendance/${employeeId}`);
  }

  // --- Admin APIs ---
  async getAdminSummary() {
    return this.makeAuthRequest('/admin/summary');
  }

  async resetPassword(email, newPassword) {
    return this.makeAuthRequest('/admin/reset-password', {
      method: 'POST',
      body: { email, new_password: newPassword }
    });
  }

  // --- Payslip APIs ---
  async generatePayslips(month, employeeId = null) {
    const body = employeeId ? { month, employee_id: employeeId } : { month };
    return this.makeAuthRequest('/payslips/generate', {
      method: 'POST',
      body
    });
  }

  async getPayslips(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/payslips${queryString ? `?${queryString}` : ''}`;
    return this.makeAuthRequest(endpoint);
  }

  async updatePayslipStatus(payslipId, status) {
    return this.makeAuthRequest(`/payslips/${payslipId}`, {
      method: 'PATCH',
      body: { status }
    });
  }

  getPayslipExportUrl(payslipId, format = 'csv') {
    const token = this.getAuthToken();
    return `${this.baseURL}/payslips/${payslipId}/export?format=${format}&token=${token}`;
  }


  // --- Health Check ---
  async healthCheck() {
    return apiRequest('/healthz');
  }

  async getServerTime() {
    return apiRequest('/time');
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
