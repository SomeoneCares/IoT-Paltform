import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db, User, UserSession
from src.routes.user import user_bp
from src.routes.device import device_bp
from src.routes.auth import auth_bp
from src.routes.organization import organization_bp
from src.routes.matter_thread import matter_thread_bp
from src.routes.analytics import analytics_bp
from src.models.device import Device, DeviceData, AutomationRule, ThreadNetwork
from src.models.organization import Organization, Location, Room, OrganizationMember
from src.services.mqtt_service import init_mqtt_service
from src.services.automation_engine import init_automation_engine, create_sample_rules

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app)

app.register_blueprint(user_bp, url_prefix='/api')
app.register_blueprint(device_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(organization_bp, url_prefix='/api')
app.register_blueprint(matter_thread_bp, url_prefix='/api')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

# uncomment if you need to use database
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# Initialize MQTT service
mqtt_service = init_mqtt_service(app)

# Initialize automation engine
automation_engine = init_automation_engine(app)

# Create sample automation rules (only if none exist)
with app.app_context():
    if AutomationRule.query.count() == 0:
        create_sample_rules()
    
    # Create default admin user if no users exist
    if User.query.count() == 0:
        admin_user = User(
            username='admin',
            email='admin@iot-platform.com',
            role='admin'
        )
        admin_user.set_password('admin123')
        
        demo_user = User(
            username='demo',
            email='demo@iot-platform.com',
            role='user'
        )
        demo_user.set_password('demo123')
        
        db.session.add(admin_user)
        db.session.add(demo_user)
        db.session.commit()
        print("Created default users: admin/admin123 and demo/demo123")

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
