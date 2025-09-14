from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from src.models.user import db, User, UserSession
from datetime import datetime, timedelta
import hashlib

auth_bp = Blueprint('auth', __name__)

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

def permission_required(permission):
    """Decorator to require specific permissions"""
    def decorator(f):
        @wraps(f)
        def decorated(current_user, *args, **kwargs):
            if not current_user.has_permission(permission):
                return jsonify({'error': 'Insufficient permissions'}), 403
            return f(current_user, *args, **kwargs)
        return decorated
    return decorator

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'{field} is required'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validate input
        if len(username) < 3:
            return jsonify({'error': 'Username must be at least 3 characters long'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters long'}), 400
        
        if '@' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already exists'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user
        user = User(
            username=username,
            email=email,
            role=data.get('role', 'user')  # Default to 'user' role
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        return jsonify({
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return token"""
    try:
        data = request.get_json()
        
        if not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username and password are required'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is disabled'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Generate token
        token = user.generate_token(current_app.config['SECRET_KEY'])
        
        # Create session record
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        session = UserSession(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent', '')[:255]
        )
        
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user.to_dict(),
            'expires_in': 86400  # 24 hours in seconds
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Login failed'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user and invalidate token"""
    try:
        # Get token from header
        auth_header = request.headers.get('Authorization', '')
        token = auth_header.split(" ")[1] if " " in auth_header else ""
        
        if token:
            # Find and deactivate session
            token_hash = hashlib.sha256(token.encode()).hexdigest()
            session = UserSession.query.filter_by(
                user_id=current_user.id,
                token_hash=token_hash,
                is_active=True
            ).first()
            
            if session:
                session.is_active = False
                db.session.commit()
        
        return jsonify({'message': 'Logout successful'}), 200
        
    except Exception as e:
        return jsonify({'error': 'Logout failed'}), 500

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Get current user profile"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Update current user profile"""
    try:
        data = request.get_json()
        
        # Update allowed fields
        if 'email' in data:
            email = data['email'].strip().lower()
            if '@' not in email:
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken by another user
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != current_user.id:
                return jsonify({'error': 'Email already registered'}), 409
            
            current_user.email = email
        
        if 'password' in data:
            password = data['password']
            if len(password) < 6:
                return jsonify({'error': 'Password must be at least 6 characters long'}), 400
            current_user.set_password(password)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Profile update failed'}), 500

@auth_bp.route('/users', methods=['GET'])
@token_required
@permission_required('manage_users')
def get_users(current_user):
    """Get all users (admin only)"""
    try:
        users = User.query.all()
        return jsonify({
            'users': [user.to_dict() for user in users]
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get users'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['PUT'])
@token_required
@permission_required('manage_users')
def update_user(current_user, user_id):
    """Update user (admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'role' in data:
            if data['role'] in ['user', 'admin', 'guest']:
                user.role = data['role']
            else:
                return jsonify({'error': 'Invalid role'}), 400
        
        if 'is_active' in data:
            user.is_active = bool(data['is_active'])
        
        db.session.commit()
        
        return jsonify({
            'message': 'User updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User update failed'}), 500

@auth_bp.route('/users/<int:user_id>', methods=['DELETE'])
@token_required
@permission_required('manage_users')
def delete_user(current_user, user_id):
    """Delete user (admin only)"""
    try:
        if user_id == current_user.id:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Deactivate sessions
        UserSession.query.filter_by(user_id=user_id).update({'is_active': False})
        
        # Delete user
        db.session.delete(user)
        db.session.commit()
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'User deletion failed'}), 500

@auth_bp.route('/sessions', methods=['GET'])
@token_required
def get_sessions(current_user):
    """Get current user's active sessions"""
    try:
        sessions = UserSession.query.filter_by(
            user_id=current_user.id,
            is_active=True
        ).filter(
            UserSession.expires_at > datetime.utcnow()
        ).all()
        
        return jsonify({
            'sessions': [session.to_dict() for session in sessions]
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Failed to get sessions'}), 500

@auth_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@token_required
def delete_session(current_user, session_id):
    """Delete a specific session"""
    try:
        session = UserSession.query.filter_by(
            id=session_id,
            user_id=current_user.id
        ).first()
        
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        session.is_active = False
        db.session.commit()
        
        return jsonify({'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Session deletion failed'}), 500

