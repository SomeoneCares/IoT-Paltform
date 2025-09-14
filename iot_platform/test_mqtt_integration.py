#!/usr/bin/env python3
"""
Test script to verify MQTT integration between edge gateway simulator and backend
"""

import subprocess
import time
import requests
import json
import threading
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def start_flask_app():
    """Start the Flask application in a separate process"""
    print("Starting Flask application...")
    process = subprocess.Popen([
        'python', 'src/main.py'
    ], cwd='/home/ubuntu/iot_platform')
    return process

def start_edge_gateway():
    """Start the edge gateway simulator"""
    print("Starting edge gateway simulator...")
    process = subprocess.Popen([
        'python', 'edge_gateway_simulator.py', 
        '--duration', '60'  # Run for 60 seconds
    ], cwd='/home/ubuntu/iot_platform')
    return process

def test_api_endpoints():
    """Test the API endpoints"""
    base_url = "http://localhost:5000/api"
    
    # Wait for Flask app to start
    print("Waiting for Flask app to start...")
    time.sleep(5)
    
    try:
        # Test getting devices
        print("Testing GET /api/devices...")
        response = requests.get(f"{base_url}/devices")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            devices = response.json()
            print(f"Found {len(devices)} devices")
            for device in devices[:3]:  # Show first 3 devices
                print(f"  - {device['name']} ({device['device_id']}) - {device['status']}")
        
        # Wait a bit for more data to accumulate
        time.sleep(10)
        
        # Test getting device data
        if response.status_code == 200 and devices:
            device_id = devices[0]['device_id']
            print(f"\nTesting GET /api/devices/{device_id}/data...")
            data_response = requests.get(f"{base_url}/devices/{device_id}/data")
            print(f"Status: {data_response.status_code}")
            if data_response.status_code == 200:
                data_points = data_response.json()
                print(f"Found {len(data_points)} data points for device {device_id}")
                if data_points:
                    latest = data_points[0]
                    print(f"  Latest: {latest['data_type']} = {latest['value']} {latest['unit']} at {latest['timestamp']}")
        
        # Test automation rules
        print(f"\nTesting GET /api/automation/rules...")
        rules_response = requests.get(f"{base_url}/automation/rules")
        print(f"Status: {rules_response.status_code}")
        if rules_response.status_code == 200:
            rules = rules_response.json()
            print(f"Found {len(rules)} automation rules")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to Flask application. Make sure it's running.")
    except Exception as e:
        print(f"Error testing API: {e}")

def main():
    """Main test function"""
    print("=== IoT Platform MQTT Integration Test ===\n")
    
    flask_process = None
    gateway_process = None
    
    try:
        # Start Flask application
        flask_process = start_flask_app()
        
        # Start edge gateway simulator
        gateway_process = start_edge_gateway()
        
        # Test API endpoints
        test_api_endpoints()
        
        # Let it run for a bit more
        print("\nLetting the system run for 30 more seconds...")
        time.sleep(30)
        
        # Final API test
        print("\n=== Final API Test ===")
        test_api_endpoints()
        
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    finally:
        print("\nCleaning up...")
        if gateway_process:
            gateway_process.terminate()
            gateway_process.wait()
        if flask_process:
            flask_process.terminate()
            flask_process.wait()
        print("Test completed")

if __name__ == "__main__":
    main()

