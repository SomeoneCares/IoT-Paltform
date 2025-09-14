from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import jwt
from datetime import timedelta

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='user')  # user, admin, guest
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    devices = db.relationship('Device', backref='user', lazy=True)
    automation_rules = db.relationship('AutomationRule', backref='user', lazy=True)

    def __repr__(self):
        return f'<User {self.username}>'
    
    def set_password(self, password):
        """Hash and set the user's password using SHA256"""
        password_bytes = password.encode('utf-8')
        self.password_hash = hashlib.sha256(password_bytes).hexdigest()
    
    def check_password(self, password):
        """Check if the provided password matches the user's password"""
        password_bytes = password.encode('utf-8')
        password_hash = hashlib.sha256(password_bytes).hexdigest()
        return password_hash == self.password_hash
    
    def generate_token(self, secret_key, expires_in=3600):
        """Generate a JWT token for the user"""
        payload = {
            'user_id': self.id,
            'username': self.username,
            'role': self.role,
            'exp': datetime.utcnow() + timedelta(seconds=expires_in)
        }
        return jwt.encode(payload, secret_key, algorithm='HS256')
    
    @staticmethod
    def verify_token(token, secret_key):
        """Verify a JWT token and return the user"""
        try:
            payload = jwt.decode(token, secret_key, algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            return user
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
    
    def has_permission(self, permission):
        """Check if user has a specific permission"""
        permissions = {
            'admin': ['read', 'write', 'delete', 'manage_users', 'manage_devices', 'manage_rules'],
            'user': ['read', 'write', 'manage_devices', 'manage_rules'],
            'guest': ['read']
        }
        return permission in permissions.get(self.role, [])
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
        if include_sensitive:
            data['password_hash'] = self.password_hash
        return data

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    token_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    
    def __repr__(self):
        return f'<UserSession {self.user_id}>'
    
    def is_expired(self):
        return datetime.utcnow() > self.expires_at
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'expires_at': self.expires_at.isoformat(),
            'is_active': self.is_active,
            'ip_address': self.ip_address
        }
