import { createContext } from 'react';

// Separate context file to satisfy Fast Refresh rule:
// This file exports ONLY the context object (no components/hooks).
export const AuthContext = createContext(null);
