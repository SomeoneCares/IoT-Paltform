from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.device import Device, ThreadNetwork
from src.routes.auth import token_required, permission_required
from datetime import datetime
import json
import secrets
import hashlib

matter_thread_bp = Blueprint('matter_thread', __name__)

# Thread Network Management Routes

@matter_thread_bp.route('/thread/networks', methods=['GET'])
@token_required
def get_thread_networks(current_user):
    """Get all Thread networks for the current user"""
    networks = ThreadNetwork.query.filter_by(user_id=current_user.id).all()
    return jsonify([network.to_dict() for network in networks])

@matter_thread_bp.route('/thread/networks', methods=['POST'])
@token_required
def create_thread_network(current_user):
    """Create a new Thread network"""
    data = request.get_json()
    
    # Generate unique Extended PAN ID if not provided
    if not data.get('extended_pan_id'):
        data['extended_pan_id'] = secrets.token_hex(8).upper()
    
    # Generate network key if not provided
    if not data.get('network_key'):
        data['network_key'] = secrets.token_hex(16)
    
    network = ThreadNetwork(
        name=data['name'],
        network_name=data['network_name'],
        network_key=data['network_key'],
        extended_pan_id=data['extended_pan_id'],
        channel=data.get('channel', 15),  # Default to channel 15
        mesh_local_prefix=data.get('mesh_local_prefix'),
        user_id=current_user.id
    )
    
    db.session.add(network)
    db.session.commit()
    
    return jsonify(network.to_dict()), 201

@matter_thread_bp.route('/thread/networks/<int:network_id>', methods=['GET'])
@token_required
def get_thread_network(current_user, network_id):
    """Get a specific Thread network"""
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    return jsonify(network.to_dict())

@matter_thread_bp.route('/thread/networks/<int:network_id>', methods=['PUT'])
@token_required
def update_thread_network(current_user, network_id):
    """Update a Thread network"""
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    data = request.get_json()
    network.name = data.get('name', network.name)
    network.network_name = data.get('network_name', network.network_name)
    network.channel = data.get('channel', network.channel)
    network.mesh_local_prefix = data.get('mesh_local_prefix', network.mesh_local_prefix)
    network.is_active = data.get('is_active', network.is_active)
    network.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(network.to_dict())

@matter_thread_bp.route('/thread/networks/<int:network_id>', methods=['DELETE'])
@token_required
def delete_thread_network(current_user, network_id):
    """Delete a Thread network"""
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    # Check if any devices are using this network
    devices_using_network = Device.query.filter_by(thread_network_id=network_id).count()
    if devices_using_network > 0:
        return jsonify({'error': f'Cannot delete network. {devices_using_network} devices are still using this network.'}), 400
    
    db.session.delete(network)
    db.session.commit()
    return jsonify({'message': 'Thread network deleted successfully'})

@matter_thread_bp.route('/thread/networks/<int:network_id>/devices', methods=['GET'])
@token_required
def get_thread_network_devices(current_user, network_id):
    """Get all devices in a Thread network"""
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    devices = Device.query.filter_by(thread_network_id=network_id).all()
    return jsonify([device.to_dict() for device in devices])

# Matter Device Management Routes

@matter_thread_bp.route('/matter/devices/<device_id>/commission', methods=['POST'])
@token_required
def commission_matter_device(current_user, device_id):
    """Commission a Matter device"""
    device = Device.query.filter_by(device_id=device_id, user_id=current_user.id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    data = request.get_json()
    
    # Update Matter-specific fields
    device.matter_vendor_id = data.get('vendor_id')
    device.matter_product_id = data.get('product_id')
    device.matter_device_type_id = data.get('device_type_id')
    device.matter_fabric_id = data.get('fabric_id')
    device.matter_node_id = data.get('node_id')
    device.matter_certificate = data.get('certificate')
    device.matter_commissioned = True
    device.matter_commissioning_date = datetime.utcnow()
    
    db.session.commit()
    return jsonify(device.to_dict())

@matter_thread_bp.route('/matter/devices/<device_id>/decommission', methods=['POST'])
@token_required
def decommission_matter_device(current_user, device_id):
    """Decommission a Matter device"""
    device = Device.query.filter_by(device_id=device_id, user_id=current_user.id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Clear Matter-specific fields
    device.matter_vendor_id = None
    device.matter_product_id = None
    device.matter_device_type_id = None
    device.matter_fabric_id = None
    device.matter_node_id = None
    device.matter_certificate = None
    device.matter_commissioned = False
    device.matter_commissioning_date = None
    
    db.session.commit()
    return jsonify(device.to_dict())

@matter_thread_bp.route('/matter/devices', methods=['GET'])
@token_required
def get_matter_devices(current_user):
    """Get all Matter-commissioned devices for the current user"""
    devices = Device.query.filter_by(user_id=current_user.id, matter_commissioned=True).all()
    return jsonify([device.to_dict() for device in devices])

# Thread Device Management Routes

@matter_thread_bp.route('/thread/devices/<device_id>/join', methods=['POST'])
@token_required
def join_thread_network(current_user, device_id):
    """Join a device to a Thread network"""
    device = Device.query.filter_by(device_id=device_id, user_id=current_user.id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    data = request.get_json()
    network_id = data.get('network_id')
    
    if not network_id:
        return jsonify({'error': 'Network ID is required'}), 400
    
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    # Update device Thread configuration
    device.thread_enabled = True
    device.thread_network_id = network_id
    device.thread_network_name = network.network_name
    device.thread_network_key = network.network_key
    device.thread_extended_pan_id = network.extended_pan_id
    device.thread_channel = network.channel
    device.thread_mesh_local_prefix = network.mesh_local_prefix
    device.thread_border_router = data.get('border_router', False)
    device.thread_router_role = data.get('router_role', 'child')
    device.thread_parent_address = data.get('parent_address')
    
    db.session.commit()
    return jsonify(device.to_dict())

@matter_thread_bp.route('/thread/devices/<device_id>/leave', methods=['POST'])
@token_required
def leave_thread_network(current_user, device_id):
    """Remove a device from a Thread network"""
    device = Device.query.filter_by(device_id=device_id, user_id=current_user.id).first()
    if not device:
        return jsonify({'error': 'Device not found'}), 404
    
    # Clear Thread configuration
    device.thread_enabled = False
    device.thread_network_id = None
    device.thread_network_name = None
    device.thread_network_key = None
    device.thread_extended_pan_id = None
    device.thread_channel = None
    device.thread_mesh_local_prefix = None
    device.thread_border_router = False
    device.thread_router_role = None
    device.thread_parent_address = None
    
    db.session.commit()
    return jsonify(device.to_dict())

@matter_thread_bp.route('/thread/devices', methods=['GET'])
@token_required
def get_thread_devices(current_user):
    """Get all Thread-enabled devices for the current user"""
    devices = Device.query.filter_by(user_id=current_user.id, thread_enabled=True).all()
    return jsonify([device.to_dict() for device in devices])

# Thread Network Diagnostics

@matter_thread_bp.route('/thread/networks/<int:network_id>/diagnostics', methods=['GET'])
@token_required
def get_thread_network_diagnostics(current_user, network_id):
    """Get Thread network diagnostics and topology"""
    network = ThreadNetwork.query.filter_by(id=network_id, user_id=current_user.id).first()
    if not network:
        return jsonify({'error': 'Thread network not found'}), 404
    
    devices = Device.query.filter_by(thread_network_id=network_id).all()
    
    # Build network topology
    border_routers = [d for d in devices if d.thread_border_router]
    routers = [d for d in devices if d.thread_router_role == 'router']
    children = [d for d in devices if d.thread_router_role == 'child']
    
    diagnostics = {
        'network': network.to_dict(),
        'topology': {
            'border_routers': len(border_routers),
            'routers': len(routers),
            'children': len(children),
            'total_devices': len(devices)
        },
        'devices': [device.to_dict() for device in devices],
        'network_health': {
            'has_border_router': len(border_routers) > 0,
            'routing_capacity': len(routers),
            'device_distribution': {
                'border_routers': [{'name': d.name, 'device_id': d.device_id} for d in border_routers],
                'routers': [{'name': d.name, 'device_id': d.device_id} for d in routers],
                'children': [{'name': d.name, 'device_id': d.device_id} for d in children]
            }
        }
    }
    
    return jsonify(diagnostics)

# Matter Device Types and Vendor Information

@matter_thread_bp.route('/matter/device-types', methods=['GET'])
def get_matter_device_types():
    """Get supported Matter device types"""
    device_types = {
        'on_off_light': {'id': '0x0100', 'name': 'On/Off Light'},
        'dimmable_light': {'id': '0x0101', 'name': 'Dimmable Light'},
        'color_temperature_light': {'id': '0x010C', 'name': 'Color Temperature Light'},
        'extended_color_light': {'id': '0x010D', 'name': 'Extended Color Light'},
        'on_off_light_switch': {'id': '0x0103', 'name': 'On/Off Light Switch'},
        'dimmer_switch': {'id': '0x0104', 'name': 'Dimmer Switch'},
        'color_dimmer_switch': {'id': '0x0105', 'name': 'Color Dimmer Switch'},
        'on_off_plug_in_unit': {'id': '0x010A', 'name': 'On/Off Plug-in Unit'},
        'dimmable_plug_in_unit': {'id': '0x010B', 'name': 'Dimmable Plug-in Unit'},
        'door_lock': {'id': '0x000A', 'name': 'Door Lock'},
        'window_covering': {'id': '0x0202', 'name': 'Window Covering'},
        'thermostat': {'id': '0x0301', 'name': 'Thermostat'},
        'fan': {'id': '0x002B', 'name': 'Fan'},
        'air_quality_sensor': {'id': '0x002C', 'name': 'Air Quality Sensor'},
        'contact_sensor': {'id': '0x0015', 'name': 'Contact Sensor'},
        'motion_sensor': {'id': '0x002D', 'name': 'Motion Sensor'},
        'temperature_sensor': {'id': '0x0302', 'name': 'Temperature Sensor'},
        'humidity_sensor': {'id': '0x0307', 'name': 'Humidity Sensor'},
        'light_sensor': {'id': '0x0106', 'name': 'Light Sensor'},
        'pressure_sensor': {'id': '0x0305', 'name': 'Pressure Sensor'},
        'flow_sensor': {'id': '0x0306', 'name': 'Flow Sensor'},
        'occupancy_sensor': {'id': '0x0107', 'name': 'Occupancy Sensor'},
        'smoke_co_alarm': {'id': '0x0028', 'name': 'Smoke/CO Alarm'},
        'security_system': {'id': '0x0015', 'name': 'Security System'},
        'garage_door_controller': {'id': '0x0200', 'name': 'Garage Door Controller'},
        'speaker': {'id': '0x0022', 'name': 'Speaker'},
        'tv': {'id': '0x0023', 'name': 'TV'},
        'refrigerator': {'id': '0x0024', 'name': 'Refrigerator'},
        'dishwasher': {'id': '0x0025', 'name': 'Dishwasher'},
        'washing_machine': {'id': '0x0026', 'name': 'Washing Machine'},
        'dryer': {'id': '0x0027', 'name': 'Dryer'},
        'oven': {'id': '0x0028', 'name': 'Oven'},
        'microwave_oven': {'id': '0x0029', 'name': 'Microwave Oven'},
        'coffee_maker': {'id': '0x002A', 'name': 'Coffee Maker'},
        'robot_vacuum_cleaner': {'id': '0x002B', 'name': 'Robot Vacuum Cleaner'},
        'air_purifier': {'id': '0x002C', 'name': 'Air Purifier'},
        'water_heater': {'id': '0x002D', 'name': 'Water Heater'},
        'water_leak_detector': {'id': '0x002E', 'name': 'Water Leak Detector'},
        'valve': {'id': '0x002F', 'name': 'Valve'},
        'pump': {'id': '0x0030', 'name': 'Pump'},
        'irrigation_controller': {'id': '0x0031', 'name': 'Irrigation Controller'},
        'pool_controller': {'id': '0x0032', 'name': 'Pool Controller'},
        'sprinkler_controller': {'id': '0x0033', 'name': 'Sprinkler Controller'},
        'bridge': {'id': '0x000E', 'name': 'Bridge'},
        'range_extender': {'id': '0x000F', 'name': 'Range Extender'}
    }
    
    return jsonify(device_types)

@matter_thread_bp.route('/matter/vendors', methods=['GET'])
def get_matter_vendors():
    """Get common Matter vendor IDs"""
    vendors = {
        'apple': {'id': '0x001D', 'name': 'Apple Inc.'},
        'google': {'id': '0x6006', 'name': 'Google LLC'},
        'amazon': {'id': '0x131D', 'name': 'Amazon.com Services LLC'},
        'samsung': {'id': '0x1349', 'name': 'Samsung Electronics Co., Ltd.'},
        'philips': {'id': '0x100B', 'name': 'Philips Lighting B.V.'},
        'schlage': {'id': '0x110A', 'name': 'Schlage (Allegion)'},
        'yale': {'id': '0x1111', 'name': 'Yale Security Inc.'},
        'august': {'id': '0x1112', 'name': 'August Home, Inc.'},
        'nest': {'id': '0x1113', 'name': 'Nest Labs Inc.'},
        'honeywell': {'id': '0x1114', 'name': 'Honeywell International Inc.'},
        'ecobee': {'id': '0x1115', 'name': 'ecobee Inc.'},
        'lifx': {'id': '0x1116', 'name': 'LIFX (Buddy Technologies)'},
        'nanoleaf': {'id': '0x1117', 'name': 'Nanoleaf'},
        'ikea': {'id': '0x1118', 'name': 'IKEA of Sweden AB'},
        'signify': {'id': '0x1119', 'name': 'Signify Netherlands B.V.'},
        'lutron': {'id': '0x111A', 'name': 'Lutron Electronics Co., Inc.'},
        'leviton': {'id': '0x111B', 'name': 'Leviton Manufacturing Co., Inc.'},
        'legrand': {'id': '0x111C', 'name': 'Legrand'},
        'somfy': {'id': '0x111D', 'name': 'Somfy'},
        'zwave': {'id': '0x111E', 'name': 'Z-Wave Alliance'},
        'zigbee': {'id': '0x111F', 'name': 'Zigbee Alliance'},
        'silicon_labs': {'id': '0x1120', 'name': 'Silicon Labs'},
        'nordic_semiconductor': {'id': '0x1121', 'name': 'Nordic Semiconductor ASA'},
        'espressif': {'id': '0x1122', 'name': 'Espressif Systems'},
        'raspberry_pi': {'id': '0x1123', 'name': 'Raspberry Pi Foundation'},
        'arduino': {'id': '0x1124', 'name': 'Arduino LLC'},
        'particle': {'id': '0x1125', 'name': 'Particle Industries, Inc.'},
        'adafruit': {'id': '0x1126', 'name': 'Adafruit Industries'},
        'sparkfun': {'id': '0x1127', 'name': 'SparkFun Electronics'},
        'seeed': {'id': '0x1128', 'name': 'Seeed Technology Co., Ltd.'}
    }
    
    return jsonify(vendors)
