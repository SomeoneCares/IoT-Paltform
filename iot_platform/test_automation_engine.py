#!/usr/bin/env python3
"""
Test script for the automation engine
"""

import requests
import json
import time
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE = "http://localhost:5000/api"

def test_automation_rules():
    """Test automation rules functionality"""
    print("=== Testing Automation Rules ===\n")
    
    try:
        # Get existing rules
        print("1. Getting existing automation rules...")
        response = requests.get(f"{API_BASE}/automation/rules")
        if response.status_code == 200:
            rules = response.json()
            print(f"Found {len(rules)} automation rules:")
            for rule in rules:
                print(f"  - {rule['name']}: {rule['description']}")
                print(f"    Active: {rule['is_active']}")
        else:
            print(f"Error getting rules: {response.status_code}")
            return
        
        print("\n2. Creating a test automation rule...")
        # Create a test rule
        test_rule = {
            "name": "Test Temperature Rule",
            "description": "Test rule for temperature monitoring",
            "trigger_device_id": "temp_001",
            "trigger_condition": {
                "type": "value_threshold",
                "data_type": "temperature",
                "operator": "gt",
                "threshold": 20.0,
                "time_window_minutes": 5,
                "min_interval_seconds": 60
            },
            "action_device_id": "light_001",
            "action_command": {
                "type": "device_command",
                "command": {
                    "action": "turn_on",
                    "brightness": 100
                }
            },
            "user_id": 1
        }
        
        response = requests.post(f"{API_BASE}/automation/rules", json=test_rule)
        if response.status_code == 201:
            new_rule = response.json()
            print(f"Created rule: {new_rule['name']} (ID: {new_rule['id']})")
            rule_id = new_rule['id']
        else:
            print(f"Error creating rule: {response.status_code} - {response.text}")
            return
        
        print("\n3. Testing rule update...")
        # Update the rule
        update_data = {
            "name": "Updated Test Temperature Rule",
            "description": "Updated test rule for temperature monitoring",
            "is_active": True
        }
        
        response = requests.put(f"{API_BASE}/automation/rules/{rule_id}", json=update_data)
        if response.status_code == 200:
            updated_rule = response.json()
            print(f"Updated rule: {updated_rule['name']}")
        else:
            print(f"Error updating rule: {response.status_code}")
        
        print("\n4. Waiting for automation engine to process rules...")
        time.sleep(10)  # Wait for automation engine to evaluate rules
        
        print("\n5. Getting device data to see if rules are working...")
        # Check recent device data
        response = requests.get(f"{API_BASE}/devices/temp_001/data?hours=1")
        if response.status_code == 200:
            data_points = response.json()
            if data_points:
                latest = data_points[0]
                print(f"Latest temperature: {latest['value']}°C at {latest['timestamp']}")
                if latest['value'] > 20.0:
                    print("Temperature is above threshold - automation rule should trigger!")
            else:
                print("No recent temperature data found")
        
        print("\n6. Cleaning up - deleting test rule...")
        # Delete the test rule
        response = requests.delete(f"{API_BASE}/automation/rules/{rule_id}")
        if response.status_code == 200:
            print("Test rule deleted successfully")
        else:
            print(f"Error deleting rule: {response.status_code}")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {e}")

def test_device_commands():
    """Test sending commands to devices"""
    print("\n=== Testing Device Commands ===\n")
    
    try:
        # Get available devices
        response = requests.get(f"{API_BASE}/devices")
        if response.status_code == 200:
            devices = response.json()
            smart_lights = [d for d in devices if d['device_type'] == 'smart_light']
            
            if smart_lights:
                light = smart_lights[0]
                print(f"Testing commands on device: {light['name']} ({light['device_id']})")
                
                # This would normally send MQTT commands, but we'll just log it
                print("Note: Device commands would be sent via MQTT to the edge gateway")
                print("The automation engine can send commands like:")
                print("  - Turn on/off lights")
                print("  - Set brightness levels")
                print("  - Control other smart devices")
            else:
                print("No smart lights found for testing")
        
    except Exception as e:
        print(f"Error testing device commands: {e}")

def main():
    """Main test function"""
    print("IoT Platform Automation Engine Test\n")
    
    # Wait a moment for services to be ready
    print("Waiting for services to be ready...")
    time.sleep(3)
    
    test_automation_rules()
    test_device_commands()
    
    print("\n=== Test Complete ===")
    print("The automation engine is running in the background and will:")
    print("- Evaluate rules every 5 seconds")
    print("- Trigger actions when conditions are met")
    print("- Send MQTT commands to devices")
    print("- Log all automation activities")

if __name__ == "__main__":
    main()

