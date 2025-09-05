import requests
import logging
import os
from datetime import datetime
from typing import Optional

logger = logging.getLogger(__name__)

class FreeDNSUpdater:
    """
    FreeDNS Dynamic DNS updater for maintaining domain name resolution
    """
    
    def __init__(self, update_url: str):
        """
        Initialize the FreeDNS updater with the provided update URL
        
        Args:
            update_url: The FreeDNS dynamic update URL
        """
        self.update_url = update_url
        self.last_update = None
        self.last_ip = None
    
    def get_current_ip(self) -> Optional[str]:
        """
        Get the current public IP address
        
        Returns:
            Current public IP address or None if unable to retrieve
        """
        try:
            # Try multiple IP detection services for reliability
            services = [
                'https://api.ipify.org',
                'https://icanhazip.com',
                'https://ipecho.net/plain',
                'https://myexternalip.com/raw'
            ]
            
            for service in services:
                try:
                    response = requests.get(service, timeout=10)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        logger.info(f"Current IP detected: {ip}")
                        return ip
                except requests.RequestException as e:
                    logger.warning(f"Failed to get IP from {service}: {e}")
                    continue
            
            logger.error("Failed to retrieve current IP from all services")
            return None
            
        except Exception as e:
            logger.error(f"Error getting current IP: {e}")
            return None
    
    def update_dns(self, force: bool = False) -> bool:
        """
        Update the FreeDNS record with current IP
        
        Args:
            force: Force update even if IP hasn't changed
            
        Returns:
            True if update was successful, False otherwise
        """
        try:
            current_ip = self.get_current_ip()
            if not current_ip:
                logger.error("Cannot update DNS: Unable to determine current IP")
                return False
            
            # Check if IP has changed (unless forced)
            if not force and current_ip == self.last_ip:
                logger.info(f"IP unchanged ({current_ip}), skipping update")
                return True
            
            # Make the FreeDNS update request
            logger.info(f"Updating FreeDNS with IP: {current_ip}")
            response = requests.get(self.update_url, timeout=30)
            
            if response.status_code == 200:
                response_text = response.text.strip()
                logger.info(f"FreeDNS update response: {response_text}")
                
                # FreeDNS typically returns success messages containing the IP
                if current_ip in response_text or "Updated" in response_text or "SUCCESS" in response_text.upper():
                    self.last_update = datetime.now()
                    self.last_ip = current_ip
                    logger.info(f"FreeDNS update successful for IP: {current_ip}")
                    return True
                else:
                    logger.warning(f"FreeDNS update may have failed. Response: {response_text}")
                    return False
            else:
                logger.error(f"FreeDNS update failed with status {response.status_code}: {response.text}")
                return False
                
        except requests.RequestException as e:
            logger.error(f"Network error during FreeDNS update: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during FreeDNS update: {e}")
            return False
    
    def get_status(self) -> dict:
        """
        Get the current status of the FreeDNS updater
        
        Returns:
            Dictionary containing status information
        """
        return {
            'last_update': self.last_update.isoformat() if self.last_update else None,
            'last_ip': self.last_ip,
            'update_url_configured': bool(self.update_url)
        }

# Global instance
_freedns_updater = None

def get_freedns_updater() -> Optional[FreeDNSUpdater]:
    """
    Get the global FreeDNS updater instance
    
    Returns:
        FreeDNS updater instance or None if not configured
    """
    global _freedns_updater
    
    if _freedns_updater is None:
        # Get FreeDNS URL from environment or use the provided one
        freedns_url = os.environ.get('FREEDNS_UPDATE_URL', 'https://freedns.afraid.org/dynamic/update.php?TDRxQmo2WnlOVzc4d1AyTWpOeXZkUnFDOjI0NDg5NTE2')
        
        if freedns_url:
            _freedns_updater = FreeDNSUpdater(freedns_url)
            logger.info("FreeDNS updater initialized")
        else:
            logger.warning("FreeDNS update URL not configured")
    
    return _freedns_updater

def update_freedns_now(force: bool = False) -> bool:
    """
    Convenience function to update FreeDNS immediately
    
    Args:
        force: Force update even if IP hasn't changed
        
    Returns:
        True if update was successful, False otherwise
    """
    updater = get_freedns_updater()
    if updater:
        return updater.update_dns(force=force)
    return False
