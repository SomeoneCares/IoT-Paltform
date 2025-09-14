"""
RBAC Management Routes
"""
from flask import Blueprint, request, jsonify
from src.decorators.rbac_decorators import token_required, permission_required, superuser_required, admin_required
from src.services.rbac_service import RBACService
from src.models.user import db, Role, Permission, User

rbac_bp = Blueprint('rbac', __name__)

# Initialize RBAC system
@rbac_bp.route('/init', methods=['POST'])
@superuser_required
def initialize_rbac(current_user):
    """Initialize default roles and permissions (superuser only)"""
    try:
        RBACService.initialize_default_roles_and_permissions()
        return jsonify({
            'message': 'RBAC system initialized successfully',
            'roles_created': len(RBACService.get_all_roles()),
            'permissions_created': len(RBACService.get_all_permissions())
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to initialize RBAC: {str(e)}'}), 500

# Role Management
@rbac_bp.route('/roles', methods=['GET'])
@permission_required('users', 'read')
def get_roles(current_user):
    """Get all roles"""
    try:
        roles = RBACService.get_all_roles()
        return jsonify({
            'roles': [role.to_dict() for role in roles]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get roles: {str(e)}'}), 500

@rbac_bp.route('/roles', methods=['POST'])
@permission_required('users', 'manage')
def create_role(current_user):
    """Create a new role"""
    try:
        data = request.get_json()
        
        required_fields = ['name', 'description']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        role, error = RBACService.create_role(
            name=data['name'],
            description=data['description'],
            permission_names=data.get('permissions', [])
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Role created successfully',
            'role': role.to_dict()
        }), 201
        
    except Exception as e:
        return jsonify({'error': f'Failed to create role: {str(e)}'}), 500

@rbac_bp.route('/roles/<int:role_id>', methods=['PUT'])
@permission_required('users', 'manage')
def update_role(current_user, role_id):
    """Update an existing role"""
    try:
        data = request.get_json()
        
        role, error = RBACService.update_role(
            role_id=role_id,
            name=data.get('name'),
            description=data.get('description'),
            permission_names=data.get('permissions')
        )
        
        if error:
            return jsonify({'error': error}), 400
        
        return jsonify({
            'message': 'Role updated successfully',
            'role': role.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to update role: {str(e)}'}), 500

@rbac_bp.route('/roles/<int:role_id>', methods=['DELETE'])
@permission_required('users', 'manage')
def delete_role(current_user, role_id):
    """Delete a role"""
    try:
        success, error = RBACService.delete_role(role_id)
        
        if not success:
            return jsonify({'error': error}), 400
        
        return jsonify({'message': 'Role deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to delete role: {str(e)}'}), 500

# Permission Management
@rbac_bp.route('/permissions', methods=['GET'])
@permission_required('users', 'read')
def get_permissions(current_user):
    """Get all permissions"""
    try:
        permissions = RBACService.get_all_permissions()
        return jsonify({
            'permissions': [permission.to_dict() for permission in permissions]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get permissions: {str(e)}'}), 500

@rbac_bp.route('/permissions/<resource>', methods=['GET'])
@permission_required('users', 'read')
def get_permissions_by_resource(current_user, resource):
    """Get permissions for a specific resource"""
    try:
        permissions = RBACService.get_permissions_by_resource(resource)
        return jsonify({
            'resource': resource,
            'permissions': [permission.to_dict() for permission in permissions]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get permissions: {str(e)}'}), 500

# User Role Assignment
@rbac_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@permission_required('users', 'manage')
def assign_role_to_user(current_user, user_id):
    """Assign a role to a user"""
    try:
        data = request.get_json()
        
        if 'role_id' not in data:
            return jsonify({'error': 'role_id is required'}), 400
        
        success, error = RBACService.assign_role_to_user(user_id, data['role_id'])
        
        if not success:
            return jsonify({'error': error}), 400
        
        return jsonify({'message': 'Role assigned successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to assign role: {str(e)}'}), 500

@rbac_bp.route('/users/<int:user_id>/role', methods=['DELETE'])
@permission_required('users', 'manage')
def remove_role_from_user(current_user, user_id):
    """Remove role assignment from a user"""
    try:
        success, error = RBACService.remove_role_from_user(user_id)
        
        if not success:
            return jsonify({'error': error}), 400
        
        return jsonify({'message': 'Role removed successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to remove role: {str(e)}'}), 500

# User Permissions
@rbac_bp.route('/users/<int:user_id>/permissions', methods=['GET'])
@permission_required('users', 'read')
def get_user_permissions(current_user, user_id):
    """Get all permissions for a user"""
    try:
        # Users can only view their own permissions unless they have manage_users permission
        if user_id != current_user.id and not current_user.has_permission('users', 'manage'):
            return jsonify({'error': 'Access denied'}), 403
        
        permissions = RBACService.get_user_permissions(user_id)
        return jsonify({
            'user_id': user_id,
            'permissions': [permission.to_dict() for permission in permissions]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get user permissions: {str(e)}'}), 500

@rbac_bp.route('/users/<int:user_id>/permissions/check', methods=['POST'])
@permission_required('users', 'read')
def check_user_permission(current_user, user_id):
    """Check if a user has a specific permission"""
    try:
        # Users can only check their own permissions unless they have manage_users permission
        if user_id != current_user.id and not current_user.has_permission('users', 'manage'):
            return jsonify({'error': 'Access denied'}), 403
        
        data = request.get_json()
        
        required_fields = ['resource', 'action']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        has_permission = RBACService.check_user_permission(
            user_id, 
            data['resource'], 
            data['action']
        )
        
        return jsonify({
            'user_id': user_id,
            'resource': data['resource'],
            'action': data['action'],
            'has_permission': has_permission
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check permission: {str(e)}'}), 500

# Current User Info
@rbac_bp.route('/me/permissions', methods=['GET'])
@token_required
def get_my_permissions(current_user):
    """Get current user's permissions"""
    try:
        permissions = current_user.get_permissions()
        return jsonify({
            'user_id': current_user.id,
            'username': current_user.username,
            'role': current_user.user_role.to_dict() if current_user.user_role else None,
            'is_superuser': current_user.is_superuser,
            'permissions': [permission.to_dict() for permission in permissions]
        }), 200
    except Exception as e:
        return jsonify({'error': f'Failed to get permissions: {str(e)}'}), 500

@rbac_bp.route('/me/check-permission', methods=['POST'])
@token_required
def check_my_permission(current_user):
    """Check if current user has a specific permission"""
    try:
        data = request.get_json()
        
        required_fields = ['resource', 'action']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        has_permission = current_user.has_permission(data['resource'], data['action'])
        
        return jsonify({
            'user_id': current_user.id,
            'username': current_user.username,
            'resource': data['resource'],
            'action': data['action'],
            'has_permission': has_permission
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Failed to check permission: {str(e)}'}), 500
