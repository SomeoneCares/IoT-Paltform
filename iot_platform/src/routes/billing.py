from flask import Blueprint, request, jsonify
from src.models.user import db, User
from src.models.billing import Subscription, Invoice, PaymentMethod, UsageRecord, SUBSCRIPTION_PLANS
from src.routes.auth import token_required
from datetime import datetime, timedelta
import uuid

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/billing/subscription', methods=['GET'])
@token_required
def get_subscription(current_user):
    """Get current user's subscription"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    # Get plan details
    plan_details = SUBSCRIPTION_PLANS.get(subscription.plan_id, {})
    
    subscription_data = subscription.to_dict()
    subscription_data['plan_details'] = plan_details
    
    return jsonify(subscription_data)

@billing_bp.route('/billing/subscription', methods=['POST'])
@token_required
def create_subscription(current_user):
    """Create a new subscription"""
    data = request.get_json()
    plan_id = data.get('plan_id')
    
    if not plan_id or plan_id not in SUBSCRIPTION_PLANS:
        return jsonify({'error': 'Invalid plan ID'}), 400
    
    # Check if user already has a subscription
    existing_subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if existing_subscription:
        return jsonify({'error': 'User already has a subscription'}), 400
    
    # Create new subscription
    now = datetime.utcnow()
    subscription = Subscription(
        user_id=current_user.id,
        plan_id=plan_id,
        status='active',
        current_period_start=now,
        current_period_end=now + timedelta(days=30),  # Monthly billing
        cancel_at_period_end=False
    )
    
    db.session.add(subscription)
    db.session.commit()
    
    # Create initial invoice
    plan_details = SUBSCRIPTION_PLANS[plan_id]
    invoice = Invoice(
        subscription_id=subscription.id,
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
        amount=plan_details['price'],
        currency='USD',
        status='pending',
        description=f"{plan_details['name']} Plan - {now.strftime('%B %Y')}",
        due_date=now + timedelta(days=7)
    )
    
    db.session.add(invoice)
    db.session.commit()
    
    subscription_data = subscription.to_dict()
    subscription_data['plan_details'] = plan_details
    
    return jsonify(subscription_data), 201

@billing_bp.route('/billing/subscription', methods=['PUT'])
@token_required
def update_subscription(current_user):
    """Update subscription plan"""
    data = request.get_json()
    plan_id = data.get('plan_id')
    
    if not plan_id or plan_id not in SUBSCRIPTION_PLANS:
        return jsonify({'error': 'Invalid plan ID'}), 400
    
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    # Update subscription
    subscription.plan_id = plan_id
    subscription.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    # Create new invoice for the updated plan
    plan_details = SUBSCRIPTION_PLANS[plan_id]
    invoice = Invoice(
        subscription_id=subscription.id,
        invoice_number=f"INV-{uuid.uuid4().hex[:8].upper()}",
        amount=plan_details['price'],
        currency='USD',
        status='pending',
        description=f"{plan_details['name']} Plan - {datetime.utcnow().strftime('%B %Y')}",
        due_date=datetime.utcnow() + timedelta(days=7)
    )
    
    db.session.add(invoice)
    db.session.commit()
    
    subscription_data = subscription.to_dict()
    subscription_data['plan_details'] = plan_details
    
    return jsonify(subscription_data)

@billing_bp.route('/billing/subscription/cancel', methods=['POST'])
@token_required
def cancel_subscription(current_user):
    """Cancel subscription at period end"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    subscription.cancel_at_period_end = True
    subscription.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Subscription will be canceled at the end of the current period'})

@billing_bp.route('/billing/subscription/reactivate', methods=['POST'])
@token_required
def reactivate_subscription(current_user):
    """Reactivate subscription"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    subscription.cancel_at_period_end = False
    subscription.updated_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'message': 'Subscription reactivated'})

@billing_bp.route('/billing/invoices', methods=['GET'])
@token_required
def get_invoices(current_user):
    """Get user's invoices"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify([])
    
    invoices = Invoice.query.filter_by(subscription_id=subscription.id).order_by(Invoice.created_at.desc()).all()
    return jsonify([invoice.to_dict() for invoice in invoices])

@billing_bp.route('/billing/invoices/<int:invoice_id>/download', methods=['GET'])
@token_required
def download_invoice(current_user, invoice_id):
    """Download invoice PDF"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    invoice = Invoice.query.filter_by(id=invoice_id, subscription_id=subscription.id).first()
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    # In a real implementation, this would generate and return a PDF
    # For now, just return the invoice data
    return jsonify({
        'message': 'Invoice download initiated',
        'invoice': invoice.to_dict()
    })

@billing_bp.route('/billing/payment-methods', methods=['GET'])
@token_required
def get_payment_methods(current_user):
    """Get user's payment methods"""
    payment_methods = PaymentMethod.query.filter_by(user_id=current_user.id).all()
    return jsonify([pm.to_dict() for pm in payment_methods])

@billing_bp.route('/billing/payment-methods', methods=['POST'])
@token_required
def add_payment_method(current_user):
    """Add a new payment method"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['type', 'brand', 'last4', 'exp_month', 'exp_year']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Missing required field: {field}'}), 400
    
    # If this is the first payment method, make it default
    existing_methods = PaymentMethod.query.filter_by(user_id=current_user.id).count()
    is_default = existing_methods == 0
    
    payment_method = PaymentMethod(
        user_id=current_user.id,
        type=data['type'],
        brand=data['brand'],
        last4=data['last4'],
        exp_month=data['exp_month'],
        exp_year=data['exp_year'],
        is_default=is_default
    )
    
    db.session.add(payment_method)
    db.session.commit()
    
    return jsonify(payment_method.to_dict()), 201

@billing_bp.route('/billing/payment-methods/<int:payment_method_id>', methods=['DELETE'])
@token_required
def remove_payment_method(current_user, payment_method_id):
    """Remove a payment method"""
    payment_method = PaymentMethod.query.filter_by(id=payment_method_id, user_id=current_user.id).first()
    if not payment_method:
        return jsonify({'error': 'Payment method not found'}), 404
    
    # If removing the default payment method, set another one as default
    if payment_method.is_default:
        other_method = PaymentMethod.query.filter(
            PaymentMethod.user_id == current_user.id,
            PaymentMethod.id != payment_method_id
        ).first()
        
        if other_method:
            other_method.is_default = True
            db.session.commit()
    
    db.session.delete(payment_method)
    db.session.commit()
    
    return jsonify({'message': 'Payment method removed'})

@billing_bp.route('/billing/payment-methods/<int:payment_method_id>/default', methods=['POST'])
@token_required
def set_default_payment_method(current_user, payment_method_id):
    """Set a payment method as default"""
    payment_method = PaymentMethod.query.filter_by(id=payment_method_id, user_id=current_user.id).first()
    if not payment_method:
        return jsonify({'error': 'Payment method not found'}), 404
    
    # Remove default from all other payment methods
    PaymentMethod.query.filter_by(user_id=current_user.id).update({'is_default': False})
    
    # Set this one as default
    payment_method.is_default = True
    
    db.session.commit()
    
    return jsonify({'message': 'Default payment method updated'})

@billing_bp.route('/billing/usage', methods=['GET'])
@token_required
def get_usage(current_user):
    """Get current usage statistics"""
    subscription = Subscription.query.filter_by(user_id=current_user.id).first()
    if not subscription:
        return jsonify({'error': 'No subscription found'}), 404
    
    plan_details = SUBSCRIPTION_PLANS.get(subscription.plan_id, {})
    limits = plan_details.get('limits', {})
    
    # Get current usage
    current_period_start = subscription.current_period_start
    current_period_end = subscription.current_period_end
    
    usage_data = {}
    
    # Device count
    device_count = len(current_user.devices)
    usage_data['devices'] = {
        'used': device_count,
        'limit': limits.get('devices', 0),
        'percentage': (device_count / limits.get('devices', 1)) * 100 if limits.get('devices', 0) > 0 else 0
    }
    
    # Automation count
    automation_count = len(current_user.automation_rules)
    usage_data['automations'] = {
        'used': automation_count,
        'limit': limits.get('automations', 0),
        'percentage': (automation_count / limits.get('automations', 1)) * 100 if limits.get('automations', 0) > 0 else 0
    }
    
    # API calls (simulated)
    api_calls = UsageRecord.query.filter(
        UsageRecord.user_id == current_user.id,
        UsageRecord.metric_type == 'api_calls',
        UsageRecord.period_start >= current_period_start,
        UsageRecord.period_end <= current_period_end
    ).first()
    
    api_calls_count = api_calls.usage_count if api_calls else 0
    usage_data['api_calls'] = {
        'used': api_calls_count,
        'limit': limits.get('api_calls', 0),
        'percentage': (api_calls_count / limits.get('api_calls', 1)) * 100 if limits.get('api_calls', 0) > 0 else 0
    }
    
    # Storage (simulated)
    storage_usage = UsageRecord.query.filter(
        UsageRecord.user_id == current_user.id,
        UsageRecord.metric_type == 'storage',
        UsageRecord.period_start >= current_period_start,
        UsageRecord.period_end <= current_period_end
    ).first()
    
    storage_count = storage_usage.usage_count if storage_usage else 0
    usage_data['storage'] = {
        'used': storage_count,
        'limit': limits.get('storage', 0),
        'percentage': (storage_count / limits.get('storage', 1)) * 100 if limits.get('storage', 0) > 0 else 0
    }
    
    return jsonify(usage_data)

@billing_bp.route('/billing/plans', methods=['GET'])
def get_plans():
    """Get available subscription plans"""
    return jsonify(SUBSCRIPTION_PLANS)
