-- Payment System Database Schema for CareAI
-- This schema supports Stripe, Mobile Money, and Orange Money payments
-- with XAF currency and regional pricing

-- Payment Transactions Table
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    amount_xaf INTEGER NOT NULL,
    amount_usd DECIMAL(10,2),
    region VARCHAR(50) NOT NULL DEFAULT 'africa',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_reference VARCHAR(255),
    payment_provider_id VARCHAR(255),
    phone_number VARCHAR(20),
    card_last_four VARCHAR(4),
    failure_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- User Subscriptions Table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT true,
    payment_method VARCHAR(50),
    last_payment_id UUID REFERENCES payment_transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    UNIQUE(user_id, status) WHERE status = 'active'
);

-- Payment Methods Table (for storing user's preferred payment methods)
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL, -- 'stripe', 'mobile_money', 'orange_money'
    is_default BOOLEAN DEFAULT false,
    
    -- Card details (encrypted)
    card_last_four VARCHAR(4),
    card_brand VARCHAR(20),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    stripe_payment_method_id VARCHAR(255),
    
    -- Mobile money details
    phone_number VARCHAR(20),
    country_code VARCHAR(10),
    provider VARCHAR(50), -- 'mtn', 'orange', 'airtel'
    
    -- Common fields
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription Plans Table (for reference)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]',
    document_limit INTEGER NOT NULL DEFAULT 3, -- -1 for unlimited
    price_usd DECIMAL(10,2) NOT NULL DEFAULT 0,
    price_xaf INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Regional Pricing Table
CREATE TABLE IF NOT EXISTS regional_pricing (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    plan_id VARCHAR(50) NOT NULL REFERENCES subscription_plans(id),
    price_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    price_usd DECIMAL(10,2) NOT NULL,
    price_xaf INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(region, plan_id)
);

-- Payment Webhooks Table (for handling payment provider webhooks)
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider VARCHAR(50) NOT NULL, -- 'stripe', 'mtn', 'orange', 'airtel'
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider, event_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_expires_at ON user_subscriptions(expires_at);

CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_is_default ON user_payment_methods(user_id, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_payment_webhooks_provider ON payment_webhooks(provider);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);

-- Row Level Security (RLS) Policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_payment_methods ENABLE ROW LEVEL SECURITY;

-- Users can only see their own payment transactions
CREATE POLICY "Users can view own payment transactions" ON payment_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own payment methods
CREATE POLICY "Users can view own payment methods" ON user_payment_methods
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment methods" ON user_payment_methods
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payment methods" ON user_payment_methods
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payment methods" ON user_payment_methods
    FOR DELETE USING (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_payment_methods_updated_at BEFORE UPDATE ON user_payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regional_pricing_updated_at BEFORE UPDATE ON regional_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, features, document_limit, price_usd, price_xaf) VALUES
('free', 'Free', 'Perfect for getting started', 
 '["3 health documents storage", "Basic chatbot access", "Appointment booking", "Basic health tracking"]', 
 3, 0, 0),
('basic', 'Basic', 'Great for individuals', 
 '["25 health documents storage", "Enhanced chatbot features", "Priority appointment booking", "Advanced health analytics", "Email support"]', 
 25, 5, 2900),
('premium', 'Premium', 'Best for families', 
 '["100 health documents storage", "AI-powered health insights", "Telemedicine consultations", "Family health management", "Priority support", "Custom health reports"]', 
 100, 15, 8700),
('enterprise', 'Enterprise', 'For healthcare organizations', 
 '["Unlimited health documents", "Advanced AI analytics", "Multi-user management", "API access", "Custom integrations", "24/7 dedicated support", "Compliance reporting"]', 
 -1, 50, 29000)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    document_limit = EXCLUDED.document_limit,
    price_usd = EXCLUDED.price_usd,
    price_xaf = EXCLUDED.price_xaf,
    updated_at = NOW();

-- Insert regional pricing (Africa gets base pricing, others get multipliers)
INSERT INTO regional_pricing (region, plan_id, price_multiplier, price_usd, price_xaf) VALUES
-- Africa (base pricing)
('africa', 'basic', 1.0, 5, 2900),
('africa', 'premium', 1.0, 15, 8700),
('africa', 'enterprise', 1.0, 50, 29000),
-- Europe (2x pricing)
('europe', 'basic', 2.0, 10, 5800),
('europe', 'premium', 2.0, 30, 17400),
('europe', 'enterprise', 2.0, 100, 58000),
-- North America (2.5x pricing)
('north_america', 'basic', 2.5, 12.5, 7250),
('north_america', 'premium', 2.5, 37.5, 21750),
('north_america', 'enterprise', 2.5, 125, 72500),
-- Other regions (2x pricing)
('other', 'basic', 2.0, 10, 5800),
('other', 'premium', 2.0, 30, 17400),
('other', 'enterprise', 2.0, 100, 58000)
ON CONFLICT (region, plan_id) DO UPDATE SET
    price_multiplier = EXCLUDED.price_multiplier,
    price_usd = EXCLUDED.price_usd,
    price_xaf = EXCLUDED.price_xaf,
    updated_at = NOW();
