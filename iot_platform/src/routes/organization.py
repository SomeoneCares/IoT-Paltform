from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.organization import Organization, Location, Room, OrganizationMember
from src.routes.auth import token_required, permission_required
from datetime import datetime
import json

organization_bp = Blueprint('organization', __name__)

# Organization Management Routes

@organization_bp.route('/organizations', methods=['GET'])
@token_required
def get_organizations(current_user):
    """Get all organizations for the current user"""
    # Get organizations where user is owner or member
    owned_orgs = Organization.query.filter_by(owner_id=current_user.id).all()
    member_orgs = Organization.query.join(OrganizationMember).filter(
        OrganizationMember.user_id == current_user.id,
        OrganizationMember.is_active == True
    ).all()
    
    # Combine and deduplicate
    all_orgs = list(set(owned_orgs + member_orgs))
    
    return jsonify([org.to_dict() for org in all_orgs])

@organization_bp.route('/organizations', methods=['POST'])
@token_required
def create_organization(current_user):
    """Create a new organization"""
    data = request.get_json()
    
    organization = Organization(
        name=data['name'],
        description=data.get('description'),
        address=data.get('address'),
        phone=data.get('phone'),
        email=data.get('email'),
        website=data.get('website'),
        owner_id=current_user.id
    )
    
    db.session.add(organization)
    db.session.commit()
    
    # Add the creator as owner member
    member = OrganizationMember(
        user_id=current_user.id,
        organization_id=organization.id,
        role='owner'
    )
    db.session.add(member)
    db.session.commit()
    
    return jsonify(organization.to_dict()), 201

@organization_bp.route('/organizations/<int:org_id>', methods=['GET'])
@token_required
def get_organization(current_user, org_id):
    """Get a specific organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    # Check if user has access to this organization
    if not _has_organization_access(current_user, organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(organization.to_dict())

@organization_bp.route('/organizations/<int:org_id>', methods=['PUT'])
@token_required
def update_organization(current_user, org_id):
    """Update an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    # Check if user is owner or admin
    if not _has_organization_permission(current_user, organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    organization.name = data.get('name', organization.name)
    organization.description = data.get('description', organization.description)
    organization.address = data.get('address', organization.address)
    organization.phone = data.get('phone', organization.phone)
    organization.email = data.get('email', organization.email)
    organization.website = data.get('website', organization.website)
    organization.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(organization.to_dict())

@organization_bp.route('/organizations/<int:org_id>', methods=['DELETE'])
@token_required
def delete_organization(current_user, org_id):
    """Delete an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    # Only owner can delete organization
    if organization.owner_id != current_user.id:
        return jsonify({'error': 'Only organization owner can delete'}), 403
    
    db.session.delete(organization)
    db.session.commit()
    return jsonify({'message': 'Organization deleted successfully'})

# Location Management Routes

@organization_bp.route('/organizations/<int:org_id>/locations', methods=['GET'])
@token_required
def get_locations(current_user, org_id):
    """Get all locations for an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    if not _has_organization_access(current_user, organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify([location.to_dict() for location in organization.locations])

@organization_bp.route('/organizations/<int:org_id>/locations', methods=['POST'])
@token_required
def create_location(current_user, org_id):
    """Create a new location"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    if not _has_organization_permission(current_user, organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    
    # Handle latitude and longitude conversion
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    
    # Convert empty strings to None, otherwise try to convert to float
    if latitude == '' or latitude is None:
        latitude = None
    else:
        try:
            latitude = float(latitude)
        except (ValueError, TypeError):
            latitude = None
    
    if longitude == '' or longitude is None:
        longitude = None
    else:
        try:
            longitude = float(longitude)
        except (ValueError, TypeError):
            longitude = None
    
    location = Location(
        name=data['name'],
        description=data.get('description'),
        address=data.get('address'),
        city=data.get('city'),
        state=data.get('state'),
        country=data.get('country'),
        postal_code=data.get('postal_code'),
        latitude=latitude,
        longitude=longitude,
        organization_id=org_id
    )
    
    db.session.add(location)
    db.session.commit()
    
    return jsonify(location.to_dict()), 201

@organization_bp.route('/locations/<int:location_id>', methods=['GET'])
@token_required
def get_location(current_user, location_id):
    """Get a specific location"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    if not _has_organization_access(current_user, location.organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(location.to_dict())

@organization_bp.route('/locations/<int:location_id>', methods=['PUT'])
@token_required
def update_location(current_user, location_id):
    """Update a location"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    if not _has_organization_permission(current_user, location.organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    location.name = data.get('name', location.name)
    location.description = data.get('description', location.description)
    location.address = data.get('address', location.address)
    location.city = data.get('city', location.city)
    location.state = data.get('state', location.state)
    location.country = data.get('country', location.country)
    location.postal_code = data.get('postal_code', location.postal_code)
    
    # Handle latitude and longitude conversion
    latitude = data.get('latitude', location.latitude)
    longitude = data.get('longitude', location.longitude)
    
    # Convert empty strings to None, otherwise try to convert to float
    if latitude == '' or latitude is None:
        location.latitude = None
    else:
        try:
            location.latitude = float(latitude)
        except (ValueError, TypeError):
            location.latitude = None
    
    if longitude == '' or longitude is None:
        location.longitude = None
    else:
        try:
            location.longitude = float(longitude)
        except (ValueError, TypeError):
            location.longitude = None
    
    location.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(location.to_dict())

@organization_bp.route('/locations/<int:location_id>', methods=['DELETE'])
@token_required
def delete_location(current_user, location_id):
    """Delete a location"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    if not _has_organization_permission(current_user, location.organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    db.session.delete(location)
    db.session.commit()
    return jsonify({'message': 'Location deleted successfully'})

# Room Management Routes

@organization_bp.route('/locations/<int:location_id>/rooms', methods=['GET'])
@token_required
def get_rooms(current_user, location_id):
    """Get all rooms for a location"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    if not _has_organization_access(current_user, location.organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify([room.to_dict() for room in location.rooms])

@organization_bp.route('/locations/<int:location_id>/rooms', methods=['POST'])
@token_required
def create_room(current_user, location_id):
    """Create a new room"""
    location = Location.query.get(location_id)
    if not location:
        return jsonify({'error': 'Location not found'}), 404
    
    if not _has_organization_permission(current_user, location.organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    
    # Handle area_sqft conversion
    area_sqft = data.get('area_sqft')
    
    # Convert empty strings to None, otherwise try to convert to float
    if area_sqft == '' or area_sqft is None:
        area_sqft = None
    else:
        try:
            area_sqft = float(area_sqft)
        except (ValueError, TypeError):
            area_sqft = None
    
    room = Room(
        name=data['name'],
        description=data.get('description'),
        room_type=data.get('room_type'),
        floor=data.get('floor'),
        area_sqft=area_sqft,
        location_id=location_id
    )
    
    db.session.add(room)
    db.session.commit()
    
    return jsonify(room.to_dict()), 201

@organization_bp.route('/rooms/<int:room_id>', methods=['GET'])
@token_required
def get_room(current_user, room_id):
    """Get a specific room"""
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    if not _has_organization_access(current_user, room.location.organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify(room.to_dict())

@organization_bp.route('/rooms/<int:room_id>', methods=['PUT'])
@token_required
def update_room(current_user, room_id):
    """Update a room"""
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    if not _has_organization_permission(current_user, room.location.organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    room.name = data.get('name', room.name)
    room.description = data.get('description', room.description)
    room.room_type = data.get('room_type', room.room_type)
    room.floor = data.get('floor', room.floor)
    
    # Handle area_sqft conversion
    area_sqft = data.get('area_sqft', room.area_sqft)
    
    # Convert empty strings to None, otherwise try to convert to float
    if area_sqft == '' or area_sqft is None:
        room.area_sqft = None
    else:
        try:
            room.area_sqft = float(area_sqft)
        except (ValueError, TypeError):
            room.area_sqft = None
    
    room.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(room.to_dict())

@organization_bp.route('/rooms/<int:room_id>', methods=['DELETE'])
@token_required
def delete_room(current_user, room_id):
    """Delete a room"""
    room = Room.query.get(room_id)
    if not room:
        return jsonify({'error': 'Room not found'}), 404
    
    if not _has_organization_permission(current_user, room.location.organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    db.session.delete(room)
    db.session.commit()
    return jsonify({'message': 'Room deleted successfully'})

# Organization Member Management Routes

@organization_bp.route('/organizations/<int:org_id>/members', methods=['GET'])
@token_required
def get_organization_members(current_user, org_id):
    """Get all members of an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    if not _has_organization_access(current_user, organization):
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify([member.to_dict() for member in organization.members])

@organization_bp.route('/organizations/<int:org_id>/members', methods=['POST'])
@token_required
def add_organization_member(current_user, org_id):
    """Add a member to an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    if not _has_organization_permission(current_user, organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id')
    role = data.get('role', 'member')
    
    if not user_id:
        return jsonify({'error': 'User ID is required'}), 400
    
    # Check if user exists
    user = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is already a member
    existing_member = OrganizationMember.query.filter_by(
        user_id=user_id, 
        organization_id=org_id
    ).first()
    
    if existing_member:
        return jsonify({'error': 'User is already a member'}), 400
    
    member = OrganizationMember(
        user_id=user_id,
        organization_id=org_id,
        role=role
    )
    
    db.session.add(member)
    db.session.commit()
    
    return jsonify(member.to_dict()), 201

@organization_bp.route('/organizations/<int:org_id>/members/<int:user_id>', methods=['DELETE'])
@token_required
def remove_organization_member(current_user, org_id, user_id):
    """Remove a member from an organization"""
    organization = Organization.query.get(org_id)
    if not organization:
        return jsonify({'error': 'Organization not found'}), 404
    
    if not _has_organization_permission(current_user, organization, ['owner', 'admin']):
        return jsonify({'error': 'Insufficient permissions'}), 403
    
    member = OrganizationMember.query.filter_by(
        user_id=user_id,
        organization_id=org_id
    ).first()
    
    if not member:
        return jsonify({'error': 'Member not found'}), 404
    
    db.session.delete(member)
    db.session.commit()
    
    return jsonify({'message': 'Member removed successfully'})

# Helper functions

def _has_organization_access(user, organization):
    """Check if user has access to an organization"""
    # User is owner
    if organization.owner_id == user.id:
        return True
    
    # User is a member
    member = OrganizationMember.query.filter_by(
        user_id=user.id,
        organization_id=organization.id,
        is_active=True
    ).first()
    
    return member is not None

def _has_organization_permission(user, organization, required_roles):
    """Check if user has specific permissions in an organization"""
    # Owner has all permissions
    if organization.owner_id == user.id:
        return True
    
    # Check member role
    member = OrganizationMember.query.filter_by(
        user_id=user.id,
        organization_id=organization.id,
        is_active=True
    ).first()
    
    if not member:
        return False
    
    return member.role in required_roles
