from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import hashlib
import jwt
from datetime import timedelta

db = SQLAlchemy()

class Role(db.Model):
    """Role model for RBAC"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.String(255), nullable=True)
    is_system = db.Column(db.Boolean, default=False)  # System roles cannot be deleted
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    permissions = db.relationship('Permission', secondary='role_permissions', backref='roles')
    users = db.relationship('User', backref='user_role', lazy=True)
    
    def __repr__(self):
        return f'<Role {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'is_system': self.is_system,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'permissions': [p.to_dict() for p in self.permissions]
        }

class Permission(db.Model):
    """Permission model for RBAC"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    resource = db.Column(db.String(50), nullable=False)  # devices, users, organizations, etc.
    action = db.Column(db.String(50), nullable=False)    # read, write, delete, manage
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Permission {self.resource}:{self.action}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'resource': self.resource,
            'action': self.action,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Association table for many-to-many relationship between roles and permissions
role_permissions = db.Table('role_permissions',
    db.Column('role_id', db.Integer, db.ForeignKey('role.id'), primary_key=True),
    db.Column('permission_id', db.Integer, db.ForeignKey('permission.id'), primary_key=True)
)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('role.id'), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    is_superuser = db.Column(db.Boolean, default=False)  # Bypass all permissions
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
            'role_id': self.role_id,
            'is_superuser': self.is_superuser,
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
    
    def has_permission(self, resource, action):
        """Check if user has a specific permission"""
        # Superusers bypass all permission checks
        if self.is_superuser:
            return True
        
        # Check if user has role and role has permission
        if self.role_id and self.user_role:
            for permission in self.user_role.permissions:
                if permission.resource == resource and permission.action == action:
                    return True
        
        return False
    
    def has_any_permission(self, permissions):
        """Check if user has any of the specified permissions"""
        for resource, action in permissions:
            if self.has_permission(resource, action):
                return True
        return False
    
    def get_permissions(self):
        """Get all permissions for the user"""
        if self.is_superuser:
            # Return all permissions for superusers
            return Permission.query.all()
        
        if self.role_id and self.user_role:
            return self.user_role.permissions
        
        return []
    
    def to_dict(self, include_sensitive=False):
        data = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role_id': self.role_id,
            'role': self.user_role.to_dict() if self.user_role else None,
            'is_active': self.is_active,
            'is_superuser': self.is_superuser,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'permissions': [p.to_dict() for p in self.get_permissions()]
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
