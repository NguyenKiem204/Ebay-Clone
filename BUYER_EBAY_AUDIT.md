# Executive summary

Audit date: 2026-03-25  
Audit scope: buyer-side capability of the current marketplace codebase (`ebayFE` + `ebayBE`)  
Evidence basis: database schema, EF models, Docker init SQL, backend controllers/services/DTOs, frontend pages/hooks/stores/components, build status, and runtime wiring actually present in code.

## Overall conclusion

This codebase is **not yet a production-ready eBay-like buyer system**.

What is real today:
- Public catalog browse/search/product-detail exists.
- Authenticated cart CRUD exists.
- Authenticated fixed-price order creation exists in backend.
- Basic seller profile display exists.
- Saved items, watchlist, and recently viewed exist in some form.

What is not real or not complete:
- Guest checkout is **not supported end-to-end**.
- Checkout has a **source-of-truth split** between displayed address and actual `addressId` used by backend.
- Order history/detail is incomplete and partly mismatched between FE and BE.
- Payment is only partially wired, PayPal flow is simplified, and integrity controls are weak.
- Reviews, notifications, returns, INR, SNAD, disputes, buyer protection, and messaging are mostly **schema-only** or write-only.
- Auction is isolated and incomplete; it does not behave like a full eBay auction journey.

## Maturity estimate by buyer area

These percentages are inferred from code coverage, not from production telemetry:

| Area | Relative maturity | Notes |
| --- | --- | --- |
| Guest browse/search | 60% | Search/detail works, but auction filter and many item facts are fake/static |
| Guest cart | 35% | Local cart exists, but persistence is fragile and checkout is blocked |
| Guest checkout | 5% | UI exists, backend/DB contract does not support it |
| Auth/profile | 45% | Core flows exist, but security and FE/BE contract mismatches are serious |
| Member cart | 60% | CRUD works, but no reservation/state machine and optimistic FE updates are weak |
| Authenticated checkout/order create | 35% | Backend can create orders, but totals/address/payment flow are not clean |
| Order history/detail | 25% | APIs exist, FE mapping/detail route are broken |
| Saved/watchlist/history | 55% | Basic persistence exists, semantics and guest behavior are inconsistent |
| Seller trust signals | 40% | Profile/reviews exist, but many signals are simulated or incomplete |
| Reviews/after-sales | 10% | Mostly schema-only |
| Returns/disputes/protection | 5% | Schema exists, business flow does not |
| Auctions | 20% | Place/list bids exists, but settlement and marketplace behavior do not |

## Benchmark used for eBay-like buyer behavior

Official eBay help/policy pages used as benchmark:
- Buying hub: <https://www.ebay.com/help/buying>
- Guest buying: <https://www.ebay.com/help/buying/paying-items/buying-guest?id=4035>
- Money Back Guarantee policy: <https://www.ebay.com/help/policies/money-back-guarantee/ebay-money-back-guarantee-policy?id=4210>
- How bidding works: <https://www.ebay.com/help/buying/auctions-bidding>

Benchmark facts used in this audit:
- eBay allows guest checkout for most eligible **Buy It Now** items, typically below a threshold and with supported payment methods; guest buyers can still track and return through confirmation email flows.
- eBay cart supports fixed-price multi-item checkout.
- eBay buyer protection explicitly covers item-not-received, damaged/faulty, item-not-as-described, and seller return-policy failure when eligibility rules are met.
- eBay surfaces seller trust signals such as feedback %, detailed seller ratings, sold count, watchers, member since, and return policy.
- eBay auction behavior includes account-based bidding, bid history, outbid/winning state, and post-auction payment/settlement.

## Build and test snapshot

- `dotnet build` in `ebayBE`: success.
- `npm run build` in `ebayFE`: fails because `@react-oauth/google` is imported in `src/main.jsx` but not resolved from current workspace runtime.
- No meaningful automated test suite was found.

## High-level verdict

- **Production-ready buyer flows:** none end-to-end.
- **Demoable flows:** browse, product detail, saved/watchlist/history, member cart, simple authenticated COD order placement.
- **Misleading/fake flows:** guest checkout, order detail button, buyer protection UI badges, seller other items, some auction surfaces, several item-detail facts.
- **First thing to fix:** canonical checkout contract and order integrity. Everything downstream depends on that.

# Module inventory

## Inventory table

| Group | Module / capability | FE | BE | DB | Main evidence | Current state | Confidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Guest | Landing / browse | Yes | Yes | Yes | `ebayFE/src/pages/HomePage.jsx`, `ebayBE/Services/Implementations/ProductService.cs` | Partial, real | High |
| Guest | Search / filter | Yes | Yes | Yes | `ebayFE/src/pages/ProductsPage.jsx`, `ProductSearchRequestDto.cs`, `ProductService.cs` | Partial, auction filter broken | High |
| Guest | Product detail | Yes | Yes | Yes | `ProductDetailsPage.jsx`, `ProductPurchaseOptions.jsx`, `AboutThisItem.jsx`, `ProductService.GetProductByIdAsync` | Partial, many facts static | High |
| Guest | Recently viewed | Yes | Yes | Yes | `useHistoryStore.js`, `HistoryController.cs`, `product_view_history` | Partial | High |
| Guest | Guest cart | Yes | No dedicated guest API | Schema hints only | `useCartStore.js`, `useAuthStore.js`, `CartService.cs`, `Cart.UserId nullable` | Partial with persistence bug | High |
| Guest | Guest checkout | Yes | No | No | `GuestCheckoutModal.jsx`, `CheckoutPage.jsx`, `[Authorize]` on `OrderController` | UI only | High |
| Buyer | Register / login / social login | Yes | Yes | Yes | `RegisterForm.jsx`, `LoginForm.jsx`, `AuthController.cs`, `AuthService.cs`, `users` | Partial with major security issues | High |
| Buyer | Profile / address | Yes | Yes | Yes | `ProfilePage.jsx`, `AddressTab.jsx`, `AddressController.cs`, `addresses` | Partial, contract mismatches | High |
| Buyer | Member cart | Yes | Yes | Yes | `useCart.js`, `CartController.cs`, `CartService.cs`, `carts`, `cart_items` | Partial, core works | High |
| Buyer | Buy It Now | Yes | Yes | Yes | `ProductPurchaseOptions.jsx`, `useCheckout.js`, `OrderService.CreateOrderAsync` | Partial, auth-only | High |
| Buyer | Cart checkout | Yes | Yes | Yes | `CheckoutPage.jsx`, `useCheckout.js`, `OrderService.cs` | Partial, checkout data inconsistent | High |
| Buyer | Saved items | Yes | Yes | Yes | `useSavedStore.js`, `SavedController.cs`, `wishlists` | Partial | High |
| Buyer | Watchlist | Yes | Yes | Yes | `useWatchlistStore.js`, `WatchlistController.cs`, `watchlist` | Partial | High |
| Buyer | Order history | Yes | Yes | Yes | `OrdersPage.jsx`, `useOrderStore.js`, `OrderController.cs`, `orders` | Broken/partial | High |
| Buyer | Order detail | No route | Yes | Yes | `GET /api/Order/{id}`, no FE route in `App.jsx` | API only | High |
| Buyer | Cancel order | Yes | Yes | Yes | `OrdersPage.jsx`, `OrderService.CancelOrderAsync` | Partial | High |
| Payment | COD | Yes | Yes | Yes | `PaymentMethod.jsx`, `CreateOrderRequestDto`, `payments` | Partial | High |
| Payment | PayPal | Yes | Yes | Yes | `PaypalController.cs`, `PaypalService.cs`, `checkoutService.js` | Partial, simulated feel | High |
| Payment | Credit card / Apple Pay / Google Pay | UI badges only | No buyer checkout flow | Schema enum supports some methods | `ProductPurchaseOptions.jsx`, `payments.method` | UI only / schema only | High |
| Order | Shipping info / tracking | UI text only | No buyer flow | Yes | `CheckoutPage.jsx`, `ShippingInfo.cs`, `shipping_info` | Schema only / mock UI | High |
| Seller data shown to buyer | Seller profile / reviews | Yes | Yes | Yes | `SellerController.cs`, `SellerService.cs`, `SellerFeedbackModal`, `reviews`, `seller_feedback` | Partial | High |
| Seller data shown to buyer | Storefront / seller other items | Partial UI | Partial BE | Yes | `SellerOtherItems.jsx`, `stores`, seller/store links | Mostly mock / incomplete | High |
| Trust / Safety / Policy | Lockout / rate limit / anti-spam | Minimal FE | Yes | Yes | `AuthService.cs`, `RateLimitingMiddleware.cs`, `AntiSpamMiddleware.cs`, `users.failed_login_attempts` | Partial | High |
| Trust / Safety / Policy | Buyer protection / MBG | Badge copy only | No flow | No full case model | `CheckoutPage.jsx`, `ProductPurchaseOptions.jsx` | UI only | High |
| Notifications / Messaging | Notifications | No inbox UI | Write-only in order flow | Yes | `Notification.cs`, `OrderService.cs`, `notifications` | Partial / write-only / risky | High |
| Notifications / Messaging | Buyer-seller messaging | No | No | Yes | `Message.cs`, no controller route | Schema only | High |
| Review / Returns / Disputes | Review / feedback after purchase | No buyer flow | No controller | Yes | `Review.cs`, no review controller | Schema only | High |
| Review / Returns / Disputes | Returns | No | No | Yes | `ReturnRequest.cs`, `return_requests` | Schema only | High |
| Review / Returns / Disputes | Item not received / SNAD / disputes | No | No | Partial generic schema | `Dispute.cs`, `disputes` | Schema only | High |
| Auction / Bidding | Bid placement / bid history | Minimal | Yes | Yes | `BidController.cs`, `BidService.cs`, `useAuctionStore.js`, `bids` | Partial | High |
| Auction / Bidding | Auction browse / settlement | Mock FE + partial BE | Partial | Yes | `ActiveAuctions.jsx`, `ProductsPage.jsx`, `products.is_auction` | Partial / mostly incomplete | High |

## Inventory notes

- `guild_ui` and `seller_ui` are not runtime buyer-facing applications. They are design/prototype assets, not production feature evidence.
- No buyer admin/moderation flow was found.
- No shipping carrier integration, no tax engine, no notification delivery service, and no after-sales workflow were found.

# Database sufficiency review

## Identity, membership, and guest capability

### DB hiện tại đang hỗ trợ gì
- `users` holds role, lockout, email verification, external provider, reset token, phone.
- `refresh_tokens` supports session continuation and revocation chain.
- `addresses` stores user shipping addresses with `is_default`.
- `carts.user_id` is nullable, which superficially suggests guest cart support.

### Nó support tốt điều gì
- Authenticated buyer identity and saved address management.
- Social-login-linked user accounts.
- Basic account lockout and email-verification persistence.

### DB còn thiếu gì
- No guest buyer identity table.
- No guest order table or guest order token table.
- No order-linked guest email/name snapshot.
- No restriction/ban/policy case table for buyer abuse.
- No device fingerprint, risk score, or suspicious order metadata.

### Rủi ro trong thiết kế DB
- Schema suggests guest capability (`carts.user_id nullable`) but implementation does not use server-side guest carts.
- Buyer policy enforcement is limited to `is_active`, failed login attempts, and lockout.
- No explicit legal consent / KYC / payment risk flags.

### Kết luận
- **DB đủ một phần**
- Sufficient for registered buyers. Not sufficient for real guest commerce or buyer risk management.

## Catalog, listing, and seller-display support

### DB hiện tại đang hỗ trợ gì
- `products`, `categories`, `stores`, `seller_feedback`, `reviews`, `bids`, `wishlists`, `watchlist`, `product_view_history`.
- `products` stores `is_auction`, `auction_start_time`, `auction_end_time`, `starting_bid`, `stock`, `shipping_fee`, `status`, `condition`.
- `seller_feedback` stores aggregate counts and rating.

### Nó support tốt điều gì
- Public listing catalog with category hierarchy.
- Basic fixed-price and auction flagging.
- Seller feedback aggregate persistence.
- View/saved/watch counts can be derived.

### DB còn thiếu gì
- No immutable item-specific snapshot for buyer-facing detail content.
- No dedicated seller reputation history or moderation flags.
- No listing policy fields like returns policy, handling time, shipping service level, item location normalization.
- No saved seller / followed seller table for buyer.

### Rủi ro trong thiết kế DB
- `products.stock` overlaps conceptually with `inventory.quantity` and `inventory.reserved_quantity`.
- Buyer-facing shipping/returns promises are not stored as first-class business fields.
- Seller reputation detail is partly derived from reviews rather than modeled cleanly.

### Kết luận
- **DB đủ một phần**
- Good enough for demo catalog browsing; not enough for a robust eBay-like buyer trust layer.

## Cart persistence

### DB hiện tại đang hỗ trợ gì
- `carts` one-to-one with user.
- `cart_items` unique per `(cart_id, product_id)`.
- Product linkage and quantities are modeled correctly.

### Nó support tốt điều gì
- Authenticated server-side cart persistence.
- Merge target after login.

### DB còn thiếu gì
- No guest cart token/cart ownership for anonymous users.
- No cart line state such as `selected`, `invalid`, `price_changed`, `stock_changed`, `reserved`.
- No cart expiration / abandonment tracking.

### Rủi ro trong thiết kế DB
- Nullable `user_id` hints at guest carts, but no actual anonymous ownership mechanism exists.
- No reservation model means checkout competes directly on `products.stock`.

### Kết luận
- **DB đủ một phần**
- Enough for authenticated cart CRUD. Not enough for resilient marketplace checkout.

## Address and order snapshot integrity

### DB hiện tại đang hỗ trợ gì
- `orders` links to `buyer_id`, `address_id`, totals, coupon, note, status.
- `order_items` links to `product_id`, `seller_id`, quantity, `unit_price`, `total_price`.
- `addresses` is normalized and reusable.

### Nó support tốt điều gì
- Basic order creation for authenticated users with a saved address.
- Price snapshot at order-item level.

### DB còn thiếu gì
- No immutable shipping-address snapshot on order.
- No immutable product title/image snapshot on `order_items`.
- No store/seller display snapshot on order.
- No order event history table.
- No shipment method snapshot or promised-delivery snapshot.
- No tax jurisdiction / tax calculation snapshot.

### Rủi ro trong thiết kế DB
- If a buyer edits or deletes an address later, historical order display can drift because order stores only `address_id`.
- Buyer order history still depends on current `Product` record for item title/image.
- Docker init SQL defines `buyer_id INT NOT NULL ... ON DELETE SET NULL` and `address_id INT NOT NULL ... ON DELETE SET NULL`, which is internally contradictory.
- `order_items.product_id` and `order_items.seller_id` are also `NOT NULL` with `ON DELETE SET NULL` in Docker SQL, which is inconsistent design.
- Runtime `OrderService` generates `EBAY-...` order numbers, while init SQL trigger generates `ORD-YYYYMMDD-XXXXXX`.

### Kết luận
- **DB không đủ**
- The current schema cannot guarantee buyer-grade order history integrity over time.

## Payment records and payment integrity

### DB hiện tại đang hỗ trợ gì
- `payments` stores `order_id`, `user_id`, `amount`, `method`, `status`, `transaction_id`, `payment_gateway`, `paid_at`.
- Payment statuses allowed in init SQL: `pending`, `completed`, `failed`, `refunded`.

### Nó support tốt điều gì
- One basic payment record per order.
- Minimal COD/PayPal tracking.

### DB còn thiếu gì
- No payment intent / authorization / capture / void states.
- No webhook/event table.
- No refund transaction table.
- No partial refund / chargeback / dispute-payment linkage.
- No idempotency key table.

### Rủi ro trong thiết kế DB
- Payment history is flattened into one record, which is too weak for real gateway reconciliation.
- `OrderService` reads payment status from navigation that is not eagerly loaded in list/detail queries.
- Frontend and backend currently do not share a canonical order-payment state graph.

### Kết luận
- **DB đủ một phần**
- Enough for a demo payment status, not enough for reliable commerce accounting.

## Coupon and promotion support

### DB hiện tại đang hỗ trợ gì
- `coupons`, `coupon_products`, `coupon_usage`.
- Coupon can target store/category/products and track limits.
- `orders.coupon_id` plus discount fields.

### Nó support tốt điều gì
- Basic coupon existence, date window, max usage, and min order amount.
- Store/category/product applicability can be persisted.

### DB còn thiếu gì
- No explicit per-order coupon snapshot beyond ID/discount amount.
- No item-level discount allocation.
- No coupon validation log / reason log.
- No rule versioning.

### Rủi ro trong thiết kế DB
- `coupon_usage.order_id` is required in schema/model, but `CouponService.UseCouponAsync` creates `CouponUsage` without setting `OrderId`.
- This is a hard integrity defect: runtime usage logic does not satisfy schema contract.
- Coupon usage increments before order completion is fully committed to a consistent business result.

### Kết luận
- **DB đủ một phần**
- The schema can support coupons, but current runtime contract is internally broken.

## Saved items, watchlist, and browse history

### DB hiện tại đang hỗ trợ gì
- `wishlists` for saved items.
- `watchlist` for watchlist.
- `product_view_history` with `user_id` or `cookie_id`, uniqueness, and expiry tracking.

### Nó support tốt điều gì
- Authenticated bookmarking.
- Guest and member recently-viewed persistence.

### DB còn thiếu gì
- No semantic distinction documented between “saved” and “watchlist”.
- No saved-search table.
- No saved-seller table.

### Rủi ro trong thiết kế DB
- Two bookmarking concepts (`wishlists` and `watchlist`) overlap heavily.
- `ProductResponseDto.SavedCount` adds both wishlist and watchlist counts, which mixes two buyer intents.
- Guest history depends on cookie behavior, but operational behavior is fragile in dev/non-HTTPS.

### Kết luận
- **DB đủ một phần**
- Good enough for simple persistence, but semantics and analytics are muddy.

## Review and feedback

### DB hiện tại đang hỗ trợ gì
- `reviews` stores `product_id`, `reviewer_id`, optional `order_id`, rating, comment, images, `is_verified_purchase`, helpful count.
- Unique composite key limits duplicate review per `(product, reviewer, order)`.
- `seller_feedback` holds aggregate seller reputation.

### Nó support tốt điều gì
- Basic review persistence.
- Potential verified-purchase flag.

### DB còn thiếu gì
- No review eligibility state.
- No seller-feedback submission workflow entity.
- No moderation status on review.
- No buyer/seller response thread on review.

### Rủi ro trong thiết kế DB
- `order_id` is nullable, so verified purchase is not structurally enforced.
- No controller/service validates that only real buyers can leave feedback.
- Seller detailed ratings are not stored as first-class review dimensions.

### Kết luận
- **DB đủ một phần**
- Schema is usable, but the business process is absent.

## Returns, INR, SNAD, and disputes

### DB hiện tại đang hỗ trợ gì
- `return_requests` with `status`, `reason`, admin notes, refund amount, timestamps.
- `disputes` with `status`, description, resolution, resolved_by, resolved_at.
- `shipping_info` could support delivery evidence.

### Nó support tốt điều gì
- Basic generic case persistence.

### DB còn thiếu gì
- No explicit case type for `INR`, `SNAD`, `damaged`, `wrong item`, `missing parts`, `buyer remorse`.
- No SLA/deadline fields.
- No evidence/attachment table.
- No return shipping label / tracking / carrier cost / refund channel data.
- No escalation owner / queue / resolution code taxonomy.
- No buyer protection decision log.

### Rủi ro trong thiết kế DB
- Generic case tables are too thin for a real marketplace resolution program.
- No linkage between dispute and payment reimbursement actions.
- No audit/event trail per case.

### Kết luận
- **DB không đủ**
- The current schema is not enough for a real eBay-like after-sales operation.

## Notifications and messaging

### DB hiện tại đang hỗ trợ gì
- `notifications` stores type, title, body, link, read state.
- `messages` supports sender/receiver/content/thread parent.

### Nó support tốt điều gì
- Potential in-app notification persistence.
- Potential buyer-seller direct messaging thread structure.

### DB còn thiếu gì
- No delivery channel/status fields.
- No notification deduplication or template metadata.
- No order/item context on messages.
- No attachment support.
- No moderation / abuse handling on conversations.

### Rủi ro trong thiết kế DB
- Docker SQL constrains notification `type` to fixed values not including `order_success`, while runtime order creation writes `order_success`.
- That can break order creation when the SQL-init path is used.
- Messaging exists only as schema, so buyer support interaction is not operational.

### Kết luận
- **DB đủ một phần**
- Schema can hold data, but runtime feature coverage is missing and one critical type mismatch exists.

## Audit, anti-abuse, and operational traceability

### DB hiện tại đang hỗ trợ gì
- `audit_logs` table exists.
- `users.failed_login_attempts`, `lockout_end`, `is_active`.

### Nó support tốt điều gì
- Basic auth lockout state.
- Potential audit storage.

### DB còn thiếu gì
- No enforced write path into `audit_logs`.
- No transaction event log for orders/payments.
- No buyer abuse / chargeback / return-abuse / messaging-abuse restriction model.

### Rủi ro trong thiết kế DB
- Security events are not persistently audited in buyer flows.
- Post-incident forensic capability is weak.

### Kết luận
- **DB không đủ**
- Production-grade buyer auditing and trust/safety are not implemented.

# Buyer flow-by-flow review

## 1. Guest browse/search/product detail

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Guest can browse, search, filter, and open item detail without account.
- Search should correctly distinguish fixed-price listings, auctions, category scope, price, and condition.
- Product detail should show canonical item data, seller trust signals, shipping/returns, and auction/fixed-price actions accurately.

### Implementation hiện tại
- FE:
  - Public routes exist for `/`, `/products`, `/products/:id`.
  - `ProductsPage.jsx` sends search params and shows public listing cards.
  - `ProductDetailsPage.jsx` loads product, related items, recommendations, seller section, and history tracking.
  - `AboutThisItem.jsx` and parts of `ProductPurchaseOptions.jsx` contain large amounts of hardcoded content.
- BE:
  - `ProductService.GetLandingPageProductsAsync`, `SearchProductsAsync`, `GetProductByIdAsync`, `GetRelatedProductsAsync`, `GetRecommendationsAsync`.
  - `SellerController` exposes seller profile and seller reviews.
- DB:
  - `products`, `categories`, `reviews`, `bids`, `wishlists`, `watchlist`, `product_view_history`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- `ProductsPage.jsx` sends `Condition=auctions` when buyer picks Auction, but `ProductSearchRequestDto` and `ProductService.SearchProductsAsync` do not support auction filtering.
- `AboutThisItem.jsx` injects `product.description` with `dangerouslySetInnerHTML`, creating stored XSS risk.
- Item number, last-updated timestamp, seller notes, category path, and many specs are hardcoded, not canonical.
- `ProductPurchaseOptions.jsx` displays shipping/import-fee/returns/payment copy that is not backed by schema or API.
- `SellerOtherItems.jsx` is mock data and links to `/product/{id}` instead of the real `/products/{id}` route.

### Tác động nghiệp vụ
- Browse/search is demoable, but buyer confidence is based on partly fake content.
- Auction discoverability is materially wrong.
- Product detail cannot be trusted as source of truth for shipping/returns/item specifics.

### Đề xuất sửa
- Sửa tối thiểu:
  - Add explicit `isAuction` search filter in FE + BE.
  - Stop rendering hardcoded shipping/returns/item facts as if they are real.
- Sửa đúng:
  - Define a canonical product-detail response with item specifics, seller/store trust signals, shipping promise, and return policy.
- Redesign lý tưởng:
  - Introduce dedicated buyer-facing listing projection/view model separate from seller edit model.

## 2. Guest cart

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Guest can add fixed-price items to cart, keep cart across sessions, and later sign in to merge cart.
- Cart should survive page refresh and not be destroyed by auth checks.

### Implementation hiện tại
- FE:
  - `useCartStore.js` persists cart in `localStorage`.
  - `useCart.js` uses local cart for guests and merge-on-login for members.
  - `CartPage.jsx` and `CartSummary.jsx` render guest cart.
- BE:
  - No guest cart API. `CartController` is for authenticated users.
- DB:
  - `carts`, `cart_items`, but no anonymous cart ownership model.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- `useAuthStore.checkAuth()` clears cart on auth failure, and `App.jsx` calls `checkAuth()` on app load. This can wipe guest cart immediately on boot.
- `CartSummary.jsx` pushes guests to login verification flow instead of real guest checkout.
- `CartItem.jsx` shows `Buy it now` and `Save for later` buttons, but they are UI-only.
- No backend persistence or stock validation for guest cart until sign-in.

### Tác động nghiệp vụ
- Guest cart feels available but is not reliable.
- This directly hurts conversion because anonymous buyers can lose intent after refresh/startup.

### Đề xuất sửa
- Sửa tối thiểu:
  - Stop clearing guest cart on unauthenticated `checkAuth()`.
- Sửa đúng:
  - Introduce explicit cart ownership state: `guest_local`, `member_server`, `merged`.
- Redesign lý tưởng:
  - Add anonymous cart token support server-side and unify cart behavior under one backend source.

## 3. Guest checkout

### Kỳ vọng nghiệp vụ (kiểu eBay)
- For eligible Buy It Now items, guest buyer enters email, address, payment, confirms order, receives order-confirmation email, can track/return through guest order details.

### Implementation hiện tại
- FE:
  - `GuestCheckoutModal.jsx` offers “Check out as guest”.
  - `CheckoutPage.jsx` is public and contains guest shipping form UX.
- BE:
  - `OrderController` is `[Authorize]`.
  - `CreateOrderRequestDto` requires `AddressId`.
- DB:
  - `orders.buyer_id` and `orders.address_id` require registered-user ownership; no guest snapshot model exists.

### Trạng thái end-to-end thực tế
- **chỉ có UI**

### Vấn đề cụ thể
- No backend contract for guest email, guest address, or guest payment context.
- No guest order lookup token.
- No guest order confirmation/recovery flow.
- FE guest shipping form does not map to any accepted backend payload.

### Tác động nghiệp vụ
- This is a fake flow. The UI suggests eBay-like guest commerce, but the system cannot execute it.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove or disable “Check out as guest”.
- Sửa đúng:
  - Add guest order DTO, guest order identity, email confirmation, and guest order details flow.
- Redesign lý tưởng:
  - Build guest checkout as a first-class path with guest order token + immutable order snapshot + post-order email access.

## 4. Login/register/auth/profile

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can register, verify identity/email, log in securely, maintain profile/address data, and use social login only after server-side verification.

### Implementation hiện tại
- FE:
  - `LoginForm.jsx`, `RegisterForm.jsx`, `ProfilePage.jsx`, `SecurityTab.jsx`, `SecurityMeasurePage.jsx`.
  - Zustand store in `useAuthStore.js`.
- BE:
  - `AuthController.cs`, `AuthService.cs`, validators, JWT cookie auth.
- DB:
  - `users`, `refresh_tokens`, `addresses`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Login UI says “Email or username”, but validator/backend only support email.
- Register UI generates username client-side, while backend ignores requested username and generates its own.
- Business account registration is cosmetic; there is no business buyer/seller entity.
- Social login trusts frontend-supplied data and does not verify Google token server-side.
- OTP values are logged and generated with `Random()`, not cryptographically secure.
- Email verification is not enforced on login.
- `SendEmailVerificationAsync` does not send email.
- `SecurityTab.jsx` sends `confirmNewPassword`, but BE expects `ConfirmPassword`.
- `ProfilePage.jsx` expects `user.createdAt` and `user.isEmailVerified`; auth store does not populate them consistently.

### Tác động nghiệp vụ
- Core auth can demo, but trust/security level is below production threshold.
- Social login is a major authentication-integrity risk.
- Profile/security UI does not fully match backend contract.

### Đề xuất sửa
- Sửa tối thiểu:
  - Make login label match actual email-only behavior.
  - Fix FE field name mismatch for password change.
  - Stop logging OTPs.
- Sửa đúng:
  - Enforce server-side token verification for social login.
  - Decide whether email verification is mandatory before purchase.
  - Return a typed profile DTO shared by FE/BE.
- Redesign lý tưởng:
  - Build a dedicated identity module with clear auth policy, MFA/captcha gates, and verified social identity handling.

## 5. Member cart

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Authenticated buyer has a persistent server cart, stock-aware quantities, merge from guest cart, and reliable cart summary for checkout.

### Implementation hiện tại
- FE:
  - `useCart.js` fetches/merges server cart after login.
  - `CartPage.jsx`, `CartItem.jsx`, `CartSummary.jsx`.
- BE:
  - `CartService.cs` supports get/add/update/remove/clear/merge.
- DB:
  - `carts`, `cart_items`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- `useCart.js` updates FE quantity optimistically; if backend rejects, FE logs error but does not restore canonical server state.
- Merge swallows invalid/out-of-stock errors silently.
- No cart-item selection state for partial checkout, though order DTO already supports `SelectedCartItemIds`.
- No reservation semantics while items are in checkout.

### Tác động nghiệp vụ
- Core cart CRUD works for demos.
- Data can drift temporarily between UI and backend after failed quantity changes.

### Đề xuất sửa
- Sửa tối thiểu:
  - Re-fetch server cart after failed quantity update.
- Sửa đúng:
  - Add selected-item handling and canonical server totals.
- Redesign lý tưởng:
  - Add reservation and pricing validation states at cart line level.

## 6. Buy It Now

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can bypass cart, purchase a fixed-price item immediately, choose address/payment, and place order with correct totals.

### Implementation hiện tại
- FE:
  - `ProductPurchaseOptions.jsx` navigates to `/checkout?buyItNow=1&productId=...&quantity=...`.
  - `useCheckout.js` loads the single item for direct checkout.
- BE:
  - `OrderService.CreateOrderAsync` supports `BuyItNowProductId` and `BuyItNowQuantity`.
- DB:
  - Standard order/payment tables.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Guest path is fake.
- Checkout address UI can diverge from the backend `addressId`.
- No backend pre-checkout quote endpoint; totals are assembled partly in FE.
- No eligibility rules for Buy It Now vs auction vs offer.

### Tác động nghiệp vụ
- Authenticated demo purchase is possible.
- Buyer can believe they are shipping to one address while backend submits another.

### Đề xuất sửa
- Sửa tối thiểu:
  - Bind checkout UI to `selectedAddressId` canonical data only.
- Sửa đúng:
  - Create a quote/preview API for Buy It Now.
- Redesign lý tưởng:
  - Treat Buy It Now as a first-class checkout mode with immutable quote token.

## 7. Cart checkout

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer checks out selected fixed-price cart items, sees canonical totals, shipping choices, coupon impact, and confirms order.

### Implementation hiện tại
- FE:
  - `CartSummary.jsx` sends logged-in users to `/checkout`.
  - `useCheckout.js` uses all cart items from store.
  - `CheckoutPage.jsx` shows summary and lets buyer change quantity.
- BE:
  - `CreateOrderRequestDto` supports `SelectedCartItemIds`, but FE never sends them.
  - `OrderService.CreateOrderAsync` can process selected cart items if provided.
- DB:
  - `cart_items`, `orders`, `order_items`, `payments`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- FE cannot select subset of cart lines even though backend supports it.
- Cart summary shows shipping `FREE`, checkout summary hardcodes `145530`, backend sums actual product shipping fees.
- No FE coupon application even though backend has validation service.
- Quantity selector in checkout allows 1..10 rather than canonical stock-driven selection.

### Tác động nghiệp vụ
- Buyer totals are inconsistent across cart vs checkout vs backend.
- Partial-cart checkout, a common marketplace behavior, is not actually wired.

### Đề xuất sửa
- Sửa tối thiểu:
  - Align displayed shipping and totals with backend calculation.
- Sửa đúng:
  - Add checkout quote API returning selected items, shipping, discounts, taxes, totals.
- Redesign lý tưởng:
  - Introduce a staged checkout aggregate rather than reusing raw cart state directly.

## 8. Payment flow

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Payment should be canonical, idempotent, gateway-verified, and reflected consistently in order/payment state.

### Implementation hiện tại
- FE:
  - `PaymentMethod.jsx` exposes only COD and PayPal.
  - `useCheckout.js` simulates PayPal progression with timeout.
- BE:
  - `PaypalController.cs`, `PaypalService.cs`.
  - `OrderService` creates initial `payments` row as `pending`.
- DB:
  - `payments` table supports `pending/completed/failed/refunded`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- PayPal amount conversion uses hardcoded `/25000`.
- No webhook verification / asynchronous reconciliation.
- No idempotency protection around create/capture.
- No refund flow.
- No support for credit card or wallet methods despite UI badges and schema enums.
- FE experience is closer to a simulation than a production payment handoff.

### Tác động nghiệp vụ
- Payment is too fragile for production accounting and dispute resolution.
- Buyer can see payment-related states that are not fully trustworthy.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove unsupported payment badges from checkout/detail surfaces.
- Sửa đúng:
  - Add payment intent lifecycle, webhook handling, and idempotency.
- Redesign lý tưởng:
  - Separate checkout/order creation from payment orchestration with explicit state machine.

## 9. Order creation

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Order creation should validate stock, pricing, coupon, address, payment mode, create immutable order snapshot, and commit atomically.

### Implementation hiện tại
- FE:
  - `handlePlaceOrder` in `useCheckout.js`.
- BE:
  - `OrderService.CreateOrderAsync` validates address ownership, checks stock, deducts stock, creates order/items/payment/notification, clears cart.
- DB:
  - `orders`, `order_items`, `payments`, `notifications`, `coupon_usage`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Address displayed to user can differ from `AddressId` sent to backend.
- No immutable address snapshot or product title/image snapshot.
- Coupon usage write path does not satisfy `CouponUsage.OrderId`.
- Notification type `order_success` may violate SQL-init constraint.
- No concurrency control around stock decrement; oversell is possible.
- No rollback logic for external payment/coupon side effects beyond local DB transaction.

### Tác động nghiệp vụ
- Order creation may succeed with wrong shipping destination, inconsistent coupon records, or integrity problems depending on deployment path.

### Đề xuất sửa
- Sửa tối thiểu:
  - Fix checkout canonical address binding and coupon usage persistence.
- Sửa đúng:
  - Add snapshot columns and optimistic concurrency / inventory reservation.
- Redesign lý tưởng:
  - Use order quote + order placement workflow with explicit inventory hold and event log.

## 10. Order history

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer sees purchase history with correct order number, items, status, payment, tracking, and actions like cancel/return/reorder.

### Implementation hiện tại
- FE:
  - `OrdersPage.jsx`, `useOrderStore.js`.
- BE:
  - `OrderController.GetMyOrders`, `OrderService.GetUserOrdersAsync`.
- DB:
  - `orders`, `order_items`, `payments`, `shipping_info`.

### Trạng thái end-to-end thực tế
- **bị lỗi**

### Vấn đề cụ thể
- FE expects `item.productName` and `item.productImageUrl`, but backend returns `Title` and `Image`.
- FE shows order number as padded `#id`; backend has `orderNumber`.
- `GetUserOrdersAsync` does not include `Payments`, but DTO mapping reads `o.Payments.FirstOrDefault()`.
- FE links to `/orders/{id}`, but `App.jsx` has no such route.

### Tác động nghiệp vụ
- Buyer purchase history is unreliable and partly broken even though order data exists.

### Đề xuất sửa
- Sửa tối thiểu:
  - Align FE field names to BE DTO.
  - Render actual `orderNumber`.
- Sửa đúng:
  - Include payment/shipping info in order list projection.
- Redesign lý tưởng:
  - Build a buyer-specific order-summary projection API.

## 11. Order detail

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer opens a full order detail page with shipment, payment, address snapshot, seller contacts, return actions, and issue reporting.

### Implementation hiện tại
- FE:
  - No route for `/orders/:id`.
- BE:
  - `GET /api/Order/{id}` exists.
- DB:
  - Base data exists in `orders`, `order_items`, `payments`, `shipping_info`.

### Trạng thái end-to-end thực tế
- **chỉ có API**

### Vấn đề cụ thể
- No frontend page.
- API still depends on mutable address/product records rather than snapshots.
- Payment info may be incomplete because query does not include `Payments`.

### Tác động nghiệp vụ
- Buyer cannot actually inspect a specific order in the frontend.

### Đề xuất sửa
- Sửa tối thiểu:
  - Add `/orders/:id` page.
- Sửa đúng:
  - Extend API to include tracking, payment, seller/store, and action eligibility flags.
- Redesign lý tưởng:
  - Use a dedicated order-detail read model.

## 12. Cancel order

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can request cancellation within allowed state windows; system should update order, payment, stock, notifications, and refund/coupon side effects.

### Implementation hiện tại
- FE:
  - `OrdersPage.jsx` shows cancel button for `pending`.
- BE:
  - `OrderService.CancelOrderAsync` allows cancel only when `order.Status == "pending"`.
- DB:
  - `orders.status`, `payments`, `order_items`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Only one direct state rule: `pending -> cancelled`.
- No payment refund handling.
- No coupon rollback.
- No cancellation reason.
- No seller approval/request semantics like eBay buyer cancellation request.

### Tác động nghiệp vụ
- Works only for a narrow demo scenario.
- It does not match eBay-like cancellation expectation where seller may accept/reject depending on fulfillment state.

### Đề xuất sửa
- Sửa tối thiểu:
  - Add notification and coupon reversal logic.
- Sửa đúng:
  - Separate `cancellation_requested` from `cancelled`.
- Redesign lý tưởng:
  - Model cancellation as a request workflow with buyer/seller/system ownership.

## 13. Saved items / Watchlist

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can save items and maintain watchlist with clear semantics.
- Watchlist typically signals active monitoring of listing/auction state.

### Implementation hiện tại
- FE:
  - `useSavedStore.js`, `SavedPage.jsx`, `useWatchlistStore.js`, `WatchlistPage.jsx`.
  - `ProductCard.jsx` uses Saved; `ProductPurchaseOptions.jsx` uses Watchlist.
- BE:
  - `SavedController.cs`, `WatchlistController.cs`.
- DB:
  - `wishlists`, `watchlist`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Two separate buyer concepts overlap without clear business rule.
- `ProductResponseDto.SavedCount` aggregates both wishlists and watchlist counts.
- Guest watch action on product detail sends guest to login directly, bypassing the FE verify gate used elsewhere.

### Tác động nghiệp vụ
- Feature works at CRUD level, but buyer semantics are ambiguous and analytics are polluted.

### Đề xuất sửa
- Sửa tối thiểu:
  - Decide and document difference between Saved and Watchlist.
- Sửa đúng:
  - Use one canonical bookmark concept for fixed-price items and a separate watch concept only if auction-specific behavior is needed.
- Redesign lý tưởng:
  - Add saved searches and saved sellers to make the buyer “My eBay” story coherent.

## 14. Recently viewed / history

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer and guest can see recently viewed items; guest history can optionally merge into account after sign-in.

### Implementation hiện tại
- FE:
  - `useHistoryStore.js`, `HistoryInitializer.jsx`, `RecentlyViewed.jsx`.
- BE:
  - `HistoryController.cs` supports track, get, sync.
- DB:
  - `product_view_history`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Controller comment says FE needs to read cookie, but FE never reads it.
- History cookie is set `Secure = true`, which can fail in non-HTTPS local/dev browsing.
- Guest history depends on cookie continuity and may be fragile in certain environments.

### Tác động nghiệp vụ
- Recently viewed is one of the healthier buyer modules, but operational behavior is still environment-sensitive.

### Đề xuất sửa
- Sửa tối thiểu:
  - Align cookie flags with actual deployment expectations.
- Sửa đúng:
  - Make guest history sync explicit and observable.
- Redesign lý tưởng:
  - Add stronger analytics and recommendation signals from browse history.

## 15. Seller profile / seller reputation hiển thị cho buyer

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer sees seller reputation, feedback %, ratings, sold count, return policy, store page, and seller reviews.

### Implementation hiện tại
- FE:
  - `ProductPurchaseOptions.jsx` fetches seller profile.
  - `SellerFeedbackModal` reads seller reviews.
  - Store and contact links are placeholders.
- BE:
  - `SellerController`, `SellerService`.
- DB:
  - `reviews`, `seller_feedback`, `stores`, `users`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Detailed seller ratings are simulated from average rating, not stored.
- FE link to seller store does not map to a public storefront route.
- Return-policy and seller-policy details are not modeled as canonical seller/listing attributes.

### Tác động nghiệp vụ
- Buyers can see some trust data, but not the full set expected in an eBay-like decision surface.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove or relabel simulated sub-ratings.
- Sửa đúng:
  - Add public store route and real seller-policy fields.
- Redesign lý tưởng:
  - Build seller reputation as a dedicated buyer-facing read model with recent feedback, metrics, and policy badges.

## 16. Review / feedback sau mua

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer who actually purchased an item can leave feedback/review within valid rules, ideally with verified-purchase linkage.

### Implementation hiện tại
- FE:
  - No buyer review submission flow found.
- BE:
  - No review controller/service for buyer write path.
- DB:
  - `reviews` table exists with `order_id` and `is_verified_purchase`.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No eligibility check.
- No write API.
- No UI.
- No moderation/workflow.

### Tác động nghiệp vụ
- Seller reputation can only rely on seed/sample data or direct DB writes, not real transaction-based buyer feedback.

### Đề xuất sửa
- Sửa tối thiểu:
  - Add review creation API restricted to delivered purchased items.
- Sửa đúng:
  - Add review eligibility computation and one-review-per-order-line rules.
- Redesign lý tưởng:
  - Separate product review and seller feedback flows if business wants eBay-like semantics.

## 17. Notifications

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer receives and can view notifications for order changes, messages, shipping updates, promotions, reviews, and case actions.

### Implementation hiện tại
- FE:
  - No buyer notification inbox/page found.
- BE:
  - Order creation inserts one notification.
  - No notification controller found.
- DB:
  - `notifications`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Write-only in practice.
- Notification type mismatch (`order_success`) can fail under Docker SQL-init constraint.
- No mark-as-read or list API.

### Tác động nghiệp vụ
- Notifications do not function as a buyer-visible feature.

### Đề xuất sửa
- Sửa tối thiểu:
  - Normalize notification types to schema constraint.
- Sửa đúng:
  - Add list/read APIs and frontend inbox.
- Redesign lý tưởng:
  - Build notification event bus + delivery channels.

## 18. Messaging với seller

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can ask seller questions pre-purchase and message seller from purchase history post-purchase.

### Implementation hiện tại
- FE:
  - Product detail has “Contact seller” placeholder only.
  - Seller header shows `Messages (0)` but not buyer-facing messaging.
- BE:
  - No message controller/service found.
- DB:
  - `messages`.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No APIs.
- No FE inbox/thread/composer.
- No order/item context.

### Tác động nghiệp vụ
- Buyer cannot contact seller through the platform even though UI copy implies that they can.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove non-functional contact links.
- Sửa đúng:
  - Add buyer-seller conversation APIs with item/order context.
- Redesign lý tưởng:
  - Add moderation, abuse detection, attachments, and notification linkage.

## 19. Returns

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can start a return from purchase history, pick reason, follow seller return policy, upload evidence when needed, and track refund progress.

### Implementation hiện tại
- FE:
  - Return promises appear only as text in UI.
- BE:
  - No return controller/service found.
- DB:
  - `return_requests`.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No buyer action path.
- No policy/eligibility engine.
- No shipping label/refund orchestration.

### Tác động nghiệp vụ
- Return flow does not exist operationally.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove or clearly label static return promises.
- Sửa đúng:
  - Add return request API and buyer order action.
- Redesign lý tưởng:
  - Implement case workflow with seller response, deadlines, carrier integration, and refund execution.

## 20. Item not received

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can report non-delivery after ETA window, contact seller, then escalate to platform if unresolved.

### Implementation hiện tại
- FE:
  - No dedicated INR action.
- BE:
  - No dedicated INR API or workflow.
- DB:
  - Only generic `disputes` and `shipping_info` tables might be related.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No INR case type, no delivery deadline logic, no escalation SLA, no eBay-step-in equivalent.

### Tác động nghiệp vụ
- Buyer protection is advertised in UI but not implemented.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove protection messaging from checkout/detail until a real case flow exists.
- Sửa đúng:
  - Add INR case type with ETA-based eligibility and seller-contact step.
- Redesign lý tưởng:
  - Integrate shipment events, buyer protection policy engine, and platform resolution queue.

## 21. Item not as described / damaged

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can open a case for wrong item, damaged item, faulty item, or item not matching listing, attach evidence, and request refund/return.

### Implementation hiện tại
- FE:
  - No dedicated flow.
- BE:
  - No dedicated API.
- DB:
  - Generic `return_requests` and `disputes` only.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No case taxonomy.
- No evidence/photos.
- No decision rules or refund outcomes.

### Tác động nghiệp vụ
- The platform does not currently support one of the core protections eBay buyers expect.

### Đề xuất sửa
- Sửa tối thiểu:
  - None that are honest except removing fake protection cues.
- Sửa đúng:
  - Add SNAD/damaged case flow.
- Redesign lý tưởng:
  - Unify returns + disputes under a buyer-protection case engine.

## 22. Dispute / escalation

### Kỳ vọng nghiệp vụ (kiểu eBay)
- If buyer and seller cannot resolve a problem, the platform can step in with a tracked case, deadlines, and decision outcome.

### Implementation hiện tại
- FE:
  - No escalation UI.
- BE:
  - No dispute controller/service.
- DB:
  - `disputes`.

### Trạng thái end-to-end thực tế
- **chỉ có schema**

### Vấn đề cụ thể
- No actor ownership, no transitions, no evidence, no resolution codes, no payout/refund linkage.

### Tác động nghiệp vụ
- There is no functional marketplace arbitration layer.

### Đề xuất sửa
- Sửa tối thiểu:
  - None beyond removing implied support messaging.
- Sửa đúng:
  - Add dispute lifecycle API and admin/moderation operations.
- Redesign lý tưởng:
  - Add buyer-protection case orchestration with event log and policy engine.

## 23. Auction / place bid / bid history

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Buyer can discover auctions, place bids, see current price/bid history/outbid status, and complete post-auction payment if they win.

### Implementation hiện tại
- FE:
  - `useAuctionStore.js` can fetch/place bids.
  - `ActiveAuctions.jsx` uses mock auctions.
  - Search filter for auctions is wired incorrectly.
- BE:
  - `BidController.cs`, `BidService.cs`.
- DB:
  - `products.is_auction`, `auction_end_time`, `starting_bid`, `bids`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- No automatic bidding/proxy bidding.
- No minimum increment policy.
- No self-bid restriction.
- No post-auction winner-to-order conversion.
- No buyer outbid notification.
- Homepage auction listing is mock, and search filter is broken.

### Tác động nghiệp vụ
- Bidding API exists, but there is no full auction commerce lifecycle.
- This is far from real eBay buyer auction behavior.

### Đề xuất sửa
- Sửa tối thiểu:
  - Add correct auction search filter and remove mock auction surfaces.
- Sửa đúng:
  - Add bid rules, auction lifecycle, and winner settlement.
- Redesign lý tưởng:
  - Implement proxy bidding and a full auction state machine.

## 24. Buyer policy / abuse controls

### Kỳ vọng nghiệp vụ (kiểu eBay)
- Platform should enforce basic anti-fraud, anti-spam, auth security, case abuse, and off-platform transaction rules.

### Implementation hiện tại
- FE:
  - Cosmetic hCaptcha gate based on `sessionStorage`.
- BE:
  - Login lockout, anti-spam middleware, rate limiting middleware.
  - Auth verify-captcha endpoint exists but is not production-configured.
- DB:
  - `users.failed_login_attempts`, `lockout_end`, `audit_logs`.

### Trạng thái end-to-end thực tế
- **hoạt động một phần**

### Vấn đề cụ thể
- Captcha gate is bypassable and not a real authorization boundary.
- Social login trust model is weak.
- No buyer abuse restriction model.
- No operational use of audit log.
- Secrets are committed in `.env`.

### Tác động nghiệp vụ
- Trust/safety posture is below production standard.

### Đề xuất sửa
- Sửa tối thiểu:
  - Remove fake FE-only gating and move enforcement server-side.
- Sửa đúng:
  - Add auth hardening, secrets management, audit logging, and buyer restriction policy.
- Redesign lý tưởng:
  - Introduce risk engine / trust-safety module with policy decisions and event evidence.

# State machine review

## 1. Cart

### Current state map
- No explicit cart status field exists.
- Implicit states in code:
  - `guest_local`
  - `member_server`
  - `merge_pending`
  - `checkout_view`

### Missing state map for eBay-like behavior
- `selected_for_checkout`
- `invalid_price`
- `invalid_stock`
- `reserved`
- `abandoned`
- `converted_to_order`
- `expired_guest_cart`

### Recommended cleaned-up state machine
- Cart owner: `guest | member`
- Cart lifecycle: `active -> quoted -> order_submitted -> cleared`
- Cart line state: `active | selected | invalid_stock | invalid_price | reserved | removed`

### Issues
- FE and BE do not share a stored cart line state.
- Guest cart is not canonical and can be cleared by auth check.
- DB can store only a simple active cart.

## 2. Order

### Current state map
- DB allowed: `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- Runtime actually used:
  - Create order: `pending`
  - PayPal capture: `confirmed`
  - Cancel: `cancelled`
- FE order page expects `pending`, `processing`, `shipped`, `delivered`, `cancelled`

### Missing state map for eBay-like behavior
- `cancellation_requested`
- `awaiting_payment`
- `payment_failed`
- `return_requested`
- `partially_refunded`
- `closed`
- `buyer_issue_open`

### Recommended cleaned-up state machine
- `draft_quote -> awaiting_payment -> paid -> fulfilment_pending -> shipped -> delivered -> completed`
- Side branches:
  - `awaiting_payment -> payment_failed`
  - `awaiting_payment -> cancellation_requested -> cancelled`
  - `delivered -> return_requested -> refunded/closed`

### Issues
- Transition ownership is unclear.
- FE and BE only partially align.
- DB status set is broader than actual implementation, but still not enough for after-sales.

## 3. Payment

### Current state map
- DB allowed: `pending`, `completed`, `failed`, `refunded`
- Runtime used:
  - Order creation: `pending`
  - PayPal capture success: `completed`

### Missing state map for eBay-like behavior
- `authorized`
- `capture_pending`
- `voided`
- `partially_refunded`
- `chargeback_open`
- `chargeback_won/lost`

### Recommended cleaned-up state machine
- `initiated -> authorized -> captured -> settled`
- Side branches:
  - `initiated/authorized -> failed`
  - `captured -> refunded/partially_refunded`

### Issues
- No payment event history.
- No gateway webhook state.
- Order status and payment status are coupled loosely.

## 4. Shipment / delivery

### Current state map
- DB allowed: `pending`, `in_transit`, `out_for_delivery`, `delivered`, `failed`
- Runtime usage found: none in buyer flow.

### Missing state map for eBay-like behavior
- `label_created`
- `carrier_accepted`
- `delivery_exception`
- `returned_to_sender`

### Recommended cleaned-up state machine
- `pending -> label_created -> in_transit -> out_for_delivery -> delivered`
- Exception branch:
  - `in_transit -> delivery_exception -> returned_to_sender`

### Issues
- FE mock delivery dates are not backed by `shipping_info`.
- No source of truth for tracking UI.

## 5. Review eligibility

### Current state map
- No dedicated state machine.
- Only `Review.IsVerifiedPurchase` exists.

### Missing state map for eBay-like behavior
- `not_eligible`
- `eligible_pending`
- `submitted`
- `edited`
- `locked`

### Recommended cleaned-up state machine
- `delivered -> eligible_pending -> submitted -> locked`

### Issues
- No FE/BE/DB contract to derive review eligibility safely.

## 6. Return request

### Current state map
- DB allowed: `pending`, `approved`, `rejected`, `completed`
- Runtime usage found: none.

### Missing state map for eBay-like behavior
- `buyer_submitted`
- `seller_responded`
- `label_issued`
- `item_received_back`
- `refund_in_progress`
- `closed`

### Recommended cleaned-up state machine
- `buyer_submitted -> seller_responded(approved/rejected)`
- If approved:
  - `approved -> label_issued -> item_received_back -> refund_in_progress -> completed`

### Issues
- Current state set is too thin for operational returns.

## 7. Dispute / escalation

### Current state map
- DB allowed: `open`, `in_progress`, `resolved`, `closed`
- Runtime usage found: none.

### Missing state map for eBay-like behavior
- `buyer_opened`
- `seller_response_due`
- `platform_review`
- `buyer_won`
- `seller_won`
- `reimbursed`

### Recommended cleaned-up state machine
- `buyer_opened -> seller_response_due -> platform_review -> resolved -> closed`

### Issues
- No case type or owner field means the transition owner is undefined.

## 8. Auction lifecycle

### Current state map
- Product fields: `is_auction`, `auction_start_time`, `auction_end_time`, `starting_bid`
- Bid fields: `is_winning`
- Implicit states:
  - auction not ended
  - auction ended
  - current winning bid

### Missing state map for eBay-like behavior
- `scheduled`
- `live`
- `ended_unpaid`
- `won_payment_due`
- `settled`
- `cancelled`
- `reserve_not_met`

### Recommended cleaned-up state machine
- `scheduled -> live -> ended`
- If winning bid exists:
  - `ended -> payment_due -> settled`
- Else:
  - `ended -> unsold`

### Issues
- No settlement or order conversion.
- No FE/BE canonical auction lifecycle.

## 9. Notification lifecycle

### Current state map
- Stored fields: `type`, `is_read`, `read_at`
- Runtime states: `unread`, `read`

### Missing state map for eBay-like behavior
- `queued`
- `delivered`
- `failed`
- `dismissed`
- `archived`

### Recommended cleaned-up state machine
- `queued -> delivered -> read/dismissed -> archived`

### Issues
- No delivery tracking.
- One runtime type value conflicts with SQL constraint.

## Summary of state-machine quality

- Current state modeling is strongest for `order.status`, `payment.status`, `shipping_info.status`, and `bid.is_winning`.
- Current state modeling is weakest for cart, buyer protection, after-sales, and review eligibility.
- FE and BE are **not fully aligned** even where states exist.
- DB can store only a subset of what a true buyer marketplace needs.

# Source-of-truth conflicts

| Conflict | Source A | Source B | Risk | Canonical source should be |
| --- | --- | --- | --- | --- |
| Checkout shipping address | Displayed `savedAddresses` / `guestShipping` in `ShippingAddress.jsx` | Actual `selectedAddressId` from backend addresses in `useCheckout.js` | Buyer may see one address and place order with another | Backend-selected address + explicit address snapshot from checkout quote |
| Cart shipping total | `CartSummary.jsx` shows `FREE` | `CheckoutPage.jsx` hardcodes `145530`; `OrderService` sums product shipping fees | Buyer sees inconsistent totals across steps | Backend quote/order calculation |
| Guest checkout support | FE modal + public `/checkout` route | `OrderController` auth-only + `orders` require member address | Fake conversion path | Product/business policy; until supported, UI must not advertise it |
| Order number | FE success page computes `EB########` from id | `OrderService` generates `EBAY-...`; Docker SQL trigger generates `ORD-...` | Buyer sees non-canonical order IDs | Backend-generated order number only |
| Payment status in orders | FE assumes returned `paymentStatus` is correct | BE mapping uses `o.Payments.FirstOrDefault()` without including payments | History/detail may show wrong default payment state | Backend query/projection including payment |
| Coupon applicability | FE has no real coupon flow | `ValidateCouponAsync` validates only by order amount, not actual cart composition | Wrong coupons may appear valid | Backend quote validation against actual items |
| Coupon usage persistence | Schema/model require `CouponUsage.OrderId` | `UseCouponAsync` inserts without `OrderId` | Integrity failure / runtime exception risk | Order-placement transaction with explicit `orderId` |
| Inventory source | `products.stock` used in cart/order/product | `inventory.quantity` and `reserved_quantity` also exist | Dual truth, oversell risk | Dedicated inventory aggregate, not duplicated fields |
| Saved vs watchlist semantics | `wishlists` + `SavedPage` | `watchlist` + `WatchlistPage`; `SavedCount` adds both | Metrics and buyer intent become ambiguous | Explicit separate semantics or unified bookmarking model |
| Auction search filter | FE sends `Condition=auctions` | BE only supports actual product condition filter | Auction browse is silently wrong | Dedicated `isAuction` filter |
| Seller/store routing | FE links imply public store and seller other items | No matching public store route; seller-other-items is mock | Buyer navigation dead ends | Public store/seller routes backed by real data |
| History guest cookie usage | Controller comment says FE reads cookie | FE never reads cookie; backend reads request cookie only | Misleading implementation assumptions | Backend-owned cookie contract with clear FE behavior |
| FE API base URL | `.env` defines `VITE_API_BASE_URL` | `axios.js` reads `VITE_API_URL` | Wrong endpoint in deployed FE | One shared env contract |
| Profile data | `ProfilePage.jsx` expects `createdAt`, `isEmailVerified` | `useAuthStore` does not consistently populate both | Buyer profile UI can misrender | Shared typed profile DTO from `/api/Auth/me` |
| Seller condition normalization | Create path normalizes condition in `ProductService.CreateProductAsync` | Update path assigns raw `request.Condition` | DB constraint can reject later updates; buyer sees inconsistent values | Shared enum normalization layer |

# eBay gap matrix

| Capability | Kỳ vọng kiểu eBay | Trạng thái hiện tại của dự án | Gap | Mức độ nghiêm trọng | Hành động khuyến nghị |
| --- | --- | --- | --- | --- | --- |
| Buyer core browse | Accurate browse/search/detail with trust signals | Partial, but item detail contains static/fake facts | Catalog exists, truth layer weak | P1 | Build canonical buyer listing/detail projection |
| Guest checkout | Supported for eligible Buy It Now flows | UI only | Major capability missing | P0 | Remove fake UI or implement real guest order flow |
| Member checkout | Canonical address/totals/payment/order pipeline | Partial and inconsistent | Checkout source-of-truth broken | P0 | Build quote API + fix address binding |
| Cart integrity | Stable guest/member cart, merge, partial checkout | Partial | Guest cart can be wiped; no subset checkout | P1 | Stabilize cart ownership and selection states |
| Order integrity | Immutable snapshots, correct numbering, payment/shipment linkage | Partial | No snapshots, conflicting order numbers, payment projection weak | P0 | Add order snapshots and canonical projection |
| Payment integrity | Reliable gateway orchestration and reconciliation | Partial | Simulated PayPal feel, no webhook/idempotency | P0 | Introduce payment intent + webhook flow |
| Order history/detail | Full purchase history and per-order drilldown | Broken/partial | FE/BE mismatch, no detail page | P1 | Align DTOs and add order-detail page |
| Seller trust surface | Feedback %, detailed ratings, sold/watcher counts, policies | Partial | Some signals simulated, routes incomplete | P2 | Add real seller trust projection |
| Reviews / feedback | Post-purchase verified feedback flow | Schema only | No business process | P2 | Add review eligibility + submission flow |
| Returns / disputes / MBG | Start return, INR, SNAD, escalate to platform | Schema only / badge copy only | Core marketplace protection missing | P0 | Build buyer protection case system |
| Notifications | Buyer-visible operational notifications | Write-only partial | No inbox or APIs | P2 | Add notification APIs and UI |
| Messaging | Buyer-seller messaging around item/order | Schema only | No APIs/UI | P2 | Build messaging module or remove placeholders |
| Auctions | Discover, bid, outbid, settle, pay | Partial | No full lifecycle or proxy bidding | P1 | Complete auction lifecycle or downscope it |
| Policy enforcement | Strong auth, anti-abuse, platform-only transaction protection | Partial | Social auth weak, secrets exposed, audit logs unused | P0 | Harden auth/secrets/audit and add trust-safety policy |

# Top 10 critical issues

| # | Problem | Location | Why serious | Buyer impact | Severity | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Checkout address UI is not the address used by backend | `ebayFE/src/pages/CheckoutPage.jsx`, `ebayFE/src/features/checkout/components/ShippingAddress.jsx`, `ebayFE/src/features/checkout/hooks/useCheckout.js` | Wrong shipping destination can be committed while UI shows another address | Buyer may order to unintended address | P0 | Full-stack |
| 2 | Guest checkout is advertised but not supported | `GuestCheckoutModal.jsx`, `CheckoutPage.jsx`, `OrderController.cs`, `CreateOrderRequestDto` | Direct fake conversion path | Guest buyer cannot complete advertised checkout | P0 | Full-stack |
| 3 | Social login trusts frontend data without server verification | `AuthService.SocialLoginAsync` | Authentication bypass / account takeover risk | Buyer identity can be forged | P0 | BE |
| 4 | Coupon usage runtime contract violates schema | `CouponService.UseCouponAsync`, `CouponUsage.cs`, `01_creates_tables.sql` | Can fail checkout and corrupt promotion integrity | Buyer sees coupon failures or inconsistent discount application | P0 | BE/DB |
| 5 | Notification type mismatch can break order creation | `OrderService.cs` vs `notifications` check constraint in `01_creates_tables.sql` | Order transaction may fail depending on DB init path | Buyer cannot place order reliably | P0 | BE/DB |
| 6 | No immutable order/address/item snapshot | `Order.cs`, `OrderItem.cs`, Docker SQL | Historical order truth is unstable | Buyer history/detail may change after product/address edits | P0 | BE/DB |
| 7 | Totals are inconsistent across cart, checkout, backend | `CartSummary.jsx`, `CheckoutPage.jsx`, `OrderService.cs` | Buyer sees different prices before/after placing order | Pricing trust is broken | P0 | Full-stack |
| 8 | Stored XSS risk in product description | `AboutThisItem.jsx` | Arbitrary HTML from seller can run in buyer browser | Buyer session and trust at risk | P0 | FE/BE |
| 9 | Order history/detail FE-BE contract mismatch | `OrdersPage.jsx`, `useOrderStore.js`, `OrderService.cs`, `App.jsx` | Buyer post-purchase management is broken | Purchase history is unreliable; detail page absent | P1 | Full-stack |
| 10 | FE production build currently fails | `ebayFE/src/main.jsx` import of `@react-oauth/google` | Whole buyer frontend is not build-clean | Platform cannot ship consistently | P1 | FE |

# Top 10 missing eBay-like buyer capabilities

| # | Missing capability | Why it matters | Core or advanced |
| --- | --- | --- | --- |
| 1 | Real guest checkout | Major conversion path for eBay-like marketplace | Core |
| 2 | Canonical checkout quote with address/shipping/tax/coupon totals | Prevents pricing/address drift | Core |
| 3 | Order detail page with tracking/payment/actions | Required post-purchase buyer self-service | Core |
| 4 | Verified post-purchase review/feedback flow | Core trust loop between buyer and seller | Core |
| 5 | Real buyer notifications inbox | Needed for orders, shipping, messages, cases | Core |
| 6 | Buyer-seller messaging | Essential for pre-sale questions and issue resolution | Core |
| 7 | Return request flow | Basic marketplace after-sales expectation | Core |
| 8 | Item not received / item not as described case flow | Fundamental buyer protection expectation | Core |
| 9 | Seller/store trust surface with real policies and storefront | Important for buyer confidence and conversion | Core |
| 10 | Full auction settlement lifecycle | Needed if the product claims eBay-like auction behavior | Advanced but central if auctions remain in scope |

# 3-phase roadmap

## Phase 1 — Làm buyer flow chạy thật

### Tasks
- Remove fake guest checkout, or implement only after backend and DB support exist.
- Fix checkout canonical contract:
  - bind FE display to backend `selectedAddressId`
  - add quote endpoint for totals
  - align cart, checkout, and order totals
- Fix order creation integrity:
  - correct coupon usage persistence
  - normalize notification type
  - use one canonical order number format
- Fix order history FE/BE contract and add order detail route.
- Stabilize guest/member cart behavior; stop clearing guest cart on auth miss.
- Harden auth:
  - verify social login token server-side
  - remove OTP logging
  - fix change-password DTO mismatch
- Remove or relabel non-functional buyer protection, contact seller, and other fake UI promises.

### Dependencies
- Shared DTO cleanup between FE and BE.
- Decision on guest checkout scope.
- Short DB migration set for coupon usage/order snapshots/notification types.

### Vì sao thứ tự này hợp lý
- There is no point building after-sales if checkout/order truth is unreliable.
- This phase turns deceptive UI into honest, working buyer flows.

## Phase 2 — Làm nó giống một marketplace thật

### Tasks
- Add order detail page with payment, shipment, seller/store, and action eligibility.
- Add real seller/store public page and trust signals.
- Add verified review/feedback flow linked to delivered purchases.
- Build notification list/read API and buyer UI.
- Add basic messaging with seller and order/item context.
- Add shipment/tracking projection for buyers.
- Add coupon apply/remove flow in checkout with backend quote validation.

### Dependencies
- Phase 1 canonical order and auth contracts.
- Public seller/store routing decisions.

### Vì sao thứ tự này hợp lý
- These features complete the normal post-purchase buyer loop and increase marketplace trust.

## Phase 3 — Làm nó gần hơn với buyer operations kiểu eBay

### Tasks
- Implement return-request workflow.
- Implement INR and SNAD case types with escalation.
- Add buyer-protection policy engine and deadlines.
- Add dispute administration/moderation workflows.
- Complete auction lifecycle:
  - auction discovery
  - bid rules
  - outbid notifications
  - winner settlement/payment
- Add trust/safety hardening:
  - audit logs
  - policy restriction model
  - abuse detection signals
  - payment and case event logging

### Dependencies
- Reliable order, shipment, and notification foundations from Phase 1-2.
- Admin/moderation ownership and operational process design.

### Vì sao thứ tự này hợp lý
- These are expensive operational capabilities. Building them before core checkout/order integrity would compound debt.

# Final verdict

## Dự án này đang gần tới mức nào so với một hệ thống buyer kiểu eBay?

- Inferred maturity: roughly **25% to 35%** of a real eBay-like buyer platform.
- It is currently closer to a **catalog + cart + basic order demo** than to a full buyer marketplace operation.

## Cái gì đã production-ready?

- Strictly speaking: **no full buyer journey is production-ready**.
- The closest to usable:
  - public browse/search
  - authenticated cart CRUD
  - basic authenticated COD/PayPal-backed order creation in a controlled demo scenario

## Cái gì còn chưa hoàn chỉnh?

- Guest checkout
- Checkout truth model
- Payment integrity
- Order history/detail
- Reviews
- Notifications
- Messaging
- Returns / disputes / buyer protection
- Auction lifecycle
- Trust/safety hardening

## Cái gì đang gây hiểu lầm / fake?

- “Check out as guest”
- eBay Money Back Guarantee badges and return promises in buyer UI
- order detail links
- seller other items
- some seller contact/storefront affordances
- many product-detail facts in `AboutThisItem.jsx`
- some auction surfaces on home/search

## Cái gì bắt buộc phải sửa đầu tiên?

1. Fix checkout source-of-truth and totals.
2. Remove or implement guest checkout for real.
3. Fix coupon/order/notification integrity issues in the order transaction.
4. Harden auth and social login.
5. Repair order history/detail so buyers can manage real purchases.

## Bottom line

If this project is presented as an eBay-style buyer marketplace today, that overstates reality.

The system currently supports:
- browsing
- viewing items
- bookmarking items
- basic member cart
- basic member order placement

It does **not** yet support the buyer operating model that makes eBay feel like eBay:
- credible guest checkout
- reliable purchase history and order detail
- buyer protection
- returns/disputes
- seller messaging
- verified feedback loop
- complete auction lifecycle

Until the checkout/order truth layer is repaired, every adjacent buyer feature remains built on unstable ground.
