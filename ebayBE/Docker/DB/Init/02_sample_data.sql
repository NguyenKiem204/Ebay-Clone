-- ============================================
-- SAMPLE DATA FOR CLONE EBAY DATABASE
-- Run this after creating the schema
-- ============================================

-- ============================================
-- USERS
-- ============================================
-- Note: Passwords are hashed using BCrypt
-- All passwords are: "Password123!"

INSERT INTO users (username, first_name, last_name, email, password_hash, role, avatar_url, is_email_verified, is_active, phone) VALUES
('admin_user', 'System', 'Admin', 'admin@ebay.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'admin', 'https://i.pravatar.cc/150?img=1', true, true, '0123456789'),
('john_seller', 'John', 'Seller', 'john.seller@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=2', true, true, '0123456788'),
('jane_shop', 'Jane', 'Shop', 'jane.shop@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=3', true, true, '0123456787'),
('mike_store', 'Mike', 'Store', 'mike.store@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=4', true, true, '0123456786'),
('sarah_buyer', 'Sarah', 'Johnson', 'sarah.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=5', true, true, '0901234567'),
('david_buyer', 'David', 'Smith', 'david.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=6', true, true, '0912345678'),
('emma_buyer', 'Emma', 'Wilson', 'emma.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=7', true, true, '0923456789'),
('robert_seller', 'Robert', 'Seller', 'robert.seller@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=8', true, true, '0123456785'),
('lisa_buyer', 'Lisa', 'Brown', 'lisa.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=9', true, true, '0934567890'),
('tom_buyer', 'Tom', 'Davis', 'tom.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=10', true, true, '0945678901');

-- ============================================
-- ADDRESSES
-- ============================================

INSERT INTO addresses (user_id, full_name, phone, street, city, state, postal_code, country, is_default) VALUES
(5, 'Sarah Johnson', '0901234567', '123 Nguyen Hue Street', 'Ho Chi Minh', 'Ho Chi Minh', '700000', 'Vietnam', true),
(5, 'Sarah Johnson', '0901234567', '456 Le Loi Street', 'Hanoi', 'Hanoi', '100000', 'Vietnam', false),
(6, 'David Smith', '0912345678', '789 Tran Hung Dao', 'Da Nang', 'Da Nang', '550000', 'Vietnam', true),
(7, 'Emma Wilson', '0923456789', '321 Hai Ba Trung', 'Hanoi', 'Hanoi', '100000', 'Vietnam', true),
(7, 'Emma Wilson', '0923456789', '654 Ly Thuong Kiet', 'Ho Chi Minh', 'Ho Chi Minh', '700000', 'Vietnam', false),
(9, 'Lisa Brown', '0934567890', '987 Phan Chu Trinh', 'Hue', 'Thua Thien Hue', '530000', 'Vietnam', true),
(10, 'Tom Davis', '0945678901', '147 Vo Van Tan', 'Can Tho', 'Can Tho', '900000', 'Vietnam', true);

-- ============================================
-- CATEGORIES
-- ============================================

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO categories (name, slug, description, parent_id, image_url, is_active, display_order) VALUES
-- Top-level Categories (User Requested 7 First)
('Laptops', 'laptops', 'High-performance laptops and notebooks', NULL, 'https://i.ebayimg.com/images/g/SwAAAeSwvwZpqvtW/s-l500.webp', true, 1),
('Computer parts', 'computer-parts', 'Components and parts for computers', NULL, 'https://i.ebayimg.com/images/g/Dz0AAeSwpDhpqvtW/s-l500.webp', true, 2),
('Smartphones', 'smartphones', 'Latest mobile phones and smartphones', NULL, 'https://i.ebayimg.com/images/g/Rp0AAeSw2yNpqvtW/s-l500.webp', true, 3),
('Enterprise networking', 'enterprise-networking', 'Networking equipment for businesses', NULL, 'https://i.ebayimg.com/images/g/O~AAAeSwcIZpqvtW/s-l500.webp', true, 4),
('Tablets and eBooks', 'tablets-ebooks', 'Tablets, iPads, and eBook readers', NULL, 'https://i.ebayimg.com/images/g/DaUAAeSwYXxpqvtW/s-l500.webp', true, 5),
('Storage and blank media', 'storage-blank-media', 'Hard drives, SSDs, and storage solutions', NULL, 'https://i.ebayimg.com/images/g/JmMAAeSwUztpqvu5/s-l500.webp', true, 6),
('Lenses and filters', 'lenses-filters', 'Camera lenses and filtering equipment', NULL, 'https://i.ebayimg.com/images/g/RusAAeSw0uxpqvtW/s-l500.webp', true, 7),
-- Other Top-level Categories
('Automotive', 'automotive', 'Car parts and accessories', NULL, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', true, 8),
('Fashion', 'fashion', 'Clothing and fashion items', NULL, 'https://images.unsplash.com/photo-1445205170230-053b83016050', true, 9),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a', true, 10),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', NULL, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211', true, 11),
('Books', 'books', 'Books and educational materials', NULL, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d', true, 12),

-- Sub-categories for Laptops (Parent 1)
('Gaming Laptops', 'gaming-laptops', 'High-performance gaming laptops', 1, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302', true, 0),
('Business Laptops', 'business-laptops', 'Professional and business-oriented laptops', 1, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853', true, 0),
('MacBooks', 'macbooks', 'Apple MacBook Air and Pro', 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8', true, 0),

-- Sub-categories for Computer parts (Parent 2)
('Processors (CPUs)', 'cpus', 'Intel and AMD processors', 2, 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea', true, 0),
('Graphics Cards (GPUs)', 'gpus', 'NVIDIA and AMD graphics cards', 2, 'https://images.unsplash.com/photo-1591488320449-011701bb6704', true, 0),
('Motherboards', 'motherboards', 'Desktop and server motherboards', 2, 'https://images.unsplash.com/photo-1518770660439-4636190af475', true, 0),

-- Sub-categories for Smartphones (Parent 3)
('iPhones', 'iphones', 'Apple iPhone models', 3, 'https://images.unsplash.com/photo-1592286927505-2fd6c44d0fb4', true, 0),
('Android Phones', 'android-phones', 'Samsung, Google, and other Android devices', 3, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', true, 0),
('Phone Accessories', 'phone-accessories', 'Cases, chargers, and more', 3, 'https://images.unsplash.com/photo-1601595225554-dfca2bb686a0', true, 0),

-- Sub-categories for Fashion (Parent 9)
('Men''s Clothing', 'mens-clothing', 'Clothing for men', 9, 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891', true, 0),
('Women''s Clothing', 'womens-clothing', 'Clothing for women', 9, 'https://images.unsplash.com/photo-1483985988355-763728e1935b', true, 0),
('Shoes', 'shoes', 'Footwear for all', 9, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2', true, 0),

-- Trending on eBay (7 Categories) - IDs 25 to 31
('Tech', 'tech-trending', 'Trending tech and gadgets', NULL, 'https://i.ebayimg.com/images/g/EosAAeSw~Wxpqvvs/s-l500.webp', true, 13),
('Motors', 'motors-trending', 'Trending automotive and parts', NULL, 'https://i.ebayimg.com/images/g/XjIAAeSwsrNpqvvs/s-l500.webp', true, 14),
('Luxury', 'luxury-trending', 'Luxury watches, bags and more', NULL, 'https://i.ebayimg.com/images/g/FBUAAeSwpDhpqvvs/s-l500.webp', true, 15),
('Collectibles and art', 'collectibles-art-trending', 'Art and rare collectibles', NULL, 'https://i.ebayimg.com/images/g/FvQAAeSwMcVpqvvs/s-l500.webp', true, 16),
('Home and garden', 'home-garden-trending', 'Trending home improvement items', NULL, 'https://i.ebayimg.com/images/g/WnYAAeSwPsRpqvvs/s-l500.webp', true, 17),
('Trading cards', 'trading-cards-trending', 'Popular trading cards and games', NULL, 'https://i.ebayimg.com/images/g/T6AAAeSwUotpqvvs/s-l500.webp', true, 18),
('Health and beauty', 'health-beauty-trending', 'Trending health and beauty products', NULL, 'https://i.ebayimg.com/images/g/M48AAeSwTkFpqvvs/s-l500.webp', true, 19);

-- ============================================
-- STORES
-- ============================================

INSERT INTO stores (seller_id, store_name, slug, description, banner_image_url, logo_url, is_active) VALUES
(2, 'John Tech Store', 'john-tech-store', 'Your trusted electronics partner. We sell genuine laptops, phones, and accessories.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa', 'https://ui-avatars.com/api/?name=John+Tech&size=200', true),
(3, 'Jane Fashion Hub', 'jane-fashion-hub', 'Latest fashion trends for men and women. Quality clothing at affordable prices.', 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04', 'https://ui-avatars.com/api/?name=Jane+Fashion&size=200', true),
(4, 'Mike Sports Pro', 'mike-sports-pro', 'Professional sports equipment and gear. Train like a champion!', 'https://images.unsplash.com/photo-1517649763962-0c623066013b', 'https://ui-avatars.com/api/?name=Mike+Sports&size=200', true),
(8, 'Robert Home Decor', 'robert-home-decor', 'Transform your home with our beautiful decor and furniture.', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7', 'https://ui-avatars.com/api/?name=Robert+Home&size=200', true);

-- ============================================
-- PRODUCTS
-- ============================================

-- Today's Deals (13 Products)
INSERT INTO products (title, slug, description, price, images, category_id, seller_id, store_id, is_auction, condition, brand, weight, view_count, status, stock, shipping_fee, original_price) VALUES
('Bose QuietComfort Ultra Noise Cancelling Headphones, Certified Refurbished', 'bose-qc-ultra-refurbished', 'World-class noise cancellation, quieter than ever before. Breakthrough spatialized audio for more immersive listening.', 5636010, ARRAY['https://i.ebayimg.com/images/g/WssAAOSwlkZn~6zp/s-l500.webp'], 21, 2, 1, false, 'refurbished', 'Bose', 0.25, 450, 'active', 25, 0, 6003006),
('Nintendo Switch OLED 64GB Game Console + 1 Year🛡️ Warranty', 'nintendo-switch-oled-64gb', 'Enjoy vivid colors and crisp contrast with a screen that makes colors pop.', 6552189, ARRAY['https://i.ebayimg.com/images/g/P-AAAeSwO7xpJxJI/s-l500.webp'], 5, 2, 1, false, 'new', 'Nintendo', 0.42, 890, 'active', 40, 0, 10485338),
('Apple iPhone 16 128GB Unlocked Smartphone A3081 Good Condition', 'apple-iphone-16-128gb', 'The latest iPhone 16 with advanced camera features and A18 chip performance.', 13080786, ARRAY['https://i.ebayimg.com/images/g/RjAAAeSwciNozaQf/s-l500.webp'], 19, 2, 1, false, 'used', 'Apple', 0.17, 1200, 'active', 15, 0, 18376014),
('Acer Nitro V 16" Gaming Laptop 16GB RAM 512GB SSD', 'acer-nitro-v-16-gaming', 'Powerful gaming performance with Ryzen 7 and RTX 40 series graphics.', 17065052, ARRAY['https://i.ebayimg.com/images/g/n~cAAeSwr4lpWBiQ/s-l500.webp'], 13, 2, 1, false, 'new', 'Acer', 2.50, 670, 'active', 10, 0, 21233078),
('Acer PM161Q 15.6in Portable Monitor FHD 1920x1080', 'acer-pm161q-portable-monitor', 'Sleek and portable monitor for on-the-go productivity.', 1096794, ARRAY['https://i.ebayimg.com/images/g/WscAAeSw0e5pq1as/s-l500.webp'], 2, 2, 1, false, 'refurbished', 'Acer', 0.97, 320, 'active', 50, 0, 2621138),
('Giraffe Tools Wet Dry Vacuum Cleaner with 30FT Retractable Hose', 'giraffe-tools-vacuum', 'Powerful wet/dry vacuum with a convenient retractable hose system.', 8257148, ARRAY['https://i.ebayimg.com/images/g/A~QAAeSwkONprEeb/s-l500.webp'], 10, 8, 4, false, 'new', 'Giraffe Tools', 12.00, 150, 'active', 20, 0, 12703304),
('14K Yellow Gold Curb Cuban Necklace Bracelet Chain Real Gold', '14k-gold-cuban-necklace', 'Genuine 14K yellow gold Cuban link chain for a classic look.', 3932100, ARRAY['https://i.ebayimg.com/images/g/jgoAAOSwW6JoVEUF/s-l500.webp'], 9, 3, 2, false, 'new', 'Unbranded', 0.05, 560, 'active', 100, 0, NULL),
('Samsung HW-B750F 5.1ch Bluetooth Soundbar with Wireless Subwoofer', 'samsung-soundbar-hw-b750f', 'Immersive 5.1 channel sound with powerful wireless bass.', 5714652, ARRAY['https://i.ebayimg.com/images/g/DsoAAOSw6jtoFS6e/s-l500.webp'], 21, 2, 1, false, 'new', 'Samsung', 8.50, 430, 'active', 30, 0, 15727089),
('Saucony Unisex ProGrid Omni 9 Socktop Shoes', 'saucony-progrid-omni-9', 'Original heritage style with modern comfort technologies.', 2174451, ARRAY['https://i.ebayimg.com/images/g/5o8AAeSwnkFo-M-m/s-l500.webp'], 24, 3, 2, false, 'new', 'Saucony', 0.80, 210, 'active', 60, 0, 4063170),
('Remote Control Lawn Mower 55°Climbing 459cc Local Warehouse', 'remote-lawn-mower-rc', 'Industrial grade remote control lawn mower for steep slopes.', 73372986, ARRAY['https://i.ebayimg.com/images/g/kXYAAeSwk0ppooOw/s-l500.webp'], 10, 8, 4, false, 'new', 'Unbranded', 150.00, 95, 'active', 5, 0, 83858586),
('Men''s UA Under Armour 1/2 Zip Tech Muscle Pullover Long Sleeve', 'under-armour-tech-pullover', 'Quick-drying, ultra-soft tech fabric for a more natural feel.', 650107, ARRAY['https://i.ebayimg.com/images/g/9gQAAOSw0ZlkG3Jz/s-l500.webp'], 22, 3, 2, false, 'new', 'Under Armour', 0.30, 890, 'active', 200, 0, 812634),
('Invicta Men''s Pro Diver 45mm Quartz Rubber Strap Watch', 'invicta-pro-diver-watch', 'Classic diving watch with reliable quartz movement and 100m water resistance.', 1048298, ARRAY['https://i.ebayimg.com/images/g/vwkAAeSwJaZpaRv9/s-l500.webp'], 9, 3, 2, false, 'new', 'Invicta', 0.15, 1400, 'active', 150, 0, 10354530),
('NEW 2025 Golf Buddy Voice XL GPS Speaker Pre Loaded 40k course', 'golf-buddy-voice-xl', 'Talking GPS rangefinder with Bluetooth speaker integration.', 1800000, ARRAY['https://i.ebayimg.com/images/g/TXIAAeSwL4ppqY6v/s-l500.webp'], 11, 4, 3, false, 'new', 'Golf Buddy', 0.20, 120, 'active', 45, 0, 2200000);

-- Bulk Generate 300 Products
INSERT INTO products (title, slug, description, price, images, category_id, seller_id, store_id, is_auction, condition, brand, weight, view_count, status, stock, shipping_fee, original_price)
SELECT 
    'Product ' || i, 
    'product-' || i || '-' || floor(random() * 10000), 
    'High quality product description for item ' || i || '. This is a sample product generated for testing the eBay clone buyer system.', 
    (random() * 5000000 + 100000)::DECIMAL(10,2), 
    ARRAY['https://picsum.photos/seed/p' || i || '/600/400', 'https://picsum.photos/seed/p' || i || 'b/600/400'], 
    (i % 24) + 1, 
    CASE WHEN i % 4 = 0 THEN 2 WHEN i % 4 = 1 THEN 3 WHEN i % 4 = 2 THEN 4 ELSE 8 END, 
    (i % 4) + 1, 
    (random() < 0.15),
    CASE WHEN i % 3 = 0 THEN 'new' WHEN i % 3 = 1 THEN 'used' ELSE 'refurbished' END,
    'Brand ' || (i % 10),
    (random() * 5 + 0.1)::DECIMAL(8,2),
    (random() * 5000)::INT,
    'active',
    (CASE WHEN random() < 0.3 THEN 0 ELSE (floor(random() * 5) * 10000 + 15000) END)::DECIMAL(10,2),
    (random() * 100 + 5)::INT,
    NULL
FROM generate_series(34, 333) s(i);

-- ============================================
-- INVENTORY
-- ============================================

INSERT INTO inventory (product_id, quantity, reserved_quantity, last_updated)
SELECT id, stock, (random() * 5)::INT, CURRENT_TIMESTAMP FROM products;

-- ============================================
-- CARTS
-- ============================================

INSERT INTO carts (user_id) VALUES (5), (6), (7), (9);

-- ============================================
-- CART ITEMS
-- ============================================

INSERT INTO cart_items (cart_id, product_id, quantity) VALUES
(1, 2, 1),
(1, 3, 1),
(2, 8, 2),
(3, 6, 1),
(3, 10, 1),
(4, 1, 1);

-- ============================================
-- ORDERS
-- ============================================

INSERT INTO orders (buyer_id, address_id, order_date, subtotal, shipping_fee, tax, discount_amount, total_price, status) VALUES
(5, 1, CURRENT_TIMESTAMP - INTERVAL '10 days', 33440000, 0, 3344000, 500000, 36284000, 'delivered'),
(6, 3, CURRENT_TIMESTAMP - INTERVAL '7 days', 2990000, 50000, 299000, 0, 3339000, 'shipped'),
(7, 4, CURRENT_TIMESTAMP - INTERVAL '5 days', 1340000, 30000, 134000, 0, 1504000, 'processing'),
(9, 6, CURRENT_TIMESTAMP - INTERVAL '3 days', 890000, 25000, 89000, 0, 1004000, 'confirmed'),
(10, 7, CURRENT_TIMESTAMP - INTERVAL '1 day', 450000, 20000, 45000, 0, 515000, 'pending');

-- Update order numbers (trigger will set them, but let's ensure)
UPDATE orders SET order_number = 'ORD-' || TO_CHAR(order_date, 'YYYYMMDD') || '-' || LPAD(id::TEXT, 6, '0');

-- ============================================
-- ORDER ITEMS
-- ============================================

INSERT INTO order_items (order_id, product_id, seller_id, quantity, unit_price, total_price) VALUES
-- Order 1
(1, 2, 2, 1, 32990000, 32990000),
(1, 9, 3, 1, 450000, 450000),
-- Order 2
(2, 8, 3, 1, 2990000, 2990000),
-- Order 3
(3, 6, 3, 1, 450000, 450000),
(3, 10, 3, 1, 890000, 890000),
-- Order 4
(4, 7, 3, 1, 890000, 890000),
-- Order 5
(5, 14, 8, 1, 450000, 450000);

-- ============================================
-- PAYMENTS
-- ============================================

INSERT INTO payments (order_id, user_id, amount, method, status, transaction_id, payment_gateway, paid_at) VALUES
(1, 5, 36284000, 'paypal', 'completed', 'PAYPAL-123456789', 'paypal', CURRENT_TIMESTAMP - INTERVAL '10 days'),
(2, 6, 3339000, 'credit_card', 'completed', 'CC-987654321', 'stripe', CURRENT_TIMESTAMP - INTERVAL '7 days'),
(3, 7, 1504000, 'paypal', 'completed', 'PAYPAL-456789123', 'paypal', CURRENT_TIMESTAMP - INTERVAL '5 days'),
(4, 9, 1004000, 'cod', 'pending', NULL, 'cod', NULL),
(5, 10, 515000, 'bank_transfer', 'pending', NULL, 'bank_transfer', NULL);

-- ============================================
-- SHIPPING INFO
-- ============================================

INSERT INTO shipping_info (order_id, carrier, tracking_number, status, shipped_at, estimated_arrival, delivered_at) VALUES
(1, 'VNPost', 'VNP123456789VN', 'delivered', CURRENT_TIMESTAMP - INTERVAL '9 days', CURRENT_TIMESTAMP - INTERVAL '7 days', CURRENT_TIMESTAMP - INTERVAL '6 days'),
(2, 'GHN', 'GHN987654321VN', 'in_transit', CURRENT_TIMESTAMP - INTERVAL '6 days', CURRENT_TIMESTAMP + INTERVAL '1 day', NULL),
(3, 'J&T Express', 'JT456789123VN', 'pending', NULL, CURRENT_TIMESTAMP + INTERVAL '3 days', NULL),
(4, NULL, NULL, 'pending', NULL, NULL, NULL),
(5, NULL, NULL, 'pending', NULL, NULL, NULL);

-- ============================================
-- COUPONS
-- ============================================

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount, start_date, end_date, max_usage, used_count, is_active, applicable_to) VALUES
('WELCOME2024', 'Welcome discount for new users', 'percentage', 10.00, 500000, 500000, '2024-01-01', '2024-12-31', 1000, 45, true, 'all'),
('NEWYEAR50', 'New Year special - 50k off', 'fixed', 50000, 1000000, 50000, '2024-01-01', '2024-01-31', 500, 123, true, 'all'),
('ELECTRONICS15', '15% off on electronics', 'percentage', 15.00, 2000000, 1000000, '2024-01-01', '2024-12-31', 200, 34, true, 'category'),
('FASHION20', '20% off on fashion items', 'percentage', 20.00, 500000, 300000, '2024-01-01', '2024-12-31', 300, 67, true, 'category'),
('FREESHIP', 'Free shipping on orders over 1M', 'fixed', 50000, 1000000, 50000, '2024-01-01', '2024-12-31', 10000, 456, true, 'all');

-- Link coupons to categories
UPDATE coupons SET category_id = 1 WHERE code = 'ELECTRONICS15';
UPDATE coupons SET category_id = 2 WHERE code = 'FASHION20';

-- ============================================
-- COUPON USAGE
-- ============================================

INSERT INTO coupon_usage (coupon_id, user_id, order_id, used_at) VALUES
(1, 5, 1, CURRENT_TIMESTAMP - INTERVAL '10 days');

-- ============================================
-- REVIEWS
-- ============================================

INSERT INTO reviews (product_id, reviewer_id, order_id, rating, title, comment, images, is_verified_purchase, helpful_count) VALUES
(2, 5, 1, 5, 'Amazing phone!', 'Best iPhone I have ever used. Camera quality is outstanding, battery life is great, and the titanium design feels premium.', ARRAY['https://images.unsplash.com/photo-1592286927505-2fd6c44d0fb4'], true, 12),
(9, 5, 1, 4, 'Good quality shirt', 'Nice fabric and comfortable fit. Color is exactly as shown in the picture. Recommend!', NULL, true, 5),
(8, 6, 2, 5, 'Perfect sneakers!', 'Very comfortable and stylish. Great for running and casual wear. Highly recommend!', ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff'], true, 8),
(6, 7, 3, 5, 'Love this shirt!', 'Perfect fit, great quality material. Will definitely buy more colors!', NULL, true, 3),
(10, 7, 3, 4, 'Nice sunglasses', 'Good quality and stylish design. UV protection works well.', NULL, true, 2),
(1, 9, NULL, 5, 'Best laptop for developers', 'M3 Max chip is incredibly fast. Perfect for coding, video editing, and multitasking.', NULL, false, 15),
(3, 10, NULL, 5, 'Excellent noise cancellation', 'Best headphones for traveling and working. Sound quality is amazing!', NULL, false, 7);

-- ============================================
-- SELLER FEEDBACK
-- ============================================

INSERT INTO seller_feedback (seller_id, average_rating, total_reviews, positive_count, neutral_count, negative_count) VALUES
(2, 4.86, 7, 6, 1, 0),
(3, 4.75, 8, 7, 1, 0),
(4, 0, 0, 0, 0, 0),
(8, 0, 0, 0, 0, 0);

-- ============================================
-- BIDS (for auction products)
-- ============================================

INSERT INTO bids (product_id, bidder_id, amount, bid_time, is_winning) VALUES
(5, 5, 66000000, CURRENT_TIMESTAMP - INTERVAL '2 days', false),
(5, 6, 66500000, CURRENT_TIMESTAMP - INTERVAL '1 day', false),
(5, 7, 67000000, CURRENT_TIMESTAMP - INTERVAL '12 hours', false),
(5, 9, 68000000, CURRENT_TIMESTAMP - INTERVAL '6 hours', true);

-- Update auction end time
UPDATE products SET auction_end_time = CURRENT_TIMESTAMP + INTERVAL '2 days' WHERE id = 5;

-- ============================================
-- RETURN REQUESTS
-- ============================================

INSERT INTO return_requests (order_id, user_id, reason, status, refund_amount, created_at) VALUES
(1, 5, 'Product has a minor defect on the screen. Want to return for replacement.', 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '2 days');

-- ============================================
-- DISPUTES
-- ============================================

INSERT INTO disputes (order_id, raised_by, description, status, created_at) VALUES
(2, 6, 'Package was damaged during shipping. Shoes have scratches.', 'in_progress', CURRENT_TIMESTAMP - INTERVAL '3 days');

-- ============================================
-- MESSAGES
-- ============================================

INSERT INTO messages (sender_id, receiver_id, subject, content, is_read, read_at) VALUES
(5, 2, 'Question about MacBook Pro', 'Hi, does the MacBook come with international warranty?', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(2, 5, 'RE: Question about MacBook Pro', 'Yes, it comes with 1-year international warranty from Apple.', true, CURRENT_TIMESTAMP - INTERVAL '8 days'),
(6, 3, 'Inquiry about return policy', 'What is your return policy for sneakers?', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(3, 6, 'RE: Inquiry about return policy', 'We offer 30-day return policy for all unused items with original packaging.', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 4, 'Tennis racket availability', 'Do you have the tennis racket in stock? I need 2 sets.', false, NULL),
(9, 8, 'Question about desk lamp', 'Can I use this lamp with a power bank?', true, CURRENT_TIMESTAMP - INTERVAL '1 day'),
(8, 9, 'RE: Question about desk lamp', 'Yes, it has a USB-C port that works with power banks.', false, NULL);

-- ============================================
-- NOTIFICATIONS
-- ============================================

INSERT INTO notifications (user_id, type, title, body, link, is_read, read_at) VALUES
('5', 'order', 'Order Delivered', 'Your order #ORD-20240105-000001 has been delivered successfully!', '/orders/1', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
('5', 'promotion', 'New Year Sale!', 'Get 20% off on all electronics. Use code: NEWYEAR20', '/promotions', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('6', 'shipping', 'Order Shipped', 'Your order #ORD-20240108-000002 is on the way!', '/orders/2', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
('6', 'message', 'New Message', 'You have a new message from Jane Fashion Hub', '/messages', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('7', 'order', 'Order Confirmed', 'Your order #ORD-20240110-000003 has been confirmed!', '/orders/3', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
('7', 'promotion', 'Flash Sale Alert!', 'Flash sale on fashion items starting now!', '/promotions', false, NULL),
('9', 'order', 'Order Confirmed', 'Your order #ORD-20240112-000004 has been confirmed!', '/orders/4', true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
('9', 'message', 'New Message', 'Robert Home Decor replied to your message', '/messages', false, NULL),
('10', 'order', 'Payment Pending', 'Please complete payment for order #ORD-20240114-000005', '/orders/5', false, NULL),
('10', 'system', 'Welcome!', 'Welcome to Clone eBay! Start shopping now and enjoy exclusive deals.', '/', false, NULL);

-- ============================================
-- WISHLISTS
-- ============================================

INSERT INTO wishlists (user_id, product_id) VALUES
(5, 1),
(5, 4),
(5, 11),
(6, 2),
(6, 7),
(7, 3),
(7, 5),
(7, 12),
(9, 1),
(9, 13),
(10, 8),
(10, 16);

-- ============================================
-- AUDIT LOGS
-- ============================================

INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, changed_by, ip_address, user_agent) VALUES
('products', 1, 'UPDATE', 
    '{"price": 85990000, "view_count": 1200}'::jsonb, 
    '{"price": 89990000, "view_count": 1250}'::jsonb, 
    2, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    
('orders', 1, 'UPDATE', 
    '{"status": "shipped"}'::jsonb, 
    '{"status": "delivered"}'::jsonb, 
    1, '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'),
    
('users', 5, 'UPDATE', 
    '{"email": "sarah.buyer@gmail.com", "last_login": "2024-01-01 10:00:00"}'::jsonb, 
    '{"email": "sarah.buyer@gmail.com", "last_login": "2024-01-15 14:30:00"}'::jsonb, 
    5, '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)'),
    
('inventory', 2, 'UPDATE', 
    '{"quantity": 55, "reserved_quantity": 3}'::jsonb, 
    '{"quantity": 50, "reserved_quantity": 5}'::jsonb, 
    2, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'),
    
('coupons', 1, 'UPDATE', 
    '{"used_count": 40}'::jsonb, 
    '{"used_count": 45}'::jsonb, 
    1, '10.0.0.1', 'System/1.0');

-- ============================================
-- REFRESH TOKENS (Sample - expired)
-- ============================================

INSERT INTO refresh_tokens (user_id, token, expires_at, created_by_ip) VALUES
(5, 'refresh_token_abc123xyz789_user5_expired', CURRENT_TIMESTAMP - INTERVAL '1 day', '192.168.1.102'),
(6, 'refresh_token_def456uvw012_user6_expired', CURRENT_TIMESTAMP - INTERVAL '2 days', '192.168.1.103');

-- Note: Active refresh tokens should be generated by your .NET Core application during login

-- ============================================
-- UPDATE STATISTICS
-- ============================================

-- Update product view counts based on reviews and activity
UPDATE products SET view_count = view_count + (SELECT COUNT(*) * 50 FROM reviews WHERE product_id = products.id);

-- Update seller feedback averages
UPDATE seller_feedback sf 
SET 
    average_rating = (
        SELECT COALESCE(AVG(r.rating), 0) 
        FROM reviews r 
        JOIN products p ON r.product_id = p.id 
        WHERE p.seller_id = sf.seller_id
    ),
    total_reviews = (
        SELECT COUNT(*) 
        FROM reviews r 
        JOIN products p ON r.product_id = p.id 
        WHERE p.seller_id = sf.seller_id
    ),
    positive_count = (
        SELECT COUNT(*) 
        FROM reviews r 
        JOIN products p ON r.product_id = p.id 
        WHERE p.seller_id = sf.seller_id AND r.rating >= 4
    ),
    neutral_count = (
        SELECT COUNT(*) 
        FROM reviews r 
        JOIN products p ON r.product_id = p.id 
        WHERE p.seller_id = sf.seller_id AND r.rating = 3
    ),
    negative_count = (
        SELECT COUNT(*) 
        FROM reviews r 
        JOIN products p ON r.product_id = p.id 
        WHERE p.seller_id = sf.seller_id AND r.rating <= 2
    );

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify data insertion

-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_products FROM products;
-- SELECT COUNT(*) as total_orders FROM orders;
-- SELECT COUNT(*) as total_reviews FROM reviews;
-- 
-- -- Check products with inventory
-- SELECT p.title, i.quantity, i.reserved_quantity 
-- FROM products p 
-- JOIN inventory i ON p.id = i.product_id 
-- LIMIT 10;
-- 
-- -- Check orders with items
-- SELECT o.order_number, o.total_price, o.status, COUNT(oi.id) as item_count
-- FROM orders o
-- JOIN order_items oi ON o.id = oi.order_id
-- GROUP BY o.id
-- ORDER BY o.order_date DESC;
-- 
-- -- Check top rated products
-- SELECT p.title, AVG(r.rating) as avg_rating, COUNT(r.id) as review_count
-- FROM products p
-- LEFT JOIN reviews r ON p.id = r.product_id
-- GROUP BY p.id
-- ORDER BY avg_rating DESC, review_count DESC
-- LIMIT 10;

-- ============================================
-- BANNERS
-- ============================================

INSERT INTO banners (title, description, cta_text, image_url, link_url, bg_color, text_color, type, items, display_order, is_active) VALUES
('Free shipping. Global shopping.', 'Shop internationally and enjoy free shipping on many items.', 'Shop now', 'https://i.ebayimg.com/images/g/OzMAAeSwlPBpEfM2/s-l960.webp', '/search?keyword=free+shipping', '#7E57C2', '#EDE7F6', 'single', NULL, 1, true),
('Endless accessories. Epic prices.', 'Browse millions of upgrades for your ride.', 'Explore offers', 'https://i.ebayimg.com/images/g/J6UAAeSwzfpouXBe/s-l960.webp', '/category/automotive', '#0064D2', '#FFFFFF', 'single', NULL, 2, true),
('Build an elite collection', 'Choose your next adventure from thousands of finds.', 'Shop now', NULL, '/search?keyword=collectibles', '#0064D2', '#FFFFFF', 'multi', '[{"title": "Lego", "image": "https://i.ebayimg.com/images/g/HI8AAeSwpUxotaQQ/s-l500.webp", "link": "/search?keyword=Lego"}, {"title": "Coins", "image": "https://i.ebayimg.com/images/g/65UAAeSwuolotaQU/s-l500.webp", "link": "/search?keyword=Coins"}, {"title": "Comic books", "image": "https://i.ebayimg.com/images/g/tnAAAeSww7RotaQY/s-l500.webp", "link": "/search?keyword=Comic+books"}]', 3, true),
('It’s up to you', 'Customize your ride, your way, with a selection of parts on eBay.', 'Explore offers', 'https://i.ebayimg.com/images/g/fl4AAeSwV0hpndZs/s-l960.webp', '/category/automotive', '#0064D2', '#FFFFFF', 'single', NULL, 4, true);

-- ============================================
-- END OF SAMPLE DATA SCRIPT
-- ============================================

ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE reviews;
ANALYZE inventory;

SELECT 'Sample data inserted successfully!' as status;