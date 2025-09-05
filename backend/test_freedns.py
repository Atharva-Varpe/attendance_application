#!/usr/bin/env python3
"""
Simple test script for FreeDNS functionality
"""
import sys
import os

# Add current directory to path to import our modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    import requests
    print("✓ requests module available")
except ImportError:
    print("✗ requests module not available - using urllib instead")
    import urllib.request
    import urllib.error

def test_ip_detection():
    """Test IP detection functionality"""
    print("\n=== Testing IP Detection ===")
    
    services = [
        'https://api.ipify.org',
        'https://icanhazip.com',
        'https://ipecho.net/plain'
    ]
    
    for service in services:
        try:
            if 'requests' in sys.modules:
                response = requests.get(service, timeout=10)
                if response.status_code == 200:
                    ip = response.text.strip()
                    print(f"✓ {service}: {ip}")
                    return ip
                else:
                    print(f"✗ {service}: HTTP {response.status_code}")
            else:
                # Fallback to urllib
                with urllib.request.urlopen(service, timeout=10) as response:
                    if response.status == 200:
                        ip = response.read().decode().strip()
                        print(f"✓ {service}: {ip}")
                        return ip
                    else:
                        print(f"✗ {service}: HTTP {response.status}")
        except Exception as e:
            print(f"✗ {service}: {e}")
    
    return None

def test_freedns_update(ip):
    """Test FreeDNS update functionality"""
    print(f"\n=== Testing FreeDNS Update with IP: {ip} ===")
    
    freedns_url = "https://freedns.afraid.org/dynamic/update.php?TDRxQmo2WnlOVzc4d1AyTWpOeXZkUnFDOjI0NDg5NTE2"
    
    try:
        if 'requests' in sys.modules:
            response = requests.get(freedns_url, timeout=30)
            status_code = response.status_code
            response_text = response.text.strip()
        else:
            # Fallback to urllib
            with urllib.request.urlopen(freedns_url, timeout=30) as response:
                status_code = response.status
                response_text = response.read().decode().strip()
        
        print(f"Status Code: {status_code}")
        print(f"Response: {response_text}")
        
        if status_code == 200:
            if ip in response_text or "Updated" in response_text or "SUCCESS" in response_text.upper():
                print("✓ FreeDNS update appears successful")
                return True
            else:
                print("⚠ FreeDNS update may have failed - check response")
                return False
        else:
            print(f"✗ FreeDNS update failed with status {status_code}")
            return False
            
    except Exception as e:
        print(f"✗ FreeDNS update failed: {e}")
        return False

def main():
    print("FreeDNS Integration Test")
    print("=" * 50)
    
    # Test IP detection
    current_ip = test_ip_detection()
    
    if not current_ip:
        print("\n✗ Could not detect current IP address")
        return False
    
    # Test FreeDNS update
    success = test_freedns_update(current_ip)
    
    print(f"\n=== Test Results ===")
    print(f"Current IP: {current_ip}")
    print(f"FreeDNS Update: {'✓ Success' if success else '✗ Failed'}")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
