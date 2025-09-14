#!/usr/bin/env python3
"""
Edge Gateway Simulator for IoT Platform
Simulates an edge gateway that collects data from various IoT devices
and sends it to the cloud platform via MQTT.
"""

import paho.mqtt.client as mqtt
import json
import time
import random
import threading
from datetime import datetime
import logging
import argparse

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IoTDeviceSimulator:
    """Simulates different types of IoT devices"""
    
    def __init__(self, device_id, device_type, location="Living Room"):
        self.device_id = device_id
        self.device_type = device_type
        self.location = location
        self.last_values = {}
        
    def generate_data(self):
        """Generate realistic sensor data based on device type"""
        timestamp = datetime.utcnow().isoformat()
        
        if self.device_type == "temperature_sensor":
            # Simulate temperature with some variation
            base_temp = self.last_values.get('temperature', 22.0)
            temperature = base_temp + random.uniform(-0.5, 0.5)
            temperature = max(15.0, min(30.0, temperature))  # Keep within realistic range
            self.last_values['temperature'] = temperature
            
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "temperature": round(temperature, 1)
                },
                "units": {
                    "temperature": "°C"
                }
            }
            
        elif self.device_type == "humidity_sensor":
            # Simulate humidity
            base_humidity = self.last_values.get('humidity', 45.0)
            humidity = base_humidity + random.uniform(-2.0, 2.0)
            humidity = max(30.0, min(70.0, humidity))
            self.last_values['humidity'] = humidity
            
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "humidity": round(humidity, 1)
                },
                "units": {
                    "humidity": "%"
                }
            }
            
        elif self.device_type == "motion_sensor":
            # Simulate motion detection (binary)
            motion = random.choice([0, 0, 0, 0, 1])  # 20% chance of motion
            
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "motion": motion
                },
                "units": {
                    "motion": "boolean"
                }
            }
            
        elif self.device_type == "smart_light":
            # Simulate smart light with brightness and color
            brightness = random.randint(0, 100)
            is_on = random.choice([True, False])
            
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "brightness": brightness,
                    "is_on": is_on,
                    "power_consumption": round(brightness * 0.1, 2) if is_on else 0
                },
                "units": {
                    "brightness": "%",
                    "is_on": "boolean",
                    "power_consumption": "W"
                }
            }
            
        elif self.device_type == "door_sensor":
            # Simulate door sensor (open/closed)
            is_open = random.choice([True, False, False, False])  # 25% chance of open
            
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "is_open": is_open
                },
                "units": {
                    "is_open": "boolean"
                }
            }
            
        else:
            # Generic sensor
            return {
                "device_id": self.device_id,
                "device_type": self.device_type,
                "location": self.location,
                "timestamp": timestamp,
                "data": {
                    "value": round(random.uniform(0, 100), 2)
                },
                "units": {
                    "value": "units"
                }
            }

class EdgeGatewaySimulator:
    """Simulates an edge gateway that manages multiple IoT devices"""
    
    def __init__(self, gateway_id, mqtt_broker='localhost', mqtt_port=1883):
        self.gateway_id = gateway_id
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        self.devices = []
        self.client = mqtt.Client()
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        self.client.on_disconnect = self.on_disconnect
        self.is_running = False
        
    def on_connect(self, client, userdata, flags, rc):
        """Callback for MQTT connection"""
        if rc == 0:
            logger.info(f"Gateway {self.gateway_id} connected to MQTT broker")
            # Subscribe to command topics for all devices
            for device in self.devices:
                client.subscribe(f"devices/{device.device_id}/commands")
        else:
            logger.error(f"Failed to connect to MQTT broker, return code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        """Callback for MQTT disconnection"""
        logger.info(f"Gateway {self.gateway_id} disconnected from MQTT broker")
    
    def on_message(self, client, userdata, msg):
        """Handle incoming MQTT messages (commands)"""
        try:
            topic_parts = msg.topic.split('/')
            if len(topic_parts) >= 3 and topic_parts[2] == 'commands':
                device_id = topic_parts[1]
                command = json.loads(msg.payload.decode())
                logger.info(f"Received command for device {device_id}: {command}")
                # Here you would implement device command handling
                self.handle_device_command(device_id, command)
        except Exception as e:
            logger.error(f"Error processing command: {e}")
    
    def handle_device_command(self, device_id, command):
        """Handle commands sent to devices"""
        # Find the device
        device = next((d for d in self.devices if d.device_id == device_id), None)
        if device:
            logger.info(f"Executing command on {device_id}: {command}")
            # Simulate command execution
            if command.get('action') == 'turn_on' and device.device_type == 'smart_light':
                logger.info(f"Turning on light {device_id}")
            elif command.get('action') == 'turn_off' and device.device_type == 'smart_light':
                logger.info(f"Turning off light {device_id}")
            elif command.get('action') == 'set_brightness' and device.device_type == 'smart_light':
                brightness = command.get('brightness', 50)
                logger.info(f"Setting brightness of {device_id} to {brightness}%")
    
    def add_device(self, device_id, device_type, location="Unknown"):
        """Add a simulated device to the gateway"""
        device = IoTDeviceSimulator(device_id, device_type, location)
        self.devices.append(device)
        logger.info(f"Added device: {device_id} ({device_type}) in {location}")
    
    def publish_device_data(self, device):
        """Publish data from a device to MQTT"""
        try:
            data = device.generate_data()
            topic = f"devices/{device.device_id}/data"
            payload = json.dumps(data)
            self.client.publish(topic, payload)
            logger.debug(f"Published data for {device.device_id}: {data['data']}")
        except Exception as e:
            logger.error(f"Error publishing device data: {e}")
    
    def publish_device_status(self, device, status="online"):
        """Publish device status to MQTT"""
        try:
            status_data = {
                "device_id": device.device_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "gateway_id": self.gateway_id
            }
            topic = f"devices/{device.device_id}/status"
            payload = json.dumps(status_data)
            self.client.publish(topic, payload)
            logger.debug(f"Published status for {device.device_id}: {status}")
        except Exception as e:
            logger.error(f"Error publishing device status: {e}")
    
    def publish_gateway_status(self):
        """Publish gateway status and device summary"""
        try:
            gateway_data = {
                "gateway_id": self.gateway_id,
                "status": "online",
                "timestamp": datetime.utcnow().isoformat(),
                "device_count": len(self.devices),
                "devices": [{"device_id": d.device_id, "type": d.device_type, "location": d.location} 
                           for d in self.devices]
            }
            topic = f"gateway/{self.gateway_id}/status"
            payload = json.dumps(gateway_data)
            self.client.publish(topic, payload)
            logger.debug(f"Published gateway status")
        except Exception as e:
            logger.error(f"Error publishing gateway status: {e}")
    
    def data_collection_loop(self):
        """Main loop for collecting and publishing device data"""
        while self.is_running:
            try:
                # Publish data from all devices
                for device in self.devices:
                    self.publish_device_data(device)
                    
                # Publish gateway status every 10 cycles
                if random.randint(1, 10) == 1:
                    self.publish_gateway_status()
                
                # Wait before next collection cycle
                time.sleep(5)  # Collect data every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in data collection loop: {e}")
                time.sleep(1)
    
    def start(self):
        """Start the edge gateway simulator"""
        try:
            # Connect to MQTT broker
            self.client.connect(self.mqtt_broker, self.mqtt_port, 60)
            self.client.loop_start()
            
            # Publish initial device statuses
            for device in self.devices:
                self.publish_device_status(device, "online")
            
            # Start data collection in a separate thread
            self.is_running = True
            data_thread = threading.Thread(target=self.data_collection_loop, daemon=True)
            data_thread.start()
            
            logger.info(f"Edge Gateway {self.gateway_id} started with {len(self.devices)} devices")
            
        except Exception as e:
            logger.error(f"Failed to start edge gateway: {e}")
    
    def stop(self):
        """Stop the edge gateway simulator"""
        self.is_running = False
        
        # Publish offline status for all devices
        for device in self.devices:
            self.publish_device_status(device, "offline")
        
        self.client.loop_stop()
        self.client.disconnect()
        logger.info(f"Edge Gateway {self.gateway_id} stopped")

def main():
    """Main function to run the edge gateway simulator"""
    parser = argparse.ArgumentParser(description='IoT Edge Gateway Simulator')
    parser.add_argument('--gateway-id', default='gateway_001', help='Gateway ID')
    parser.add_argument('--mqtt-broker', default='localhost', help='MQTT broker host')
    parser.add_argument('--mqtt-port', type=int, default=1883, help='MQTT broker port')
    parser.add_argument('--duration', type=int, default=300, help='Simulation duration in seconds')
    
    args = parser.parse_args()
    
    # Create edge gateway
    gateway = EdgeGatewaySimulator(args.gateway_id, args.mqtt_broker, args.mqtt_port)
    
    # Add simulated devices
    gateway.add_device("temp_001", "temperature_sensor", "Living Room")
    gateway.add_device("temp_002", "temperature_sensor", "Bedroom")
    gateway.add_device("humid_001", "humidity_sensor", "Living Room")
    gateway.add_device("motion_001", "motion_sensor", "Hallway")
    gateway.add_device("motion_002", "motion_sensor", "Kitchen")
    gateway.add_device("light_001", "smart_light", "Living Room")
    gateway.add_device("light_002", "smart_light", "Bedroom")
    gateway.add_device("door_001", "door_sensor", "Front Door")
    gateway.add_device("door_002", "door_sensor", "Back Door")
    
    try:
        # Start the gateway
        gateway.start()
        
        # Run for specified duration
        logger.info(f"Running simulation for {args.duration} seconds...")
        time.sleep(args.duration)
        
    except KeyboardInterrupt:
        logger.info("Simulation interrupted by user")
    finally:
        gateway.stop()
        logger.info("Simulation completed")

if __name__ == "__main__":
    main()

