#!/usr/bin/env python3
"""
Comprehensive system test for the IoT Platform
"""

import requests
import json
import time
import sys
import os
import threading
import subprocess

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE = "http://localhost:5000/api"

class SystemTester:
    def __init__(self):
        self.admin_token = None
        self.user_token = None
        self.test_results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        if success:
            print(f"✓ {test_name}")
            self.test_results['passed'] += 1
        else:
            print(f"✗ {test_name}: {message}")
            self.test_results['failed'] += 1
            self.test_results['errors'].append(f"{test_name}: {message}")
    
    def setup_authentication(self):
        """Setup authentication tokens"""
        print("=== Setting up Authentication ===")
        
        # Login as admin
        admin_login = {
            "username": "admin",
            "password": "admin123"
        }
        
        response = requests.post(f"{API_BASE}/auth/login", json=admin_login)
        if response.status_code == 200:
            self.admin_token = response.json()['token']
            self.log_result("Admin login", True)
        else:
            self.log_result("Admin login", False, f"Status: {response.status_code}")
            return False
        
        # Login as regular user
        user_login = {
            "username": "demo",
            "password": "demo123"
        }
        
        response = requests.post(f"{API_BASE}/auth/login", json=user_login)
        if response.status_code == 200:
            self.user_token = response.json()['token']
            self.log_result("User login", True)
        else:
            self.log_result("User login", False, f"Status: {response.status_code}")
            return False
        
        return True
    
    def test_device_management(self):
        """Test device management functionality"""
        print("\n=== Testing Device Management ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get devices
        response = requests.get(f"{API_BASE}/devices", headers=headers)
        self.log_result("Get devices", response.status_code == 200)
        
        if response.status_code == 200:
            devices = response.json()
            if devices:
                device = devices[0]
                device_id = device['device_id']
                
                # Get device details
                response = requests.get(f"{API_BASE}/devices/{device_id}", headers=headers)
                self.log_result("Get device details", response.status_code == 200)
                
                # Get device data
                response = requests.get(f"{API_BASE}/devices/{device_id}/data", headers=headers)
                self.log_result("Get device data", response.status_code == 200)
                
                # Update device
                update_data = {"name": "Updated Test Device"}
                response = requests.put(f"{API_BASE}/devices/{device_id}", json=update_data, headers=headers)
                self.log_result("Update device", response.status_code == 200)
            else:
                self.log_result("Device availability", False, "No devices found")
    
    def test_automation_engine(self):
        """Test automation engine functionality"""
        print("\n=== Testing Automation Engine ===")
        
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # Get automation rules
        response = requests.get(f"{API_BASE}/automation/rules", headers=headers)
        self.log_result("Get automation rules", response.status_code == 200)
        
        # Create test rule
        test_rule = {
            "name": "System Test Rule",
            "description": "Test rule for system testing",
            "trigger_device_id": "temp_001",
            "trigger_condition": {
                "type": "value_threshold",
                "data_type": "temperature",
                "operator": "gt",
                "threshold": 25.0,
                "time_window_minutes": 5
            },
            "action_device_id": "light_001",
            "action_command": {
                "type": "device_command",
                "command": {"action": "turn_on", "brightness": 100}
            },
            "user_id": 1
        }
        
        response = requests.post(f"{API_BASE}/automation/rules", json=test_rule, headers=headers)
        if response.status_code == 201:
            rule_id = response.json()['id']
            self.log_result("Create automation rule", True)
            
            # Update rule
            update_data = {"name": "Updated System Test Rule"}
            response = requests.put(f"{API_BASE}/automation/rules/{rule_id}", json=update_data, headers=headers)
            self.log_result("Update automation rule", response.status_code == 200)
            
            # Delete rule
            response = requests.delete(f"{API_BASE}/automation/rules/{rule_id}", headers=headers)
            self.log_result("Delete automation rule", response.status_code == 200)
        else:
            self.log_result("Create automation rule", False, f"Status: {response.status_code}")
    
    def test_analytics(self):
        """Test analytics functionality"""
        print("\n=== Testing Analytics ===")
        
        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Get system overview
        response = requests.get(f"{API_BASE}/analytics/system/overview", headers=headers)
        self.log_result("System overview", response.status_code == 200)
        
        # Get dashboard summary
        response = requests.get(f"{API_BASE}/analytics/dashboard/summary", headers=headers)
        self.log_result("Dashboard summary", response.status_code == 200)
        
        # Test device-specific analytics
        response = requests.get(f"{API_BASE}/devices", headers=headers)
        if response.status_code == 200:
            devices = response.json()
            if devices:
                device_id = devices[0]['device_id']
                
                # Device statistics
                response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/statistics", headers=headers)
                self.log_result("Device statistics", response.status_code == 200)
                
                # Device health
                response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/health", headers=headers)
                self.log_result("Device health", response.status_code == 200)
                
                # Anomaly detection
                response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/anomalies", headers=headers)
                self.log_result("Anomaly detection", response.status_code == 200)
    
    def test_user_management(self):
        """Test user management functionality"""
        print("\n=== Testing User Management ===")
        
        # Test user registration
        new_user = {
            "username": "systemtest",
            "email": "systemtest@example.com",
            "password": "testpass123"
        }
        
        response = requests.post(f"{API_BASE}/auth/register", json=new_user)
        if response.status_code == 201:
            self.log_result("User registration", True)
            
            # Test login with new user
            login_data = {
                "username": "systemtest",
                "password": "testpass123"
            }
            
            response = requests.post(f"{API_BASE}/auth/login", json=login_data)
            if response.status_code == 200:
                new_user_token = response.json()['token']
                self.log_result("New user login", True)
                
                # Test profile access
                headers = {"Authorization": f"Bearer {new_user_token}"}
                response = requests.get(f"{API_BASE}/auth/profile", headers=headers)
                self.log_result("Profile access", response.status_code == 200)
                
                # Test logout
                response = requests.post(f"{API_BASE}/auth/logout", headers=headers)
                self.log_result("User logout", response.status_code == 200)
            else:
                self.log_result("New user login", False, f"Status: {response.status_code}")
        else:
            self.log_result("User registration", False, f"Status: {response.status_code}")
        
        # Test admin functions
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{API_BASE}/auth/users", headers=admin_headers)
        self.log_result("Admin user list", response.status_code == 200)
    
    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n=== Testing Role-Based Access Control ===")
        
        user_headers = {"Authorization": f"Bearer {self.user_token}"}
        admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        # User should NOT be able to access admin routes
        response = requests.get(f"{API_BASE}/auth/users", headers=user_headers)
        self.log_result("User blocked from admin route", response.status_code == 403)
        
        # Admin should be able to access admin routes
        response = requests.get(f"{API_BASE}/auth/users", headers=admin_headers)
        self.log_result("Admin access to admin route", response.status_code == 200)
        
        # Both should be able to access general routes
        response = requests.get(f"{API_BASE}/devices", headers=user_headers)
        self.log_result("User access to devices", response.status_code == 200)
        
        response = requests.get(f"{API_BASE}/devices", headers=admin_headers)
        self.log_result("Admin access to devices", response.status_code == 200)
    
    def test_mqtt_integration(self):
        """Test MQTT integration"""
        print("\n=== Testing MQTT Integration ===")
        
        try:
            # Check if MQTT broker is running
            import socket
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(('localhost', 1883))
            sock.close()
            
            if result == 0:
                self.log_result("MQTT broker connectivity", True)
                
                # The MQTT service should be running as part of the Flask app
                # We can verify this by checking if devices are receiving data
                headers = {"Authorization": f"Bearer {self.user_token}"}
                response = requests.get(f"{API_BASE}/devices", headers=headers)
                
                if response.status_code == 200:
                    devices = response.json()
                    if devices:
                        # Check if any device has recent data
                        device_id = devices[0]['device_id']
                        response = requests.get(f"{API_BASE}/devices/{device_id}/data?hours=1", headers=headers)
                        
                        if response.status_code == 200:
                            data = response.json()
                            self.log_result("MQTT data flow", len(data) > 0)
                        else:
                            self.log_result("MQTT data flow", False, "No data endpoint")
                    else:
                        self.log_result("MQTT data flow", False, "No devices")
                else:
                    self.log_result("MQTT data flow", False, "Cannot access devices")
            else:
                self.log_result("MQTT broker connectivity", False, "Broker not accessible")
        
        except Exception as e:
            self.log_result("MQTT integration test", False, str(e))
    
    def test_frontend_integration(self):
        """Test frontend integration"""
        print("\n=== Testing Frontend Integration ===")
        
        try:
            # Test if the frontend is accessible
            response = requests.get("http://localhost:5000/")
            self.log_result("Frontend accessibility", response.status_code == 200)
            
            # Check if it's serving the React app
            if response.status_code == 200:
                content = response.text
                self.log_result("React app served", "IoT Platform Dashboard" in content)
            
        except Exception as e:
            self.log_result("Frontend integration test", False, str(e))
    
    def test_error_handling(self):
        """Test error handling"""
        print("\n=== Testing Error Handling ===")
        
        # Test invalid endpoints
        response = requests.get(f"{API_BASE}/nonexistent")
        self.log_result("404 handling", response.status_code == 404)
        
        # Test unauthorized access
        response = requests.get(f"{API_BASE}/devices")
        self.log_result("Unauthorized access blocked", response.status_code == 401)
        
        # Test invalid authentication
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{API_BASE}/devices", headers=headers)
        self.log_result("Invalid token rejected", response.status_code == 401)
        
        # Test invalid data
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        invalid_rule = {"invalid": "data"}
        response = requests.post(f"{API_BASE}/automation/rules", json=invalid_rule, headers=headers)
        self.log_result("Invalid data rejected", response.status_code in [400, 422])
    
    def run_all_tests(self):
        """Run all system tests"""
        print("IoT Platform - Comprehensive System Test")
        print("=" * 50)
        
        try:
            # Setup
            if not self.setup_authentication():
                print("Authentication setup failed. Cannot continue tests.")
                return False
            
            # Run all test suites
            self.test_device_management()
            self.test_automation_engine()
            self.test_analytics()
            self.test_user_management()
            self.test_role_based_access()
            self.test_mqtt_integration()
            self.test_frontend_integration()
            self.test_error_handling()
            
            # Print summary
            print("\n" + "=" * 50)
            print("TEST SUMMARY")
            print("=" * 50)
            print(f"Tests Passed: {self.test_results['passed']}")
            print(f"Tests Failed: {self.test_results['failed']}")
            print(f"Success Rate: {(self.test_results['passed'] / (self.test_results['passed'] + self.test_results['failed']) * 100):.1f}%")
            
            if self.test_results['errors']:
                print("\nFailed Tests:")
                for error in self.test_results['errors']:
                    print(f"  - {error}")
            
            return self.test_results['failed'] == 0
            
        except requests.exceptions.ConnectionError:
            print("Error: Could not connect to the API. Make sure the Flask app is running.")
            return False
        except Exception as e:
            print(f"Error during testing: {e}")
            return False

def main():
    """Main function"""
    tester = SystemTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 All tests passed! The IoT Platform is ready for deployment.")
    else:
        print("\n⚠️  Some tests failed. Please review and fix issues before deployment.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

