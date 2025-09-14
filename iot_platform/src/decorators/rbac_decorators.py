"""
RBAC Decorators for Flask routes
"""
from flask import request, jsonify, current_app
from functools import wraps
from src.models.user import User, UserSession
import hashlib

def token_required(f):
    """Decorator to require authentication for routes"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Verify token
            current_user = User.verify_token(token, current_app.config['SECRET_KEY'])
            if current_user is None:
                return jsonify({'error': 'Token is invalid or expired'}), 401
            
            if not current_user.is_active:
                return jsonify({'error': 'User account is disabled'}), 401
                
        except Exception as e:
            return jsonify({'error': 'Token verification failed'}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated

def permission_required(resource, action):
    """Decorator to require specific permissions"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            if not current_user.has_permission(resource, action):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_permission': f'{resource}:{action}',
                    'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

def any_permission_required(permissions):
    """Decorator to require any of the specified permissions"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            if not current_user.has_any_permission(permissions):
                return jsonify({
                    'error': 'Insufficient permissions',
                    'required_permissions': [f'{r}:{a}' for r, a in permissions],
                    'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
                }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

def superuser_required(f):
    """Decorator to require superuser privileges"""
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_superuser:
            return jsonify({
                'error': 'Superuser privileges required',
                'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
            }), 403
        return f(current_user, *args, **kwargs)
    return decorated

def role_required(role_name):
    """Decorator to require a specific role"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            if not current_user.user_role or current_user.user_role.name != role_name:
                if not current_user.is_superuser:  # Superusers bypass role checks
                    return jsonify({
                        'error': f'Role "{role_name}" required',
                        'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
                    }), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

def admin_required(f):
    """Decorator to require admin role or superuser"""
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if not current_user.is_superuser:
            if not current_user.user_role or current_user.user_role.name not in ['admin', 'super_admin']:
                return jsonify({
                    'error': 'Admin privileges required',
                    'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
                }), 403
        return f(current_user, *args, **kwargs)
    return decorated

def owner_or_permission_required(resource, action, get_owner_func):
    """
    Decorator that allows access if user owns the resource OR has the required permission
    get_owner_func should be a function that takes the resource_id and returns the owner_id
    """
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(current_user, *args, **kwargs):
            # Check if user has the required permission
            if current_user.has_permission(resource, action):
                return f(current_user, *args, **kwargs)
            
            # Check if user owns the resource
            resource_id = kwargs.get('id') or kwargs.get('device_id') or kwargs.get('user_id')
            if resource_id:
                try:
                    owner_id = get_owner_func(resource_id)
                    if owner_id == current_user.id:
                        return f(current_user, *args, **kwargs)
                except Exception:
                    pass
            
            return jsonify({
                'error': 'Access denied. You must either own this resource or have the required permission.',
                'required_permission': f'{resource}:{action}',
                'user_role': current_user.user_role.name if current_user.user_role else 'No role assigned'
            }), 403
        return decorated
    return decorator

def organization_member_required(f):
    """Decorator to require organization membership"""
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        organization_id = kwargs.get('organization_id')
        if not organization_id:
            return jsonify({'error': 'Organization ID required'}), 400
        
        # Superusers and admins can access any organization
        if current_user.is_superuser or (current_user.user_role and current_user.user_role.name in ['admin', 'super_admin']):
            return f(current_user, *args, **kwargs)
        
        # Check if user is a member of the organization
        from src.models.organization import OrganizationMember
        membership = OrganizationMember.query.filter_by(
            user_id=current_user.id,
            organization_id=organization_id
        ).first()
        
        if not membership:
            return jsonify({
                'error': 'You are not a member of this organization',
                'organization_id': organization_id
            }), 403
        
        return f(current_user, *args, **kwargs)
    return decorated

def validate_request_data(required_fields=None, optional_fields=None):
    """Decorator to validate request data"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if request.method in ['POST', 'PUT', 'PATCH']:
                data = request.get_json()
                if not data:
                    return jsonify({'error': 'Request data is required'}), 400
                
                # Check required fields
                if required_fields:
                    missing_fields = [field for field in required_fields if field not in data or data[field] is None]
                    if missing_fields:
                        return jsonify({
                            'error': 'Missing required fields',
                            'missing_fields': missing_fields
                        }), 400
                
                # Validate field types and values
                for field, value in data.items():
                    if field in (required_fields or []) or field in (optional_fields or []):
                        if value is not None:
                            # Add field validation logic here if needed
                            pass
            
            return f(*args, **kwargs)
        return decorated
    return decorator
