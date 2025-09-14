from flask import Blueprint, jsonify, request
from src.models.user import User, db
from src.decorators.rbac_decorators import token_required, permission_required

user_bp = Blueprint('user', __name__)

@user_bp.route('/users', methods=['GET'])
@permission_required('users', 'read')
def get_users(current_user):
    """Get all users - only accessible by users with read permission"""
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route('/users', methods=['POST'])
@permission_required('users', 'write')
def create_user(current_user):
    """Create a new user - only accessible by users with write permission"""
    data = request.json
    user = User(username=data['username'], email=data['email'])
    user.set_password(data.get('password', 'defaultpassword'))
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route('/users/<int:user_id>', methods=['GET'])
@token_required
def get_user(current_user, user_id):
    """Get user profile - users can only access their own profile, admins can access any"""
    if current_user.id != user_id and not current_user.has_permission('users', 'read'):
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
def update_user(current_user, user_id):
    """Update user profile - users can only update their own profile, admins can update any"""
    if current_user.id != user_id and not current_user.has_permission('users', 'write'):
        return jsonify({'error': 'Access denied'}), 403
    
    user = User.query.get_or_404(user_id)
    data = request.json
    user.username = data.get('username', user.username)
    user.email = data.get('email', user.email)
    if 'password' in data:
        user.set_password(data['password'])
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@permission_required('users', 'delete')
def delete_user(current_user, user_id):
    """Delete user - only accessible by users with delete permission"""
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return '', 204

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_current_user_profile(current_user):
    """Get current user's own profile"""
    return jsonify(current_user.to_dict())

@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_current_user_profile(current_user):
    """Update current user's own profile"""
    data = request.json
    current_user.username = data.get('username', current_user.username)
    current_user.email = data.get('email', current_user.email)
    if 'password' in data:
        current_user.set_password(data['password'])
    db.session.commit()
    return jsonify(current_user.to_dict())
