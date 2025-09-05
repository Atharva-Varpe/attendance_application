import React, { useEffect } from 'react';

/**
 * A global component responsible for displaying authentication-related notifications.
 * It listens for custom window events dispatched from the AuthContext and
 * provides immediate visual feedback to the user for events like session
 * expiration and manual logout.
 */
export default function SessionManager() {

  useEffect(() => {
    /**
     * Handles the display of a toast notification when the session expires.
     * This event is typically fired automatically when an expired token is detected.
     */
    const handleSessionExpiredToast = (event) => {
      const message = event.detail?.message || 'Your session has expired. Please log in again.';
      console.warn('Session Expired:', message);
      // TODO: Replace with shadcn toast when implemented
      alert(message); // Temporary fallback
    };

    /**
     * Handles the display of a toast notification after a user manually logs out.
     */
    const handleLogoutToast = () => {
      console.log('Logged Out: You have successfully logged out.');
      // TODO: Replace with shadcn toast when implemented
    };

    // Listen for the specific event to show a session expiration TOAST.
    window.addEventListener('auth:session-expired-toast', handleSessionExpiredToast);
    // Listen for the event fired after a successful manual logout.
    window.addEventListener('auth:logged-out', handleLogoutToast);
    
    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('auth:session-expired-toast', handleSessionExpiredToast);
      window.removeEventListener('auth:logged-out', handleLogoutToast);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return null; // No UI component needed, just event listeners
}
