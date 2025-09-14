from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.device import Device, DeviceData, AutomationRule
from datetime import datetime, timedelta
import json

device_bp = Blueprint('device', __name__)

@device_bp.route('/devices', methods=['GET'])
def get_devices():
    """Get all devices for a user"""
    user_id = request.args.get('user_id', 1)  # Default to user 1 for demo
    room_id = request.args.get('room_id')  # Optional room filter
    
    query = Device.query.filter_by(user_id=user_id)
    if room_id:
        query = query.filter_by(room_id=room_id)
    
    devices = query.all()
    return jsonify([device.to_dict() for device in devices])

@device_bp.route('/devices', methods=['POST'])
def create_device():
    """Create a new device"""
    data = request.get_json()
    
    device = Device(
        device_id=data['device_id'],
        name=data['name'],
        device_type=data['device_type'],
        location=data.get('location'),  # Legacy field
        user_id=data.get('user_id', 1),  # Default to user 1 for demo
        room_id=data.get('room_id'),  # New room association
        config=json.dumps(data.get('config', {}))
    )
    
    db.session.add(device)
    db.session.commit()
    
    return jsonify(device.to_dict()), 201

@device_bp.route('/devices/<device_id>', methods=['GET'])
def get_device(device_id):
    """Get a specific device"""
    device = Device.query.filter_by(device_id=device_id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    return jsonify(device.to_dict())

@device_bp.route('/devices/<device_id>', methods=['PUT'])
def update_device(device_id):
    """Update a device"""
    device = Device.query.filter_by(device_id=device_id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    data = request.get_json()
    device.name = data.get('name', device.name)
    device.location = data.get('location', device.location)  # Legacy field
    device.room_id = data.get('room_id', device.room_id)  # New room association
    device.status = data.get('status', device.status)
    if 'config' in data:
        device.config = json.dumps(data['config'])
    
    db.session.commit()
    return jsonify(device.to_dict())

@device_bp.route('/devices/<device_id>', methods=['DELETE'])
def delete_device(device_id):
    """Delete a device"""
    device = Device.query.filter_by(device_id=device_id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    db.session.delete(device)
    db.session.commit()
    return jsonify({'message': 'Device deleted successfully'})

@device_bp.route('/rooms/<int:room_id>/devices', methods=['GET'])
def get_room_devices(room_id):
    """Get all devices in a specific room"""
    devices = Device.query.filter_by(room_id=room_id).all()
    return jsonify([device.to_dict() for device in devices])

@device_bp.route('/devices/<device_id>/data', methods=['POST'])
def add_device_data():
    """Add data from a device"""
    device_id = request.view_args['device_id']
    data = request.get_json()
    
    # Check if device exists
    device = Device.query.filter_by(device_id=device_id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Update device last_seen
    device.last_seen = datetime.utcnow()
    device.status = 'online'
    
    # Add device data
    device_data = DeviceData(
        device_id=device_id,
        data_type=data['data_type'],
        value=data['value'],
        unit=data.get('unit'),
        timestamp=datetime.fromisoformat(data['timestamp']) if 'timestamp' in data else datetime.utcnow()
    )
    
    db.session.add(device_data)
    db.session.commit()
    
    return jsonify(device_data.to_dict()), 201

@device_bp.route('/devices/<device_id>/data', methods=['GET'])
def get_device_data(device_id):
    """Get historical data for a device"""
    # Query parameters
    data_type = request.args.get('data_type')
    hours = int(request.args.get('hours', 24))  # Default to last 24 hours
    
    # Calculate time range
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(hours=hours)
    
    # Build query
    query = DeviceData.query.filter_by(device_id=device_id)
    if data_type:
        query = query.filter_by(data_type=data_type)
    query = query.filter(DeviceData.timestamp >= start_time)
    query = query.order_by(DeviceData.timestamp.desc())
    
    data = query.all()
    return jsonify([item.to_dict() for item in data])

@device_bp.route('/automation/rules', methods=['GET'])
def get_automation_rules():
    """Get all automation rules for a user"""
    user_id = request.args.get('user_id', 1)  # Default to user 1 for demo
    rules = AutomationRule.query.filter_by(user_id=user_id).all()
    return jsonify([rule.to_dict() for rule in rules])

@device_bp.route('/automation/rules', methods=['POST'])
def create_automation_rule():
    """Create a new automation rule"""
    data = request.get_json()
    
    rule = AutomationRule(
        name=data['name'],
        description=data.get('description'),
        trigger_device_id=data['trigger_device_id'],
        trigger_condition=json.dumps(data['trigger_condition']),
        action_device_id=data['action_device_id'],
        action_command=json.dumps(data['action_command']),
        user_id=data.get('user_id', 1)  # Default to user 1 for demo
    )
    
    db.session.add(rule)
    db.session.commit()
    
    return jsonify(rule.to_dict()), 201

@device_bp.route('/automation/rules/<int:rule_id>', methods=['PUT'])
def update_automation_rule(rule_id):
    """Update an automation rule"""
    rule = AutomationRule.query.get(rule_id)
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404
    
    data = request.get_json()
    rule.name = data.get('name', rule.name)
    rule.description = data.get('description', rule.description)
    rule.is_active = data.get('is_active', rule.is_active)
    
    if 'trigger_condition' in data:
        rule.trigger_condition = json.dumps(data['trigger_condition'])
    if 'action_command' in data:
        rule.action_command = json.dumps(data['action_command'])
    
    db.session.commit()
    return jsonify(rule.to_dict())

@device_bp.route('/automation/rules/<int:rule_id>', methods=['DELETE'])
def delete_automation_rule(rule_id):
    """Delete an automation rule"""
    rule = AutomationRule.query.get(rule_id)
    if not rule:
        return jsonify({'error': 'Rule not found'}), 404
    
    db.session.delete(rule)
    db.session.commit()
    return jsonify({'message': 'Rule deleted successfully'})

