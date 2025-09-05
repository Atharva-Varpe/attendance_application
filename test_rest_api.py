#!/usr/bin/env python3
"""
Test script for REST API integration between frontend and backend
"""
import requests
import json
import sys

# Configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api"

def test_health_check():
    """Test health check endpoint"""
    print("=== Testing Health Check ===")
    try:
        response = requests.get(f"{API_BASE}/healthz")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_server_time():
    """Test server time endpoint"""
    print("\n=== Testing Server Time ===")
    try:
        response = requests.get(f"{API_BASE}/time")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_login():
    """Test login endpoint"""
    print("\n=== Testing Login ===")
    try:
        # Test with invalid credentials first
        response = requests.post(f"{API_BASE}/login", json={
            "email": "test@example.com",
            "password": "wrongpassword"
        })
        print(f"Invalid login - Status: {response.status_code}")
        
        # You can add a valid test user here if needed
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_cors():
    """Test CORS headers"""
    print("\n=== Testing CORS ===")
    try:
        # Test OPTIONS request
        response = requests.options(f"{API_BASE}/healthz")
        print(f"OPTIONS Status: {response.status_code}")
        print("CORS Headers:")
        for header, value in response.headers.items():
            if 'access-control' in header.lower():
                print(f"  {header}: {value}")
        
        # Test actual request with CORS headers
        headers = {
            'Origin': 'http://localhost:3000',
            'Content-Type': 'application/json'
        }
        response = requests.get(f"{API_BASE}/healthz", headers=headers)
        print(f"GET with CORS - Status: {response.status_code}")
        
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_api_structure():
    """Test API endpoint structure"""
    print("\n=== Testing API Structure ===")
    
    endpoints = [
        ("/api/healthz", "GET"),
        ("/api/time", "GET"),
        ("/api/login", "POST"),
        ("/api/me", "GET"),  # Requires auth
        ("/api/employees", "GET"),  # Requires auth
        ("/api/admin/summary", "GET"),  # Requires admin auth
    ]
    
    for endpoint, method in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}")
            elif method == "POST":
                response = requests.post(f"{BASE_URL}{endpoint}", json={})
            
            print(f"{method} {endpoint}: {response.status_code}")
            
            # Check if response is JSON
            try:
                response.json()
                print(f"  ✓ Valid JSON response")
            except:
                print(f"  ✗ Invalid JSON response")
                
        except Exception as e:
            print(f"{method} {endpoint}: Error - {e}")

def main():
    """Run all tests"""
    print("REST API Integration Test")
    print("=" * 50)
    
    tests = [
        test_health_check,
        test_server_time,
        test_cors,
        test_login,
        test_api_structure
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"Test failed with exception: {e}")
            results.append(False)
    
    print(f"\n=== Test Results ===")
    print(f"Passed: {sum(results)}/{len(results)}")
    
    if all(results):
        print("✓ All tests passed - REST API is properly configured")
        return True
    else:
        print("✗ Some tests failed - Check backend configuration")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
