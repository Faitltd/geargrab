-- GearGrab Database Schema
-- PostgreSQL database schema for the GearGrab marketplace

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(255) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(255),
    photo_url TEXT,
    phone_number VARCHAR(20),
    
    -- Profile information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    
    -- Address
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'US',
    
    -- Verification status
    is_verified BOOLEAN DEFAULT FALSE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    is_id_verified BOOLEAN DEFAULT FALSE,
    
    -- Ratings
    rating_as_owner DECIMAL(3,2) DEFAULT 0.00,
    rating_as_renter DECIMAL(3,2) DEFAULT 0.00,
    total_reviews_as_owner INTEGER DEFAULT 0,
    total_reviews_as_renter INTEGER DEFAULT 0,
    
    -- Tax information
    tax_id_type VARCHAR(20), -- 'ssn', 'ein', 'itin', 'none'
    tax_id_number_encrypted TEXT,
    tax_id_verified BOOLEAN DEFAULT FALSE,
    entity_type VARCHAR(20) DEFAULT 'individual', -- 'individual', 'business', 'llc', 'corporation'
    business_name VARCHAR(255),
    
    -- Tax address (can be different from main address)
    tax_street_address TEXT,
    tax_city VARCHAR(100),
    tax_state VARCHAR(50),
    tax_zip_code VARCHAR(20),
    tax_country VARCHAR(50) DEFAULT 'US',
    
    -- Tax preferences
    backup_withholding BOOLEAN DEFAULT FALSE,
    tax_document_delivery VARCHAR(20) DEFAULT 'email', -- 'email', 'mail', 'both'
    
    -- Account status
    account_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'banned'
    suspension_reason TEXT,

    -- Stripe integration
    stripe_connect_account_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    
    -- Notifications preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    push_notifications BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Gear items table
CREATE TABLE gear_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Basic information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    
    -- Details
    brand VARCHAR(100),
    model VARCHAR(100),
    condition VARCHAR(50) NOT NULL, -- 'Like New', 'Good', 'Fair', 'Poor'
    age_in_years INTEGER DEFAULT 0,
    
    -- Features and specifications (JSON)
    features JSONB DEFAULT '[]',
    specifications JSONB DEFAULT '{}',
    
    -- Images
    images JSONB DEFAULT '[]', -- Array of image URLs
    
    -- Pricing
    daily_price DECIMAL(10,2) NOT NULL,
    weekly_price DECIMAL(10,2),
    monthly_price DECIMAL(10,2),
    security_deposit DECIMAL(10,2) DEFAULT 0.00,
    
    -- Location
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    
    -- Delivery options
    pickup_available BOOLEAN DEFAULT TRUE,
    dropoff_available BOOLEAN DEFAULT FALSE,
    shipping_available BOOLEAN DEFAULT FALSE,
    pickup_location TEXT,
    dropoff_distance_miles INTEGER DEFAULT 0,
    shipping_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Availability
    unavailable_dates JSONB DEFAULT '[]', -- Array of date strings
    
    -- Insurance
    includes_insurance BOOLEAN DEFAULT FALSE,
    insurance_details TEXT,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'rented', 'maintenance'
    is_featured BOOLEAN DEFAULT FALSE,
    
    -- Metrics
    view_count INTEGER DEFAULT 0,
    rental_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Rentals table
CREATE TABLE rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Rental period
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Pricing
    daily_rate DECIMAL(10,2) NOT NULL,
    total_days INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    service_fee DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    security_deposit DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed'
    
    -- Photos and documentation
    checkout_photos JSONB DEFAULT '[]',
    checkout_notes TEXT,
    return_photos JSONB DEFAULT '[]',
    return_notes TEXT,
    damage_photos JSONB DEFAULT '[]',
    damage_notes TEXT,
    
    -- Delivery information
    delivery_method VARCHAR(20), -- 'pickup', 'dropoff', 'shipping'
    pickup_location TEXT,
    delivery_address TEXT,
    
    -- Important dates
    confirmed_at TIMESTAMP WITH TIME ZONE,
    checked_out_at TIMESTAMP WITH TIME ZONE,
    returned_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'system'
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Transaction records table (for tax compliance)
CREATE TABLE transaction_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable ID like "TXN-2024-000001"
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    
    -- Payment processing
    payment_processor VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', etc.
    payment_processor_transaction_id VARCHAR(255),
    payment_method_type VARCHAR(50), -- 'card', 'bank_transfer', etc.
    payment_status VARCHAR(20) NOT NULL, -- 'completed', 'pending', 'failed', 'refunded'
    
    -- Financial breakdown
    base_amount DECIMAL(10,2) NOT NULL, -- Rental amount before fees
    platform_fee_amount DECIMAL(10,2) NOT NULL, -- GearGrab service fee
    payment_processing_fee DECIMAL(10,2) NOT NULL, -- Stripe/payment processor fee
    tax_amount DECIMAL(10,2) DEFAULT 0.00, -- Any applicable taxes
    total_amount DECIMAL(10,2) NOT NULL, -- Total transaction amount
    
    -- Fee allocation
    owner_payout_amount DECIMAL(10,2) NOT NULL, -- Amount paid to gear owner
    platform_revenue DECIMAL(10,2) NOT NULL, -- GearGrab's revenue from transaction
    
    -- Parties
    payer_user_id UUID NOT NULL REFERENCES users(id),
    payee_user_id UUID NOT NULL REFERENCES users(id),
    
    -- Timing
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    tax_year INTEGER NOT NULL,
    
    -- Tax reporting
    requires_1099 BOOLEAN DEFAULT FALSE,
    is_business_transaction BOOLEAN DEFAULT FALSE,
    
    -- Audit trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gear_item_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    
    -- Review type
    review_type VARCHAR(20) NOT NULL, -- 'renter_to_owner', 'owner_to_renter', 'gear_review'
    
    -- Status
    is_public BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cart items table (temporary storage for checkout process)
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gear_item_id UUID NOT NULL REFERENCES gear_items(id) ON DELETE CASCADE,

    -- Rental details
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Guarantee claims table (for damage/dispute handling)
CREATE TABLE guarantee_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    claimant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    respondent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Claim details
    claim_type VARCHAR(50) NOT NULL, -- 'damage', 'theft', 'no_return', 'other'
    description TEXT NOT NULL,
    claimed_amount DECIMAL(10,2),

    -- Evidence
    evidence_photos JSONB DEFAULT '[]',
    evidence_documents JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'investigating', 'approved', 'denied', 'resolved'
    resolution_notes TEXT,
    resolved_amount DECIMAL(10,2),

    -- Admin handling
    assigned_admin_id UUID REFERENCES users(id),
    admin_notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Tax documents table
CREATE TABLE tax_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type VARCHAR(50) NOT NULL, -- '1099-MISC', '1099-K', 'annual_summary'
    tax_year INTEGER NOT NULL,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Document details
    total_earnings DECIMAL(10,2) NOT NULL,
    total_transactions INTEGER NOT NULL,
    document_status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'generated', 'sent', 'corrected'

    -- File storage
    document_url TEXT,
    document_hash VARCHAR(255), -- For integrity verification

    -- Delivery
    sent_date TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(20), -- 'email', 'mail'
    delivery_status VARCHAR(20), -- 'pending', 'delivered', 'failed'

    -- Compliance
    irs_filing_required BOOLEAN DEFAULT FALSE,
    irs_filing_date TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Refund adjustments table
CREATE TABLE refund_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_transaction_id UUID NOT NULL REFERENCES transaction_records(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(50) NOT NULL, -- 'refund', 'chargeback', 'fee_adjustment'

    -- Financial impact
    adjustment_amount DECIMAL(10,2) NOT NULL,
    reason TEXT,

    -- Tax impact
    affects_tax_reporting BOOLEAN DEFAULT TRUE,
    tax_year_impact INTEGER,

    -- Processing
    processed_date TIMESTAMP WITH TIME ZONE,
    processor_reference VARCHAR(255),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    type VARCHAR(50) NOT NULL, -- 'rental_request', 'payment_received', 'message', 'review', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,

    -- Related entities
    related_rental_id UUID REFERENCES rentals(id),
    related_user_id UUID REFERENCES users(id),
    related_gear_item_id UUID REFERENCES gear_items(id),

    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Delivery channels
    sent_email BOOLEAN DEFAULT FALSE,
    sent_sms BOOLEAN DEFAULT FALSE,
    sent_push BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email verifications table
CREATE TABLE email_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verification_code VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Phone verifications table
CREATE TABLE phone_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    verification_code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- ID verifications table
CREATE TABLE id_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Document details
    document_type VARCHAR(50) NOT NULL, -- 'drivers_license', 'passport', 'national_id', 'state_id'
    document_url TEXT NOT NULL,
    document_number VARCHAR(100),

    -- Verification status
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,

    -- Admin review
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Payment intents table (for Stripe payment tracking)
CREATE TABLE payment_intents (
    id VARCHAR(255) PRIMARY KEY, -- Stripe payment intent ID
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255) NOT NULL,
    amount INTEGER NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status VARCHAR(50) NOT NULL, -- 'requires_payment_method', 'requires_confirmation', 'succeeded', etc.

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Disputes table
CREATE TABLE disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,

    -- Parties involved
    complainant_id UUID NOT NULL REFERENCES users(id),
    respondent_id UUID NOT NULL REFERENCES users(id),

    -- Dispute details
    dispute_type VARCHAR(50) NOT NULL, -- 'damage', 'no_show', 'late_return', 'item_not_as_described', 'other'
    description TEXT NOT NULL,
    evidence_urls JSONB DEFAULT '[]',

    -- Status and resolution
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'under_review', 'resolved', 'closed'
    resolution TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,

    -- Financial resolution
    refund_amount DECIMAL(10,2),
    refund_recipient_id UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Dispute messages table
CREATE TABLE dispute_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    -- Message content
    message TEXT NOT NULL,
    is_admin_message BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,

    -- Participants (ordered for consistency)
    participant1_id UUID NOT NULL REFERENCES users(id),
    participant2_id UUID NOT NULL REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),

    -- Constraints
    CONSTRAINT conversations_different_participants CHECK (participant1_id != participant2_id),
    CONSTRAINT conversations_ordered_participants CHECK (participant1_id < participant2_id OR rental_id IS NOT NULL)
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),

    -- Message content
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'

    -- Read status
    read_at TIMESTAMP WITH TIME ZONE,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_status ON users(account_status);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_location ON users(city, state);

-- Gear items indexes
CREATE INDEX idx_gear_items_owner_id ON gear_items(owner_id);
CREATE INDEX idx_gear_items_category ON gear_items(category);
CREATE INDEX idx_gear_items_subcategory ON gear_items(subcategory);
CREATE INDEX idx_gear_items_status ON gear_items(status);
CREATE INDEX idx_gear_items_location ON gear_items(city, state, zip_code);
CREATE INDEX idx_gear_items_price ON gear_items(daily_price);
CREATE INDEX idx_gear_items_created_at ON gear_items(created_at);
CREATE INDEX idx_gear_items_featured ON gear_items(is_featured, status);
CREATE INDEX idx_gear_items_search ON gear_items USING gin(to_tsvector('english', title || ' ' || description));

-- Rentals indexes
CREATE INDEX idx_rentals_gear_item_id ON rentals(gear_item_id);
CREATE INDEX idx_rentals_renter_id ON rentals(renter_id);
CREATE INDEX idx_rentals_owner_id ON rentals(owner_id);
CREATE INDEX idx_rentals_status ON rentals(status);
CREATE INDEX idx_rentals_dates ON rentals(start_date, end_date);
CREATE INDEX idx_rentals_created_at ON rentals(created_at);

-- Messages indexes
CREATE INDEX idx_messages_rental_id ON messages(rental_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_unread ON messages(receiver_id, is_read, created_at);

-- Transaction records indexes
CREATE INDEX idx_transaction_records_rental_id ON transaction_records(rental_id);
CREATE INDEX idx_transaction_records_payer_id ON transaction_records(payer_user_id);
CREATE INDEX idx_transaction_records_payee_id ON transaction_records(payee_user_id);
CREATE INDEX idx_transaction_records_tax_year ON transaction_records(tax_year);
CREATE INDEX idx_transaction_records_date ON transaction_records(transaction_date);
CREATE INDEX idx_transaction_records_status ON transaction_records(payment_status);

-- Reviews indexes
CREATE INDEX idx_reviews_rental_id ON reviews(rental_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);
CREATE INDEX idx_reviews_gear_item_id ON reviews(gear_item_id);
CREATE INDEX idx_reviews_type ON reviews(review_type);
CREATE INDEX idx_reviews_public ON reviews(is_public, created_at);

-- Cart items indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_gear_item_id ON cart_items(gear_item_id);
CREATE INDEX idx_cart_items_created_at ON cart_items(created_at);

-- Guarantee claims indexes
CREATE INDEX idx_guarantee_claims_rental_id ON guarantee_claims(rental_id);
CREATE INDEX idx_guarantee_claims_claimant_id ON guarantee_claims(claimant_id);
CREATE INDEX idx_guarantee_claims_status ON guarantee_claims(status);
CREATE INDEX idx_guarantee_claims_admin ON guarantee_claims(assigned_admin_id, status);

-- Tax documents indexes
CREATE INDEX idx_tax_documents_recipient_id ON tax_documents(recipient_user_id);
CREATE INDEX idx_tax_documents_tax_year ON tax_documents(tax_year);
CREATE INDEX idx_tax_documents_type ON tax_documents(document_type);
CREATE INDEX idx_tax_documents_status ON tax_documents(document_status);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at);
CREATE INDEX idx_notifications_type ON notifications(type);

-- Verification indexes
CREATE INDEX idx_email_verifications_code ON email_verifications(verification_code);
CREATE INDEX idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX idx_phone_verifications_user_code ON phone_verifications(user_id, verification_code);
CREATE INDEX idx_phone_verifications_expires ON phone_verifications(expires_at);
CREATE INDEX idx_id_verifications_status ON id_verifications(status);
CREATE INDEX idx_id_verifications_submitted ON id_verifications(submitted_at);

-- Payment intents indexes
CREATE INDEX idx_payment_intents_rental_id ON payment_intents(rental_id);
CREATE INDEX idx_payment_intents_stripe_id ON payment_intents(stripe_payment_intent_id);
CREATE INDEX idx_payment_intents_status ON payment_intents(status);
CREATE INDEX idx_payment_intents_created_at ON payment_intents(created_at);

-- Disputes indexes
CREATE INDEX idx_disputes_rental_id ON disputes(rental_id);
CREATE INDEX idx_disputes_complainant_id ON disputes(complainant_id);
CREATE INDEX idx_disputes_respondent_id ON disputes(respondent_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_disputes_created_at ON disputes(created_at);

-- Dispute messages indexes
CREATE INDEX idx_dispute_messages_dispute_id ON dispute_messages(dispute_id);
CREATE INDEX idx_dispute_messages_sender_id ON dispute_messages(sender_id);
CREATE INDEX idx_dispute_messages_created_at ON dispute_messages(created_at);

-- Conversations indexes
CREATE INDEX idx_conversations_rental_id ON conversations(rental_id);
CREATE INDEX idx_conversations_participant1_id ON conversations(participant1_id);
CREATE INDEX idx_conversations_participant2_id ON conversations(participant2_id);
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at);

-- Messages indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_read_at ON messages(read_at);
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gear_items_updated_at BEFORE UPDATE ON gear_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rentals_updated_at BEFORE UPDATE ON rentals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transaction_records_updated_at BEFORE UPDATE ON transaction_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_guarantee_claims_updated_at BEFORE UPDATE ON guarantee_claims FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_documents_updated_at BEFORE UPDATE ON tax_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_refund_adjustments_updated_at BEFORE UPDATE ON refund_adjustments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_id_verifications_updated_at BEFORE UPDATE ON id_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_intents_updated_at BEFORE UPDATE ON payment_intents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_disputes_updated_at BEFORE UPDATE ON disputes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
    year_part TEXT;
    sequence_part TEXT;
    next_number INTEGER;
BEGIN
    -- Get the current year
    year_part := EXTRACT(YEAR FROM CURRENT_TIMESTAMP)::TEXT;

    -- Get the next sequence number for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(transaction_number FROM 'TXN-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO next_number
    FROM transaction_records
    WHERE transaction_number LIKE 'TXN-' || year_part || '-%';

    -- Format the sequence part with leading zeros
    sequence_part := LPAD(next_number::TEXT, 6, '0');

    -- Set the transaction number
    NEW.transaction_number := 'TXN-' || year_part || '-' || sequence_part;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for transaction number generation
CREATE TRIGGER generate_transaction_number_trigger
    BEFORE INSERT ON transaction_records
    FOR EACH ROW
    WHEN (NEW.transaction_number IS NULL)
    EXECUTE FUNCTION generate_transaction_number();
