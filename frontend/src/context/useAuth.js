import { useContext } from 'react';
import { AuthContext } from './AuthContext.js';

// Dedicated hook file to satisfy Fast Refresh rule.
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
