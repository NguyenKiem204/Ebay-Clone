-- ============================================
-- SAMPLE DATA FOR CLONE EBAY DATABASE
-- Run this after creating the schema
-- ============================================

-- ============================================
-- USERS
-- ============================================
-- Note: Passwords are hashed using BCrypt
-- All passwords are: "Password123!"

INSERT INTO users (username, email, password_hash, role, avatar_url, is_email_verified, is_active) VALUES
('admin_user', 'admin@ebay.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'admin', 'https://i.pravatar.cc/150?img=1', true, true),
('john_seller', 'john.seller@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=2', true, true),
('jane_shop', 'jane.shop@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=3', true, true),
('mike_store', 'mike.store@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=4', true, true),
('sarah_buyer', 'sarah.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=5', true, true),
('david_buyer', 'david.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=6', true, true),
('emma_buyer', 'emma.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=7', true, true),
('robert_seller', 'robert.seller@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'seller', 'https://i.pravatar.cc/150?img=8', true, true),
('lisa_buyer', 'lisa.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=9', true, true),
('tom_buyer', 'tom.buyer@gmail.com', '$2a$11$vPMxwZZgbxLfXmKxHqQOvOYdKVPPXqXqXqXqXqXqXqXqXqXqXqXqX', 'buyer', 'https://i.pravatar.cc/150?img=10', true, true);

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

INSERT INTO categories (name, slug, description, parent_id, image_url, is_active) VALUES
('Electronics', 'electronics', 'Electronic devices and accessories', NULL, 'https://images.unsplash.com/photo-1498049794561-7780e7231661', true),
('Fashion', 'fashion', 'Clothing and fashion items', NULL, 'https://images.unsplash.com/photo-1445205170230-053b83016050', true),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, 'https://images.unsplash.com/photo-1484101403633-562f891dc89a', true),
('Sports & Outdoors', 'sports-outdoors', 'Sports equipment and outdoor gear', NULL, 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211', true),
('Books', 'books', 'Books and educational materials', NULL, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d', true),
('Toys & Games', 'toys-games', 'Toys, games and entertainment', NULL, 'https://images.unsplash.com/photo-1558060370-d644479cb6f7', true),
('Health & Beauty', 'health-beauty', 'Health and beauty products', NULL, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571', true),
('Automotive', 'automotive', 'Car parts and accessories', NULL, 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7', true),

-- Sub-categories for Electronics
('Laptops', 'laptops', 'Laptop computers', 1, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853', true),
('Smartphones', 'smartphones', 'Mobile phones and accessories', 1, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9', true),
('Cameras', 'cameras', 'Digital cameras and equipment', 1, 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd', true),
('Audio', 'audio', 'Headphones, speakers, and audio equipment', 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e', true),

-- Sub-categories for Fashion
('Men''s Clothing', 'mens-clothing', 'Clothing for men', 2, 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891', true),
('Women''s Clothing', 'womens-clothing', 'Clothing for women', 2, 'https://images.unsplash.com/photo-1483985988355-763728e1935b', true),
('Shoes', 'shoes', 'Footwear for all', 2, 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2', true),
('Accessories', 'accessories', 'Fashion accessories', 2, 'https://images.unsplash.com/photo-1523779917675-b6ed3a42a561', true);

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

INSERT INTO products (title, slug, description, price, images, category_id, seller_id, store_id, is_auction, condition, brand, weight, view_count) VALUES
-- Electronics
('MacBook Pro 16" M3 Max', 'macbook-pro-16-m3-max', 'Latest MacBook Pro with M3 Max chip, 36GB RAM, 1TB SSD. Perfect for professionals.', 89990000, ARRAY['https://images.unsplash.com/photo-1517336714731-489689fd1ca8', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'], 9, 2, 1, false, 'new', 'Apple', 2.15, 1250),
('iPhone 15 Pro Max 256GB', 'iphone-15-pro-max-256gb', 'Latest iPhone with titanium design, A17 Pro chip, amazing camera system.', 32990000, ARRAY['https://images.unsplash.com/photo-1592286927505-2fd6c44d0fb4', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'], 10, 2, 1, false, 'new', 'Apple', 0.22, 2340),
('Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5-headphones', 'Industry-leading noise cancellation, exceptional sound quality, 30-hour battery life.', 8990000, ARRAY['https://images.unsplash.com/photo-1505740420928-5e560c06d30e', 'https://images.unsplash.com/photo-1524678606370-a47ad25cb82a'], 12, 2, 1, false, 'new', 'Sony', 0.25, 890),
('Dell XPS 15 Laptop', 'dell-xps-15-laptop', 'Powerful laptop with Intel i7, 16GB RAM, 512GB SSD, perfect for work and creativity.', 45990000, ARRAY['https://images.unsplash.com/photo-1593642632823-8f785ba67e45', 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2'], 9, 2, 1, false, 'new', 'Dell', 1.83, 567),
('Canon EOS R6 Camera', 'canon-eos-r6-camera', 'Full-frame mirrorless camera, 20MP, 4K video, perfect for photography enthusiasts.', 65990000, ARRAY['https://images.unsplash.com/photo-1502920917128-1aa500764cbd', 'https://images.unsplash.com/photo-1606980620778-59a1c1f2c100'], 11, 2, 1, true, 'new', 'Canon', 0.68, 445),

-- Fashion
('Men''s Casual Shirt Blue', 'mens-casual-shirt-blue', 'Comfortable cotton shirt, perfect for casual wear. Available in multiple sizes.', 450000, ARRAY['https://images.unsplash.com/photo-1596755094514-f87e34085b2c', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'], 13, 3, 2, false, 'new', 'Zara', 0.30, 234),
('Women''s Summer Dress', 'womens-summer-dress', 'Light and breezy summer dress, perfect for hot weather. Beautiful floral pattern.', 890000, ARRAY['https://images.unsplash.com/photo-1595777457583-95e059d581b8', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1'], 14, 3, 2, false, 'new', 'H&M', 0.25, 567),
('Nike Air Max Sneakers', 'nike-air-max-sneakers', 'Comfortable and stylish sneakers for everyday wear. Cushioned sole, breathable material.', 2990000, ARRAY['https://images.unsplash.com/photo-1542291026-7eec264c27ff', 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa'], 15, 3, 2, false, 'new', 'Nike', 0.80, 1890),
('Leather Wallet Brown', 'leather-wallet-brown', 'Genuine leather wallet with multiple card slots and cash compartment.', 350000, ARRAY['https://images.unsplash.com/photo-1627123424574-724758594e93', 'https://images.unsplash.com/photo-1591561954555-607968c989ab'], 16, 3, 2, false, 'new', 'Fossil', 0.15, 123),
('Designer Sunglasses', 'designer-sunglasses', 'UV protection, polarized lenses, stylish frame. Perfect for sunny days.', 1250000, ARRAY['https://images.unsplash.com/photo-1511499767150-a48a237f0083', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f'], 16, 3, 2, false, 'new', 'Ray-Ban', 0.10, 345),

-- Sports
('Professional Yoga Mat', 'professional-yoga-mat', 'Non-slip, eco-friendly yoga mat. Perfect for all types of yoga and exercises.', 890000, ARRAY['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b'], 4, 4, 3, false, 'new', 'Lululemon', 1.20, 456),
('Basketball Pro', 'basketball-pro', 'Official size basketball, indoor/outdoor use, excellent grip.', 650000, ARRAY['https://images.unsplash.com/photo-1546519638-68e109498ffc', 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0'], 4, 4, 3, false, 'new', 'Spalding', 0.62, 234),
('Tennis Racket Set', 'tennis-racket-set', 'Professional tennis racket with carrying case and 3 balls included.', 2450000, ARRAY['https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67', 'https://images.unsplash.com/photo-1617882309324-a66b5163c742'], 4, 4, 3, false, 'new', 'Wilson', 0.35, 189),

-- Home & Garden
('Modern LED Desk Lamp', 'modern-led-desk-lamp', 'Adjustable LED desk lamp with touch control and USB charging port.', 450000, ARRAY['https://images.unsplash.com/photo-1513506003901-1e6a229e2d15', 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c'], 3, 8, 4, false, 'new', 'Philips', 0.65, 345),
('Ceramic Flower Vase', 'ceramic-flower-vase', 'Handmade ceramic vase, perfect for home decoration. Modern minimalist design.', 290000, ARRAY['https://images.unsplash.com/photo-1578500494198-246f612d3b3d', 'https://images.unsplash.com/photo-1610701596007-11502861dcfa'], 3, 8, 4, false, 'new', 'HomeDecor', 0.80, 123),

-- Books
('The Art of Computer Programming', 'art-of-computer-programming', 'Classic computer science book by Donald Knuth. Must-have for programmers.', 1250000, ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f', 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d'], 5, 2, 1, false, 'new', 'Addison-Wesley', 2.50, 567),
('Clean Code', 'clean-code', 'A Handbook of Agile Software Craftsmanship by Robert C. Martin.', 650000, ARRAY['https://images.unsplash.com/photo-1532012197267-da84d127e765', 'https://images.unsplash.com/photo-1589998059171-988d887df646'], 5, 2, 1, false, 'used', 'Prentice Hall', 0.75, 890);

-- ============================================
-- INVENTORY
-- ============================================

INSERT INTO inventory (product_id, quantity, reserved_quantity, last_updated) VALUES
(1, 15, 2, CURRENT_TIMESTAMP),
(2, 50, 5, CURRENT_TIMESTAMP),
(3, 30, 3, CURRENT_TIMESTAMP),
(4, 20, 1, CURRENT_TIMESTAMP),
(5, 8, 0, CURRENT_TIMESTAMP),
(6, 100, 10, CURRENT_TIMESTAMP),
(7, 75, 8, CURRENT_TIMESTAMP),
(8, 150, 15, CURRENT_TIMESTAMP),
(9, 200, 20, CURRENT_TIMESTAMP),
(10, 80, 5, CURRENT_TIMESTAMP),
(11, 120, 12, CURRENT_TIMESTAMP),
(12, 45, 3, CURRENT_TIMESTAMP),
(13, 30, 2, CURRENT_TIMESTAMP),
(14, 60, 4, CURRENT_TIMESTAMP),
(15, 90, 6, CURRENT_TIMESTAMP),
(16, 25, 1, CURRENT_TIMESTAMP),
(17, 40, 2, CURRENT_TIMESTAMP);

-- ============================================
-- CART ITEMS
-- ============================================

INSERT INTO cart_items (user_id, product_id, quantity) VALUES
(5, 2, 1),
(5, 3, 1),
(6, 8, 2),
(7, 6, 1),
(7, 10, 1),
(9, 1, 1);

-- ============================================
-- ORDERS
-- ============================================

INSERT INTO orders (buyer_id, address_id, order_date, subtotal, shipping_fee, tax, discount, total_price, status) VALUES
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

INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_discount, start_date, end_date, max_usage, used_count, is_active, applicable_to) VALUES
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

INSERT INTO notifications (user_id, type, title, message, link, is_read, read_at) VALUES
(5, 'order', 'Order Delivered', 'Your order #ORD-20240105-000001 has been delivered successfully!', '/orders/1', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(5, 'promotion', 'New Year Sale!', 'Get 20% off on all electronics. Use code: NEWYEAR20', '/promotions', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(6, 'shipping', 'Order Shipped', 'Your order #ORD-20240108-000002 is on the way!', '/orders/2', true, CURRENT_TIMESTAMP - INTERVAL '6 days'),
(6, 'message', 'New Message', 'You have a new message from Jane Fashion Hub', '/messages', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 'order', 'Order Confirmed', 'Your order #ORD-20240110-000003 has been confirmed!', '/orders/3', true, CURRENT_TIMESTAMP - INTERVAL '5 days'),
(7, 'promotion', 'Flash Sale Alert!', 'Flash sale on fashion items starting now!', '/promotions', false, NULL),
(9, 'order', 'Order Confirmed', 'Your order #ORD-20240112-000004 has been confirmed!', '/orders/4', true, CURRENT_TIMESTAMP - INTERVAL '3 days'),
(9, 'message', 'New Message', 'Robert Home Decor replied to your message', '/messages', false, NULL),
(10, 'order', 'Payment Pending', 'Please complete payment for order #ORD-20240114-000005', '/orders/5', false, NULL),
(10, 'system', 'Welcome!', 'Welcome to Clone eBay! Start shopping now and enjoy exclusive deals.', '/', false, NULL);

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
-- END OF SAMPLE DATA SCRIPT
-- ============================================

ANALYZE users;
ANALYZE products;
ANALYZE orders;
ANALYZE reviews;
ANALYZE inventory;

SELECT 'Sample data inserted successfully!' as status;