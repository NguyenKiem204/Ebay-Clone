-- ============================================
-- PostgreSQL Database Schema for Clone eBay
-- ============================================

-- Create Database (run separately)
-- CREATE DATABASE clone_ebay_db;
-- \c clone_ebay_db;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'buyer',
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,

    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    lockout_end TIMESTAMP,

    last_login TIMESTAMP,
    phone VARCHAR(20),
    external_provider VARCHAR(50),
    external_provider_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_role CHECK (role IN ('buyer', 'seller', 'admin'))
);

-- Refresh Tokens Table (for JWT authentication)
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by_ip VARCHAR(45),
    revoked_at TIMESTAMP,
    revoked_by_ip VARCHAR(45),
    replaced_by_token VARCHAR(500)
    -- Note: is_active should be calculated in application: revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- Addresses Table
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    street VARCHAR(200) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_addresses_user ON addresses(user_id);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id INT REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    icon_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_slug ON categories(slug);

-- Stores Table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    store_name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    banner_image_url TEXT,
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_stores_seller ON stores(seller_id);
CREATE INDEX idx_stores_slug ON stores(slug);

-- Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    images TEXT[], -- Array of image URLs
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    seller_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id INT REFERENCES stores(id) ON DELETE SET NULL,
    is_auction BOOLEAN DEFAULT FALSE,
    auction_start_time TIMESTAMP,
    auction_end_time TIMESTAMP,
    starting_bid DECIMAL(10,2),
    condition VARCHAR(20), -- new, used, refurbished
    brand VARCHAR(100),
    weight DECIMAL(8,2), -- in kg
    dimensions VARCHAR(50), -- e.g., "10x20x30 cm"
    is_active BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) DEFAULT 'active',
    stock INTEGER DEFAULT 0,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    original_price DECIMAL(10,2),
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_condition CHECK (condition IN ('new','used','refurbished','open box','pre-owned'))
);

CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);

-- Inventory Table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT DEFAULT 0, -- Quantity in pending orders
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_quantity CHECK (quantity >= 0),
    CONSTRAINT chk_reserved CHECK (reserved_quantity >= 0)
);

CREATE INDEX idx_inventory_product ON inventory(product_id);

-- ============================================
-- SHOPPING & ORDERS
-- ============================================

-- Shopping Carts Table
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_carts_user ON carts(user_id);

-- Shopping Cart Items Table
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_cart_quantity CHECK (quantity > 0),
    UNIQUE(cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ============================================
-- COUPONS & DISCOUNTS
-- ============================================

CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount DECIMAL(10,2),
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    max_usage INT,
    used_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    applicable_to VARCHAR(20) DEFAULT 'all', -- all, category, product
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    product_id INT REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    max_usage_per_user INTEGER DEFAULT 1,
    coupon_type VARCHAR(20) DEFAULT 'discount',
    store_id INTEGER,
    CONSTRAINT chk_discount_type CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT chk_applicable CHECK (applicable_to IN ('all', 'category', 'product')),
    CONSTRAINT unique_coupon_code UNIQUE (code),
    CONSTRAINT coupons_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

CREATE TABLE coupon_products (
    coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (coupon_id, product_id)
);
CREATE INDEX idx_coupons_code ON coupons(code);

-- Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    buyer_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    address_id INT NOT NULL REFERENCES addresses(id) ON DELETE SET NULL,
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_fee DECIMAL(10,2) DEFAULT 0,
    tax DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    coupon_id INT REFERENCES coupons(id) ON DELETE SET NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_order_status CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'))
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date DESC);

-- Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE SET NULL,
    seller_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_seller ON order_items(seller_id);

-- Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    transaction_id VARCHAR(255),
    payment_gateway VARCHAR(50), -- paypal, stripe, cod
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_payment_method CHECK (method IN ('paypal', 'credit_card', 'cod', 'bank_transfer')),
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_user ON payments(user_id);

-- Shipping Info Table
CREATE TABLE shipping_info (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    carrier VARCHAR(100),
    tracking_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipped_at TIMESTAMP,
    estimated_arrival TIMESTAMP,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_shipping_status CHECK (status IN ('pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'))
);

CREATE INDEX idx_shipping_order ON shipping_info(order_id);


-- Coupon Usage Table
CREATE TABLE coupon_usage (
    id SERIAL PRIMARY KEY,
    coupon_id INT NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(coupon_id, order_id)
);

CREATE INDEX idx_coupon_usage_user ON coupon_usage(user_id);

-- ============================================
-- REVIEWS & RATINGS
-- ============================================

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reviewer_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id INT REFERENCES orders(id) ON DELETE SET NULL,
    rating INT NOT NULL,
    title VARCHAR(200),
    comment TEXT,
    images TEXT[], -- Array of review image URLs
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
    UNIQUE(product_id, reviewer_id, order_id)
);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_reviewer ON reviews(reviewer_id);

-- Seller Feedback Table
CREATE TABLE seller_feedback (
    id SERIAL PRIMARY KEY,
    seller_id INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    positive_count INT DEFAULT 0,
    neutral_count INT DEFAULT 0,
    negative_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- AUCTION & BIDDING
-- ============================================

CREATE TABLE bids (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    bidder_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_winning BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT chk_bid_amount CHECK (amount > 0)
);

CREATE INDEX idx_bids_product ON bids(product_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_time ON bids(bid_time DESC);

-- ============================================
-- RETURNS & DISPUTES
-- ============================================

CREATE TABLE return_requests (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    refund_amount DECIMAL(10,2),
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_return_status CHECK (status IN ('pending', 'approved', 'rejected', 'completed'))
);

CREATE INDEX idx_returns_order ON return_requests(order_id);
CREATE INDEX idx_returns_user ON return_requests(user_id);

CREATE TABLE disputes (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    raised_by INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolution TEXT,
    resolved_by INT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_dispute_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_user ON disputes(raised_by);

-- ============================================
-- MESSAGING
-- ============================================

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(200),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    parent_message_id INT REFERENCES messages(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_notification_type CHECK (type IN ('order', 'payment', 'shipping', 'promotion', 'review', 'message', 'system'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);

-- ============================================
-- AUDIT LOGS
-- ============================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INT REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_audit_action CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

CREATE INDEX idx_audit_table ON audit_logs(table_name);
CREATE INDEX idx_audit_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_logs(changed_by);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- WISHLISTS / FAVORITES
-- ============================================

CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);

CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, product_id)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);

-- Product View History Table (Recently Viewed)
CREATE TABLE product_view_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,          -- NULL for guests
    cookie_id VARCHAR(36),                                        -- UUID cookie for guests
    product_id INT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    CONSTRAINT uq_user_product  UNIQUE (user_id, product_id),
    CONSTRAINT uq_guest_product UNIQUE (cookie_id, product_id)
);

CREATE INDEX idx_pvh_user    ON product_view_history(user_id, viewed_at DESC);
CREATE INDEX idx_pvh_cookie  ON product_view_history(cookie_id, viewed_at DESC);
CREATE INDEX idx_pvh_expires ON product_view_history(expires_at);

-- Banners Table
CREATE TABLE banners (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cta_text VARCHAR(50),
    image_url TEXT,
    link_url TEXT,
    bg_color VARCHAR(20),
    text_color VARCHAR(20),
    type VARCHAR(20) DEFAULT 'single', -- single, multi
    items JSONB, -- For multi-item slides: [{"title": "...", "image": "...", "link": "..."}]
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD') || '-' || LPAD(NEW.id::TEXT, 6, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================
-- VIEWS
-- ============================================

-- View for product listing with category info
CREATE VIEW vw_product_listing AS
SELECT 
    p.id,
    p.title,
    p.slug,
    p.description,
    p.price,
    p.images,
    p.is_auction,
    p.auction_end_time,
    p.condition,
    p.brand,
    p.view_count,
    p.created_at,
    c.name as category_name,
    c.slug as category_slug,
    u.username as seller_name,
    s.store_name,
    i.quantity as stock_quantity,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN users u ON p.seller_id = u.id
LEFT JOIN stores s ON p.store_id = s.id
LEFT JOIN inventory i ON p.id = i.product_id
LEFT JOIN reviews r ON p.id = r.product_id
WHERE p.is_active = TRUE
GROUP BY p.id, c.name, c.slug, u.username, s.store_name, i.quantity;

-- View for order summary
CREATE VIEW vw_order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.buyer_id,
    u.username as buyer_name,
    u.email as buyer_email,
    o.total_price,
    o.status,
    o.order_date,
    p.status as payment_status,
    s.status as shipping_status,
    s.tracking_number
FROM orders o
LEFT JOIN users u ON o.buyer_id = u.id
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN shipping_info s ON o.id = s.order_id;

-- ============================================
-- EF CORE MIGRATIONS HISTORY SYNC
-- ============================================
-- Since this script generates all tables automatically,
-- we must tell EF Core that its baseline migrations have already been applied
-- so it does not crash on startup with 'relation already exists'

CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260316024845_AddSocialLoginFields', '9.0.2') ON CONFLICT DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260320004759_SyncModelSnapshot', '9.0.2') ON CONFLICT DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260320004716_AddWatchlistTable', '9.0.2') ON CONFLICT DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260320033846_AddProductViewHistoryTable', '9.0.2') ON CONFLICT DO NOTHING;
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('20260320154259_SyncUserColumnNames', '9.0.2') ON CONFLICT DO NOTHING;
