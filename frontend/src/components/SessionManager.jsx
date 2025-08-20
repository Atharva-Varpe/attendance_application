import React, { useEffect, useRef } from 'react';
import { Toast } from 'primereact/toast';

/**
 * A global component responsible for displaying authentication-related notifications.
 * It listens for custom window events dispatched from the AuthContext and
 * provides immediate visual feedback to the user for events like session 
 * expiration and manual logout.
 */
export default function SessionManager() {
  const toast = useRef(null);

  useEffect(() => {
    /**
     * Handles the display of a toast notification when the session expires.
     * This event is typically fired automatically when an expired token is detected.
     */
    const handleSessionExpiredToast = (event) => {
      const message = event.detail?.message || 'Your session has expired. Please log in again.';
      
      toast.current?.show({
        severity: 'warn',
        summary: 'Session Expired',
        detail: message,
        life: 5000,
        sticky: true // Make it sticky so the user must acknowledge it
      });
    };

    /**
     * Handles the display of a toast notification after a user manually logs out.
     */
    const handleLogoutToast = () => {
      toast.current?.show({
        severity: 'success',
        summary: 'Logged Out',
        detail: 'You have successfully logged out.',
        life: 3000
      });
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

  return <Toast ref={toast} position="top-center" />;
}
