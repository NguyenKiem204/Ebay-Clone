# 🖥️ eBay Clone — Mô tả Luồng Màn hình & Giao diện

> Giao diện bám sát eBay.com — layout, màu sắc, component, UX flow
> **Màu chính:** `#E53238` (đỏ eBay) · `#0064D2` (xanh eBay) · `#F7F7F7` (nền xám nhạt) · `#FFFFFF` · `#333333` (text)

---

## 🗺️ SƠ ĐỒ LUỒNG MÀN HÌNH TỔNG QUAN

```
Trang chủ (/)
├── Tìm kiếm → Trang kết quả (/search)
│   └── Click sản phẩm → Chi tiết sản phẩm (/products/:id)
│       ├── Thêm vào giỏ → Mini Cart → Trang Cart (/cart)
│       │   └── Checkout (/checkout)
│       │       ├── Bước 1: Địa chỉ
│       │       ├── Bước 2: Thanh toán
│       │       ├── Bước 3: Xác nhận
│       │       └── Thành công (/order-success/:id)
│       ├── Mua ngay → Checkout (bypass cart)
│       ├── Đặt giá (Auction) → realtime bid
│       └── Nhắn tin → /messages/:sellerId
│
├── Đăng nhập (/login)
│   ├── Đăng ký (/register)
│   ├── Xác nhận email (/verify-email)
│   └── Quên mật khẩu (/forgot-password) → /reset-password
│
└── Tài khoản (dropdown)
    ├── Profile (/profile)
    ├── Địa chỉ (/profile/addresses)
    ├── Đơn hàng (/orders) → Chi tiết (/orders/:id)
    ├── Wishlist (/wishlist)
    ├── Tin nhắn (/messages)
    └── Thông báo (/notifications)
```

---

## 📐 LAYOUT CHUNG — HEADER & FOOTER

### Header (cố định, sticky top)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [Logo eBay]  [Search bar rộng 50%────────────────] [All ▼] [Search🔍] │
│                                                                          │
│  Hi, [Username] ▼   Daily Deals   Watchlist   My eBay ▼   Cart 🛒(3)  │
└─────────────────────────────────────────────────────────────────────────┘
```

**Chi tiết từng vùng:**

- **Logo:** "eb**ay**" — chữ e đỏ, b xanh, a vàng, y xanh lá — size 34px, link về `/`
- **Search bar:**
  - Chiều rộng ~50% header, bo tròn border-radius 24px
  - Border `2px solid #E53238` khi focus
  - Dropdown "All Categories" bên trái search input
  - Nút Search màu `#E53238`, icon kính lúp
  - Khi gõ: dropdown autocomplete xuất hiện bên dưới (tối đa 8 gợi ý)
- **Top nav phụ (dòng 2):**
  - "Hi, [Username]" → dropdown: Profile / Đơn hàng / Đăng xuất
  - "Daily Deals" → trang khuyến mãi
  - "Watchlist" (tức Wishlist)
  - "Cart" với badge số lượng đỏ góc trên phải icon

**Mobile Header:**
```
┌─────────────────────────────────────┐
│  [Logo]    [🔍 Search]    [🛒(3)]  │
└─────────────────────────────────────┘
```
- Ẩn nav phụ, chỉ giữ logo + search icon + cart icon
- Search icon → mở full-width search bar overlay

---

### Footer

```
┌─────────────────────────────────────────────────────────┐
│  [Logo eBay]                                            │
│                                                         │
│  Mua sắm      Bán hàng      Về chúng tôi    Trợ giúp  │
│  Thời trang   Bắt đầu bán   Về eBay Clone   Liên hệ   │
│  Điện tử      Quy định      Chính sách       FAQ        │
│  Nhà cửa                    Điều khoản                  │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  © 2025 eBay Clone  |  Chính sách bảo mật | Cookie    │
└─────────────────────────────────────────────────────────┘
```

---

## 1️⃣ TRANG CHỦ `/`

### Layout tổng thể
```
[HEADER]
[CATEGORY NAV BAR]
[HERO BANNER]
[FEATURED CATEGORIES GRID]
[SECTION: Today's Deals]
[SECTION: Recently Viewed / Recommended]
[SECTION: Active Auctions]
[FOOTER]
```

---

### 1.1 Category Navigation Bar (dưới header)
```
┌──────────────────────────────────────────────────────────────┐
│  Điện tử  Thời trang  Nhà cửa  Thể thao  Sách  Đấu giá...  │
└──────────────────────────────────────────────────────────────┘
```
- Background trắng, border-bottom `1px solid #e0e0e0`
- Hover: text màu `#0064D2`, underline
- Hover vào "Điện tử" → Mega dropdown xuất hiện:

```
┌──────────────────────────────────────┐
│  Điện tử                             │
│  ─────────────────────────────────  │
│  Điện thoại    Laptop    Tai nghe   │
│  Máy tính bảng Đồng hồ  Phụ kiện   │
│                                      │
│  [Xem tất cả Điện tử →]             │
└──────────────────────────────────────┘
```

---

### 1.2 Hero Banner
- Carousel tự động chuyển sau 5 giây, có dot indicator và mũi tên prev/next
- Kích thước: full width × 400px (desktop) / 200px (mobile)
- Nội dung mỗi slide: ảnh nền + text overlay + nút CTA

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   🏷️ Siêu Sale Điện tử                                     │
│   Giảm đến 50% cho tất cả Laptop                          │
│                                                             │
│   [Shop Now →]                          ←  ● ○ ○ ○  →     │
└─────────────────────────────────────────────────────────────┘
```

---

### 1.3 Featured Categories Grid
```
┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐
│  📱  │  │  💻  │  │  👕  │  │  🏠  │  │  ⚽  │  │  📚  │
│Điện  │  │Laptop│  │Thời  │  │Nhà   │  │Thể  │  │Sách  │
│thoại │  │      │  │trang │  │cửa   │  │thao │  │      │
└──────┘  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘
```
- 6 ô vuông đều nhau, icon lớn + tên danh mục
- Hover: nền xám nhạt, scale nhẹ 1.03
- Mobile: scroll ngang

---

### 1.4 Section "Today's Deals" (Ưu đãi hôm nay)
```
Today's Deals                              [See all deals →]
─────────────────────────────────────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │
│          │  │          │  │          │  │          │
│ Tên SP   │  │ Tên SP   │  │ Tên SP   │  │ Tên SP   │
│ ~~500k~~ │  │ ~~800k~~ │  │ ~~300k~~ │  │ ~~1.2M~~ │
│ 250,000đ │  │ 400,000đ │  │ 150,000đ │  │ 600,000đ │
│ -50%     │  │ -50%     │  │ -50%     │  │ -50%     │
│ ♡ Lưu   │  │ ♡ Lưu   │  │ ♡ Lưu   │  │ ♡ Lưu   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```
- Giá gốc gạch ngang (strikethrough), màu xám
- Giá sale màu `#E53238`, đậm
- Badge "% giảm" góc trên trái ảnh, nền đỏ chữ trắng

---

### 1.5 Section "Active Auctions" (Đang đấu giá)
```
Đang đấu giá — Còn ít thời gian!          [Xem tất cả →]
─────────────────────────────────────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │
│          │  │          │  │          │  │          │
│ Tên SP   │  │ Tên SP   │  │ Tên SP   │  │ Tên SP   │
│ Giá hiện │  │ Giá hiện │  │ Giá hiện │  │ Giá hiện │
│ 1,200,000│  │   850,000│  │   320,000│  │ 4,500,000│
│ ⏱ 2g 15p │  │ ⏱ 45p   │  │ ⏱ 1n 3g  │  │ ⏱ 5g 20p │
│ 12 lượt  │  │  8 lượt  │  │  3 lượt  │  │ 25 lượt  │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```
- Countdown timer màu `#E53238`, font monospace
- Khi còn < 1 giờ: nền đỏ nhạt, text đỏ đậm, animation nhấp nháy nhẹ

---

## 2️⃣ TRANG DANH SÁCH SẢN PHẨM `/products` hoặc `/search`

### Layout tổng thể
```
[HEADER]
[BREADCRUMB]
┌─────────────────────────────────────────────────────┐
│  [FILTER SIDEBAR 240px]  │  [PRODUCT GRID / LIST]   │
│                          │                          │
│  Categories              │  [Sort bar + Result count│
│  Price Range             │  + Grid/List toggle]     │
│  Condition               │                          │
│  Listing Type            │  [Product Cards...]      │
│  Shipping                │                          │
│                          │  [Pagination]            │
└─────────────────────────────────────────────────────┘
[FOOTER]
```

---

### 2.1 Breadcrumb
```
Trang chủ  >  Điện tử  >  Điện thoại  >  Kết quả cho "iphone"
```
- Font nhỏ 13px, màu `#767676`
- Link màu `#0064D2`, hover underline
- Trang hiện tại: không phải link, màu `#333`

---

### 2.2 Filter Sidebar (Desktop — 240px)
```
┌─────────────────────────┐
│  Category               │
│  ─────────────────────  │
│  ○ Tất cả (300)         │
│  ○ Điện thoại (120)     │
│  ○ Laptop (85)          │
│  ○ Tai nghe (60)        │
│  ● Đồng hồ (35)  ← active│
│                         │
│  Price                  │
│  ─────────────────────  │
│  ●━━━━━━━━━━━●          │
│  50,000đ    50,000,000đ │
│  [    100k  ] [ 5,000k ]│
│                         │
│  Condition              │
│  ─────────────────────  │
│  ☑ Mới (180)            │
│  ☑ Đã dùng (95)         │
│  ☐ Refurbished (25)     │
│                         │
│  Listing Type           │
│  ─────────────────────  │
│  ☑ Mua ngay             │
│  ☐ Đấu giá              │
│                         │
│  [Clear all filters]    │
└─────────────────────────┘
```
- Active filter: highlight màu xanh `#0064D2`
- "Clear all filters": link đỏ `#E53238`
- Mỗi section có thể collapse/expand (accordion)

**Mobile Filter:**
- Nút "🔧 Bộ lọc (3)" sticky bottom hoặc top
- Tap → Bottom Sheet drawer trượt lên từ dưới
- Header drawer: "Bộ lọc" + nút X + nút "Áp dụng (3)"

---

### 2.3 Sort Bar + Result Count
```
┌──────────────────────────────────────────────────────────┐
│  1,248 kết quả cho "điện thoại"                         │
│                          Sort: [Best Match ▼]  ☰  ⊞    │
└──────────────────────────────────────────────────────────┘
```
- Sort dropdown options: Best Match / Price: Low to High / Price: High to Low / Newest / Most Reviews
- `☰` = List view · `⊞` = Grid view (icon toggle)

---

### 2.4 Product Card (Grid View)
```
┌──────────────────┐
│  [BADGE: -30%]   │
│                  │
│    [ảnh SP]      │   ← aspect ratio 1:1, object-fit cover
│                  │
│  ♡               │   ← wishlist icon góc trên phải ảnh
├──────────────────┤
│ Tên sản phẩm     │   ← 2 dòng, truncate, font 14px
│ dài tối đa 2 dòng│
│                  │
│ ⭐⭐⭐⭐⭐ (128)  │   ← stars + review count, font 12px
│                  │
│ 1,250,000đ       │   ← giá, màu #333, bold 16px
│ ~~1,800,000đ~~   │   ← giá gốc gạch, xám 12px (nếu có sale)
│                  │
│ Free shipping    │   ← xanh lá #389728, font 12px
│ From: TechShop   │   ← tên seller, xám nhạt 11px
└──────────────────┘
```

**Hover state:**
- Box shadow `0 2px 8px rgba(0,0,0,0.15)`
- Icon ♡ đổi sang màu đỏ nhẹ
- Nút "Add to cart" slide up từ dưới ảnh

---

### 2.5 Product Card (List View)
```
┌────────────────────────────────────────────────────────┐
│  ┌──────┐   Tên sản phẩm dài, hiển thị đầy đủ        │
│  │[ảnh] │   Thương hiệu: Apple  |  Mới  |  Còn 5      │
│  │150px │   ⭐⭐⭐⭐⭐ (128 đánh giá)                 │
│  │      │                                              │
│  └──────┘   1,250,000đ           [Add to cart]        │
│             ~~1,800,000đ~~        [♡ Save]            │
│             ✓ Free shipping                            │
│             Seller: TechShop_VN  ⭐ 99.2%             │
└────────────────────────────────────────────────────────┘
```

---

### 2.6 Autocomplete Dropdown (khi search)
```
┌──────────────────────────────────────┐
│  🔍 iphone 15 pro                   │
│  🔍 iphone 15                       │
│  🔍 iphone case                     │
│  📁 Điện thoại  >  iPhone           │
│  📁 Phụ kiện   >  Ốp lưng iPhone   │
└──────────────────────────────────────┘
```
- Kết quả text: icon kính lúp
- Kết quả category: icon folder, in nghiêng

---

### 2.7 Pagination
```
        ← Trước    1  2  [3]  4  5 ... 24    Sau →
```
- Trang hiện tại: nền `#0064D2`, chữ trắng, bo tròn
- Hover: nền xám nhạt

---

## 3️⃣ TRANG CHI TIẾT SẢN PHẨM `/products/:id`

### Layout tổng thể
```
[HEADER]
[BREADCRUMB]
┌─────────────────────────────────────────────────────────┐
│  [IMAGE GALLERY 55%]     │  [PRODUCT INFO 45%]          │
│                          │                              │
└─────────────────────────────────────────────────────────┘
[SELLER INFO BAR]
[TABS: Mô tả | Thông số | Đánh giá]
[RELATED PRODUCTS]
[FOOTER]
```

---

### 3.1 Image Gallery (trái)
```
┌────────────────────────┐
│                        │
│      [Ảnh chính]       │   ← 500×500px, zoom khi hover (lens)
│                        │
└────────────────────────┘
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
│[1] │ │[2] │ │[3] │ │[4] │ │[5] │  ← thumbnails 80×80px
└────┘ └────┘ └────┘ └────┘ └────┘
     active thumb: border 2px #0064D2
```
- Hover vào ảnh chính (desktop): lens zoom xuất hiện phải ảnh
- Mobile: swipe ngang giữa các ảnh, dot indicator bên dưới

---

### 3.2 Product Info (phải)
```
┌────────────────────────────────────────┐
│  Điện tử > Điện thoại > iPhone        │  ← breadcrumb nhỏ
│                                        │
│  iPhone 15 Pro 256GB Titan Black       │  ← h1, 22px, bold
│                                        │
│  ⭐⭐⭐⭐⭐  4.8  (128 đánh giá)       │  ← click → scroll tới reviews
│  1,250 đã bán                          │
│                                        │
│  ─────────────────────────────────    │
│  Giá:    1,250,000đ                   │  ← 28px, bold, #E53238
│          ~~1,800,000đ~~ Tiết kiệm     │
│          550,000đ (30%)               │
│  ─────────────────────────────────    │
│                                        │
│  Tình trạng:  [Mới ▼]                 │  ← nếu có nhiều option
│                                        │
│  Số lượng:   [-] [1] [+]             │  ← stepper, max = stock
│              Còn 5 sản phẩm           │  ← màu đỏ nếu ≤ 5
│                                        │
│  [    Thêm vào giỏ hàng    ]          │  ← nền #0064D2, chữ trắng
│  [         Mua ngay         ]          │  ← nền #E53238, chữ trắng
│                                        │
│  ♡ Thêm vào Watchlist (245 người đang │
│    theo dõi)                           │
│                                        │
│  ─────────────────────────────────    │
│  🚚 Free shipping                      │
│     Dự kiến giao: 3–5 ngày làm việc   │
│                                        │
│  🔄 Chính sách đổi trả 30 ngày        │
│  🔒 Thanh toán bảo mật                │
└────────────────────────────────────────┘
```

---

### 3.3 Seller Info Bar (ngang bên dưới gallery + info)
```
┌──────────────────────────────────────────────────────────┐
│  [Avatar]  TechShop_VN              [Contact seller]     │
│            ⭐ 99.2% positive                              │
│            2,841 đánh giá · Tham gia từ 2020             │
│            [Visit store →]                               │
└──────────────────────────────────────────────────────────┘
```
- Background `#F7F7F7`, border top/bottom `1px solid #e0e0e0`
- "Contact seller" → mở chat
- "Visit store" → trang `/stores/:sellerId`

---

### 3.4 Auction Section (thay thế giá + nút nếu isAuction = true)
```
┌────────────────────────────────────────┐
│  Giá hiện tại:  1,200,000đ            │  ← cập nhật real-time
│  12 lượt đặt giá                      │
│                                        │
│  ⏱ Kết thúc sau:  02:14:35            │  ← countdown đỏ, mono font
│                                        │
│  Đặt giá của bạn:                      │
│  [              1,201,000đ           ] │  ← input, min = current+1000
│  Giá tối thiểu: 1,201,000đ           │
│                                        │
│  [        Đặt giá ngay        ]        │  ← nền #E53238
│                                        │
│  Top bids gần nhất:                    │
│  nguyen*** · 1,200,000đ · 5p trước    │
│  tran***   · 1,100,000đ · 12p trước   │
│  le***     ·   950,000đ · 30p trước   │
└────────────────────────────────────────┘
```

---

### 3.5 Tabs: Mô tả / Thông số / Đánh giá
```
┌──────────────────────────────────────────────────────────┐
│  [Mô tả]  [Thông số]  [Đánh giá (128)]                  │
│  ─────────────────────────────────────────────────────   │
│  Tab active: border-bottom 3px solid #0064D2             │
└──────────────────────────────────────────────────────────┘
```

**Tab Đánh giá:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│   4.8 ★★★★★         5★ ████████████ 89              │
│   128 đánh giá      4★ ████         22              │
│                     3★ ██            8              │
│                     2★ █             5              │
│                     1★ █             4              │
│                                                          │
│  Filter: [Tất cả] [5★] [4★] [3★] [2★] [1★]            │
│  ─────────────────────────────────────────────────────  │
│  [Avatar] nguyen_van_a  ★★★★★  12/01/2025              │
│  "Sản phẩm đúng mô tả, giao hàng nhanh, đóng gói cẩn    │
│  thận. Rất hài lòng!"                                   │
│  ─────────────────────────────────────────────────────  │
│  [Avatar] tran_thi_b   ★★★★☆  08/01/2025              │
│  "Sản phẩm tốt nhưng hộp có một chút móp..."            │
│  ─────────────────────────────────────────────────────  │
│                    [Xem thêm đánh giá]                   │
└──────────────────────────────────────────────────────────┘
```

---

## 4️⃣ TRANG GIỎ HÀNG `/cart`

```
[HEADER]

Your shopping cart  (3 items)
─────────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────────────────┐
│  ☑ Chọn tất cả (3)                    [Xóa đã chọn]       │
├───────────────────────────────────────────────────┬─────────┤
│  [Cart items — 65%]                               │ [Sum-   │
│                                                   │  mary   │
│  ☑ [ảnh 80px] iPhone 15 Pro 256GB               │  35%]   │
│              TechShop_VN                          │         │
│              Mới · Còn hàng ✓                     │ Tạm tính│
│              [-] [1] [+]   1,250,000đ  [Xóa]     │ 2,400k  │
│  ─────────────────────────────────────────────    │         │
│  ☑ [ảnh 80px] Tai nghe Sony WH-1000XM5          │ Giao    │
│              TechShop_VN                          │ hàng    │
│              Mới · Còn hàng ✓                     │ Free    │
│              [-] [2] [+]     750,000đ  [Xóa]     │         │
│  ─────────────────────────────────────────────    │ Tổng    │
│  ☑ [ảnh 80px] Laptop Dell XPS 13                │ cộng    │
│              TechShop_VN                          │ 2,400k  │
│              ⚠ Chỉ còn 2 sản phẩm               │         │
│              [-] [1] [+]     400,000đ  [Xóa]     │ [Tiến   │
│                                                   │ hành    │
│                                                   │ thanh   │
│                                                   │ toán]   │
└───────────────────────────────────────────────────┴─────────┘

Có thể bạn cũng thích:
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐
│[ảnh] │ │[ảnh] │ │[ảnh] │ │[ảnh] │
└──────┘ └──────┘ └──────┘ └──────┘
```

**Order Summary box:**
- Sticky khi scroll (desktop)
- Background trắng, border `1px solid #e0e0e0`, border-radius 8px
- Nút "Tiến hành thanh toán": full width, nền `#E53238`
- Biểu tượng PayPal / COD nhỏ bên dưới nút

---

## 5️⃣ TRANG CHECKOUT `/checkout`

### Stepper Header
```
┌────────────────────────────────────────────────────┐
│   ①─────────②─────────③                          │
│  Địa chỉ   Thanh toán  Xác nhận                  │
│  (done)    (active)    (pending)                  │
└────────────────────────────────────────────────────┘
```
- Bước done: icon ✓ xanh
- Bước active: số trong vòng tròn `#0064D2`
- Bước pending: số trong vòng tròn xám

---

### Bước 1 — Địa chỉ giao hàng
```
┌────────────────────────────────────┬──────────────────┐
│  Chọn địa chỉ giao hàng           │  Order Summary   │
│  ─────────────────────────────    │  ─────────────   │
│  ◉ Nguyễn Văn A        [DEFAULT]  │  iPhone 15 Pro   │
│    0912 345 678                    │  × 1     1,250k  │
│    123 Lê Lợi, Q1, TP.HCM        │                  │
│    [Sửa]                           │  Sony WH-1000XM5 │
│  ─────────────────────────────    │  × 2       750k  │
│  ○ Trần Thị B                     │                  │
│    0987 654 321                    │  ──────────────  │
│    456 Nguyễn Huệ, Q3, TP.HCM    │  Tạm tính 2,750k │
│    [Sửa]                           │  Giao hàng  Free │
│  ─────────────────────────────    │  ──────────────  │
│  [+ Thêm địa chỉ mới]            │  Tổng    2,750k  │
│                                    │                  │
│              [Tiếp theo →]        │                  │
└────────────────────────────────────┴──────────────────┘
```

---

### Bước 2 — Phương thức thanh toán
```
┌────────────────────────────────────┬──────────────────┐
│  Phương thức thanh toán           │  Order Summary   │
│  ─────────────────────────────    │  (như bước 1)    │
│  ◉ [PayPal logo]                  │                  │
│    Thanh toán qua PayPal          │                  │
│                                    │                  │
│  ○ Thanh toán khi nhận hàng (COD) │                  │
│                                    │                  │
│  ─────────────────────────────    │                  │
│  Mã giảm giá                       │                  │
│  ┌─────────────────┐  [Áp dụng]   │                  │
│  │  WELCOME10      │               │                  │
│  └─────────────────┘               │                  │
│  ✓ Giảm 50,000đ đã được áp dụng  │                  │
│                                    │                  │
│  Ghi chú đơn hàng (tùy chọn)      │                  │
│  ┌─────────────────────────────┐  │                  │
│  │                             │  │                  │
│  └─────────────────────────────┘  │                  │
│                                    │                  │
│  [← Quay lại]  [Tiếp theo →]     │                  │
└────────────────────────────────────┴──────────────────┘
```

---

### Bước 3 — Xác nhận đơn hàng
```
┌────────────────────────────────────┬──────────────────┐
│  Xác nhận đơn hàng               │  Chi tiết đơn    │
│  ─────────────────────────────    │  ─────────────   │
│  Địa chỉ giao hàng               │  iPhone 15 Pro   │
│  Nguyễn Văn A                     │  × 1     1,250k  │
│  123 Lê Lợi, Q1, TP.HCM         │  Sony WH-1000XM5 │
│  0912 345 678                     │  × 2       750k  │
│  [Thay đổi]                        │  ──────────────  │
│                                    │  Tạm tính 2,750k │
│  Phương thức thanh toán           │  Giảm giá   -50k │
│  PayPal                            │  Giao hàng  Free │
│  [Thay đổi]                        │  ══════════════  │
│                                    │  Tổng    2,700k  │
│  Ghi chú: (không có)              │                  │
│                                    │  [Đặt hàng]      │
│                                    │  ← nền #E53238   │
│                                    │  full width btn  │
└────────────────────────────────────┴──────────────────┘
```

---

### Trang Order Success
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              ✅                                      │
│                                                      │
│         Đặt hàng thành công!                        │
│                                                      │
│  Mã đơn hàng: #ORD-20250115-00042                   │
│                                                      │
│  Cảm ơn bạn đã mua hàng. Chúng tôi sẽ xử lý        │
│  đơn hàng của bạn trong thời gian sớm nhất.         │
│                                                      │
│  Dự kiến giao hàng: 18/01/2025 – 22/01/2025        │
│                                                      │
│  [Xem chi tiết đơn hàng]  [Tiếp tục mua sắm]       │
│                                                      │
└──────────────────────────────────────────────────────┘
```
- Icon ✅ to, màu xanh lá, có animation scale-in
- Nút "Xem chi tiết": outline style
- Nút "Tiếp tục": filled `#0064D2`

---

## 6️⃣ TRANG ĐĂNG NHẬP / ĐĂNG KÝ

### Đăng nhập `/login`
```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              [Logo eBay Clone]                       │
│                                                      │
│         Đăng nhập vào tài khoản của bạn             │
│                                                      │
│  Email hoặc tên đăng nhập                           │
│  ┌──────────────────────────────────────────────┐   │
│  │                                              │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  Mật khẩu                                           │
│  ┌─────────────────────────────────────┐  [👁]   │   │
│  │                                     │          │   │
│  └─────────────────────────────────────┘          │   │
│                                                      │
│  [        Đăng nhập        ]  ← nền #0064D2         │
│                                                      │
│  Quên mật khẩu?                                     │
│                                                      │
│  ──────── hoặc ────────                             │
│                                                      │
│  Chưa có tài khoản? [Đăng ký ngay]                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```
- Layout: card trắng, shadow, max-width 440px, căn giữa trang
- Background trang: `#F7F7F7`
- Input focus: border `#0064D2`, box-shadow xanh nhạt
- Error state: border đỏ + icon ⚠ + text đỏ bên dưới input

---

### Đăng ký `/register`
```
Giống layout đăng nhập, thêm các trường:
- Username
- Email
- Password (+ strength bar)
- Confirm password
- Checkbox "Tôi đồng ý với Điều khoản sử dụng"
- Nút "Tạo tài khoản" màu #E53238
```

**Password Strength Bar:**
```
Độ mạnh: ████░░░░  Trung bình
         đỏ → vàng → xanh tùy độ mạnh
```

---

## 7️⃣ TRANG QUẢN LÝ TÀI KHOẢN

### Layout Account Pages (sidebar + content)
```
[HEADER]
┌──────────────────┬─────────────────────────────────────┐
│  My eBay         │  [CONTENT AREA]                     │
│  ─────────────   │                                     │
│  👤 Profile      │                                     │
│  📦 Purchases    │                                     │
│  ♡  Watchlist   │                                     │
│  💬 Messages     │                                     │
│  🔔 Notifications│                                     │
│  📍 Addresses    │                                     │
│  ─────────────   │                                     │
│  ⚙️ Settings     │                                     │
│  🚪 Sign out     │                                     │
└──────────────────┴─────────────────────────────────────┘
```
- Sidebar: 220px, background `#F7F7F7`, border-right
- Active item: nền trắng, border-left `3px solid #0064D2`, text `#0064D2`

---

### 7.1 Trang Profile
```
┌─────────────────────────────────────────────────────────┐
│  Personal Information                    [Edit]         │
│  ─────────────────────────────────────────────────────  │
│  [Avatar 100px]  Nguyễn Văn A                          │
│  [Thay đổi ảnh]  nguyenvana@email.com                  │
│                  0912 345 678                           │
│                  Tham gia từ: 15/01/2024               │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Security                                               │
│  Mật khẩu: ●●●●●●●●          [Đổi mật khẩu]          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### 7.2 Trang Đơn hàng `/orders`

**Tab bar trạng thái:**
```
[Tất cả] [Chờ xác nhận] [Đã xác nhận] [Đang giao] [Đã nhận] [Đã hủy] [Hoàn trả]
```

**Mỗi order card:**
```
┌─────────────────────────────────────────────────────────┐
│  Đơn hàng #ORD-20250115-00042     Đặt 15/01/2025       │
│  ─────────────────────────────────────────────────────  │
│  [ảnh] iPhone 15 Pro × 1                               │
│  [ảnh] Sony WH-1000XM5 × 2   +1 sản phẩm khác         │
│                                                         │
│  Tổng: 2,700,000đ          ● Đang giao hàng           │
│                                                         │
│  [Xem chi tiết]  [Mua lại]                             │
└─────────────────────────────────────────────────────────┘
```
- Chip trạng thái màu: Chờ=vàng / Xác nhận=xanh dương / Đang giao=cam / Đã nhận=xanh lá / Hủy=đỏ

---

### 7.3 Trang Chi tiết Đơn hàng `/orders/:id`
```
┌─────────────────────────────────────────────────────────┐
│  Đơn hàng #ORD-20250115-00042                          │
│                                                         │
│  TIMELINE TRẠNG THÁI                                    │
│  ●──────────●──────────●──────────○──────────○         │
│  Đặt hàng  Xác nhận  Đang giao  Đã giao   Hoàn thành  │
│  15/01     16/01     17/01                              │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  🚚 Thông tin vận chuyển                                │
│  Đơn vị: GHN Express                                   │
│  Mã vận đơn: GHN123456789                              │
│  Dự kiến: 18/01/2025 – 22/01/2025                     │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Sản phẩm đã đặt                                       │
│  [ảnh] iPhone 15 Pro 256GB × 1        1,250,000đ      │
│  [ảnh] Sony WH-1000XM5    × 2         1,500,000đ      │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│  Tạm tính:        2,750,000đ                           │
│  Mã giảm giá:       -50,000đ                           │
│  Phí vận chuyển:        Free                           │
│  ══════════════════════════════                        │
│  Tổng cộng:       2,700,000đ                           │
│                                                         │
│  [Viết đánh giá]  [Yêu cầu hoàn trả]                  │
└─────────────────────────────────────────────────────────┘
```

---

## 8️⃣ TRANG THÔNG BÁO `/notifications`

### Bell Dropdown (trong Header)
```
          🔔(5)
          ↓
┌─────────────────────────────────┐
│  Thông báo                      │
│  ─────────────────────────────  │
│  🟦 Đơn hàng #042 đang giao    │   ← chưa đọc: nền xanh nhạt
│     2 giờ trước                 │
│  🟦 Bạn bị vượt giá SP iPhone  │
│     3 giờ trước                 │
│  ○  Đặt hàng #041 thành công   │   ← đã đọc: nền trắng
│     Hôm qua                     │
│  ─────────────────────────────  │
│  [Xem tất cả thông báo]        │
└─────────────────────────────────┘
```

### Trang thông báo đầy đủ
```
Thông báo của bạn            [Đánh dấu tất cả đã đọc]
Filter: [Tất cả] [Đơn hàng] [Đấu giá] [Tin nhắn] [Hệ thống]
─────────────────────────────────────────────────────────────
  ● Đơn hàng #042 đang được giao đến bạn              2g
    GHN Express · Mã: GHN123456789
─────────────────────────────────────────────────────────────
  ● Bạn đã bị vượt giá tại "Đồng hồ Casio G-Shock"   3g
    Giá hiện tại: 2,500,000đ · [Đặt giá lại]
─────────────────────────────────────────────────────────────
    Đặt hàng #041 đã thành công                       Hôm qua
    Cảm ơn bạn đã mua hàng!
─────────────────────────────────────────────────────────────
```
- Chưa đọc: dấu chấm xanh bên trái + nền `#EBF5FF`
- Đã đọc: không có dấu chấm + nền trắng

---

## 9️⃣ TRANG TIN NHẮN `/messages`

```
[HEADER]
┌──────────────────────┬──────────────────────────────────┐
│  Conversations       │  TechShop_VN                    │
│  ─────────────────   │  ─────────────────────────────   │
│  [Ava] TechShop_VN   │                                  │
│  Cảm ơn bạn...  2g  │  [Avatar] TechShop_VN            │
│  ── ← active ──      │  Xin chào, tôi muốn hỏi...      │
│                       │  10:30 AM                        │
│  [Ava] FashionStore  │                                  │
│  Sản phẩm đã...  1d  │                    Bạn           │
│                       │  Sản phẩm có còn hàng không?    │
│  [Ava] HomeDecor     │                        10:32 AM  │
│  Cảm ơn bạn đã... 3d │                                  │
│                       │  [Avatar] TechShop_VN            │
│                       │  Dạ còn bạn ơi, còn 5 sản      │
│                       │  phẩm ạ!                        │
│                       │  10:33 AM                        │
│                       │  ─────────────────────────────   │
│                       │  ┌─────────────────────┐ [Gửi] │
│                       │  │ Nhập tin nhắn...    │       │
│                       │  └─────────────────────┘       │
└──────────────────────┴──────────────────────────────────┘
```
- Conversation đang chọn: nền `#EBF5FF`
- Tin nhắn của mình: bong bóng phải, nền `#0064D2`, chữ trắng
- Tin nhắn đối phương: bong bóng trái, nền `#F0F0F0`, chữ đen

---

## 🔟 TRANG WISHLIST `/wishlist`

```
Watchlist của bạn (8 sản phẩm)
─────────────────────────────────────────────────────────────
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │  │  [ảnh]   │
│          │  │          │  │  ⏱ Còn   │  │          │
│          │  │          │  │  2g 15p  │  │          │
│ Tên SP   │  │ Tên SP   │  │ Tên SP   │  │ Tên SP   │
│ 1,250k   │  │   850k   │  │ 2,500k   │  │   320k   │
│[Add cart]│  │[Add cart]│  │[Đặt giá] │  │[Add cart]│
│ [✕ Xóa] │  │ [✕ Xóa] │  │ [✕ Xóa] │  │ [✕ Xóa] │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```
- Card đấu giá: hiện countdown, nút "Đặt giá" thay vì "Add to cart"

---

## 📱 MOBILE — BOTTOM NAVIGATION

```
┌─────────────────────────────────────────────────────┐
│                    [Content]                        │
└─────────────────────────────────────────────────────┘
┌──────┬──────┬──────┬──────┬──────────────────────────┐
│  🏠  │  🔍  │  🛒  │  🔔  │  👤                     │
│ Home │Search│ Cart │ Noti │ My eBay                 │
│      │      │ (3)  │ (5)  │                         │
└──────┴──────┴──────┴──────┴─────────────────────────┘
```
- Height: 56px, background trắng, border-top `1px solid #e0e0e0`
- Active icon: màu `#0064D2`
- Badge: nền đỏ `#E53238`, chữ trắng, border-radius 10px

---

## 🎨 DESIGN TOKENS

### Màu sắc

| Token | Mã hex | Dùng cho |
|-------|--------|---------|
| `primary` | `#E53238` | Nút CTA, giá sale, badge, logo |
| `secondary` | `#0064D2` | Link, nút thứ cấp, active state |
| `success` | `#389728` | Free shipping, in stock, success |
| `warning` | `#FF6600` | Countdown, low stock |
| `text-primary` | `#333333` | Nội dung chính |
| `text-secondary` | `#767676` | Nội dung phụ, placeholder |
| `border` | `#E0E0E0` | Viền card, divider |
| `bg-light` | `#F7F7F7` | Nền trang, sidebar |
| `bg-white` | `#FFFFFF` | Card, modal, input |

### Typography

| Element | Font size | Weight |
|---------|-----------|--------|
| H1 (tên SP) | 22px | 700 |
| H2 (section title) | 18px | 700 |
| Body | 14px | 400 |
| Price (lớn) | 28px | 700 |
| Price (card) | 16px | 700 |
| Small / Meta | 12px | 400 |
| Badge | 11px | 700 |

### Spacing & Border Radius

| Element | Border radius |
|---------|--------------|
| Card sản phẩm | 8px |
| Nút lớn | 24px (pill) |
| Input | 24px |
| Badge | 4px |
| Modal | 12px |
| Avatar | 50% (tròn) |

---

## 🔄 LOADING STATES & EMPTY STATES

### Skeleton Loading (Product Card)
```
┌──────────────────┐
│  ░░░░░░░░░░░░░░  │  ← ảnh skeleton (shimmer animation)
│  ░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░  │
│  ░░░░░░░░        │
│  ░░░░░░          │
└──────────────────┘
```
- Màu `#E0E0E0` → `#F7F7F7` animation shimmer trái → phải

### Empty States

**Giỏ hàng trống:**
```
        🛒
   Giỏ hàng trống

   Hãy tìm kiếm sản phẩm yêu thích
   và thêm vào giỏ hàng nhé!

   [Tiếp tục mua sắm]
```

**Không có đơn hàng:**
```
        📦
   Bạn chưa có đơn hàng nào

   Mua sắm ngay để nhận ưu đãi hấp dẫn!

   [Khám phá ngay]
```

**Không có kết quả tìm kiếm:**
```
        🔍
   Không tìm thấy kết quả cho "abcxyz"

   Thử kiểm tra lại chính tả hoặc
   tìm kiếm với từ khóa khác.

   Gợi ý: Điện thoại · Laptop · Thời trang
```

---

*Tất cả màn hình đều responsive — mobile-first, test trên iOS Safari & Android Chrome.*
