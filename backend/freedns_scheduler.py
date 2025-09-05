import threading
import time
import logging
from datetime import datetime, timedelta
from freedns_updater import get_freedns_updater

logger = logging.getLogger(__name__)

class FreeDNSScheduler:
    """
    Background scheduler for periodic FreeDNS updates
    """
    
    def __init__(self, update_interval_minutes: int = 60):
        """
        Initialize the scheduler
        
        Args:
            update_interval_minutes: How often to check for IP changes (default: 60 minutes)
        """
        self.update_interval = update_interval_minutes * 60  # Convert to seconds
        self.running = False
        self.thread = None
        self.last_check = None
    
    def start(self):
        """Start the background scheduler"""
        if self.running:
            logger.warning("FreeDNS scheduler is already running")
            return
        
        self.running = True
        self.thread = threading.Thread(target=self._run_scheduler, daemon=True)
        self.thread.start()
        logger.info(f"FreeDNS scheduler started with {self.update_interval/60} minute intervals")
    
    def stop(self):
        """Stop the background scheduler"""
        self.running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=5)
        logger.info("FreeDNS scheduler stopped")
    
    def _run_scheduler(self):
        """Main scheduler loop"""
        while self.running:
            try:
                self.last_check = datetime.now()
                updater = get_freedns_updater()
                
                if updater:
                    logger.debug("Performing scheduled FreeDNS check")
                    success = updater.update_dns(force=False)  # Only update if IP changed
                    if success:
                        logger.debug("Scheduled FreeDNS check completed")
                    else:
                        logger.warning("Scheduled FreeDNS check failed")
                else:
                    logger.debug("FreeDNS updater not configured, skipping check")
                
                # Sleep for the specified interval
                time.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"Error in FreeDNS scheduler: {e}")
                # Sleep for a shorter time on error to retry sooner
                time.sleep(min(300, self.update_interval))  # Max 5 minutes on error
    
    def get_status(self) -> dict:
        """Get scheduler status"""
        return {
            'running': self.running,
            'update_interval_minutes': self.update_interval / 60,
            'last_check': self.last_check.isoformat() if self.last_check else None,
            'next_check': (self.last_check + timedelta(seconds=self.update_interval)).isoformat() if self.last_check else None
        }

# Global scheduler instance
_scheduler = None

def get_scheduler() -> FreeDNSScheduler:
    """Get the global scheduler instance"""
    global _scheduler
    if _scheduler is None:
        _scheduler = FreeDNSScheduler()
    return _scheduler

def start_scheduler():
    """Start the global scheduler"""
    scheduler = get_scheduler()
    scheduler.start()

def stop_scheduler():
    """Stop the global scheduler"""
    scheduler = get_scheduler()
    scheduler.stop()
