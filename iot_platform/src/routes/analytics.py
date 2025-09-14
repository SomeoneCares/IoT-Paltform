from flask import Blueprint, request, jsonify
from src.services.analytics_service import analytics_service
from src.routes.auth import token_required, permission_required

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/devices/<device_id>/statistics', methods=['GET'])
@token_required
def get_device_statistics(current_user, device_id):
    """Get statistical summary for a device"""
    try:
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Limit to 1 week
        
        stats = analytics_service.get_device_statistics(device_id, hours)
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get device statistics'}), 500

@analytics_bp.route('/devices/<device_id>/aggregated', methods=['GET'])
@token_required
def get_aggregated_data(current_user, device_id):
    """Get aggregated data for visualization"""
    try:
        data_type = request.args.get('data_type', 'temperature')
        interval = request.args.get('interval', '1H')  # 1H, 15T, 5T
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Limit to 1 week
        
        data = analytics_service.get_aggregated_data(device_id, data_type, interval, hours)
        return jsonify({
            'device_id': device_id,
            'data_type': data_type,
            'interval': interval,
            'hours': hours,
            'data': data
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get aggregated data'}), 500

@analytics_bp.route('/devices/<device_id>/anomalies', methods=['GET'])
@token_required
def get_anomalies(current_user, device_id):
    """Get detected anomalies for a device"""
    try:
        data_type = request.args.get('data_type', 'temperature')
        hours = request.args.get('hours', 24, type=int)
        threshold = request.args.get('threshold', 2.0, type=float)
        hours = min(hours, 168)  # Limit to 1 week
        
        anomalies = analytics_service.detect_anomalies(device_id, data_type, hours, threshold)
        return jsonify({
            'device_id': device_id,
            'data_type': data_type,
            'hours': hours,
            'threshold': threshold,
            'anomalies': anomalies,
            'count': len(anomalies)
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to detect anomalies'}), 500

@analytics_bp.route('/devices/<device_id>/health', methods=['GET'])
@token_required
def get_device_health(current_user, device_id):
    """Get device health score"""
    try:
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Limit to 1 week
        
        health = analytics_service.get_device_health_score(device_id, hours)
        return jsonify(health), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get device health'}), 500

@analytics_bp.route('/system/overview', methods=['GET'])
@token_required
def get_system_overview(current_user):
    """Get system-wide analytics overview"""
    try:
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Limit to 1 week
        
        overview = analytics_service.get_system_overview(hours)
        return jsonify(overview), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get system overview'}), 500

@analytics_bp.route('/dashboard/summary', methods=['GET'])
@token_required
def get_dashboard_summary(current_user):
    """Get summary data for dashboard"""
    try:
        hours = request.args.get('hours', 24, type=int)
        hours = min(hours, 168)  # Limit to 1 week
        
        # Get system overview
        overview = analytics_service.get_system_overview(hours)
        
        if 'error' in overview:
            return jsonify(overview), 500
        
        # Get recent anomalies across all devices
        from src.models.device import Device
        devices = Device.query.all()
        
        all_anomalies = []
        for device in devices[:5]:  # Limit to first 5 devices for performance
            try:
                anomalies = analytics_service.detect_anomalies(
                    device.device_id, 'temperature', hours=6, threshold=2.0
                )
                for anomaly in anomalies:
                    anomaly['device_id'] = device.device_id
                    anomaly['device_name'] = device.name
                all_anomalies.extend(anomalies)
            except:
                continue
        
        # Sort by timestamp and get most recent
        all_anomalies.sort(key=lambda x: x['timestamp'], reverse=True)
        recent_anomalies = all_anomalies[:10]
        
        return jsonify({
            'system_health': overview['system_health'],
            'data_metrics': overview['data_metrics'],
            'device_types': overview['device_types'],
            'recent_anomalies': recent_anomalies,
            'alerts': {
                'critical_devices': len([h for h in overview['device_health'].values() 
                                       if h.get('status') == 'critical']),
                'total_anomalies': len(recent_anomalies),
                'offline_devices': overview['system_health']['offline_devices']
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get dashboard summary'}), 500

@analytics_bp.route('/reports/device/<device_id>', methods=['GET'])
@token_required
def generate_device_report(current_user, device_id):
    """Generate comprehensive device report"""
    try:
        hours = request.args.get('hours', 168, type=int)  # Default to 1 week
        hours = min(hours, 720)  # Limit to 1 month
        
        from src.models.device import Device
        device = Device.query.filter_by(device_id=device_id).first()
        if not device:
            return jsonify({'error': 'Device not found'}), 404
        
        # Get comprehensive data
        statistics = analytics_service.get_device_statistics(device_id, hours)
        health = analytics_service.get_device_health_score(device_id, hours)
        
        # Get anomalies for different data types
        anomalies_by_type = {}
        if 'statistics' in statistics:
            for data_type in statistics['statistics'].keys():
                anomalies = analytics_service.detect_anomalies(device_id, data_type, hours)
                if anomalies:
                    anomalies_by_type[data_type] = anomalies
        
        report = {
            'device_info': {
                'device_id': device.device_id,
                'name': device.name,
                'type': device.device_type,
                'location': device.location,
                'status': device.status,
                'last_seen': device.last_seen.isoformat() if device.last_seen else None
            },
            'time_period': {
                'hours': hours,
                'start_time': statistics.get('time_range', {}).get('start'),
                'end_time': statistics.get('time_range', {}).get('end')
            },
            'statistics': statistics,
            'health': health,
            'anomalies': anomalies_by_type,
            'summary': {
                'total_data_points': statistics.get('total_data_points', 0),
                'data_types_count': len(statistics.get('data_types', [])),
                'health_score': health.get('health_score', 0),
                'total_anomalies': sum(len(a) for a in anomalies_by_type.values()),
                'issues_count': len(health.get('issues', []))
            }
        }
        
        return jsonify(report), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to generate device report'}), 500

