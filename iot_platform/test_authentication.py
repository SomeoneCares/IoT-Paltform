#!/usr/bin/env python3
"""
Test script for authentication system
"""

import requests
import json
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE = "http://localhost:5000/api"

def test_user_registration():
    """Test user registration"""
    print("=== Testing User Registration ===")
    
    # Test user registration
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{API_BASE}/auth/register", json=user_data)
    if response.status_code == 201:
        print("✓ User registration successful")
        user = response.json()['user']
        print(f"  Created user: {user['username']} ({user['email']})")
        return True
    else:
        print(f"✗ User registration failed: {response.status_code} - {response.text}")
        return False

def test_user_login():
    """Test user login"""
    print("\n=== Testing User Login ===")
    
    # Test login with demo user
    login_data = {
        "username": "demo",
        "password": "demo123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code == 200:
        print("✓ User login successful")
        data = response.json()
        token = data['token']
        user = data['user']
        print(f"  Logged in as: {user['username']} (Role: {user['role']})")
        print(f"  Token expires in: {data['expires_in']} seconds")
        return token
    else:
        print(f"✗ User login failed: {response.status_code} - {response.text}")
        return None

def test_protected_routes(token):
    """Test protected routes with authentication"""
    print("\n=== Testing Protected Routes ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test getting profile
    response = requests.get(f"{API_BASE}/auth/profile", headers=headers)
    if response.status_code == 200:
        print("✓ Profile access successful")
        profile = response.json()['user']
        print(f"  Profile: {profile['username']} - {profile['email']}")
    else:
        print(f"✗ Profile access failed: {response.status_code}")
    
    # Test getting devices (should work with token)
    response = requests.get(f"{API_BASE}/devices", headers=headers)
    if response.status_code == 200:
        print("✓ Device access successful")
        devices = response.json()
        print(f"  Found {len(devices)} devices")
    else:
        print(f"✗ Device access failed: {response.status_code}")
    
    # Test getting devices without token (should fail)
    response = requests.get(f"{API_BASE}/devices")
    if response.status_code == 401:
        print("✓ Unauthorized access properly blocked")
    else:
        print(f"✗ Unauthorized access not blocked: {response.status_code}")

def test_admin_functions():
    """Test admin-only functions"""
    print("\n=== Testing Admin Functions ===")
    
    # Login as admin
    admin_login = {
        "username": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=admin_login)
    if response.status_code == 200:
        admin_token = response.json()['token']
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Test getting all users (admin only)
        response = requests.get(f"{API_BASE}/auth/users", headers=headers)
        if response.status_code == 200:
            print("✓ Admin user list access successful")
            users = response.json()['users']
            print(f"  Found {len(users)} users:")
            for user in users:
                print(f"    - {user['username']} ({user['role']})")
        else:
            print(f"✗ Admin user list access failed: {response.status_code}")
    else:
        print(f"✗ Admin login failed: {response.status_code}")

def test_role_based_access():
    """Test role-based access control"""
    print("\n=== Testing Role-Based Access Control ===")
    
    # Login as regular user
    user_login = {
        "username": "demo",
        "password": "demo123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=user_login)
    if response.status_code == 200:
        user_token = response.json()['token']
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Try to access admin-only route (should fail)
        response = requests.get(f"{API_BASE}/auth/users", headers=headers)
        if response.status_code == 403:
            print("✓ Role-based access control working - user blocked from admin route")
        else:
            print(f"✗ Role-based access control failed: {response.status_code}")
    else:
        print(f"✗ User login failed: {response.status_code}")

def test_session_management(token):
    """Test session management"""
    print("\n=== Testing Session Management ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get active sessions
    response = requests.get(f"{API_BASE}/auth/sessions", headers=headers)
    if response.status_code == 200:
        print("✓ Session list access successful")
        sessions = response.json()['sessions']
        print(f"  Found {len(sessions)} active sessions")
    else:
        print(f"✗ Session list access failed: {response.status_code}")
    
    # Test logout
    response = requests.post(f"{API_BASE}/auth/logout", headers=headers)
    if response.status_code == 200:
        print("✓ Logout successful")
        
        # Try to use token after logout (should fail)
        response = requests.get(f"{API_BASE}/auth/profile", headers=headers)
        if response.status_code == 401:
            print("✓ Token invalidated after logout")
        else:
            print(f"✗ Token still valid after logout: {response.status_code}")
    else:
        print(f"✗ Logout failed: {response.status_code}")

def main():
    """Main test function"""
    print("IoT Platform Authentication System Test\n")
    
    try:
        # Test user registration
        test_user_registration()
        
        # Test user login
        token = test_user_login()
        if not token:
            print("Cannot continue tests without valid token")
            return
        
        # Test protected routes
        test_protected_routes(token)
        
        # Test admin functions
        test_admin_functions()
        
        # Test role-based access
        test_role_based_access()
        
        # Test session management
        test_session_management(token)
        
        print("\n=== Authentication Test Complete ===")
        print("Authentication system features:")
        print("- User registration and login")
        print("- JWT token-based authentication")
        print("- Role-based access control (admin, user, guest)")
        print("- Session management")
        print("- Password hashing with bcrypt")
        print("- Token expiration and validation")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

