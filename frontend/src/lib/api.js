/**
 * Centralized API helpers and constants.
 * Keeping non-component exports outside React component files
 * to satisfy Fast Refresh requirements.
 */

// API Base URL - uses different URLs for dev vs production
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  import.meta.env.DEV ? 'http://localhost:5000/api' : '/api'
);

export function withAuth(headers = {}, token) {
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}

// API helper functions for common operations
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return { ok: true, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { ok: false, error: error.message };
  }
}

export async function apiRequestAuth(endpoint, token, options = {}) {
  return apiRequest(endpoint, {
    ...options,
    headers: withAuth(options.headers, token),
  });
}
