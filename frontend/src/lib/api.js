/**
 * Centralized API helpers and constants.
 * Keeping non-component exports outside React component files
 * to satisfy Fast Refresh requirements.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://backend:5000/api';

export function withAuth(headers = {}, token) {
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}
