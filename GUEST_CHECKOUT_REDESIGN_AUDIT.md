# Guest Checkout Redesign Audit

## Scope
- Phạm vi chỉ tập trung vào guest checkout theo mô hình eligibility-based.
- Chuẩn nghiệp vụ dùng để review:
  - backend là nơi quyết định guest checkout có được phép hay không
  - mọi item trong checkout phải là fixed-price / Buy It Now eligible
  - không áp dụng cho auction / won bid
  - guest phải nhập đầy đủ name, email, phone, shipping address, payment method
  - phải tạo order thật
  - phải có immutable shipping snapshot
  - phải có email confirmation
  - phải có guest order lookup tối thiểu bằng order number + email

## 1. Current guest-related behavior

### Guest hiện thật sự làm được gì
- Browse/search/product detail công khai.
  - FE route public ở `ebayFE/src/App.jsx:61-66`.
- Add cart khi chưa đăng nhập, nhưng chỉ ở localStorage.
  - Guest path trong `ebayFE/src/features/cart/hooks/useCart.js:97-100`.
  - Persist local cart ở `ebayFE/src/features/cart/hooks/useCartStore.js:5-10` và `:69`.
- Recently viewed cho guest là flow thật, có backend cookie support.
  - FE gọi `POST /api/History/{productId}` trong `ebayFE/src/features/history/useHistoryStore.js:12-35`.
  - BE xử lý guest bằng cookie `ebay_guest_id` ở `ebayBE/Controllers/HistoryController.cs:16-42`, `:44-95`, `:97-127`.
  - DB có `product_view_history` với `user_id` nullable và `cookie_id` cho guest ở `ebayBE/Docker/DB/Init/01_creates_tables.sql:516-525`.
- Guest có thể mở trang checkout public và nhập form shipping local.
  - Route `/checkout` là public ở `ebayFE/src/App.jsx:113-115`.
  - Guest state ở `ebayFE/src/features/checkout/hooks/useCheckout.js:26-29`.
  - Form guest ở `ebayFE/src/features/checkout/components/ShippingAddress.jsx:158-185`, `:207-233`, `:239-260`.

### Guest hiện không làm được gì
- Không checkout từ cart như một guest thật.
  - `CartSummary` đẩy guest sang `/verify` hoặc `/login`, không sang flow guest checkout thật: `ebayFE/src/features/cart/components/CartSummary.jsx:13-23`.
- Không tạo được order thật ở checkout.
  - FE luôn yêu cầu `selectedAddressId` trước khi submit: `ebayFE/src/features/checkout/hooks/useCheckout.js:79-83`.
  - FE submit vào `POST /api/Order`: `ebayFE/src/features/checkout/services/checkoutService.js:9-11`.
  - `OrderController` bị `[Authorize]`: `ebayBE/Controllers/OrderController.cs:10-28`.
- Không tạo được payment guest.
  - `PaypalController` bị `[Authorize]`: `ebayBE/Controllers/PaypalController.cs:9-33`.
- Không có guest order history / guest order detail / guest lookup.
  - FE chỉ có `/orders`: `ebayFE/src/App.jsx:89-90`.
  - Không có route `/orders/:id`: `ebayFE/src/App.jsx:51-204`.
  - `OrdersPage` là member purchase history và gọi `/api/Order`: `ebayFE/src/pages/OrdersPage.jsx:9-23`, `ebayFE/src/store/useOrderStore.js:9-14`.
- Không có order confirmation email cho order.
  - `EmailService` hiện chỉ có OTP/reset mail ở `ebayBE/Services/Implementations/EmailService.cs:22-67`.

### Chỗ nào là UI promise, chỗ nào là logic thật
- UI promise:
  - Guest modal với nút `Check out as guest`: `ebayFE/src/components/product/GuestCheckoutModal.jsx:47-59`.
  - Guest shipping form và nút `Confirm and pay` ở checkout: `ebayFE/src/pages/CheckoutPage.jsx:170-221`.
  - `OrderSuccessPage` dựng order number giả từ query `id` và nói đã gửi email: `ebayFE/src/pages/OrderSuccessPage.jsx:5-8`, `:32-34`.
- Logic thật:
  - browse/search/product detail public
  - local guest cart
  - cookie-based recently viewed
  - member-only order creation/payment

### Nhận định quan trọng
- Codebase hiện tại không có guest eligibility engine thật.
- Tôi không thấy bằng chứng hệ thống hiện tại đang hardcode guest eligibility theo số lượng item. Thực tế hiện tại còn chưa có eligibility backend; chỉ có route/UI gating và auth gating.

## 2. Current blockers for eligibility-based guest checkout

### 2.1 Auth guard blocker
- Nằm ở đâu:
  - `ebayBE/Controllers/OrderController.cs:10-28`
  - `ebayBE/Controllers/PaypalController.cs:9-33`
  - `ebayBE/Controllers/AddressController.cs:10-64`
  - `ebayBE/Controllers/CartController.cs:10-64`
- Vì sao chặn guest checkout thật:
  - Guest không thể tạo order, không thể tạo/capture PayPal order, không thể dùng address API, không thể dùng backend cart.
- Mức độ: `P0`
- Sửa tối thiểu:
  - thêm endpoint anonymous riêng cho guest eligibility, guest order creation, guest order lookup.
- Sửa đúng:
  - giữ `OrderController` member-only, tạo `GuestCheckoutController` hoặc `CheckoutController` riêng cho guest, dùng chung service core phía trong.

### 2.2 AddressId blocker
- Nằm ở đâu:
  - FE submit `addressId` bắt buộc ở `ebayFE/src/features/checkout/hooks/useCheckout.js:79-99`
  - DTO hiện tại chỉ có `AddressId`: `ebayBE/DTOs/Requests/OrderRequests.cs:3-13`
  - BE load address theo owner user: `ebayBE/Services/Implementations/OrderService.cs:23-25`
- Vì sao chặn guest checkout thật:
  - Guest không có address book row để lấy `AddressId`.
  - FE guest form chỉ là local state, không hề map vào backend payload.
- Mức độ: `P0`
- Sửa tối thiểu:
  - tạo guest create-order DTO riêng chứa contact + shipping fields.
- Sửa đúng:
  - lưu immutable shipping snapshot trên order, không phụ thuộc `addresses.id`.

### 2.3 DB ownership blocker
- Nằm ở đâu:
  - `orders.buyer_id INT NOT NULL`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:237-245`
  - `orders.address_id INT NOT NULL`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:237-245`
  - `payments.user_id INT NOT NULL`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:278-282`
  - EF model cũng non-null:
    - `ebayBE/Models/Order.cs:12-15`
    - `ebayBE/Models/Payment.cs:10-13`
- Vì sao chặn guest checkout thật:
  - Guest order không có buyer member row và không có address row.
  - Payment record hiện cũng đòi user member.
- Mức độ: `P0`
- Sửa tối thiểu:
  - cho `orders.buyer_id`, `orders.address_id`, `payments.user_id` nullable và thêm guest columns trên `orders`.
- Sửa đúng:
  - tách rõ customer type và snapshot/contact data khỏi member profile.

### 2.4 Checkout totals / source-of-truth blocker
- Nằm ở đâu:
  - Cart hiển thị shipping `FREE`: `ebayFE/src/features/cart/components/CartSummary.jsx:37-43`
  - Checkout hardcode shipping `145530`: `ebayFE/src/pages/CheckoutPage.jsx:88`, `:123-124`, `:203-206`
  - Backend tính shipping theo tổng `Product.ShippingFee`: `ebayBE/Services/Implementations/OrderService.cs:63-77`
- Vì sao chặn guest checkout thật:
  - FE total không phải source of truth.
  - Buyer có thể thấy subtotal/shipping khác hẳn backend.
- Mức độ: `P0`
- Sửa tối thiểu:
  - thêm endpoint evaluate/quote để FE lấy totals từ backend trước khi confirm.
- Sửa đúng:
  - mọi eligibility, shipping, coupon, total, payment options đều đi từ backend quote object.

### 2.5 Coupon blocker
- Nằm ở đâu:
  - `ValidateCouponAsync(string code, decimal orderAmount, int userId)`: `ebayBE/Services/Implementations/CouponService.cs:19-79`
  - `UseCouponAsync(int couponId, int userId)`: `ebayBE/Services/Implementations/CouponService.cs:81-95`
  - `coupon_usage.order_id` là NOT NULL: `ebayBE/Docker/DB/Init/01_creates_tables.sql:315-322`
  - Model `CouponUsage.OrderId` là required: `ebayBE/Models/CouponUsage.cs:10-15`
- Vì sao chặn guest checkout thật:
  - Coupon service hiện phụ thuộc `userId`.
  - Usage insert hiện còn không set `OrderId`, nên integrity đã có vấn đề ngay cả với member.
- Mức độ: `P0/P1`
- Sửa tối thiểu:
  - phase đầu tắt coupon cho guest checkout.
- Sửa đúng:
  - validate/apply coupon trên quote/order thật, usage phải gắn `order_id`; guest usage policy cần explicit.

### 2.6 Payment blocker
- Nằm ở đâu:
  - FE luôn cho guest chọn `PayPal` và `COD`: `ebayFE/src/features/checkout/components/PaymentMethod.jsx:38-80`
  - PayPal API auth-only: `ebayBE/Controllers/PaypalController.cs:9-33`
  - PayPal service load order bằng `(orderId, userId)`: `ebayBE/Services/Implementations/PaypalService.cs:54-58`
  - Payment record yêu cầu `UserId`: `ebayBE/Services/Implementations/OrderService.cs:133-142`, `ebayBE/Models/Payment.cs:10-13`
- Vì sao chặn guest checkout thật:
  - Guest không thể dùng current PayPal path.
  - FE đang hứa payment options nhiều hơn BE hỗ trợ cho guest.
- Mức độ: `P0`
- Sửa tối thiểu:
  - phase đầu chỉ cho guest `COD`.
- Sửa đúng:
  - payment contract phải bám vào order identity, không bám vào authenticated user.

### 2.7 Order confirmation blocker
- Nằm ở đâu:
  - FE success page là static promise: `ebayFE/src/pages/OrderSuccessPage.jsx:17-34`
  - BE không gửi order email sau `CreateOrderAsync`: `ebayBE/Services/Implementations/OrderService.cs:21-180`
- Vì sao chặn guest checkout thật:
  - Guest không có account center để quay lại, email confirmation là bắt buộc.
- Mức độ: `P1`
- Sửa tối thiểu:
  - thêm gửi confirmation email sau khi guest order tạo thành công.
- Sửa đúng:
  - email template riêng cho order confirmation + resend endpoint + throttling.

### 2.8 Order lookup blocker
- Nằm ở đâu:
  - Không có guest lookup API hiện tại.
  - `OrdersPage` chỉ dành cho member: `ebayFE/src/store/useOrderStore.js:9-37`
  - `OrderSuccessPage` chỉ giữ query `id`, không có real access info: `ebayFE/src/pages/OrderSuccessPage.jsx:5-8`
  - `View details` route còn không tồn tại: `ebayFE/src/pages/OrdersPage.jsx:181`, `ebayFE/src/App.jsx:51-204`
- Vì sao chặn guest checkout thật:
  - Guest không có cách truy cập order sau khi rời success page.
- Mức độ: `P0`
- Sửa tối thiểu:
  - guest lookup bằng `orderNumber + email`.
- Sửa đúng:
  - lookup bằng `orderNumber + email`, và email confirmation chứa signed access token cho deep link.

### 2.9 Notification/email blocker
- Nằm ở đâu:
  - Notification hiện bắt buộc `user_id`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:448-463`, `ebayBE/Models/Notification.cs:8-12`
  - `OrderService` insert `Type = "order_success"`: `ebayBE/Services/Implementations/OrderService.cs:150-159`
  - SQL constraint chỉ cho `'order', 'payment', 'shipping', 'promotion', 'review', 'message', 'system'`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:459`
- Vì sao chặn guest checkout thật:
  - Guest không có `user_id`.
  - Notification hiện tại không phải nền tảng phù hợp để deliver guest confirmation.
  - Có xung đột runtime/schema rõ ràng.
- Mức độ: `P1`
- Sửa tối thiểu:
  - guest flow dùng email làm kênh chính, chưa cần notification row.
- Sửa đúng:
  - normalize notification type, tách email delivery/audit khỏi in-app notification.

### 2.10 Guest cart persistence blocker
- Nằm ở đâu:
  - `App` luôn gọi `checkAuth()`: `ebayFE/src/App.jsx:208-213`
  - `checkAuth` khi fail sẽ `clearCart()`: `ebayFE/src/store/useAuthStore.js:133-151`
- Vì sao chặn guest checkout thật:
  - guest cart local có rủi ro bị xóa khi app boot hoặc auth check fail.
- Mức độ: `P1`
- Sửa tối thiểu:
  - không clear local guest cart khi `/api/Auth/me` fail.
- Sửa đúng:
  - chỉ clear cart server-owned; tách rõ guest cart lifecycle khỏi auth failure.

## 3. Guest checkout business spec mapping

### Rule: all items must be fixed-price / Buy It Now eligible
- Current code đã có gì:
  - Product có `IsAuction`: `ebayBE/Models/Product.cs:26-32`
  - Product DTO expose `IsAuction`: `ebayBE/DTOs/Responses/ProductResponseDto.cs:32-35`
  - Bid service có branch riêng cho auction: `ebayBE/Services/Implementations/BidService.cs:30-39`
- Thiếu gì:
  - không có backend eligibility service cho checkout
  - không có `BuyItNowEligible` flag riêng
- Sai gì:
  - `ProductPurchaseOptions` luôn render `Buy It Now`, không check `product.isAuction`: `ebayFE/src/components/product/ProductPurchaseOptions.jsx:154-169`
  - `OrderService` không chặn auction item: `ebayBE/Services/Implementations/OrderService.cs:66-80`
- File cần sửa:
  - `ebayFE/src/components/product/ProductPurchaseOptions.jsx`
  - `ebayFE/src/features/checkout/hooks/useCheckout.js`
  - backend service/controller mới cho eligibility

### Rule: no auction items
- Current code đã có gì:
  - hệ thống có `IsAuction` và `BidController`/`BidService`
- Thiếu gì:
  - không có chặn auction ở checkout
- Sai gì:
  - guest có thể đi tới `/checkout?buyItNow=1&productId=...` chỉ bằng UI navigation từ modal
- File cần sửa:
  - `ebayFE/src/components/product/GuestCheckoutModal.jsx`
  - `ebayFE/src/components/product/ProductPurchaseOptions.jsx`
  - backend eligibility service mới

### Rule: backend decides eligibility
- Current code đã có gì:
  - chưa có bằng chứng cho thấy backend đang quyết định guest eligibility
- Thiếu gì:
  - endpoint evaluate eligibility
  - quote model canonical
- Sai gì:
  - FE đang quyết định flow bằng route/query và local form state:
    - `ebayFE/src/components/product/GuestCheckoutModal.jsx:10-19`
    - `ebayFE/src/features/cart/components/CartSummary.jsx:13-23`
- File cần sửa:
  - `checkoutService.js`
  - `useCheckout.js`
  - controller/service mới ở backend

### Rule: guest enters name/email/phone/address/payment
- Current code đã có gì:
  - FE guest form collect email/firstName/lastName/street/city/state/zip/phone: `ebayFE/src/features/checkout/components/ShippingAddress.jsx:170-177`, `:207-260`
  - FE payment selector có PayPal/COD: `ebayFE/src/features/checkout/components/PaymentMethod.jsx:38-80`
- Thiếu gì:
  - BE DTO không nhận guest fields
  - DB không lưu guest contact
- Sai gì:
  - FE field naming khác BE address DTO:
    - FE dùng `firstName`, `lastName`, `zip`, `email`
    - BE member address DTO dùng `FullName`, `PostalCode`, không có email: `ebayBE/DTOs/Requests/AddressRequestDto.cs:5-27`
- File cần sửa:
  - `ShippingAddress.jsx`
  - `useCheckout.js`
  - DTO guest mới ở backend

### Rule: guest order snapshot required
- Current code đã có gì:
  - Order chỉ giữ `AddressId`: `ebayBE/Models/Order.cs:12-15`
  - Response map shipping từ `Address` hiện tại: `ebayBE/Services/Implementations/OrderService.cs:244-277`
- Thiếu gì:
  - immutable guest shipping snapshot
- Sai gì:
  - order detail đang phụ thuộc address book mutable
  - `OrderItem` cũng không snapshot title/image: `ebayBE/Models/OrderItem.cs:10-20`
- File cần sửa:
  - `Order.cs`
  - `OrderItem.cs`
  - SQL schema / EF mapping / create order flow

### Rule: email confirmation required
- Current code đã có gì:
  - mail infrastructure tồn tại qua OTP mail
- Thiếu gì:
  - order confirmation method/template/path
- Sai gì:
  - `OrderSuccessPage` nói đã gửi email nhưng backend không làm việc đó
- File cần sửa:
  - `EmailService.cs`
  - order service guest flow
  - FE success page

### Rule: guest order lookup required
- Current code đã có gì:
  - không có bằng chứng để xác nhận
- Thiếu gì:
  - lookup API
  - lookup page
  - access token hoặc mechanism tương đương
- Sai gì:
  - success page dựng order number giả
  - không có route guest detail
- File cần sửa:
  - controller/service mới
  - `OrderSuccessPage.jsx`
  - thêm page lookup mới

## 4. Database sufficiency for guest checkout

### Current support
- Có `orders`, `order_items`, `payments`, `addresses`, `coupon_usage`, `notifications`, `shipping_info`.
- Có `products.is_auction` để làm eligibility rule: `ebayBE/Models/Product.cs:26-32`.
- Có `order_number` unique và index: `ebayBE/Docker/DB/Init/01_creates_tables.sql:237-256`.
- Có pattern guest identity bằng cookie ở `product_view_history`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:516-525`.

### Missing fields/tables
- Thiếu guest identity trên order:
  - `guest_email`
  - `guest_full_name`
  - `guest_phone`
  - `customer_type` hoặc `is_guest_order`
- Thiếu immutable shipping snapshot:
  - snapshot name/phone/street/city/state/postal_code/country
- Thiếu guest lookup mechanism:
  - `guest_lookup_token_hash` hoặc bảng access token riêng
- Thiếu order-item snapshot đủ dùng:
  - `product_title_snapshot`
  - `product_image_snapshot`
  - tùy chọn `seller_name_snapshot`
- `payments.user_id` đang không hỗ trợ guest
- `coupon_usage` hiện không phản ánh order usage integrity đúng
- Không có email delivery/audit linkage cho guest confirmation

### Integrity risks
- `orders.buyer_id` và `orders.address_id` là NOT NULL nên guest order không insert được.
- `payments.user_id` là NOT NULL nên guest payment record không insert được.
- `orders.address_id` làm source-of-truth shipping bị mutable.
- `OrderService` set order number kiểu `EBAY-...`: `ebayBE/Services/Implementations/OrderService.cs:102-104`
- SQL trigger lại set `ORD-YYYYMMDD-XXXXXX`: `ebayBE/Docker/DB/Init/01_creates_tables.sql:583-592`
- FE success page lại dựng `EB########`: `ebayFE/src/pages/OrderSuccessPage.jsx:5-8`
- `coupon_usage.order_id` là required nhưng service không set `OrderId`: `ebayBE/Services/Implementations/CouponService.cs:81-95`
- Notification type runtime/schema conflict:
  - runtime: `order_success`
  - schema constraint: chỉ `order|payment|shipping|promotion|review|message|system`

### Minimum DB change
- `orders.buyer_id` -> nullable
- `orders.address_id` -> nullable
- `payments.user_id` -> nullable
- thêm trên `orders`:
  - `customer_type`
  - `guest_email`
  - `guest_full_name`
  - `guest_phone`
  - `ship_full_name`
  - `ship_phone`
  - `ship_street`
  - `ship_city`
  - `ship_state`
  - `ship_postal_code`
  - `ship_country`
- thêm index lookup:
  - `(order_number)`
  - `(order_number, guest_email)`
- sửa `coupon_usage` path để luôn có `order_id`

### Correct DB design
- `orders` là canonical record cho cả member và guest:
  - `buyer_id` optional
  - `customer_type` enum `member|guest`
  - guest contact fields
  - immutable shipping snapshot fields
- `order_items` có snapshot title/image
- `payments` gắn canonical vào `order_id`; `user_id` chỉ là optional denormalization nếu cần
- `guest_order_access_tokens` hoặc trường token hash/expiry riêng để deep-link từ email
- không dùng `addresses` làm source-of-truth cho shipping của order đã đặt

### Verdict
- `DB không đủ` cho guest checkout phương án B nếu không đổi schema.
- Lý do:
  - chưa lưu được guest identity
  - chưa lưu được immutable shipping snapshot
  - chưa có lookup mechanism
  - payment/order ownership đang member-bound

## 5. API redesign proposal

### Design principles
- Không vá guest vào `CreateOrderRequestDto` hiện tại.
- Giữ `OrderController` member-only.
- Tạo API guest riêng nhưng chia sẻ core service tính eligibility/totals/order creation.
- Backend phải là canonical source cho:
  - eligibility
  - totals
  - shipping fee
  - allowed payment methods
  - order number

### Endpoint 1: Evaluate guest eligibility
- Route đề xuất: `POST /api/checkout/guest/eligibility`
- Request DTO:
  - `items: [{ productId, quantity }]`
  - `checkoutSource: "cart" | "buy_now"`
  - `couponCode?: string`
- Response DTO:
  - `eligible: boolean`
  - `reasons: string[]`
  - `items: normalized checkout items`
  - `subtotal`
  - `shippingFee`
  - `discountAmount`
  - `totalAmount`
  - `allowedPaymentMethods`
  - `quoteToken` hoặc `quoteExpiresAt`
- Validation rules:
  - item list không rỗng
  - quantity > 0
  - product tồn tại, `Status == active`, `IsActive == true`
  - stock đủ
  - `IsAuction != true`
- Auth: `AllowAnonymous`
- Business notes:
  - phase đầu có thể trả `allowedPaymentMethods = ["COD"]`
  - nếu chưa hỗ trợ coupon guest thì trả lý do rõ ràng

### Endpoint 2: Create guest order
- Route đề xuất: `POST /api/checkout/guest/orders`
- Request DTO:
  - `quoteToken` hoặc `items`
  - `guestFullName`
  - `guestEmail`
  - `guestPhone`
  - `shippingAddress { street, city, state, postalCode, country }`
  - `paymentMethod`
  - `note?`
- Response DTO:
  - `orderId`
  - `orderNumber`
  - `status`
  - `paymentStatus`
  - `paymentMethod`
  - `totalAmount`
  - `shippingSnapshot`
  - `guestAccessToken?`
- Validation rules:
  - re-check eligibility server-side
  - email/phone/address required
  - payment method phải nằm trong allowed methods của quote
  - không cho auction item lọt qua
- Auth: `AllowAnonymous`
- Business notes:
  - không dùng `AddressId`
  - tạo payment record thật
  - gửi confirmation email sau khi commit order thành công

### Endpoint 3: Guest order lookup
- Route đề xuất: `POST /api/checkout/guest/orders/lookup`
- Request DTO:
  - `orderNumber`
  - `email`
  - `accessToken?`
- Response DTO:
  - limited order detail projection
  - `orderNumber`
  - `status`
  - `paymentStatus`
  - `items`
  - `shippingSnapshot`
  - `createdAt`
- Validation rules:
  - match `orderNumber + email`, hoặc signed token valid
  - response generic nếu không match để giảm enumeration risk
- Auth: `AllowAnonymous`
- Business notes:
  - phase đầu có thể dùng `orderNumber + email`
  - phase sau thêm email deep link token

### Endpoint 4: Resend confirmation email
- Route đề xuất: `POST /api/checkout/guest/orders/resend-confirmation`
- Request DTO:
  - `orderNumber`
  - `email`
- Response DTO:
  - generic success message
- Validation rules:
  - rate limit / throttling
  - generic response, không leak order existence
- Auth: `AllowAnonymous`
- Business notes:
  - cần cho trường hợp guest mất email đầu tiên hoặc đóng tab success

## 6. Frontend redesign proposal

### Từ cart
- Giữ:
  - `CartPage`
  - `CartItem`
  - `useCart`
  - `useCartStore`
- Refactor:
  - `CartSummary` không được đẩy guest sang `/login` hoặc `/verify` mặc định nữa
  - `CartSummary` phải gọi backend eligibility với local cart items
- Source of truth chuyển về backend:
  - shipping fee
  - total
  - guest checkout allowed / denied reasons

### Từ buy-it-now
- Giữ:
  - `GuestCheckoutModal`
- Refactor:
  - modal chỉ là entry point, không được coi là bằng chứng guest checkout hoạt động
  - nếu `product.isAuction === true`, FE nên ẩn/disable guest checkout CTA ngay từ UI để đỡ misleading
  - nhưng eligibility cuối cùng vẫn do backend quyết định

### Từ checkout page
- Giữ:
  - `CheckoutPage` shell
- Refactor mạnh:
  - `useCheckout` phải tách member path và guest path
  - guest path không dùng `selectedAddressId`
  - checkout page phải load backend quote/eligibility trước khi cho confirm
  - bỏ hardcoded shipping `145530`
- Chuyển logic từ FE sang BE:
  - totals
  - allowed payment methods
  - guest eligibility

### ShippingAddress
- Không nên giữ nguyên component unified hiện tại.
- Refactor thành:
  - `MemberAddressSelector`
  - `GuestShippingForm`
- Lý do:
  - component hiện tại đang trộn member address book với guest local form
  - `savedAddresses[selectedSavedIdx]` là display state, còn submit lại dựa vào `selectedAddressId`, dẫn tới source-of-truth conflict
    - display logic: `ebayFE/src/features/checkout/components/ShippingAddress.jsx:39-43`
    - submit logic: `ebayFE/src/features/checkout/hooks/useCheckout.js:77-99`

### PaymentMethod
- Giữ component shell.
- Refactor:
  - options phải tới từ backend quote
  - phase đầu guest chỉ nên thấy `COD` nếu team chưa mở guest PayPal thật

### Order success
- Refactor:
  - phải dùng `orderNumber` thật từ backend, không tự dựng từ `id`
  - guest success CTA phải sang guest lookup hoặc hiển thị “check your email”, không đẩy sang `/orders`

### Guest order lookup
- Thêm page mới:
  - `GuestOrderLookupPage`
- Chức năng:
  - nhập `orderNumber + email`
  - xem limited order detail
  - resend confirmation email

## 7. Step-by-step change plan

### Phase 0 — Preconditions
- FE tasks:
  - audit lại toàn bộ CTA guest để bỏ promise sai
  - khóa `OrderSuccessPage` để chỉ hiển thị order number từ backend response
- BE tasks:
  - chốt canonical rule của guest checkout
  - chốt phase đầu guest payment = `COD only`
  - chốt canonical order number source
- DB tasks:
  - chuẩn bị migration strategy cho `orders` và `payments`
- Test tasks:
  - baseline test member checkout hiện tại trước khi đụng order schema
- Migration risk:
  - trung bình
- Dependency:
  - thống nhất thiết kế guest order model

### Phase 1 — Make guest eligibility evaluation real
- FE tasks:
  - `CartSummary` gọi eligibility API thay vì redirect sang login/verify
  - `GuestCheckoutModal` và `CheckoutPage` gọi eligibility API
  - hiển thị deny reasons khi cart có auction/out-of-stock/inactive item
- BE tasks:
  - tạo endpoint `POST /api/checkout/guest/eligibility`
  - tạo service quote/eligibility dùng `Product.IsAuction`, stock, status, shipping fee
- DB tasks:
  - chưa bắt buộc đổi schema nếu quote là stateless
- Test tasks:
  - eligible fixed-price cart
  - mixed cart có auction item
  - out-of-stock
  - inactive product
- Migration risk:
  - thấp
- Dependency:
  - product flags hiện tại (`IsAuction`, `Status`, `Stock`)

### Phase 2 — Make guest order creation real
- FE tasks:
  - submit guest form sang API guest order mới
  - bỏ `selectedAddressId` requirement khỏi guest path
  - payment UI chỉ render methods backend cho phép
- BE tasks:
  - tạo endpoint `POST /api/checkout/guest/orders`
  - tạo guest order DTO
  - tách shared internal order creation core khỏi `OrderService.CreateOrderAsync`
  - gửi confirmation email sau commit
- DB tasks:
  - thêm guest identity + shipping snapshot
  - nullable `orders.buyer_id`
  - nullable `orders.address_id`
  - nullable `payments.user_id`
- Test tasks:
  - create guest COD order end-to-end
  - stock deduct
  - order number persistence
  - email dispatch
- Migration risk:
  - cao vì đụng schema core order/payment
- Dependency:
  - Phase 1 quote/eligibility

### Phase 3 — Make guest post-order access real
- FE tasks:
  - thêm `GuestOrderLookupPage`
  - sửa `OrderSuccessPage` dùng `orderNumber` thật và CTA đúng
- BE tasks:
  - tạo `lookup` và `resend-confirmation`
  - trả limited order projection cho guest
- DB tasks:
  - nếu dùng token: thêm token hash/expiry
  - thêm index `(order_number, guest_email)`
- Test tasks:
  - đúng email + đúng order
  - sai email
  - resend email throttling
- Migration risk:
  - trung bình
- Dependency:
  - guest order row phải tồn tại thật

### Phase 4 — Stabilize checkout/order integrity around guest flow
- FE tasks:
  - unify member/guest checkout quanh backend quote
  - bỏ source-of-truth giả ở totals / shipping / success page
- BE tasks:
  - coupon redesign
  - guest PayPal nếu cần
  - normalize notification type
  - add order-item snapshots
  - logging/audit cho checkout
- DB tasks:
  - fix `coupon_usage`
  - canonical order number strategy
  - payment attempt tracking nếu mở online payment guest
- Test tasks:
  - concurrent stock race
  - rollback on payment failure
  - source-of-truth consistency
- Migration risk:
  - cao
- Dependency:
  - phases trước phải ổn định

## 8. Output tables

### A. Guest checkout gap table

| Rule / Capability | Current code | Missing | Risk | Files impacted | Priority |
| --- | --- | --- | --- | --- | --- |
| Backend decides guest eligibility | Chưa có endpoint hay service eligibility | Eligibility API + quote model | FE promise sai, auction lọt vào checkout | `ebayFE/src/features/cart/components/CartSummary.jsx`, `ebayFE/src/features/checkout/hooks/useCheckout.js`, backend controller/service mới | P0 |
| Exclude auction items | Có `Product.IsAuction` nhưng checkout không dùng | Backend validation `IsAuction != true` | Guest có thể được hứa Buy It Now trên auction item | `ebayFE/src/components/product/ProductPurchaseOptions.jsx`, `ebayBE/Services/Implementations/OrderService.cs` | P0 |
| Guest contact + shipping to BE | FE form local only | Guest order DTO | Guest không tạo order thật | `ShippingAddress.jsx`, `useCheckout.js`, `OrderRequests.cs` | P0 |
| Real guest order creation | `/api/Order` auth-only, contract member-only | Guest create-order endpoint | Guest checkout hiện là flow giả | `OrderController.cs`, `OrderService.cs` | P0 |
| Immutable shipping snapshot | Order chỉ giữ `AddressId` | Snapshot fields/table | Địa chỉ order bị drift theo address book | `Order.cs`, schema orders | P0 |
| Guest payment | FE cho PayPal/COD, BE chỉ member PayPal | Guest payment contract | Payment path gãy hoặc misleading | `PaymentMethod.jsx`, `PaypalController.cs`, `Payment.cs` | P0 |
| Guest email confirmation | Success page chỉ hứa bằng text | Order confirmation mail path | Guest mất khả năng quay lại order | `OrderSuccessPage.jsx`, `EmailService.cs`, guest order service | P1 |
| Guest order lookup | Không có | Lookup API + page | Post-order access bị đứt | `OrderSuccessPage.jsx`, `App.jsx`, controller/service mới | P0 |
| Canonical totals | FE hardcode shipping, cart ghi FREE | Backend quote canonical | Total mismatch, dispute risk | `CartSummary.jsx`, `CheckoutPage.jsx`, backend eligibility service | P0 |
| Canonical order number | BE, DB, FE dùng 3 format khác nhau | Chọn 1 source duy nhất | Lookup/conf email/order detail không tin cậy | `OrderService.cs`, SQL init, `OrderSuccessPage.jsx` | P1 |

### B. Change plan table

| Task | FE | BE | DB | Why needed | Priority | Dependency |
| --- | --- | --- | --- | --- | --- | --- |
| Add guest eligibility API | Call from cart/buy-now/checkout | New endpoint + quote service | None or optional quote token | Stop fake guest checkout promise | P0 | Product rules |
| Stop cart redirect-to-login for guest checkout | Refactor `CartSummary` | None | None | Enable guest flow entry from cart | P0 | Eligibility API |
| Split guest/member checkout paths | Refactor `useCheckout` | Separate guest create service | None | Current hook is member-only | P0 | Eligibility API |
| Add guest order DTO | Submit contact/shipping data | New DTO + validation | None | Current `AddressId` contract blocks guest | P0 | Design sign-off |
| Add guest fields + shipping snapshot on orders | Minimal mapping changes | Persist guest order | Migration on `orders` | Required for real guest order | P0 | DTO finalized |
| Make `payments.user_id` nullable | FE untouched initially | Payment creation updated | Migration on `payments` | Guest payment record otherwise impossible | P0 | Guest order schema |
| Add guest lookup API/page | New page + success CTA | Lookup/resend endpoints | Index/token storage | Guest needs post-order access | P0 | Real guest order |
| Add confirmation email | Success UI copy from real response | Email send path | Optional audit table | Guest cannot rely on member center | P1 | Guest order commit |
| Normalize order number source | Consume returned `orderNumber` only | Stop dual generation | Remove/align trigger strategy | Lookup and email must be stable | P1 | Schema review |
| Disable guest coupon in phase 1 | Hide or message clearly | Return unsupported reason | None | Coupon integrity is currently broken | P1 | Eligibility API |

### C. API contract table

| Endpoint | Purpose | Request | Response | Auth | Notes |
| --- | --- | --- | --- | --- | --- |
| `POST /api/checkout/guest/eligibility` | Evaluate guest checkout eligibility and quote | `items[]`, `checkoutSource`, `couponCode?` | `eligible`, `reasons[]`, totals, `allowedPaymentMethods`, `quoteToken?` | Anonymous | Backend canonical decision |
| `POST /api/checkout/guest/orders` | Create real guest order | `quoteToken/items`, guest contact, shipping address, `paymentMethod`, `note?` | `orderId`, `orderNumber`, status, payment status, totals, `guestAccessToken?` | Anonymous | Revalidate on server before create |
| `POST /api/checkout/guest/orders/lookup` | Lookup guest order | `orderNumber`, `email`, `accessToken?` | Limited order detail | Anonymous | Generic failure response to reduce enumeration |
| `POST /api/checkout/guest/orders/resend-confirmation` | Resend confirmation email | `orderNumber`, `email` | Generic success message | Anonymous | Must throttle |

## 9. Final decision

### Với codebase hiện tại, phương án B có khả thi không
- `Có`, nhưng không khả thi nếu chỉ vá nhẹ vào flow hiện tại.
- Nền tảng tái sử dụng được:
  - product flags (`IsAuction`, `Status`, `Stock`)
  - member order creation core
  - payment infrastructure cơ bản
  - email infrastructure cơ bản
  - pattern guest identity qua cookie ở history
- Nhưng guest checkout thật hiện đang thiếu các khối bắt buộc:
  - guest contract
  - guest order persistence model
  - shipping snapshot
  - lookup flow
  - canonical quote/totals

### Khả thi ở mức nào
- Khả thi kỹ thuật ở mức trung bình.
- Có thể tái sử dụng khoảng `40-50%` nền tảng hiện tại.
- Phần không tái sử dụng được nguyên trạng:
  - `CreateOrderRequestDto`
  - `OrderController`
  - `OrderService.CreateOrderAsync` theo contract member-only
  - current checkout totals logic ở FE
  - current PayPal flow cho guest

### Có nên làm full guest checkout ngay không hay rollout theo 2 bước
- Nên rollout theo `2 bước`:
  - bước 1: eligibility thật + guest COD order creation + confirmation email + lookup
  - bước 2: guest online payment và coupon
- Không nên mở guest PayPal ngay khi order schema và lookup chưa ổn.

### Cái gì phải làm trước tiên
- Chọn canonical design cho guest order:
  - nullable member ownership
  - guest contact
  - immutable shipping snapshot
- Sau đó làm eligibility API thật.
- Sau đó mới làm guest order create.

### Cái gì có thể postpone
- Guest PayPal
- Guest coupon
- Advanced notification persistence cho guest
- Tokenized deep-link lookup nếu phase đầu đã có `orderNumber + email`

### Kết luận thẳng
- Guest checkout hiện tại không phải flow thật.
- Nó là tập hợp của:
  - route public
  - modal/UI promise
  - local form state
  - member-only backend contract
- Nếu team muốn giống eBay ở mức hợp lý, hướng đúng là:
  - backend eligibility trước
  - guest order model thật sau
  - guest post-order access sau nữa
- Không nên cố nhồi guest vào `AddressId + [Authorize] + member payment` hiện tại.
