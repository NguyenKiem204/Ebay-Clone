# 🛒 eBay Clone — Kế hoạch Triển khai: Vai trò Người Mua (Buyer)

> **Phạm vi:** Buyer Features + Database + Phi chức năng
> **Lưu ý:** Team Buyer tự làm **toàn bộ hệ thống độc lập** — bao gồm cả data sản phẩm, không phụ thuộc team khác
> **Stack:** React + Node.js/NestJS + SQL Server + Redis

---

## 📦 PHẦN 1 — DATABASE

### Bảng sử dụng cho hệ thống Buyer

| Bảng | Vai trò |
|------|---------|
| `[User]` | Tài khoản buyer + seller giả (seed) |
| `[Address]` | Địa chỉ giao hàng của buyer |
| `[Product]` | Dữ liệu sản phẩm — **tự seed ~300 records** |
| `[Category]` | Danh mục sản phẩm — **tự seed ~20 records** |
| `[Inventory]` | Số lượng tồn kho |
| `[OrderTable]` | Đơn hàng của buyer |
| `[OrderItem]` | Chi tiết từng sản phẩm trong đơn |
| `[Payment]` | Thông tin thanh toán |
| `[ShippingInfo]` | Thông tin vận chuyển |
| `[ReturnRequest]` | Yêu cầu hoàn trả |
| `[Review]` | Đánh giá sản phẩm |
| `[Bid]` | Lịch sử đấu giá |
| `[Coupon]` | Mã giảm giá |
| `[Cart]` | Giỏ hàng — **tạo mới** |
| `[CartItem]` | Item trong giỏ — **tạo mới** |
| `[Wishlist]` | Sản phẩm yêu thích — **tạo mới** |
| `[Notification]` | Thông báo hệ thống — **tạo mới** |
| `[RefreshToken]` | Quản lý JWT Refresh Token — **tạo mới** |

---

### 🔧 Cần sửa / Thêm cột vào bảng hiện có

#### 1. Bảng `[User]`

```sql
ALTER TABLE [User] ADD
    [isEmailVerified]    BIT           DEFAULT 0,
    [emailVerifyToken]   NVARCHAR(255) NULL,
    [resetPasswordToken] NVARCHAR(255) NULL,
    [resetTokenExpiry]   DATETIME      NULL,
    [isActive]           BIT           DEFAULT 1,
    [phone]              NVARCHAR(20)  NULL,
    [createdAt]          DATETIME      DEFAULT GETDATE(),
    [lastLoginAt]        DATETIME      NULL;
```

#### 2. Bảng `[Product]`

```sql
ALTER TABLE [Product] ADD
    [status]      NVARCHAR(20)  DEFAULT 'active',
    [condition]   NVARCHAR(20)  NULL,
    [stock]       INT           DEFAULT 0,
    [viewCount]   INT           DEFAULT 0,
    [brand]       NVARCHAR(100) NULL,
    [shippingFee] DECIMAL(10,2) DEFAULT 0,
    [slug]        NVARCHAR(255) NULL,
    [createdAt]   DATETIME      DEFAULT GETDATE();
```

#### 3. Bảng `[Category]`

```sql
ALTER TABLE [Category] ADD
    [parentId]     INT           NULL FOREIGN KEY REFERENCES [Category](id),
    [slug]         NVARCHAR(100) NULL,
    [iconURL]      NVARCHAR(MAX) NULL,
    [displayOrder] INT           DEFAULT 0,
    [isActive]     BIT           DEFAULT 1;
```

#### 4. Bảng `[OrderTable]`

```sql
ALTER TABLE [OrderTable] ADD
    [couponId]       INT           NULL FOREIGN KEY REFERENCES [Coupon](id),
    [discountAmount] DECIMAL(10,2) DEFAULT 0,
    [shippingFee]    DECIMAL(10,2) DEFAULT 0,
    [note]           NVARCHAR(MAX) NULL,
    [updatedAt]      DATETIME      NULL;
```

#### 5. Bảng `[Coupon]`

```sql
ALTER TABLE [Coupon] ADD
    [discountType]   NVARCHAR(20)  DEFAULT 'percent',
    [minOrderAmount] DECIMAL(10,2) DEFAULT 0,
    [maxDiscount]    DECIMAL(10,2) NULL,
    [usedCount]      INT           DEFAULT 0,
    [isActive]       BIT           DEFAULT 1;
```

#### 6. Bảng `[Message]`

```sql
ALTER TABLE [Message] ADD
    [isRead] BIT DEFAULT 0;
```

---

### 🆕 Tạo mới các bảng còn thiếu

```sql
CREATE TABLE [Cart] (
    [id]        INT IDENTITY(1,1) PRIMARY KEY,
    [userId]    INT      FOREIGN KEY REFERENCES [User](id),
    [createdAt] DATETIME DEFAULT GETDATE(),
    [updatedAt] DATETIME NULL
);

CREATE TABLE [CartItem] (
    [id]        INT IDENTITY(1,1) PRIMARY KEY,
    [cartId]    INT      FOREIGN KEY REFERENCES [Cart](id),
    [productId] INT      FOREIGN KEY REFERENCES [Product](id),
    [quantity]  INT      DEFAULT 1,
    [addedAt]   DATETIME DEFAULT GETDATE()
);

CREATE TABLE [Wishlist] (
    [id]        INT IDENTITY(1,1) PRIMARY KEY,
    [userId]    INT      FOREIGN KEY REFERENCES [User](id),
    [productId] INT      FOREIGN KEY REFERENCES [Product](id),
    [addedAt]   DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_Wishlist UNIQUE ([userId], [productId])
);

CREATE TABLE [Notification] (
    [id]        INT IDENTITY(1,1) PRIMARY KEY,
    [userId]    INT           FOREIGN KEY REFERENCES [User](id),
    [type]      NVARCHAR(50)  NOT NULL,
    [title]     NVARCHAR(255) NOT NULL,
    [body]      NVARCHAR(MAX) NULL,
    [isRead]    BIT           DEFAULT 0,
    [link]      NVARCHAR(500) NULL,
    [createdAt] DATETIME      DEFAULT GETDATE()
);

CREATE TABLE [RefreshToken] (
    [id]         INT IDENTITY(1,1) PRIMARY KEY,
    [userId]     INT           FOREIGN KEY REFERENCES [User](id),
    [token]      NVARCHAR(500) NOT NULL,
    [expiresAt]  DATETIME      NOT NULL,
    [isRevoked]  BIT           DEFAULT 0,
    [deviceInfo] NVARCHAR(255) NULL,
    [createdAt]  DATETIME      DEFAULT GETDATE()
);
```

---

### 📊 Index khuyến nghị

```sql
CREATE INDEX IX_Product_CategoryId ON [Product]([categoryId]);
CREATE INDEX IX_Product_Status     ON [Product]([status]);
CREATE INDEX IX_Product_Price      ON [Product]([price]);
CREATE INDEX IX_Product_SellerId   ON [Product]([sellerId]);
CREATE INDEX IX_Order_BuyerId      ON [OrderTable]([buyerId]);
CREATE INDEX IX_Order_Status       ON [OrderTable]([status]);
CREATE INDEX IX_CartItem_CartId    ON [CartItem]([cartId]);
CREATE INDEX IX_Notification_User  ON [Notification]([userId], [isRead]);
CREATE INDEX IX_RefreshToken_Token ON [RefreshToken]([token]);
CREATE INDEX IX_Bid_ProductId      ON [Bid]([productId]);
```

---

## 🌱 PHẦN 2 — SEED DATA (Tự tạo dữ liệu)

> Team Buyer làm hệ thống **độc lập hoàn toàn** — không chờ team nào khác.
> Cần seed sẵn: Category, Seller giả, Product, Inventory, Coupon, Review mẫu.

---

### TASK S.1 — Seed Category

```sql
-- Danh mục cha
INSERT INTO [Category] (name, slug, displayOrder) VALUES
(N'Điện tử',           'dien-tu',   1),
(N'Thời trang',        'thoi-trang',2),
(N'Nhà cửa & Đời sống','nha-cua',   3),
(N'Thể thao',          'the-thao',  4),
(N'Sách',              'sach',      5);

-- Danh mục con
INSERT INTO [Category] (name, slug, parentId, displayOrder) VALUES
(N'Điện thoại',   'dien-thoai', 1, 1),
(N'Laptop',       'laptop',     1, 2),
(N'Tai nghe',     'tai-nghe',   1, 3),
(N'Đồng hồ',     'dong-ho',    1, 4),
(N'Áo nam',       'ao-nam',     2, 1),
(N'Áo nữ',        'ao-nu',      2, 2),
(N'Giày dép',     'giay-dep',   2, 3),
(N'Nội thất',     'noi-that',   3, 1),
(N'Nhà bếp',      'nha-bep',    3, 2),
(N'Dụng cụ thể thao','the-thao-dc',4, 1);
```

---

### TASK S.2 — Seed Seller giả

```javascript
// seed/seedSellers.js
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('Seed@123456', 12);

const sellers = [
  { username: 'TechShop_VN',   email: 'techshop@seed.com'  },
  { username: 'FashionStore',  email: 'fashion@seed.com'   },
  { username: 'HomeDecor_HCM', email: 'homedecor@seed.com' },
  { username: 'SportZone',     email: 'sport@seed.com'     },
  { username: 'BookWorld',     email: 'bookworld@seed.com' },
];

for (const s of sellers) {
  await db.query(`
    INSERT INTO [User] (username, email, password, role, isEmailVerified, isActive)
    VALUES (N'${s.username}', '${s.email}', '${hash}', 'seller', 1, 1)
  `);
}
// Tạo Store cho mỗi seller
await db.query(`
  INSERT INTO [Store] (sellerId, storeName, description)
  SELECT id, username + N' Store', N'Cửa hàng chính thức'
  FROM [User] WHERE role = 'seller'
`);
```

---

### TASK S.3 — Seed Product (~300 sản phẩm)

```bash
npm install @faker-js/faker --save-dev
```

```javascript
// seed/seedProducts.js
const { faker } = require('@faker-js/faker');

// categoryId → sellerId
const map = { 6:1, 7:1, 8:1, 9:1, 10:2, 11:2, 12:2, 13:3, 14:3, 15:4, 16:5 };

for (let i = 0; i < 300; i++) {
  const categoryId = faker.helpers.arrayElement(Object.keys(map));
  const sellerId   = map[categoryId];
  const price      = faker.number.float({ min: 50000, max: 50000000, precision: 1000 });
  const stock      = faker.number.int({ min: 0, max: 100 });
  const isAuction  = faker.datatype.boolean({ probability: 0.15 });

  await db.query(`
    INSERT INTO [Product]
      (title, description, price, images, categoryId, sellerId,
       condition, stock, brand, shippingFee, status, isAuction,
       auctionEndTime, viewCount, createdAt)
    VALUES (
      N'${faker.commerce.productName().replace(/'/g,"''")}',
      N'${faker.commerce.productDescription().replace(/'/g,"''")}',
      ${price},
      '["https://picsum.photos/seed/${i}a/400/400","https://picsum.photos/seed/${i}b/400/400"]',
      ${categoryId}, ${sellerId},
      '${faker.helpers.arrayElement(['new','used','refurbished'])}',
      ${stock}, N'${faker.company.name().replace(/'/g,"''")}',
      ${faker.helpers.arrayElement([0, 15000, 25000, 35000])},
      '${stock > 0 ? 'active' : 'sold'}',
      ${isAuction ? 1 : 0},
      ${isAuction ? `'${new Date(Date.now() + faker.number.int({min:1,max:7})*86400000).toISOString()}'` : 'NULL'},
      ${faker.number.int({ min: 0, max: 5000 })},
      '${faker.date.past({ years: 1 }).toISOString()}'
    )
  `);
}
console.log('Seeded 300 products');
```

---

### TASK S.4 — Seed Inventory

```sql
INSERT INTO [Inventory] (productId, quantity, lastUpdated)
SELECT id, stock, GETDATE() FROM [Product];
```

---

### TASK S.5 — Seed Coupon mẫu

```sql
INSERT INTO [Coupon]
  (code, discountPercent, discountType, minOrderAmount, maxDiscount,
   startDate, endDate, maxUsage, usedCount, isActive)
VALUES
('WELCOME10', 10, 'percent', 100000, 50000,
  GETDATE(), DATEADD(month,3,GETDATE()), 1000, 0, 1),
('FREESHIP',  35000, 'fixed', 200000, 35000,
  GETDATE(), DATEADD(month,1,GETDATE()), 500, 0, 1),
('SALE50K',   50000, 'fixed', 500000, 50000,
  GETDATE(), DATEADD(day,7,GETDATE()), 200, 0, 1);
```

---

### TASK S.6 — Seed Review mẫu

```javascript
// seed/seedReviews.js — tạo ~500 review để sản phẩm có rating
const productIds = (await db.query(
  'SELECT TOP 100 id FROM [Product] ORDER BY NEWID()'
)).recordset;

const buyerIds = (await db.query(
  'SELECT id FROM [User] WHERE role = \'buyer\''
)).recordset;

for (const { id: productId } of productIds) {
  const count = faker.number.int({ min: 2, max: 8 });
  for (let i = 0; i < count; i++) {
    const reviewer = faker.helpers.arrayElement(buyerIds);
    await db.query(`
      INSERT INTO [Review] (productId, reviewerId, rating, comment, createdAt)
      VALUES (
        ${productId}, ${reviewer.id},
        ${faker.number.int({ min: 3, max: 5 })},
        N'${faker.lorem.sentences(2).replace(/'/g,"''")}',
        '${faker.date.past({ years: 1 }).toISOString()}'
      )
    `);
  }
}
```

---

### TASK S.7 — Script chạy tất cả seed 1 lần

```javascript
// seed/index.js
async function main() {
  console.log('Bat dau seed database...');
  await require('./seedCategories')();  // ~15 records
  await require('./seedSellers')();     // ~5 records
  await require('./seedProducts')();    // ~300 records
  await require('./seedInventory')();   // ~300 records
  await require('./seedCoupons')();     // ~3 records
  await require('./seedReviews')();     // ~500 records
  console.log('Seed hoan tat!');
  process.exit(0);
}
main();
```

```json
// package.json scripts
{
  "scripts": {
    "seed":       "node seed/index.js",
    "seed:reset": "node seed/reset.js && node seed/index.js"
  }
}
```

---

## 👤 PHẦN 3 — BUYER FEATURES

---

### MODULE 1 — AUTHENTICATION

---

#### TASK 1.1 — Đăng ký tài khoản

**Backend**
- Endpoint: `POST /api/auth/register`
- Input: `{ username, email, password, confirmPassword }`
- Logic:
  1. Validate: email đúng format, password >= 8 ký tự, confirmPassword khớp
  2. Kiểm tra email đã tồn tại → 409 nếu trùng
  3. Hash password bcrypt (salt = 12)
  4. INSERT `[User]` với `role = 'buyer'`, `isEmailVerified = 0`
  5. Tạo `emailVerifyToken` (UUID v4), lưu DB
  6. Gửi email xác nhận qua Nodemailer
- Response: `201 { message: "Vui lòng kiểm tra email" }`

**Frontend**
- [ ] Form: username, email, password, confirm password
- [ ] Password strength indicator (yếu / trung bình / mạnh)
- [ ] Inline validation từng trường (React Hook Form + Yup)
- [ ] Nút submit có loading spinner, disable khi đang gửi
- [ ] Hiển thị lỗi cụ thể từ API (email đã tồn tại, v.v.)

---

#### TASK 1.2 — Xác nhận email

**Backend**
- `GET /api/auth/verify-email?token=xxx`
- Logic: Tìm User theo token → Set `isEmailVerified = 1` → Xóa token → Redirect `/login?verified=true`

**Frontend**
- [ ] Trang `/verify-email`: tự gọi API khi load, hiển thị spinner
- [ ] Thành công → nút "Đăng nhập ngay"
- [ ] Thất bại → nút "Gửi lại email xác nhận"

---

#### TASK 1.3 — Đăng nhập

**Backend**
- `POST /api/auth/login` — Input: `{ email, password }`
- Logic:
  1. Tìm User → 401 nếu không tồn tại
  2. Kiểm tra `isActive` → 403 nếu bị khóa
  3. Kiểm tra `isEmailVerified` → 403 nếu chưa xác nhận
  4. `bcrypt.compare` → 401 nếu sai
  5. Tạo Access Token JWT (exp: 15 phút, payload: userId, role)
  6. Tạo Refresh Token (UUID, exp: 7 ngày) → Lưu `[RefreshToken]`
  7. Set RT vào HttpOnly cookie
  8. Update `lastLoginAt`
- Response: `200 { accessToken, user: { id, username, email, role, avatarURL } }`

**Frontend**
- [ ] Form: email, password, checkbox "Ghi nhớ đăng nhập"
- [ ] Lưu Access Token vào Zustand store — **không dùng localStorage**
- [ ] Axios interceptor: tự gắn `Authorization: Bearer <token>`
- [ ] Redirect về trang trước khi bị chặn

---

#### TASK 1.4 — Auto Refresh Token & Đăng xuất

**Backend**
- `POST /api/auth/refresh` → Đọc cookie → Validate RT → Cấp AT mới
- `POST /api/auth/logout` → Revoke RT trong DB → Xóa cookie

**Frontend**
- [ ] Axios response interceptor: nhận 401 → gọi `/auth/refresh` → retry request gốc
- [ ] Nếu refresh thất bại → clear state → redirect `/login`

---

#### TASK 1.5 — Quên / Đặt lại mật khẩu

**Backend**
- `POST /api/auth/forgot-password` → Tạo token (exp: 1 giờ) → Gửi email
- `POST /api/auth/reset-password` → Validate token → Hash mật khẩu mới → Xóa token

**Frontend**
- [ ] Trang `/forgot-password`: nhập email → "Email đã được gửi nếu tồn tại"
- [ ] Trang `/reset-password?token=`: nhập mật khẩu mới + xác nhận → redirect `/login`

---

### MODULE 2 — QUẢN LÝ TÀI KHOẢN

---

#### TASK 2.1 — Xem & Cập nhật thông tin cá nhân

**Backend**
- `GET /api/users/me` → Thông tin user hiện tại (không trả password)
- `PUT /api/users/me` — Input: `{ username, phone }` → Validate → Cập nhật

**Frontend**
- [ ] Trang Profile: avatar, username, email (readonly), phone, ngày tham gia
- [ ] Form inline edit + nút Lưu / Hủy

---

#### TASK 2.2 — Cập nhật Avatar

**Backend**
- `PUT /api/users/me/avatar` → Multer → Upload Cloudinary → Lưu URL
- Giới hạn: jpg/png/webp, tối đa 2MB

**Frontend**
- [ ] Click avatar → file picker → preview → progress bar khi upload
- [ ] Cập nhật avatar trên Header ngay sau khi xong

---

#### TASK 2.3 — Đổi mật khẩu

**Backend**
- `PUT /api/users/me/password` — Input: `{ currentPassword, newPassword, confirmNewPassword }`
- Verify current → Hash new → Revoke tất cả RT của user

**Frontend**
- [ ] Form 3 trường, sau thành công → đăng xuất → redirect `/login`

---

#### TASK 2.4 — Quản lý địa chỉ giao hàng

**Backend**
- `GET /api/addresses` — `POST /api/addresses` (tối đa 10)
- `PUT /api/addresses/:id` — `DELETE /api/addresses/:id`
- `PUT /api/addresses/:id/default` → UPDATE tất cả `isDefault = 0` → SET id này `isDefault = 1`

**Frontend**
- [ ] Trang Address Book: danh sách dạng card, badge "Mặc định"
- [ ] Nút "Thêm địa chỉ" → Modal: fullName, phone, street, city, state, country, checkbox isDefault
- [ ] Nút Sửa / Xóa / Đặt làm mặc định, confirm dialog trước khi xóa

---

### MODULE 3 — XEM SẢN PHẨM

---

#### TASK 3.1 — Trang chủ

**Backend**
- `GET /api/products/featured` → Top 12 nhiều view + rating cao, cache Redis 5 phút
- `GET /api/products/auction` → Sản phẩm đang đấu giá chưa hết hạn, limit 8
- `GET /api/categories?parentOnly=true` → Danh mục cấp 1, cache 10 phút

**Frontend**
- [ ] Hero banner carousel
- [ ] Grid danh mục nổi bật (icon + tên, click → trang filter)
- [ ] Section "Sản phẩm nổi bật": 4 cột desktop, scroll ngang mobile
- [ ] Section "Đang đấu giá": card có countdown timer
- [ ] Skeleton loader khi fetch

---

#### TASK 3.2 — Danh sách sản phẩm & Tìm kiếm

**Backend**
- `GET /api/products?page=1&limit=20&categoryId=&minPrice=&maxPrice=&keyword=&sortBy=&condition=&isAuction=`
- Dynamic WHERE → JOIN Category + Seller → ORDER BY → Paginate
- `GET /api/products/suggest?q=` → Top 5 tên khớp (autocomplete)
- Cache Redis 60 giây, key = hash của query params
- Response: `{ data: [], total, page, totalPages }`

**Frontend**
- [ ] Search bar Header: debounce 300ms → suggest dropdown
- [ ] Trang `/products`: layout 2 cột (filter trái, grid phải)
- [ ] Sidebar filter: Danh mục cây / Khoảng giá (slider) / Tình trạng / Loại (Mua ngay | Đấu giá)
- [ ] Sort: Mới nhất / Giá tăng / Giá giảm / Rating cao nhất
- [ ] Toggle Grid / List view + Skeleton loading
- [ ] Breadcrumb: Trang chủ > Danh mục > Kết quả
- [ ] Mobile: filter ẩn sau nút "Bộ lọc" → bottom sheet

---

#### TASK 3.3 — Chi tiết sản phẩm

**Backend**
- `GET /api/products/:id` → Product + Seller (username, avatarURL, rating) + Category + Stock + avgRating
- `GET /api/products/:id/reviews?page=&rating=&limit=5`
- `GET /api/products/:id/related` → 8 sản phẩm cùng category
- Tăng `viewCount` (debounce Redis theo IP + productId, TTL 1 giờ)

**Frontend**
- [ ] Image gallery: ảnh chính + thumbnails + zoom on hover (desktop) + swipe (mobile)
- [ ] Thông tin: tên, thương hiệu, tình trạng, giá, stock, số đã bán
- [ ] Stepper số lượng (min=1, max=stock)
- [ ] Nút "Thêm vào giỏ" + "Mua ngay"
- [ ] Nút tim Wishlist (toggle)
- [ ] Seller card: avatar, tên, rating, nút "Nhắn tin"
- [ ] Tab: Mô tả / Đánh giá
- [ ] Section sản phẩm liên quan
- [ ] Nếu Auction: countdown + form đặt giá

---

### MODULE 4 — GIỎ HÀNG (CART)

---

#### TASK 4.1 — Giỏ hàng Hybrid (Guest + Logged in)

**Backend**
- `GET /api/cart` → Items + product info (tên, ảnh, giá, stock)
- `POST /api/cart/items` — Input: `{ productId, quantity }` → Kiểm tra stock
- `PUT /api/cart/items/:itemId` — Input: `{ quantity }`
- `DELETE /api/cart/items/:itemId` — `DELETE /api/cart`
- `POST /api/cart/merge` — Input: `[{ productId, quantity }]` → Merge sau đăng nhập

**Frontend**
- [ ] Guest cart: lưu `[{ productId, quantity }]` vào `localStorage`
- [ ] Sau đăng nhập: gọi `/cart/merge` → xóa localStorage
- [ ] Cart icon Header: badge tổng số lượng
- [ ] Mini cart drawer: hiện sau khi thêm, top 3 item + tổng
- [ ] Trang `/cart`:
  - Danh sách: ảnh, tên, đơn giá, stepper qty, nút xóa
  - Cảnh báo đỏ nếu qty > stock; item hết hàng disabled
  - Order summary: tạm tính / ship ước tính / tổng
  - Checkbox chọn từng item để checkout
  - Nút "Tiến hành thanh toán"

---

### MODULE 5 — CHECKOUT & ĐẶT HÀNG

---

#### TASK 5.1 — Quy trình Checkout 3 bước

**Backend**
- `POST /api/orders` — Input: `{ items, addressId, paymentMethod, couponCode, note }`
- Logic trong SQL Transaction:
  1. Validate stock + lấy giá từ DB (không tin giá từ client)
  2. Validate coupon nếu có
  3. Tính: subtotal + shippingFee - discountAmount = totalPrice
  4. INSERT `[OrderTable]`, `[OrderItem]`
  5. UPDATE `[Inventory].quantity` (trừ đi)
  6. INSERT `[Payment]` status = `pending`
  7. Tăng `coupon.usedCount`
  8. Xóa items đã order khỏi `[CartItem]`
  9. INSERT `[Notification]` "Đặt hàng thành công"
  10. Rollback toàn bộ nếu bất kỳ bước nào lỗi
- Response: `201 { orderId }`

**Frontend — Stepper 3 bước:**

**Bước 1 — Địa chỉ giao hàng**
- [ ] Radio select địa chỉ đã lưu, badge "Mặc định"
- [ ] Nút "Thêm địa chỉ mới" inline

**Bước 2 — Phương thức thanh toán**
- [ ] Radio: COD / PayPal
- [ ] Ô nhập mã giảm giá + nút "Áp dụng" → gọi `POST /api/coupons/validate`
  - Thành công: nhãn xanh "Giảm 50,000đ" + nút X hủy
  - Thất bại: thông báo đỏ lý do cụ thể
- [ ] Textarea ghi chú (tùy chọn)

**Bước 3 — Xác nhận đơn hàng**
- [ ] Tóm tắt: sản phẩm, địa chỉ, phương thức thanh toán
- [ ] Breakdown: tạm tính / giảm giá / ship / **Tổng cộng**
- [ ] Nút "Đặt hàng" → disable ngay sau click (chống double submit) → loading overlay
- [ ] Thành công → redirect `/order-success/:orderId`

---

#### TASK 5.2 — Thanh toán PayPal

**Backend**
- `POST /api/payments/paypal/create` → Tạo PayPal Order → `{ approveURL }`
- `POST /api/payments/paypal/capture` → Capture → UPDATE Payment `paid` + Order `confirmed` + Notification

**Frontend**
- [ ] Tích hợp `@paypal/react-paypal-js`
- [ ] Loading overlay khi đang capture
- [ ] Xử lý cancel → "Thanh toán bị hủy, đơn hàng chưa xác nhận"

---

#### TASK 5.3 — Trang đặt hàng thành công

**Frontend**
- [ ] Mã đơn hàng + tóm tắt + ngày giao hàng dự kiến
- [ ] Nút "Xem đơn hàng" + "Tiếp tục mua sắm"

---

### MODULE 6 — QUẢN LÝ ĐƠN HÀNG

---

#### TASK 6.1 — Danh sách đơn hàng

**Backend**
- `GET /api/orders?status=&page=&limit=10` → Chỉ đơn của `buyerId = currentUser.id`

**Frontend**
- [ ] Trang `/orders`: tab filter theo trạng thái
- [ ] Mỗi đơn: ảnh SP đầu tiên, tên, tổng tiền, ngày đặt, chip trạng thái màu
- [ ] Nút "Xem chi tiết" + "Mua lại"

---

#### TASK 6.2 — Chi tiết đơn hàng

**Backend**
- `GET /api/orders/:id` → Order + Items + Payment + ShippingInfo + ReturnRequest

**Frontend**
- [ ] Timeline trạng thái vertical: Đặt hàng → Xác nhận → Đang giao → Đã nhận
- [ ] Tracking: carrier, tracking number, estimated arrival
- [ ] Danh sách sản phẩm, địa chỉ, thông tin thanh toán, breakdown giá
- [ ] Nút "Viết đánh giá" (chỉ khi delivered + chưa review)
- [ ] Nút "Yêu cầu hoàn trả" (chỉ khi delivered + trong 30 ngày)
- [ ] Nút "Hủy đơn" (chỉ khi status = pending)

---

#### TASK 6.3 — Hủy đơn hàng

**Backend**
- `PUT /api/orders/:id/cancel` — Điều kiện: `status = 'pending'`
- Logic: UPDATE status → Hoàn lại Inventory → Tạo notification

**Frontend**
- [ ] Confirm dialog trước khi hủy
- [ ] Cập nhật UI ngay sau khi thành công

---

#### TASK 6.4 — Yêu cầu hoàn trả

**Backend**
- `POST /api/orders/:orderId/return` — Input: `{ reason }`
- Điều kiện: `status = 'delivered'` + trong vòng 30 ngày
- Logic: INSERT `[ReturnRequest]` → UPDATE order `status = 'return_requested'`

**Frontend**
- [ ] Modal: dropdown lý do (Sản phẩm lỗi / Không đúng mô tả / Đổi ý / Khác) + textarea
- [ ] Hiển thị trạng thái return trong chi tiết đơn

---

### MODULE 7 — ĐÁNH GIÁ SẢN PHẨM

---

#### TASK 7.1 — Viết đánh giá

**Backend**
- `POST /api/reviews` — Input: `{ productId, rating, comment }`
- Điều kiện: có OrderItem với productId trong đơn `delivered`
- Mỗi buyer chỉ review 1 lần / sản phẩm
- Sau insert: cập nhật `[Feedback]` của seller (averageRating, totalReviews, positiveRate)

**Frontend**
- [ ] Star rating 5 sao, hover preview, click chọn
- [ ] Textarea tối thiểu 10 ký tự
- [ ] Sau submit: ẩn form, hiện review vừa đăng ngay

---

#### TASK 7.2 — Xem đánh giá

**Backend**
- `GET /api/products/:id/reviews?page=&rating=&limit=5`
- Response: `{ data, averageRating, total, distribution: { 5:x, 4:x, 3:x, 2:x, 1:x } }`

**Frontend**
- [ ] Rating summary: số sao trung bình + bar chart phân bố
- [ ] Filter theo số sao
- [ ] Mỗi review: avatar, tên rút gọn, sao, comment, ngày

---

### MODULE 8 — ĐẤU GIÁ (AUCTION)

---

#### TASK 8.1 — Xem & Đặt giá thầu

**Backend**
- `GET /api/products/:id/bids` → Top 10 bid gần nhất
- `POST /api/bids` — Input: `{ productId, amount }`
- Validation: `amount > MAX(bid.amount)` + bước tối thiểu 1,000đ
- Điều kiện: `isAuction = 1` + `auctionEndTime > NOW()`
- Sau bid: emit Socket.IO `new_bid` tới room `product_${productId}`
- Gửi notification cho người bị vượt giá

**Cron job** (mỗi phút): Tìm auction hết giờ → Tạo Order cho người thắng → Gửi notification

**Frontend**
- [ ] Section Auction trong trang chi tiết (chỉ hiện nếu isAuction = true):
  - Giá hiện tại cập nhật real-time qua Socket
  - Số lượt đặt thầu + countdown timer
  - Input giá mới (min = currentMaxBid + 1000) + nút "Đặt giá"
  - Bảng top 5 bid gần nhất (cập nhật real-time)
- [ ] Toast "Bạn đã bị vượt giá!" khi nhận Socket event `outbid`
- [ ] Disable form sau khi auction kết thúc

---

### MODULE 9 — MÃ GIẢM GIÁ (COUPON)

---

#### TASK 9.1 — Áp dụng mã giảm giá

**Backend**
- `POST /api/coupons/validate` — Input: `{ code, orderAmount }`
- Kiểm tra: tồn tại → `isActive` → còn hạn → `usedCount < maxUsage` → `orderAmount >= minOrderAmount`
- Tính discount: `percent` → `min(amount * rate, maxDiscount)` | `fixed` → số tiền cố định
- Response: `{ valid: true, discountAmount, description }`

**Frontend**
- [ ] Ô input + nút "Áp dụng" (ở bước 2 Checkout)
- [ ] Thành công: nhãn xanh + nút X hủy mã; cập nhật tổng tiền ngay
- [ ] Thất bại: thông báo đỏ lý do cụ thể

---

### MODULE 10 — THÔNG BÁO (NOTIFICATION)

---

#### TASK 10.1 — Thông báo real-time

**Backend — Trigger tạo notification:**

| Sự kiện | Nội dung |
|---------|----------|
| Đặt hàng thành công | "Đơn hàng #xxx đã được đặt thành công" |
| Seller xác nhận | "Đơn hàng #xxx đã được xác nhận" |
| Đơn đang giao | "Đơn hàng #xxx đang trên đường giao" |
| Đơn đã giao | "Đơn hàng #xxx đã được giao thành công" |
| Bị vượt giá | "Bạn đã bị vượt giá tại sản phẩm [tên]" |
| Thắng đấu giá | "Chúc mừng! Bạn đã thắng đấu giá [tên]" |
| Tin nhắn mới | "[Tên seller] đã gửi tin nhắn cho bạn" |

- `GET /api/notifications?page=&isRead=`
- `PUT /api/notifications/:id/read` — `PUT /api/notifications/read-all`
- Socket.IO: emit `notification` tới room `user_${userId}`

**Frontend**
- [ ] Bell icon Header: badge đỏ số chưa đọc
- [ ] Dropdown top 5 mới nhất + link "Xem tất cả"
- [ ] Trang `/notifications`: nền khác màu cho chưa đọc
- [ ] Click → mark as read + navigate tới link
- [ ] Real-time: Socket event → tăng badge + toast popup + thêm vào đầu danh sách

---

### MODULE 11 — NHẮN TIN VỚI SELLER

---

#### TASK 11.1 — Chat Buyer & Seller

**Backend**
- `GET /api/messages/conversations` → Danh sách conversation (grouped by partner)
- `GET /api/messages/:userId?page=` → Lịch sử chat
- `POST /api/messages` — Input: `{ receiverId, content }` → INSERT → emit Socket
- Socket.IO: room `user_${userId}`, event `receive_message`

**Frontend**
- [ ] Trang `/messages`: layout 2 cột (conversations trái, chat box phải)
- [ ] Bubble: sent (phải, xanh) / received (trái, xám) + timestamp
- [ ] Input + nút gửi, Enter để gửi
- [ ] Real-time: tin mới hiển thị ngay không cần refresh
- [ ] Nút "Nhắn tin" trong trang chi tiết SP → mở conversation với seller đó

---

### MODULE 12 — WISHLIST

---

#### TASK 12.1 — Danh sách yêu thích

**Backend**
- `POST /api/wishlist/:productId` → Thêm (idempotent)
- `DELETE /api/wishlist/:productId` → Xóa
- `GET /api/wishlist` → Danh sách kèm product info

**Frontend**
- [ ] Icon tim trên Product Card: đỏ nếu đã lưu, outline nếu chưa (optimistic update)
- [ ] Trang `/wishlist`: grid sản phẩm, nút "Xóa" + "Thêm vào giỏ"

---

## 🔒 PHẦN 4 — PHI CHỨC NĂNG

---

### TASK P.1 — Bảo mật

| Hạng mục | Giải pháp | Cấu hình |
|----------|-----------|----------|
| Hash password | bcrypt | salt = 12 |
| Access Token | JWT | exp: 15 phút |
| Refresh Token | UUID, HttpOnly cookie | exp: 7 ngày |
| CSRF | SameSite=Strict | Kết hợp HttpOnly |
| Rate Limiting | express-rate-limit | Auth: 10 req/15p; API: 100 req/15p |
| XSS | helmet.js | CSP header |
| Input | class-validator | Validate + sanitize tất cả DTO |
| SQL Injection | Parameterized query | Không nối chuỗi SQL |
| HTTPS | Nginx SSL | Redirect HTTP → HTTPS |

**Checklist:**
- [ ] Không bao giờ trả password, token trong response
- [ ] Checkout: lấy giá từ DB, không tin giá từ client
- [ ] File upload: kiểm tra MIME type thực, giới hạn 2MB
- [ ] Mọi route cần auth phải có middleware `verifyToken`

---

### TASK P.2 — Performance (Target < 1 giây)

**Backend:**
- [ ] Redis cache: product list (TTL 60s) / product detail (TTL 5p) / categories (TTL 10p)
- [ ] Tránh N+1: dùng JOIN thay vì loop query
- [ ] Full-text index trên `Product.title`, `Product.brand`

**Frontend:**
- [ ] Code splitting: `React.lazy + Suspense` cho từng route
- [ ] Image lazy loading + placeholder blur
- [ ] React Query: cache response client-side
- [ ] Debounce search: 300ms

| Trang | Target |
|-------|--------|
| Trang chủ | < 1.5 giây |
| Danh sách / Tìm kiếm | < 1 giây |
| Chi tiết sản phẩm | < 1 giây |
| Checkout | < 1.5 giây |

---

### TASK P.3 — Responsive / Mobile

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile | < 640px | 1 cột, bottom nav |
| Tablet | 640–1024px | 2 cột |
| Desktop | > 1024px | Sidebar + main |

**Checklist:**
- [ ] Mobile Bottom Navigation: Home / Search / Cart / Notification / Profile
- [ ] Product grid: 1 cột → 2 cột → 4 cột
- [ ] Filter sidebar mobile: bottom sheet drawer
- [ ] Image gallery mobile: swipe (Swiper.js)
- [ ] Tap target tối thiểu: 44×44px
- [ ] Test: Chrome DevTools iPhone 14 + Samsung Galaxy S22

---

### TASK P.4 — Logging

```javascript
// 4 level rõ ràng
logger.error()  // Lỗi server, DB fail, exception không xử lý được
logger.warn()   // Coupon hết lượt, stock = 0, validation fail
logger.info()   // Request/response, tạo đơn, đăng nhập
logger.debug()  // Query SQL, payload chi tiết (chỉ bật ở dev)

// Format bắt buộc mỗi log
{
  "timestamp": "2025-01-15T10:30:00Z",
  "level": "info",
  "requestId": "req_abc123",
  "userId": 42,
  "method": "POST",
  "path": "/api/orders",
  "statusCode": 201,
  "duration": "245ms"
}
```

- [ ] Request ID middleware (UUID) gắn vào mọi log trong request
- [ ] Error middleware tập trung: phân loại 4xx vs 5xx
- [ ] Không log: password, token
- [ ] Frontend: Error Boundary cho mọi route chính

---

## 📋 PHẦN 5 — SPRINT PLAN (8 tuần)

| Sprint | Tuần | Backend | Frontend |
|--------|------|---------|----------|
| 1 | 1–2 | DB migration, seed script, Auth APIs, User/Address APIs | Form đăng ký/đăng nhập, Profile, Address Book |
| 2 | 2–3 | Product APIs (list, detail, search, suggest), Category APIs | Trang chủ, danh sách SP, filter/sort, chi tiết SP |
| 3 | 3–4 | Cart APIs, Order API (COD), Coupon validate | Giỏ hàng hybrid, Checkout 3 bước, trang success |
| 4 | 4–5 | PayPal, Order history/detail API, Cancel, Return | Thanh toán PayPal, trang đơn hàng, chi tiết đơn |
| 5 | 5–6 | Review APIs, Auction + Bid + cron job, Notification APIs | Viết/xem đánh giá, countdown + đặt giá, bell notification |
| 6 | 6–7 | Messaging Socket.IO, Wishlist APIs | Trang chat, wishlist, real-time notification |
| 7 | 7–8 | Redis cache, index DB, rate limiting, security hardening | Code splitting, lazy load, responsive polish, mobile nav |
| 8 | 8 | Load test JMeter, fix bottleneck | Bug fix, cross-browser test, final QA |

---

*Hệ thống hoàn toàn độc lập — team tự seed đủ data sản phẩm, danh mục, seller giả để Buyer hoạt động được từ ngày đầu mà không phụ thuộc bất kỳ team nào khác.*
