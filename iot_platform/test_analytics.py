#!/usr/bin/env python3
"""
Test script for analytics and data visualization
"""

import requests
import json
import time
import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

API_BASE = "http://localhost:5000/api"

def get_auth_token():
    """Get authentication token"""
    login_data = {
        "username": "demo",
        "password": "demo123"
    }
    
    response = requests.post(f"{API_BASE}/auth/login", json=login_data)
    if response.status_code == 200:
        return response.json()['token']
    else:
        print(f"Login failed: {response.status_code}")
        return None

def test_device_statistics(token, device_id):
    """Test device statistics endpoint"""
    print(f"\n=== Testing Device Statistics for {device_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/statistics?hours=24", headers=headers)
    if response.status_code == 200:
        stats = response.json()
        print("✓ Device statistics retrieved successfully")
        
        if 'statistics' in stats:
            print(f"  Total data points: {stats['total_data_points']}")
            print(f"  Data types: {', '.join(stats['data_types'])}")
            
            for data_type, stat in stats['statistics'].items():
                print(f"  {data_type}:")
                print(f"    Mean: {stat['mean']:.2f} {stat['unit']}")
                print(f"    Min/Max: {stat['min']:.2f} / {stat['max']:.2f} {stat['unit']}")
                print(f"    Latest: {stat['latest']:.2f} {stat['unit']}")
        else:
            print(f"  No statistics available: {stats}")
    else:
        print(f"✗ Failed to get device statistics: {response.status_code}")

def test_aggregated_data(token, device_id):
    """Test aggregated data endpoint"""
    print(f"\n=== Testing Aggregated Data for {device_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/aggregated?data_type=temperature&interval=1H&hours=24", headers=headers)
    if response.status_code == 200:
        data = response.json()
        print("✓ Aggregated data retrieved successfully")
        print(f"  Data points: {len(data['data'])}")
        
        if data['data']:
            latest = data['data'][-1]
            print(f"  Latest aggregated data:")
            print(f"    Timestamp: {latest['timestamp']}")
            print(f"    Mean: {latest['mean']:.2f}")
            print(f"    Min/Max: {latest['min']:.2f} / {latest['max']:.2f}")
            print(f"    Count: {latest['count']}")
    else:
        print(f"✗ Failed to get aggregated data: {response.status_code}")

def test_anomaly_detection(token, device_id):
    """Test anomaly detection endpoint"""
    print(f"\n=== Testing Anomaly Detection for {device_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/anomalies?data_type=temperature&hours=24", headers=headers)
    if response.status_code == 200:
        anomalies = response.json()
        print("✓ Anomaly detection completed successfully")
        print(f"  Anomalies detected: {anomalies['count']}")
        
        if anomalies['anomalies']:
            print("  Recent anomalies:")
            for anomaly in anomalies['anomalies'][:3]:  # Show first 3
                print(f"    {anomaly['timestamp']}: {anomaly['value']:.2f} (severity: {anomaly['severity']})")
    else:
        print(f"✗ Failed to detect anomalies: {response.status_code}")

def test_device_health(token, device_id):
    """Test device health endpoint"""
    print(f"\n=== Testing Device Health for {device_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/devices/{device_id}/health?hours=24", headers=headers)
    if response.status_code == 200:
        health = response.json()
        print("✓ Device health calculated successfully")
        
        if 'health_score' in health:
            print(f"  Health Score: {health['health_score']}/100 ({health['status']})")
            print(f"  Data Availability: {health['data_availability']:.1f}%")
            
            if health['issues']:
                print("  Issues:")
                for issue in health['issues']:
                    print(f"    - {issue}")
            else:
                print("  No issues detected")
        else:
            print(f"  Health calculation failed: {health}")
    else:
        print(f"✗ Failed to get device health: {response.status_code}")

def test_system_overview(token):
    """Test system overview endpoint"""
    print("\n=== Testing System Overview ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/system/overview?hours=24", headers=headers)
    if response.status_code == 200:
        overview = response.json()
        print("✓ System overview retrieved successfully")
        
        if 'system_health' in overview:
            health = overview['system_health']
            print(f"  System Health Score: {health['average_health_score']:.1f}/100")
            print(f"  Total Devices: {health['total_devices']}")
            print(f"  Online/Offline: {health['online_devices']}/{health['offline_devices']}")
            print(f"  Uptime: {health['uptime_percentage']:.1f}%")
            
            data = overview['data_metrics']
            print(f"  Total Data Points: {data['total_data_points']}")
            print(f"  Data Points/Hour: {data['data_points_per_hour']:.1f}")
            
            print("  Device Types:")
            for device_type, info in overview['device_types'].items():
                print(f"    {device_type}: {info['online']}/{info['count']} online")
        else:
            print(f"  System overview failed: {overview}")
    else:
        print(f"✗ Failed to get system overview: {response.status_code}")

def test_dashboard_summary(token):
    """Test dashboard summary endpoint"""
    print("\n=== Testing Dashboard Summary ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/dashboard/summary?hours=24", headers=headers)
    if response.status_code == 200:
        summary = response.json()
        print("✓ Dashboard summary retrieved successfully")
        
        if 'alerts' in summary:
            alerts = summary['alerts']
            print(f"  Critical Devices: {alerts['critical_devices']}")
            print(f"  Total Anomalies: {alerts['total_anomalies']}")
            print(f"  Offline Devices: {alerts['offline_devices']}")
            
            if summary['recent_anomalies']:
                print("  Recent Anomalies:")
                for anomaly in summary['recent_anomalies'][:3]:
                    print(f"    {anomaly['device_name']}: {anomaly['value']:.2f} at {anomaly['timestamp']}")
        else:
            print(f"  Dashboard summary failed: {summary}")
    else:
        print(f"✗ Failed to get dashboard summary: {response.status_code}")

def test_device_report(token, device_id):
    """Test device report generation"""
    print(f"\n=== Testing Device Report for {device_id} ===")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(f"{API_BASE}/analytics/reports/device/{device_id}?hours=168", headers=headers)
    if response.status_code == 200:
        report = response.json()
        print("✓ Device report generated successfully")
        
        if 'summary' in report:
            summary = report['summary']
            print(f"  Report Summary:")
            print(f"    Data Points: {summary['total_data_points']}")
            print(f"    Data Types: {summary['data_types_count']}")
            print(f"    Health Score: {summary['health_score']:.1f}/100")
            print(f"    Anomalies: {summary['total_anomalies']}")
            print(f"    Issues: {summary['issues_count']}")
        else:
            print(f"  Report generation failed: {report}")
    else:
        print(f"✗ Failed to generate device report: {response.status_code}")

def main():
    """Main test function"""
    print("IoT Platform Analytics and Data Visualization Test\n")
    
    try:
        # Get authentication token
        token = get_auth_token()
        if not token:
            print("Cannot continue tests without valid token")
            return
        
        # Get available devices
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{API_BASE}/devices", headers=headers)
        
        if response.status_code == 200:
            devices = response.json()
            if devices:
                # Test with the first device
                test_device = devices[0]
                device_id = test_device['device_id']
                
                print(f"Testing analytics with device: {test_device['name']} ({device_id})")
                
                # Run all analytics tests
                test_device_statistics(token, device_id)
                test_aggregated_data(token, device_id)
                test_anomaly_detection(token, device_id)
                test_device_health(token, device_id)
                test_system_overview(token)
                test_dashboard_summary(token)
                test_device_report(token, device_id)
                
            else:
                print("No devices found for testing")
        else:
            print(f"Failed to get devices: {response.status_code}")
        
        print("\n=== Analytics Test Complete ===")
        print("Analytics features tested:")
        print("- Device statistics and aggregation")
        print("- Anomaly detection using statistical methods")
        print("- Device health scoring")
        print("- System-wide overview and monitoring")
        print("- Dashboard summary with alerts")
        print("- Comprehensive device reporting")
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the API. Make sure the Flask app is running.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()

