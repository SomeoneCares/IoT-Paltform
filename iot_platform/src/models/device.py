from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from src.models.user import db

class Device(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(100), nullable=False)
    device_type = db.Column(db.String(50), nullable=False)  # sensor, actuator, gateway
    location = db.Column(db.String(100), nullable=True)  # Legacy field, kept for backward compatibility
    status = db.Column(db.String(20), default='offline')  # online, offline, error
    last_seen = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('room.id'), nullable=True)  # New field for room association
    
    # Device-specific configuration stored as JSON
    config = db.Column(db.Text, nullable=True)
    
    # Matter Protocol Support
    matter_vendor_id = db.Column(db.String(20), nullable=True)  # Matter Vendor ID
    matter_product_id = db.Column(db.String(20), nullable=True)  # Matter Product ID
    matter_device_type_id = db.Column(db.String(20), nullable=True)  # Matter Device Type ID
    matter_fabric_id = db.Column(db.String(50), nullable=True)  # Matter Fabric ID
    matter_node_id = db.Column(db.String(50), nullable=True)  # Matter Node ID
    matter_certificate = db.Column(db.Text, nullable=True)  # Matter device certificate
    matter_commissioned = db.Column(db.Boolean, default=False)  # Commissioning status
    matter_commissioning_date = db.Column(db.DateTime, nullable=True)  # When device was commissioned
    
    # Thread Protocol Support
    thread_enabled = db.Column(db.Boolean, default=False)  # Thread support enabled
    thread_network_name = db.Column(db.String(100), nullable=True)  # Thread network name
    thread_network_key = db.Column(db.String(100), nullable=True)  # Thread network key (encrypted)
    thread_extended_pan_id = db.Column(db.String(50), nullable=True)  # Thread Extended PAN ID
    thread_channel = db.Column(db.Integer, nullable=True)  # Thread channel (11-26)
    thread_mesh_local_prefix = db.Column(db.String(50), nullable=True)  # Thread mesh local prefix
    thread_border_router = db.Column(db.Boolean, default=False)  # Is this device a Thread border router
    thread_router_role = db.Column(db.String(20), nullable=True)  # Thread router role (leader, router, child)
    thread_parent_address = db.Column(db.String(50), nullable=True)  # Thread parent address
    thread_network_id = db.Column(db.Integer, db.ForeignKey('thread_network.id'), nullable=True)  # Link to Thread network
    
    def __repr__(self):
        return f'<Device {self.name} ({self.device_id})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'name': self.name,
            'device_type': self.device_type,
            'location': self.location,  # Legacy field
            'status': self.status,
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'user_id': self.user_id,
            'room_id': self.room_id,
            'room': self.room.to_dict() if self.room else None,
            'config': self.config,
            # Matter Protocol fields
            'matter_vendor_id': self.matter_vendor_id,
            'matter_product_id': self.matter_product_id,
            'matter_device_type_id': self.matter_device_type_id,
            'matter_fabric_id': self.matter_fabric_id,
            'matter_node_id': self.matter_node_id,
            'matter_commissioned': self.matter_commissioned,
            'matter_commissioning_date': self.matter_commissioning_date.isoformat() if self.matter_commissioning_date else None,
            # Thread Protocol fields
            'thread_enabled': self.thread_enabled,
            'thread_network_name': self.thread_network_name,
            'thread_extended_pan_id': self.thread_extended_pan_id,
            'thread_channel': self.thread_channel,
            'thread_mesh_local_prefix': self.thread_mesh_local_prefix,
            'thread_border_router': self.thread_border_router,
            'thread_router_role': self.thread_router_role,
            'thread_parent_address': self.thread_parent_address
        }

class DeviceData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.String(100), db.ForeignKey('device.device_id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_type = db.Column(db.String(50), nullable=False)  # temperature, humidity, switch_state, etc.
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20), nullable=True)
    
    def __repr__(self):
        return f'<DeviceData {self.device_id}: {self.data_type}={self.value}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'device_id': self.device_id,
            'timestamp': self.timestamp.isoformat(),
            'data_type': self.data_type,
            'value': self.value,
            'unit': self.unit
        }

class ThreadNetwork(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    network_name = db.Column(db.String(100), nullable=False)  # Thread network name
    network_key = db.Column(db.String(100), nullable=True)  # Thread network key (encrypted)
    extended_pan_id = db.Column(db.String(50), nullable=False)  # Thread Extended PAN ID
    channel = db.Column(db.Integer, nullable=False)  # Thread channel (11-26)
    mesh_local_prefix = db.Column(db.String(50), nullable=True)  # Thread mesh local prefix
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    # Relationships
    user = db.relationship('User', backref='thread_networks', lazy=True)
    devices = db.relationship('Device', backref='thread_network', lazy=True)
    
    def __repr__(self):
        return f'<ThreadNetwork {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'network_name': self.network_name,
            'extended_pan_id': self.extended_pan_id,
            'channel': self.channel,
            'mesh_local_prefix': self.mesh_local_prefix,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'devices_count': len(self.devices)
        }

class AutomationRule(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    trigger_device_id = db.Column(db.String(100), nullable=False)
    trigger_condition = db.Column(db.Text, nullable=False)  # JSON condition
    action_device_id = db.Column(db.String(100), nullable=False)
    action_command = db.Column(db.Text, nullable=False)  # JSON command
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    def __repr__(self):
        return f'<AutomationRule {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'trigger_device_id': self.trigger_device_id,
            'trigger_condition': self.trigger_condition,
            'action_device_id': self.action_device_id,
            'action_command': self.action_command,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'user_id': self.user_id
        }

