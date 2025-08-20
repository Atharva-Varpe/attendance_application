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
      // Check if it's an authentication error
      if (response.status === 401) {
        // Trigger logout if token is invalid/expired
        window.dispatchEvent(new CustomEvent('auth:token-expired'));
      }
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

// Token management utilities
export function isTokenExpired(token) {
  if (!token) return true;
  
  try {
    // Decode the JWT token payload (basic decode, not verification)
    const parts = token.split('.');
    if (parts.length !== 3) {
      // This is not a JWT token, it might be a different format
      // For now, let the backend handle expiration validation
      return false;
    }
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token has exp field and if it's expired
    if (payload.exp && payload.exp < currentTime) {
      return true;
    }
    
    // If no exp field, consider it valid (let backend handle expiration)
    return false;
  } catch (error) {
    console.warn('Error checking token expiration:', error);
    // If we can't decode, don't assume it's expired - let backend validate
    return false;
  }
}

export function clearAuthData() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
  sessionStorage.clear(); // Clear session storage too
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('auth') || name.includes('user')) {
          caches.delete(name);
        }
      });
    });
  }
}
