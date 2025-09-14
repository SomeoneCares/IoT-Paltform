"""
RBAC Service for managing roles and permissions
"""
from src.models.user import db, Role, Permission, User
from datetime import datetime

class RBACService:
    """Service class for Role-Based Access Control operations"""
    
    @staticmethod
    def initialize_default_roles_and_permissions():
        """Initialize default roles and permissions in the database"""
        
        # Define default permissions
        default_permissions = [
            # Device permissions
            {'name': 'devices:read', 'resource': 'devices', 'action': 'read', 'description': 'View devices'},
            {'name': 'devices:write', 'resource': 'devices', 'action': 'write', 'description': 'Create and edit devices'},
            {'name': 'devices:delete', 'resource': 'devices', 'action': 'delete', 'description': 'Delete devices'},
            {'name': 'devices:manage', 'resource': 'devices', 'action': 'manage', 'description': 'Full device management'},
            
            # User permissions
            {'name': 'users:read', 'resource': 'users', 'action': 'read', 'description': 'View users'},
            {'name': 'users:write', 'resource': 'users', 'action': 'write', 'description': 'Create and edit users'},
            {'name': 'users:delete', 'resource': 'users', 'action': 'delete', 'description': 'Delete users'},
            {'name': 'users:manage', 'resource': 'users', 'action': 'manage', 'description': 'Full user management'},
            
            # Organization permissions
            {'name': 'organizations:read', 'resource': 'organizations', 'action': 'read', 'description': 'View organizations'},
            {'name': 'organizations:write', 'resource': 'organizations', 'action': 'write', 'description': 'Create and edit organizations'},
            {'name': 'organizations:delete', 'resource': 'organizations', 'action': 'delete', 'description': 'Delete organizations'},
            {'name': 'organizations:manage', 'resource': 'organizations', 'action': 'manage', 'description': 'Full organization management'},
            
            # Automation permissions
            {'name': 'automations:read', 'resource': 'automations', 'action': 'read', 'description': 'View automation rules'},
            {'name': 'automations:write', 'resource': 'automations', 'action': 'write', 'description': 'Create and edit automation rules'},
            {'name': 'automations:delete', 'resource': 'automations', 'action': 'delete', 'description': 'Delete automation rules'},
            {'name': 'automations:manage', 'resource': 'automations', 'action': 'manage', 'description': 'Full automation management'},
            
            # Billing permissions
            {'name': 'billing:read', 'resource': 'billing', 'action': 'read', 'description': 'View billing information'},
            {'name': 'billing:write', 'resource': 'billing', 'action': 'write', 'description': 'Manage billing'},
            {'name': 'billing:manage', 'resource': 'billing', 'action': 'manage', 'description': 'Full billing management'},
            
            # Analytics permissions
            {'name': 'analytics:read', 'resource': 'analytics', 'action': 'read', 'description': 'View analytics data'},
            {'name': 'analytics:manage', 'resource': 'analytics', 'action': 'manage', 'description': 'Full analytics management'},
            
            # System permissions
            {'name': 'system:read', 'resource': 'system', 'action': 'read', 'description': 'View system information'},
            {'name': 'system:manage', 'resource': 'system', 'action': 'manage', 'description': 'Full system management'},
        ]
        
        # Create permissions
        for perm_data in default_permissions:
            existing_perm = Permission.query.filter_by(name=perm_data['name']).first()
            if not existing_perm:
                permission = Permission(**perm_data)
                db.session.add(permission)
        
        db.session.commit()
        
        # Define default roles
        default_roles = [
            {
                'name': 'super_admin',
                'description': 'Super Administrator with full system access',
                'is_system': True,
                'permissions': [p['name'] for p in default_permissions]
            },
            {
                'name': 'admin',
                'description': 'Administrator with management capabilities',
                'is_system': True,
                'permissions': [
                    'devices:read', 'devices:write', 'devices:delete', 'devices:manage',
                    'users:read', 'users:write', 'users:delete', 'users:manage',
                    'organizations:read', 'organizations:write', 'organizations:delete', 'organizations:manage',
                    'automations:read', 'automations:write', 'automations:delete', 'automations:manage',
                    'billing:read', 'billing:write', 'billing:manage',
                    'analytics:read', 'analytics:manage',
                    'system:read'
                ]
            },
            {
                'name': 'manager',
                'description': 'Manager with device and organization management',
                'is_system': True,
                'permissions': [
                    'devices:read', 'devices:write', 'devices:delete', 'devices:manage',
                    'users:read', 'users:write',
                    'organizations:read', 'organizations:write', 'organizations:manage',
                    'automations:read', 'automations:write', 'automations:delete', 'automations:manage',
                    'billing:read',
                    'analytics:read'
                ]
            },
            {
                'name': 'user',
                'description': 'Regular user with basic device management',
                'is_system': True,
                'permissions': [
                    'devices:read', 'devices:write',
                    'organizations:read',
                    'automations:read', 'automations:write',
                    'billing:read'
                ]
            },
            {
                'name': 'guest',
                'description': 'Guest user with read-only access',
                'is_system': True,
                'permissions': [
                    'devices:read',
                    'organizations:read',
                    'automations:read'
                ]
            }
        ]
        
        # Create roles and assign permissions
        for role_data in default_roles:
            existing_role = Role.query.filter_by(name=role_data['name']).first()
            if not existing_role:
                role = Role(
                    name=role_data['name'],
                    description=role_data['description'],
                    is_system=role_data['is_system']
                )
                db.session.add(role)
                db.session.flush()  # Get the role ID
                
                # Assign permissions to role
                for perm_name in role_data['permissions']:
                    permission = Permission.query.filter_by(name=perm_name).first()
                    if permission:
                        role.permissions.append(permission)
            else:
                # Update existing role permissions
                role = existing_role
                role.permissions.clear()
                for perm_name in role_data['permissions']:
                    permission = Permission.query.filter_by(name=perm_name).first()
                    if permission:
                        role.permissions.append(permission)
        
        db.session.commit()
        return True
    
    @staticmethod
    def create_role(name, description, permission_names=None):
        """Create a new role with specified permissions"""
        if Role.query.filter_by(name=name).first():
            return None, "Role already exists"
        
        role = Role(name=name, description=description, is_system=False)
        db.session.add(role)
        db.session.flush()
        
        if permission_names:
            for perm_name in permission_names:
                permission = Permission.query.filter_by(name=perm_name).first()
                if permission:
                    role.permissions.append(permission)
        
        db.session.commit()
        return role, None
    
    @staticmethod
    def update_role(role_id, name=None, description=None, permission_names=None):
        """Update an existing role"""
        role = Role.query.get(role_id)
        if not role:
            return None, "Role not found"
        
        if role.is_system:
            return None, "Cannot modify system roles"
        
        if name:
            role.name = name
        if description:
            role.description = description
        
        if permission_names is not None:
            role.permissions.clear()
            for perm_name in permission_names:
                permission = Permission.query.filter_by(name=perm_name).first()
                if permission:
                    role.permissions.append(permission)
        
        db.session.commit()
        return role, None
    
    @staticmethod
    def delete_role(role_id):
        """Delete a role (only non-system roles)"""
        role = Role.query.get(role_id)
        if not role:
            return False, "Role not found"
        
        if role.is_system:
            return False, "Cannot delete system roles"
        
        # Check if any users are assigned to this role
        users_with_role = User.query.filter_by(role_id=role_id).count()
        if users_with_role > 0:
            return False, f"Cannot delete role. {users_with_role} users are assigned to this role."
        
        db.session.delete(role)
        db.session.commit()
        return True, None
    
    @staticmethod
    def assign_role_to_user(user_id, role_id):
        """Assign a role to a user"""
        user = User.query.get(user_id)
        role = Role.query.get(role_id)
        
        if not user:
            return False, "User not found"
        if not role:
            return False, "Role not found"
        
        user.role_id = role_id
        db.session.commit()
        return True, None
    
    @staticmethod
    def remove_role_from_user(user_id):
        """Remove role assignment from a user"""
        user = User.query.get(user_id)
        if not user:
            return False, "User not found"
        
        user.role_id = None
        db.session.commit()
        return True, None
    
    @staticmethod
    def get_user_permissions(user_id):
        """Get all permissions for a user"""
        user = User.query.get(user_id)
        if not user:
            return []
        
        return user.get_permissions()
    
    @staticmethod
    def check_user_permission(user_id, resource, action):
        """Check if a user has a specific permission"""
        user = User.query.get(user_id)
        if not user:
            return False
        
        return user.has_permission(resource, action)
    
    @staticmethod
    def get_all_roles():
        """Get all roles with their permissions"""
        return Role.query.all()
    
    @staticmethod
    def get_all_permissions():
        """Get all available permissions"""
        return Permission.query.all()
    
    @staticmethod
    def get_permissions_by_resource(resource):
        """Get all permissions for a specific resource"""
        return Permission.query.filter_by(resource=resource).all()
