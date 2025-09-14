import paho.mqtt.client as mqtt
import json
import threading
from datetime import datetime
from src.models.user import db
from src.models.device import Device, DeviceData
import logging

class MQTTService:
    def __init__(self, app, broker_host='localhost', broker_port=1883):
        self.app = app
        self.broker_host = broker_host
        self.broker_port = broker_port
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.is_connected = False
        
        # Setup logging
        logging.basicConfig(level=logging.INFO)
        self.logger = logging.getLogger(__name__)
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for when the client receives a CONNACK response from the server."""
        if rc == 0:
            self.is_connected = True
            self.logger.info("Connected to MQTT broker")
            # Subscribe to device topics
            client.subscribe("devices/+/data")  # Listen to all device data
            client.subscribe("devices/+/status")  # Listen to device status updates
            client.subscribe("gateway/+/data")  # Listen to gateway data
        else:
            self.logger.error(f"Failed to connect to MQTT broker, return code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback for when the client disconnects from the server."""
        self.is_connected = False
        self.logger.info("Disconnected from MQTT broker")
    
    def on_message(self, client, userdata, msg):
        """Callback for when a PUBLISH message is received from the server."""
        try:
            topic_parts = msg.topic.split('/')
            if len(topic_parts) >= 3:
                device_id = topic_parts[1]
                message_type = topic_parts[2]
                
                payload = json.loads(msg.payload.decode())
                
                with self.app.app_context():
                    if message_type == 'data':
                        self.handle_device_data(device_id, payload)
                    elif message_type == 'status':
                        self.handle_device_status(device_id, payload)
                        
        except Exception as e:
            self.logger.error(f"Error processing MQTT message: {e}")
    
    def handle_device_data(self, device_id, payload):
        """Handle incoming device data"""
        try:
            # Check if device exists, create if not
            device = Device.query.filter_by(device_id=device_id).first()
            if not device:
                # Auto-register device
                device = Device(
                    device_id=device_id,
                    name=f"Auto-registered {device_id}",
                    device_type=payload.get('device_type', 'sensor'),
                    user_id=1,  # Default to user 1 for demo
                    status='online'
                )
                db.session.add(device)
                db.session.commit()
                self.logger.info(f"Auto-registered device: {device_id}")
            
            # Update device last seen
            device.last_seen = datetime.utcnow()
            device.status = 'online'
            
            # Store device data
            for data_type, value in payload.get('data', {}).items():
                device_data = DeviceData(
                    device_id=device_id,
                    data_type=data_type,
                    value=float(value),
                    unit=payload.get('units', {}).get(data_type),
                    timestamp=datetime.fromisoformat(payload['timestamp']) if 'timestamp' in payload else datetime.utcnow()
                )
                db.session.add(device_data)
            
            db.session.commit()
            self.logger.info(f"Stored data for device: {device_id}")
            
        except Exception as e:
            self.logger.error(f"Error handling device data: {e}")
            db.session.rollback()
    
    def handle_device_status(self, device_id, payload):
        """Handle device status updates"""
        try:
            device = Device.query.filter_by(device_id=device_id).first()
            if device:
                device.status = payload.get('status', 'unknown')
                device.last_seen = datetime.utcnow()
                db.session.commit()
                self.logger.info(f"Updated status for device {device_id}: {device.status}")
        except Exception as e:
            self.logger.error(f"Error handling device status: {e}")
            db.session.rollback()
    
    def publish_command(self, device_id, command):
        """Send a command to a device"""
        if self.is_connected:
            topic = f"devices/{device_id}/commands"
            payload = json.dumps(command)
            self.client.publish(topic, payload)
            self.logger.info(f"Sent command to {device_id}: {command}")
            return True
        return False
    
    def start(self):
        """Start the MQTT service"""
        try:
            self.client.connect(self.broker_host, self.broker_port, 60)
            # Start the network loop in a separate thread
            self.client.loop_start()
            self.logger.info(f"MQTT service started, connecting to {self.broker_host}:{self.broker_port}")
        except Exception as e:
            self.logger.error(f"Failed to start MQTT service: {e}")
    
    def stop(self):
        """Stop the MQTT service"""
        if self.is_connected:
            self.client.loop_stop()
            self.client.disconnect()
            self.logger.info("MQTT service stopped")

# Global MQTT service instance
mqtt_service = None

def init_mqtt_service(app):
    """Initialize the MQTT service with the Flask app"""
    global mqtt_service
    mqtt_service = MQTTService(app)
    # Start MQTT service in a separate thread to avoid blocking
    threading.Thread(target=mqtt_service.start, daemon=True).start()
    return mqtt_service

