import json
import threading
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from src.models.user import db
from src.models.device import Device, DeviceData, AutomationRule
from src.services.mqtt_service import mqtt_service

logger = logging.getLogger(__name__)

class AutomationEngine:
    """
    Automation engine that evaluates rules and executes actions based on device data
    """
    
    def __init__(self, app):
        self.app = app
        self.is_running = False
        self.evaluation_interval = 5  # seconds
        self.rule_cache = {}
        self.last_evaluation = {}
        
    def start(self):
        """Start the automation engine"""
        self.is_running = True
        self.engine_thread = threading.Thread(target=self._engine_loop, daemon=True)
        self.engine_thread.start()
        logger.info("Automation engine started")
    
    def stop(self):
        """Stop the automation engine"""
        self.is_running = False
        logger.info("Automation engine stopped")
    
    def _engine_loop(self):
        """Main engine loop that evaluates rules periodically"""
        while self.is_running:
            try:
                with self.app.app_context():
                    self._evaluate_all_rules()
                time.sleep(self.evaluation_interval)
            except Exception as e:
                logger.error(f"Error in automation engine loop: {e}")
                time.sleep(1)
    
    def _evaluate_all_rules(self):
        """Evaluate all active automation rules"""
        try:
            # Get all active rules
            rules = AutomationRule.query.filter_by(is_active=True).all()
            
            for rule in rules:
                try:
                    self._evaluate_rule(rule)
                except Exception as e:
                    logger.error(f"Error evaluating rule {rule.id}: {e}")
                    
        except Exception as e:
            logger.error(f"Error getting automation rules: {e}")
    
    def _evaluate_rule(self, rule: AutomationRule):
        """Evaluate a single automation rule"""
        try:
            # Parse trigger condition
            trigger_condition = json.loads(rule.trigger_condition)
            
            # Check if rule should be evaluated (avoid too frequent evaluations)
            rule_key = f"rule_{rule.id}"
            last_eval = self.last_evaluation.get(rule_key, datetime.min)
            min_interval = trigger_condition.get('min_interval_seconds', 30)
            
            if (datetime.utcnow() - last_eval).total_seconds() < min_interval:
                return
            
            # Evaluate the trigger condition
            if self._check_trigger_condition(rule.trigger_device_id, trigger_condition):
                logger.info(f"Rule {rule.id} ({rule.name}) triggered")
                
                # Execute the action
                action_command = json.loads(rule.action_command)
                self._execute_action(rule.action_device_id, action_command)
                
                # Update last evaluation time
                self.last_evaluation[rule_key] = datetime.utcnow()
                
        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id}: {e}")
    
    def _check_trigger_condition(self, device_id: str, condition: Dict[str, Any]) -> bool:
        """Check if a trigger condition is met"""
        try:
            condition_type = condition.get('type')
            
            if condition_type == 'value_threshold':
                return self._check_value_threshold(device_id, condition)
            elif condition_type == 'value_change':
                return self._check_value_change(device_id, condition)
            elif condition_type == 'time_based':
                return self._check_time_based(condition)
            elif condition_type == 'device_status':
                return self._check_device_status(device_id, condition)
            elif condition_type == 'composite':
                return self._check_composite_condition(condition)
            else:
                logger.warning(f"Unknown condition type: {condition_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking trigger condition: {e}")
            return False
    
    def _check_value_threshold(self, device_id: str, condition: Dict[str, Any]) -> bool:
        """Check if a device value meets a threshold condition"""
        try:
            data_type = condition.get('data_type')
            operator = condition.get('operator')  # 'gt', 'lt', 'eq', 'gte', 'lte'
            threshold = condition.get('threshold')
            time_window = condition.get('time_window_minutes', 5)
            
            # Get recent data for the device
            since_time = datetime.utcnow() - timedelta(minutes=time_window)
            recent_data = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.data_type == data_type,
                DeviceData.timestamp >= since_time
            ).order_by(DeviceData.timestamp.desc()).first()
            
            if not recent_data:
                return False
            
            value = recent_data.value
            
            # Evaluate condition
            if operator == 'gt':
                return value > threshold
            elif operator == 'lt':
                return value < threshold
            elif operator == 'eq':
                return value == threshold
            elif operator == 'gte':
                return value >= threshold
            elif operator == 'lte':
                return value <= threshold
            else:
                logger.warning(f"Unknown operator: {operator}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking value threshold: {e}")
            return False
    
    def _check_value_change(self, device_id: str, condition: Dict[str, Any]) -> bool:
        """Check if a device value has changed significantly"""
        try:
            data_type = condition.get('data_type')
            change_type = condition.get('change_type')  # 'increase', 'decrease', 'any'
            min_change = condition.get('min_change', 0)
            time_window = condition.get('time_window_minutes', 10)
            
            # Get recent data for comparison
            since_time = datetime.utcnow() - timedelta(minutes=time_window)
            recent_data = DeviceData.query.filter(
                DeviceData.device_id == device_id,
                DeviceData.data_type == data_type,
                DeviceData.timestamp >= since_time
            ).order_by(DeviceData.timestamp.desc()).limit(2).all()
            
            if len(recent_data) < 2:
                return False
            
            current_value = recent_data[0].value
            previous_value = recent_data[1].value
            change = current_value - previous_value
            
            # Evaluate change condition
            if change_type == 'increase':
                return change >= min_change
            elif change_type == 'decrease':
                return change <= -min_change
            elif change_type == 'any':
                return abs(change) >= min_change
            else:
                logger.warning(f"Unknown change type: {change_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking value change: {e}")
            return False
    
    def _check_time_based(self, condition: Dict[str, Any]) -> bool:
        """Check if a time-based condition is met"""
        try:
            time_type = condition.get('time_type')  # 'time_of_day', 'day_of_week', 'interval'
            
            if time_type == 'time_of_day':
                start_time = condition.get('start_time')  # "HH:MM"
                end_time = condition.get('end_time')  # "HH:MM"
                current_time = datetime.now().strftime("%H:%M")
                
                if start_time <= end_time:
                    return start_time <= current_time <= end_time
                else:  # Crosses midnight
                    return current_time >= start_time or current_time <= end_time
                    
            elif time_type == 'day_of_week':
                allowed_days = condition.get('days', [])  # [0-6, Monday=0]
                current_day = datetime.now().weekday()
                return current_day in allowed_days
                
            elif time_type == 'interval':
                interval_minutes = condition.get('interval_minutes', 60)
                last_trigger = condition.get('last_trigger')
                
                if not last_trigger:
                    return True
                    
                last_trigger_time = datetime.fromisoformat(last_trigger)
                return (datetime.utcnow() - last_trigger_time).total_seconds() >= interval_minutes * 60
                
            else:
                logger.warning(f"Unknown time type: {time_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking time-based condition: {e}")
            return False
    
    def _check_device_status(self, device_id: str, condition: Dict[str, Any]) -> bool:
        """Check if a device status condition is met"""
        try:
            expected_status = condition.get('status')
            
            device = Device.query.filter_by(device_id=device_id).first()
            if not device:
                return False
                
            return device.status == expected_status
            
        except Exception as e:
            logger.error(f"Error checking device status: {e}")
            return False
    
    def _check_composite_condition(self, condition: Dict[str, Any]) -> bool:
        """Check a composite condition (AND/OR of multiple conditions)"""
        try:
            operator = condition.get('operator', 'AND')  # 'AND' or 'OR'
            sub_conditions = condition.get('conditions', [])
            
            if operator == 'AND':
                return all(self._check_trigger_condition(
                    sub_cond.get('device_id'), sub_cond
                ) for sub_cond in sub_conditions)
            elif operator == 'OR':
                return any(self._check_trigger_condition(
                    sub_cond.get('device_id'), sub_cond
                ) for sub_cond in sub_conditions)
            else:
                logger.warning(f"Unknown composite operator: {operator}")
                return False
                
        except Exception as e:
            logger.error(f"Error checking composite condition: {e}")
            return False
    
    def _execute_action(self, device_id: str, action: Dict[str, Any]):
        """Execute an automation action"""
        try:
            action_type = action.get('type')
            
            if action_type == 'device_command':
                self._execute_device_command(device_id, action)
            elif action_type == 'notification':
                self._execute_notification(action)
            elif action_type == 'webhook':
                self._execute_webhook(action)
            elif action_type == 'delay':
                self._execute_delay(action)
            elif action_type == 'sequence':
                self._execute_sequence(action)
            else:
                logger.warning(f"Unknown action type: {action_type}")
                
        except Exception as e:
            logger.error(f"Error executing action: {e}")
    
    def _execute_device_command(self, device_id: str, action: Dict[str, Any]):
        """Execute a command on a device"""
        try:
            command = action.get('command', {})
            
            # Send command via MQTT
            if mqtt_service and mqtt_service.is_connected:
                mqtt_service.publish_command(device_id, command)
                logger.info(f"Sent command to device {device_id}: {command}")
            else:
                logger.warning("MQTT service not available for sending command")
                
        except Exception as e:
            logger.error(f"Error executing device command: {e}")
    
    def _execute_notification(self, action: Dict[str, Any]):
        """Execute a notification action"""
        try:
            message = action.get('message', 'Automation rule triggered')
            notification_type = action.get('notification_type', 'log')
            
            if notification_type == 'log':
                logger.info(f"Automation notification: {message}")
            # Add other notification types (email, SMS, push) here
            
        except Exception as e:
            logger.error(f"Error executing notification: {e}")
    
    def _execute_webhook(self, action: Dict[str, Any]):
        """Execute a webhook action"""
        try:
            import requests
            
            url = action.get('url')
            method = action.get('method', 'POST')
            payload = action.get('payload', {})
            headers = action.get('headers', {'Content-Type': 'application/json'})
            
            if method.upper() == 'POST':
                response = requests.post(url, json=payload, headers=headers, timeout=10)
            elif method.upper() == 'GET':
                response = requests.get(url, params=payload, headers=headers, timeout=10)
            else:
                logger.warning(f"Unsupported webhook method: {method}")
                return
                
            logger.info(f"Webhook executed: {url} - Status: {response.status_code}")
            
        except Exception as e:
            logger.error(f"Error executing webhook: {e}")
    
    def _execute_delay(self, action: Dict[str, Any]):
        """Execute a delay action"""
        try:
            delay_seconds = action.get('delay_seconds', 1)
            time.sleep(delay_seconds)
            logger.info(f"Executed delay: {delay_seconds} seconds")
            
        except Exception as e:
            logger.error(f"Error executing delay: {e}")
    
    def _execute_sequence(self, action: Dict[str, Any]):
        """Execute a sequence of actions"""
        try:
            actions = action.get('actions', [])
            
            for sub_action in actions:
                device_id = sub_action.get('device_id')
                self._execute_action(device_id, sub_action)
                
        except Exception as e:
            logger.error(f"Error executing sequence: {e}")

# Global automation engine instance
automation_engine = None

def init_automation_engine(app):
    """Initialize the automation engine with the Flask app"""
    global automation_engine
    automation_engine = AutomationEngine(app)
    automation_engine.start()
    return automation_engine

def create_sample_rules():
    """Create some sample automation rules for demonstration"""
    try:
        # Rule 1: Turn on lights when motion is detected
        motion_light_rule = AutomationRule(
            name="Motion Activated Lights",
            description="Turn on living room light when motion is detected in hallway",
            trigger_device_id="motion_001",
            trigger_condition=json.dumps({
                "type": "value_threshold",
                "data_type": "motion",
                "operator": "eq",
                "threshold": 1,
                "time_window_minutes": 1,
                "min_interval_seconds": 30
            }),
            action_device_id="light_001",
            action_command=json.dumps({
                "type": "device_command",
                "command": {
                    "action": "turn_on",
                    "brightness": 80
                }
            }),
            user_id=1
        )
        
        # Rule 2: Temperature alert
        temp_alert_rule = AutomationRule(
            name="High Temperature Alert",
            description="Send notification when temperature exceeds 25°C",
            trigger_device_id="temp_001",
            trigger_condition=json.dumps({
                "type": "value_threshold",
                "data_type": "temperature",
                "operator": "gt",
                "threshold": 25.0,
                "time_window_minutes": 5,
                "min_interval_seconds": 300  # 5 minutes
            }),
            action_device_id="",
            action_command=json.dumps({
                "type": "notification",
                "message": "High temperature detected in Living Room",
                "notification_type": "log"
            }),
            user_id=1
        )
        
        # Rule 3: Evening lights automation
        evening_lights_rule = AutomationRule(
            name="Evening Lights",
            description="Turn on all lights at sunset",
            trigger_device_id="",
            trigger_condition=json.dumps({
                "type": "time_based",
                "time_type": "time_of_day",
                "start_time": "18:00",
                "end_time": "18:01"
            }),
            action_device_id="light_001",
            action_command=json.dumps({
                "type": "sequence",
                "actions": [
                    {
                        "device_id": "light_001",
                        "type": "device_command",
                        "command": {"action": "turn_on", "brightness": 60}
                    },
                    {
                        "device_id": "light_002",
                        "type": "device_command",
                        "command": {"action": "turn_on", "brightness": 60}
                    }
                ]
            }),
            user_id=1
        )
        
        db.session.add(motion_light_rule)
        db.session.add(temp_alert_rule)
        db.session.add(evening_lights_rule)
        db.session.commit()
        
        logger.info("Sample automation rules created")
        
    except Exception as e:
        logger.error(f"Error creating sample rules: {e}")
        db.session.rollback()

