import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from src.models.user import db
from src.models.device import Device, DeviceData
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Service for advanced analytics and data processing of IoT device data
    """
    
    def __init__(self):
        pass
    
    def get_device_statistics(self, device_id: str, hours: int = 24) -> Dict[str, Any]:
        """Get statistical summary for a device"""
        try:
            # Get data for the specified time period
            since_time = datetime.utcnow() - timedelta(hours=hours)
            data_points = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.timestamp >= since_time
            ).all()
            
            if not data_points:
                return {"error": "No data available"}
            
            # Convert to DataFrame for analysis
            df = pd.DataFrame([{
                'timestamp': dp.timestamp,
                'data_type': dp.data_type,
                'value': dp.value,
                'unit': dp.unit
            } for dp in data_points])
            
            # Group by data type and calculate statistics
            stats = {}
            for data_type in df['data_type'].unique():
                type_data = df[df['data_type'] == data_type]['value']
                
                stats[data_type] = {
                    'count': len(type_data),
                    'mean': float(type_data.mean()),
                    'median': float(type_data.median()),
                    'std': float(type_data.std()) if len(type_data) > 1 else 0,
                    'min': float(type_data.min()),
                    'max': float(type_data.max()),
                    'latest': float(type_data.iloc[-1]) if len(type_data) > 0 else None,
                    'unit': df[df['data_type'] == data_type]['unit'].iloc[0]
                }
            
            return {
                'device_id': device_id,
                'time_period_hours': hours,
                'total_data_points': len(data_points),
                'data_types': list(df['data_type'].unique()),
                'statistics': stats,
                'time_range': {
                    'start': df['timestamp'].min().isoformat(),
                    'end': df['timestamp'].max().isoformat()
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating device statistics: {e}")
            return {"error": str(e)}
    
    def get_aggregated_data(self, device_id: str, data_type: str, 
                          interval: str = '1H', hours: int = 24) -> List[Dict[str, Any]]:
        """Get aggregated data for visualization"""
        try:
            # Get data for the specified time period
            since_time = datetime.utcnow() - timedelta(hours=hours)
            data_points = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.data_type == data_type,
                DeviceData.timestamp >= since_time
            ).order_by(DeviceData.timestamp).all()
            
            if not data_points:
                return []
            
            # Convert to DataFrame
            df = pd.DataFrame([{
                'timestamp': dp.timestamp,
                'value': dp.value
            } for dp in data_points])
            
            # Set timestamp as index for resampling
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
            
            # Resample data based on interval
            if interval == '1H':
                resampled = df.resample('1H').agg({
                    'value': ['mean', 'min', 'max', 'count']
                }).round(2)
            elif interval == '15T':
                resampled = df.resample('15T').agg({
                    'value': ['mean', 'min', 'max', 'count']
                }).round(2)
            elif interval == '5T':
                resampled = df.resample('5T').agg({
                    'value': ['mean', 'min', 'max', 'count']
                }).round(2)
            else:
                # Default to hourly
                resampled = df.resample('1H').agg({
                    'value': ['mean', 'min', 'max', 'count']
                }).round(2)
            
            # Convert back to list of dictionaries
            result = []
            for timestamp, row in resampled.iterrows():
                if row[('value', 'count')] > 0:  # Only include periods with data
                    result.append({
                        'timestamp': timestamp.isoformat(),
                        'mean': float(row[('value', 'mean')]),
                        'min': float(row[('value', 'min')]),
                        'max': float(row[('value', 'max')]),
                        'count': int(row[('value', 'count')])
                    })
            
            return result
            
        except Exception as e:
            logger.error(f"Error aggregating data: {e}")
            return []
    
    def detect_anomalies(self, device_id: str, data_type: str, 
                        hours: int = 24, threshold: float = 2.0) -> List[Dict[str, Any]]:
        """Detect anomalies in device data using statistical methods"""
        try:
            # Get data for analysis
            since_time = datetime.utcnow() - timedelta(hours=hours)
            data_points = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.data_type == data_type,
                DeviceData.timestamp >= since_time
            ).order_by(DeviceData.timestamp).all()
            
            if len(data_points) < 10:  # Need minimum data for anomaly detection
                return []
            
            # Convert to DataFrame
            df = pd.DataFrame([{
                'timestamp': dp.timestamp,
                'value': dp.value
            } for dp in data_points])
            
            # Calculate rolling statistics
            df['rolling_mean'] = df['value'].rolling(window=10, center=True).mean()
            df['rolling_std'] = df['value'].rolling(window=10, center=True).std()
            
            # Detect anomalies using z-score
            df['z_score'] = np.abs((df['value'] - df['rolling_mean']) / df['rolling_std'])
            anomalies = df[df['z_score'] > threshold].copy()
            
            # Convert to list of dictionaries
            result = []
            for _, row in anomalies.iterrows():
                result.append({
                    'timestamp': row['timestamp'].isoformat(),
                    'value': float(row['value']),
                    'expected_value': float(row['rolling_mean']) if not pd.isna(row['rolling_mean']) else None,
                    'z_score': float(row['z_score']) if not pd.isna(row['z_score']) else None,
                    'severity': 'high' if row['z_score'] > threshold * 1.5 else 'medium'
                })
            
            return result
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    def get_device_health_score(self, device_id: str, hours: int = 24) -> Dict[str, Any]:
        """Calculate a health score for a device based on various metrics"""
        try:
            device = Device.query.filter_by(device_id=device_id).first()
            if not device:
                return {"error": "Device not found"}
            
            # Get recent data
            since_time = datetime.utcnow() - timedelta(hours=hours)
            data_points = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.timestamp >= since_time
            ).all()
            
            # Calculate health metrics
            health_score = 100  # Start with perfect score
            issues = []
            
            # Check data availability (30% of score)
            expected_data_points = hours * 12  # Assuming data every 5 minutes
            actual_data_points = len(data_points)
            data_availability = min(actual_data_points / expected_data_points, 1.0) * 100
            
            if data_availability < 80:
                health_score -= (100 - data_availability) * 0.3
                issues.append(f"Low data availability: {data_availability:.1f}%")
            
            # Check device status (20% of score)
            if device.status != 'online':
                health_score -= 20
                issues.append(f"Device status: {device.status}")
            
            # Check last seen time (20% of score)
            if device.last_seen:
                time_since_last_seen = (datetime.utcnow() - device.last_seen).total_seconds() / 3600
                if time_since_last_seen > 1:  # More than 1 hour
                    health_score -= min(time_since_last_seen * 5, 20)
                    issues.append(f"Last seen {time_since_last_seen:.1f} hours ago")
            
            # Check for anomalies (30% of score)
            if data_points:
                df = pd.DataFrame([{'value': dp.value, 'data_type': dp.data_type} for dp in data_points])
                for data_type in df['data_type'].unique():
                    anomalies = self.detect_anomalies(device_id, data_type, hours=hours)
                    if anomalies:
                        anomaly_penalty = min(len(anomalies) * 2, 30)
                        health_score -= anomaly_penalty
                        issues.append(f"{len(anomalies)} anomalies detected in {data_type}")
            
            # Ensure score doesn't go below 0
            health_score = max(health_score, 0)
            
            # Determine health status
            if health_score >= 90:
                status = "excellent"
            elif health_score >= 75:
                status = "good"
            elif health_score >= 50:
                status = "fair"
            elif health_score >= 25:
                status = "poor"
            else:
                status = "critical"
            
            return {
                'device_id': device_id,
                'health_score': round(health_score, 1),
                'status': status,
                'data_availability': round(data_availability, 1),
                'issues': issues,
                'metrics': {
                    'total_data_points': actual_data_points,
                    'expected_data_points': expected_data_points,
                    'device_status': device.status,
                    'last_seen': device.last_seen.isoformat() if device.last_seen else None
                }
            }
            
        except Exception as e:
            logger.error(f"Error calculating device health score: {e}")
            return {"error": str(e)}
    
    def get_system_overview(self, hours: int = 24) -> Dict[str, Any]:
        """Get system-wide analytics overview"""
        try:
            # Get all devices
            devices = Device.query.all()
            
            # Calculate system metrics
            total_devices = len(devices)
            online_devices = len([d for d in devices if d.status == 'online'])
            offline_devices = total_devices - online_devices
            
            # Get total data points
            since_time = datetime.utcnow() - timedelta(hours=hours)
            total_data_points = DeviceData.query.filter(
                DeviceData.timestamp >= since_time
            ).count()
            
            # Calculate average health scores
            health_scores = []
            device_health = {}
            
            for device in devices:
                health = self.get_device_health_score(device.device_id, hours)
                if 'health_score' in health:
                    health_scores.append(health['health_score'])
                    device_health[device.device_id] = health
            
            avg_health_score = np.mean(health_scores) if health_scores else 0
            
            # Get data by device type
            device_types = {}
            for device in devices:
                device_type = device.device_type
                if device_type not in device_types:
                    device_types[device_type] = {'count': 0, 'online': 0}
                device_types[device_type]['count'] += 1
                if device.status == 'online':
                    device_types[device_type]['online'] += 1
            
            return {
                'system_health': {
                    'average_health_score': round(avg_health_score, 1),
                    'total_devices': total_devices,
                    'online_devices': online_devices,
                    'offline_devices': offline_devices,
                    'uptime_percentage': round((online_devices / total_devices * 100) if total_devices > 0 else 0, 1)
                },
                'data_metrics': {
                    'total_data_points': total_data_points,
                    'data_points_per_hour': round(total_data_points / hours, 1),
                    'time_period_hours': hours
                },
                'device_types': device_types,
                'device_health': device_health
            }
            
        except Exception as e:
            logger.error(f"Error getting system overview: {e}")
            return {"error": str(e)}

# Global analytics service instance
analytics_service = AnalyticsService()

