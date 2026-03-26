# Guest Checkout Implementation Tasks

## Scope
- Tài liệu này chuyển [GUEST_CHECKOUT_REDESIGN_AUDIT.md](d:/Sping26/PRN232_Ebay/Ebay-Clone/GUEST_CHECKOUT_REDESIGN_AUDIT.md) thành backlog triển khai.
- Phạm vi chỉ cho guest checkout phase 1:
  - fixed-price only
  - non-auction only
  - COD only
  - không coupon nếu quote/order path chưa được chuẩn hóa

## Phase 0 — Spec And Guardrails

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Chốt rule guest checkout phase 1 | `ebayFE/src/features/checkout/*`, `ebayBE/Controllers/*`, `ebayBE/Services/*`, docs nội bộ mới | Chỉ cho guest checkout với fixed-price, non-auction, phase đầu chỉ COD | Nếu rule mơ hồ thì FE/BE sẽ tự hiểu khác nhau | Có spec ngắn mô tả rule phase 1; FE/BE/QA cùng bám đúng một rule |
| Chốt state contract cho guest order/payment | `ebayBE/Models/Order.cs`, `ebayBE/Models/Payment.cs`, `ebayBE/Services/Implementations/OrderService.cs`, docs nội bộ mới | Xác định rõ guest COD order tạo ra `order.status` và `payment.status` nào | Nếu không chốt sớm, lookup/email/FE success page sẽ diễn giải sai | Có bảng state tối thiểu cho guest COD và service code bám theo |
| Chốt canonical order number source | `ebayBE/Services/Implementations/OrderService.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayFE/src/pages/OrderSuccessPage.jsx` | Chỉ có một nguồn sinh và hiển thị order number | Hiện có 3 format khác nhau giữa FE/BE/DB | Order success, email và lookup cùng dùng một order number thật |

## Phase 1 — Schema And Persistence

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Thêm customer type cho order | `ebayBE/Models/Order.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Phân biệt rõ `member` và `guest` | Nếu không có sẽ phải suy đoán từ `buyer_id` null | Order lưu được loại khách hàng rõ ràng |
| Cho `orders.buyer_id` nullable | `ebayBE/Models/Order.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Support guest order thật | Query/order history cũ có thể assume non-null buyer | Guest order tạo được mà không cần account |
| Cho `orders.address_id` nullable | `ebayBE/Models/Order.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Bỏ dependency bắt buộc vào address book | FE/BE có thể vẫn render từ address book cũ nếu không dọn kỹ | Guest order không cần `AddressId` mà vẫn lưu được shipping đầy đủ |
| Thêm immutable shipping snapshot trên order | `ebayBE/Models/Order.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Lưu `guest_full_name`, `guest_email`, `guest_phone`, `ship_*` trên order | Nếu vẫn phụ thuộc `addresses` thì order detail sẽ drift khi profile đổi | Order detail render đúng ngay cả khi address book thay đổi |
| Thêm immutable item snapshot | `ebayBE/Models/OrderItem.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Snapshot title/image/seller hiển thị của item lúc đặt đơn | Nếu không snapshot, order email/detail sẽ drift theo listing hiện tại | Order item vẫn hiển thị đúng khi product đổi title/image hoặc bị ẩn |
| Cho `payments.user_id` nullable | `ebayBE/Models/Payment.cs`, `ebayBE/Models/EbayDbContext.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Cho phép payment record của guest | Query/payment history cũ có thể assume member ownership | Guest COD/payment record lưu được mà không cần member |
| Đồng bộ EF migration và init SQL | `ebayBE/Migrations/*`, `ebayBE/Docker/DB/Init/01_creates_tables.sql` | Tránh schema drift giữa local/dev/docker | Môi trường khác nhau ra behavior khác nhau | Migration và init SQL phản ánh cùng một schema guest-ready |
| Tạo migration rollout plan | docs nội bộ mới, `ebayBE/Migrations/*` | Có thứ tự rollout an toàn cho thêm nullable và snapshot fields | Đổi schema trực tiếp có thể làm gãy môi trường đang chạy | Có plan rõ: add columns -> deploy code đọc field mới -> cleanup/backfill nếu cần |

## Phase 2 — Checkout Core And Guest APIs

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Tạo shared checkout core service | `ebayBE/Services/Implementations/OrderService.cs`, `ebayBE/Services/Implementations/CheckoutCoreService.cs` (new), `ebayBE/Services/Interfaces/*` | Dùng chung quote/validation/order creation core cho member và guest | Nếu vá trực tiếp vào code cũ sẽ thành `if guest else` lan khắp nơi | Member/guest dùng chung lõi tính item, stock, shipping, total |
| Tách member checkout contract và guest checkout contract | `ebayBE/DTOs/Requests/OrderRequests.cs`, `ebayBE/DTOs/Requests/GuestCheckoutRequests.cs` (new), `ebayFE/src/features/checkout/hooks/useCheckout.js` | Có 2 request model rõ ràng nhưng dùng chung core service | Nếu dùng chung contract sẽ méo DTO và khó maintain | Member và guest có DTO/request builder riêng |
| Tạo DTO guest eligibility request/response | `ebayBE/DTOs/Requests/GuestCheckoutRequests.cs` (new), `ebayBE/DTOs/Responses/GuestCheckoutResponses.cs` (new) | Contract rõ cho FE gọi eligibility | DTO lẫn với member DTO gây rối | Có DTO riêng cho guest eligibility |
| Tạo canonical quote cho checkout | `ebayBE/Services/Implementations/CheckoutCoreService.cs` (new), `ebayFE/src/features/checkout/services/checkoutService.js`, `ebayFE/src/pages/CheckoutPage.jsx`, `ebayFE/src/features/cart/components/CartSummary.jsx` | Một source of truth cho subtotal/shipping/discount/total | Totals lệch giữa cart/checkout/order sẽ gây fake flow | FE render total từ backend response, không tự tính lệch |
| Tạo endpoint evaluate eligibility | `ebayBE/Controllers/CheckoutController.cs` (new), `ebayBE/Services/Implementations/CheckoutCoreService.cs` | Backend quyết định guest có được checkout không | Nếu FE tự quyết eligibility thì guest flow vẫn là giả | API trả `eligible`, `reasons`, `canonicalTotals`, `normalizedItems`, `allowedPaymentMethods` |
| Chặn auction khỏi guest flow | `ebayBE/Services/Implementations/CheckoutCoreService.cs`, `ebayBE/Services/Implementations/OrderService.cs`, `ebayFE/src/components/product/ProductPurchaseOptions.jsx`, `ebayFE/src/components/product/GuestCheckoutModal.jsx` | Đúng rule guest phase 1 | FE chặn mà BE không chặn thì vẫn lọt; BE chặn mà FE không chặn thì UX sai | Auction và won-bid luôn cho `guestEligible = false` |
| Tạo DTO create guest order riêng | `ebayBE/DTOs/Requests/GuestCheckoutRequests.cs` (new), `ebayBE/DTOs/Responses/GuestCheckoutResponses.cs` (new) | Không vá guest vào `CreateOrderRequestDto` hiện tại | Nhồi guest vào DTO member sẽ làm contract méo | Có request model riêng cho guest với name/email/phone/address/payment |
| Tạo API `POST /api/checkout/guest/orders` | `ebayBE/Controllers/CheckoutController.cs` (new), `ebayBE/Services/Implementations/GuestCheckoutService.cs` (new), `ebayBE/Services/Implementations/CheckoutCoreService.cs` | Tạo guest order thật | Nếu reuse `[Authorize]` cũ thì guest không vào được | Guest tạo order thành công không cần login |
| Ràng buộc guest chỉ dùng COD ở phase 1 | `ebayFE/src/features/checkout/components/PaymentMethod.jsx`, `ebayFE/src/features/checkout/hooks/useCheckout.js`, `ebayBE/Services/Implementations/GuestCheckoutService.cs` (new) | Giảm risk payment contract khi guest flow mới | Mở PayPal quá sớm sẽ đụng auth/user-bound payment path | Guest chỉ thấy COD; backend chặn method khác |
| Thêm idempotency/double-submit protection cho guest order create | `ebayBE/Controllers/CheckoutController.cs` (new), `ebayBE/Services/Implementations/GuestCheckoutService.cs` (new), `ebayFE/src/features/checkout/hooks/useCheckout.js` | Tránh duplicate order khi double-click/retry | Endpoint anonymous rất dễ tạo duplicate order | Submit lặp lại không tạo 2 order giống nhau |
| Fix notification type mismatch | `ebayBE/Services/Implementations/OrderService.cs`, `ebayBE/Services/Implementations/GuestCheckoutService.cs` (new), `ebayBE/Docker/DB/Init/01_creates_tables.sql`, `ebayBE/Migrations/*` | Tránh order create fail ở cuối transaction | Type runtime hiện không khớp DB constraint | Tạo order không fail do notification type |
| Chuẩn hóa coupon path trước khi mở cho guest | `ebayBE/Services/Implementations/CouponService.cs`, `ebayBE/Services/Implementations/CheckoutCoreService.cs`, `ebayBE/Models/CouponUsage.cs`, `ebayBE/Docker/DB/Init/01_creates_tables.sql` | Không để coupon làm vỡ order path | Coupon hiện còn chưa sạch ngay cả với member | Quote/order path xử lý coupon nhất quán hoặc bị disable rõ ràng |
| Chốt guest phase 1 không dùng coupon nếu chưa ổn | `ebayFE/src/pages/CheckoutPage.jsx`, `ebayFE/src/features/checkout/services/checkoutService.js`, `ebayBE/Controllers/CheckoutController.cs` (new) | Giảm phạm vi rollout | Mở coupon quá sớm sẽ tạo nhiều mismatch và bug | Guest phase 1 bỏ coupon hoặc backend trả reject reason rõ ràng |
| Sửa queries/order history để chịu được guest order | `ebayBE/Services/Implementations/OrderService.cs`, `ebayBE/DTOs/Requests/OrderRequests.cs`, `ebayBE/Models/Order.cs` | Không làm vỡ member order screens khi `buyer_id` nullable | Query cũ assume non-null buyer | Member flow vẫn chạy; guest order không phá dữ liệu cũ |

## Phase 3 — Frontend Checkout Flow

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Gắn eligibility vào cart entry point | `ebayFE/src/features/cart/components/CartSummary.jsx`, `ebayFE/src/features/checkout/services/checkoutService.js` | Guest chỉ vào checkout khi eligible hoặc được báo lý do | FE vào checkout xong mới vỡ ở cuối | Cart CTA hiển thị lý do không eligible từ backend |
| Gắn eligibility vào buy-now entry point | `ebayFE/src/components/product/ProductPurchaseOptions.jsx`, `ebayFE/src/components/product/GuestCheckoutModal.jsx`, `ebayFE/src/features/checkout/services/checkoutService.js` | Buy-now guest không bypass eligibility | Guest đi thẳng `/checkout?buyItNow=1` trên item không hợp lệ | Modal/CTA phản ánh đúng kết quả backend |
| Tách guest checkout flow và member checkout flow ở FE | `ebayFE/src/features/checkout/hooks/useCheckout.js`, `ebayFE/src/pages/CheckoutPage.jsx` | Giảm coupling và tránh logic rối | Dùng chung hook hiện tại sẽ đầy condition khó maintain | Có 2 branch/request builder rõ ràng nhưng dùng chung quote backend |
| Sửa source of truth địa chỉ checkout | `ebayFE/src/pages/CheckoutPage.jsx`, `ebayFE/src/features/checkout/components/ShippingAddress.jsx`, `ebayFE/src/features/checkout/hooks/useCheckout.js` | Địa chỉ hiển thị và địa chỉ tạo order phải là một | Buyer nhìn một địa chỉ nhưng order lưu địa chỉ khác | FE submit đúng payload/address source từ guest form hoặc quote canonical |
| Sửa `OrderSuccessPage` dùng dữ liệu thật | `ebayFE/src/pages/OrderSuccessPage.jsx`, `ebayFE/src/App.jsx` | Hiển thị order number/order info thật từ backend | Hiện page đang fake order number và fake email claim | Page hiển thị đúng order number, customer type và next steps |
| Tạo guest order detail page | `ebayFE/src/pages/GuestOrderLookupPage.jsx` (new), `ebayFE/src/pages/GuestOrderDetailPage.jsx` (new), `ebayFE/src/App.jsx` | Cho guest xem order tối thiểu sau lookup | Không có page thì email confirmation không đủ hữu ích | Guest mở được order detail bằng lookup flow |
| Dọn UI promise guest checkout | `ebayFE/src/components/product/GuestCheckoutModal.jsx`, `ebayFE/src/features/cart/components/CartSummary.jsx`, `ebayFE/src/pages/CheckoutPage.jsx` | UI chỉ hiện guest checkout khi flow thật tồn tại | Hứa guest checkout nhưng backend chưa có | Không còn flow giả; CTA phản ánh trạng thái thật |
| Sửa guest cart persistence khi auth check fail | `ebayFE/src/store/useAuthStore.js`, `ebayFE/src/App.jsx`, `ebayFE/src/features/cart/hooks/useCartStore.js` | Không làm mất guest cart vô cớ | Guest cart hiện có thể bị clear khi app boot/checkAuth fail | Guest cart còn nguyên khi user chưa đăng nhập |

## Phase 4 — Post-Order Access And Hardening

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Tạo confirmation email cho guest | `ebayBE/Services/Implementations/EmailService.cs`, `ebayBE/Services/Implementations/GuestCheckoutService.cs` (new), email template mới | Guest có entry point sau mua | Không có email thì guest gần như mất đơn | Guest nhận email có order number và link tra cứu |
| Tạo guest order lookup API | `ebayBE/Controllers/GuestOrderController.cs` (new) hoặc `CheckoutController.cs` (new), `ebayBE/Services/Implementations/GuestOrderLookupService.cs` (new) | Cho guest tra cứu đơn bằng `orderNumber + email` hoặc token | Enumeration risk nếu làm ẩu | Guest xem được order tối thiểu sau mua |
| Thêm generic response cho guest lookup | `ebayBE/Controllers/GuestOrderController.cs` (new), `ebayBE/Services/Implementations/GuestOrderLookupService.cs` (new) | Giảm enumeration risk | API có thể leak order existence | Lookup sai không lộ quá nhiều thông tin |
| Thêm throttling cho lookup/resend email | `ebayBE/Controllers/GuestOrderController.cs` (new), middleware/config rate limit | Chống abuse cho endpoint anonymous | Nếu không throttle, lookup và resend sẽ bị spam | Lookup/resend có rate limit thực thi được |
| Cân nhắc signed token cho lookup link | `ebayBE/Services/Implementations/EmailService.cs`, `ebayBE/Services/Implementations/GuestOrderLookupService.cs` (new), schema token mới nếu cần | Hướng nâng cấp an toàn hơn `orderNumber + email` | Nếu bỏ qua quá lâu sẽ tăng rủi ro public lookup | Có tokenized link hoặc ít nhất có thiết kế/plan nâng cấp rõ ràng |

## Phase 5 — Testing And Documentation

| Task | File cần sửa | Mục tiêu | Risk | Done criteria |
| --- | --- | --- | --- | --- |
| Tạo test matrix cho eligibility | test backend mới, checklist FE/QA mới | Kiểm tra fixed-price vs auction, COD-only, required fields | Rule sai sẽ tạo regressions khó thấy | Có case pass cho eligible/ineligible chính |
| Tạo test create guest order | integration tests backend mới | Xác minh guest order transaction hoàn chỉnh | Runtime fail giữa chừng rất khó debug | Guest order tạo thành công với snapshot, payment, order number |
| Tạo test lookup/email flow | tests backend/FE mới | Xác minh guest có thể vào lại đơn sau mua | Mua xong không tra cứu được | Guest nhận email và lookup thành công |
| Cập nhật spec/README nội bộ cho guest checkout | docs nội bộ mới | Giữ FE/BE/QA cùng hiểu một nghiệp vụ | Không có spec sẽ drift lại sau vài sprint | Có tài liệu ngắn mô tả rule, API, state, limitation của guest phase 1 |
