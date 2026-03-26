using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly EbayDbContext _context;
        private readonly ICheckoutCoreService _checkoutCoreService;
        private readonly ICouponService _couponService;
        private readonly IOrderNotificationService _orderNotificationService;
        private readonly IOrderNumberGenerator _orderNumberGenerator;
        private readonly IOrderProjectionMapper _orderProjectionMapper;
        private readonly IOrderCancellationService _orderCancellationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<OrderService> _logger;

        public OrderService(
            EbayDbContext context,
            ICheckoutCoreService checkoutCoreService,
            ICouponService couponService,
            IOrderNotificationService orderNotificationService,
            IOrderNumberGenerator orderNumberGenerator,
            IOrderProjectionMapper orderProjectionMapper,
            IOrderCancellationService orderCancellationService,
            IEmailService emailService,
            ILogger<OrderService> logger)
        {
            _context = context;
            _checkoutCoreService = checkoutCoreService;
            _couponService = couponService;
            _orderNotificationService = orderNotificationService;
            _orderNumberGenerator = orderNumberGenerator;
            _orderProjectionMapper = orderProjectionMapper;
            _orderCancellationService = orderCancellationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(int userId, CreateOrderRequestDto request)
        {
            var address = await GetValidatedAddressAsync(userId, request.AddressId);
            var cartItems = await ResolveCheckoutCartItemsAsync(userId, request);
            EnsureBuyerDoesNotPurchaseOwnListings(userId, cartItems);
            var memberEmailRecipient = await GetMemberEmailRecipientAsync(userId);

            // 3. Start Transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var checkoutCoreResult = await _checkoutCoreService.PrepareAsync(
                    cartItems.Select(item => new CheckoutCoreItemRequest
                    {
                        ProductId = item.ProductId,
                        Quantity = item.Quantity
                    }));

                if (!checkoutCoreResult.IsValid)
                {
                    var errors = checkoutCoreResult.Issues
                        .Select(issue => issue.Message)
                        .Distinct()
                        .ToList();

                    throw new BadRequestException("Checkout không hợp lệ", errors);
                }

                var normalizedItemsByProductId = checkoutCoreResult.NormalizedItems
                    .ToDictionary(item => item.ProductId);

                foreach (var item in cartItems)
                {
                    item.Product.Stock = (item.Product.Stock ?? 0) - item.Quantity;
                }

                // 5. Coupon Validation
                decimal discountAmount = 0;
                int? couponId = null;
                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    var couponResult = await _couponService.ValidateCouponAsync(request.CouponCode, checkoutCoreResult.Subtotal, userId);
                    if (couponResult.Valid)
                    {
                        discountAmount = couponResult.DiscountAmount;
                        couponId = couponResult.CouponId;
                        if (couponId.HasValue)
                            await _couponService.UseCouponAsync(couponId.Value, userId);
                    }
                }

                var totalPrice = checkoutCoreResult.Subtotal + checkoutCoreResult.ShippingFee - discountAmount + checkoutCoreResult.Tax;
                var now = DateTime.UtcNow;

                // 6. Create Order record
                var order = new Order
                {
                    CustomerType = "member",
                    BuyerId = userId,
                    OrderNumber = _orderNumberGenerator.Generate(),
                    AddressId = request.AddressId,
                    ShipFullName = address.FullName,
                    ShipPhone = address.Phone,
                    ShipStreet = address.Street,
                    ShipCity = address.City,
                    ShipState = address.State,
                    ShipPostalCode = address.PostalCode,
                    ShipCountry = address.Country,
                    OrderDate = now,
                    Subtotal = checkoutCoreResult.Subtotal,
                    ShippingFee = checkoutCoreResult.ShippingFee,
                    DiscountAmount = discountAmount,
                    Tax = checkoutCoreResult.Tax,
                    TotalPrice = totalPrice,
                    CouponId = couponId,
                    Status = "pending",
                    Note = request.Note,
                    CreatedAt = now,
                    UpdatedAt = now
                };

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync(); // To get Order.Id

                // 7. Create Order Items
                var orderItems = cartItems.Select(ci =>
                {
                    var normalizedItem = normalizedItemsByProductId[ci.ProductId];

                    return new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = ci.ProductId,
                        SellerId = ci.Product.SellerId,
                        Quantity = ci.Quantity,
                        UnitPrice = normalizedItem.UnitPrice,
                        TotalPrice = normalizedItem.UnitPrice * ci.Quantity,
                        ProductTitleSnapshot = ci.Product.Title,
                        ProductImageSnapshot = ci.Product.Images != null && ci.Product.Images.Any() ? ci.Product.Images[0] : null,
                        SellerDisplayNameSnapshot = ResolveSellerDisplayName(ci.Product),
                        CreatedAt = now
                    };
                }).ToList();

                await _context.OrderItems.AddRangeAsync(orderItems);

                // 8. Create Initial Payment Record
                var payment = new Payment
                {
                    OrderId = order.Id,
                    UserId = userId,
                    Amount = totalPrice,
                    Method = request.PaymentMethod == "PayPal" ? "paypal" : "cod",
                    Status = "pending",
                    CreatedAt = now
                };

                await _context.Payments.AddAsync(payment);

                // 9. Clear Cart Items
                if (!request.BuyItNowProductId.HasValue)
                {
                    _context.CartItems.RemoveRange(cartItems);
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                order.Address = address;
                order.OrderItems = orderItems;
                order.Payments = new List<Payment> { payment };

                await _orderNotificationService.TryCreateOrderPlacedNotificationAsync(
                    userId,
                    order.Id,
                    order.OrderNumber);

                await TrySendMemberConfirmationEmailAsync(order, payment, memberEmailRecipient);

                return _orderProjectionMapper.MapMemberOrder(order);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<MemberCheckoutReviewResponseDto> ReviewCheckoutAsync(int userId, CreateOrderRequestDto request)
        {
            var address = await GetValidatedAddressAsync(userId, request.AddressId);
            var cartItems = await ResolveCheckoutCartItemsAsync(userId, request);
            EnsureBuyerDoesNotPurchaseOwnListings(userId, cartItems);

            var checkoutCoreResult = await _checkoutCoreService.PrepareAsync(
                cartItems.Select(item => new CheckoutCoreItemRequest
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity
                }));

            if (!checkoutCoreResult.IsValid)
            {
                var errors = checkoutCoreResult.Issues
                    .Select(issue => issue.Message)
                    .Distinct()
                    .ToList();

                throw new BadRequestException("Checkout không hợp lệ", errors);
            }

            decimal discountAmount = 0;
            if (!string.IsNullOrWhiteSpace(request.CouponCode))
            {
                var couponResult = await _couponService.ValidateCouponAsync(request.CouponCode, checkoutCoreResult.Subtotal, userId);
                if (couponResult.Valid)
                {
                    discountAmount = couponResult.DiscountAmount;
                }
            }

            var totalAmount = checkoutCoreResult.Subtotal + checkoutCoreResult.ShippingFee - discountAmount + checkoutCoreResult.Tax;

            return new MemberCheckoutReviewResponseDto
            {
                AddressId = address.Id,
                PaymentMethod = request.PaymentMethod,
                ShippingAddress = MapShippingAddress(address),
                Subtotal = checkoutCoreResult.Subtotal,
                ShippingFee = checkoutCoreResult.ShippingFee,
                DiscountAmount = discountAmount,
                Tax = checkoutCoreResult.Tax,
                TotalAmount = totalAmount,
                Items = checkoutCoreResult.NormalizedItems
                    .Select(item => new MemberCheckoutReviewItemResponseDto
                    {
                        ProductId = item.ProductId,
                        Title = item.Title,
                        Quantity = item.Quantity,
                        UnitPrice = item.UnitPrice,
                        LineSubtotal = item.LineSubtotal,
                        ShippingFee = item.ShippingFee,
                        LineTotal = item.LineTotal
                    })
                    .ToList()
            };
        }

        public async Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId, string? status = null)
        {
            var query = _context.Orders
                .AsNoTracking()
                .Include(o => o.Address)
                .Include(o => o.OrderCancellationRequests)
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.BuyerId == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return orders.Select(o => _orderProjectionMapper.MapMemberOrder(o)).ToList();
        }

        public async Task<OrderResponseDto> GetOrderByIdAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Include(o => o.Address)
                .Include(o => o.OrderCancellationRequests)
                .Include(o => o.Payments)
                .Include(o => o.ShippingInfo)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null) throw new NotFoundException("Đơn hàng không tồn tại");

            return _orderProjectionMapper.MapMemberOrder(order);
        }

        public async Task CancelOrderAsync(int userId, int orderId)
        {
            await _orderCancellationService.RequestCancellationAsync(
                userId,
                orderId,
                reason: null);
        }

        private static string ResolveSellerDisplayName(Product product)
        {
            if (!string.IsNullOrWhiteSpace(product.Store?.StoreName))
            {
                return product.Store.StoreName;
            }

            return product.Seller.Username;
        }

        private async Task<MemberEmailRecipient> GetMemberEmailRecipientAsync(int userId)
        {
            var member = await _context.Users
                .AsNoTracking()
                .Where(user => user.Id == userId)
                .Select(user => new MemberEmailRecipient(
                    user.Email,
                    user.Username,
                    user.FirstName,
                    user.LastName))
                .FirstOrDefaultAsync();

            if (member == null)
            {
                throw new BadRequestException("Người dùng không hợp lệ");
            }

            return member;
        }

        private async Task TrySendMemberConfirmationEmailAsync(Order order, Payment payment, MemberEmailRecipient member)
        {
            if (string.IsNullOrWhiteSpace(member.Email))
            {
                _logger.LogWarning(
                    "Member confirmation email skipped because Email is missing for user {UserId}, order {OrderNumber}",
                    order.BuyerId,
                    order.OrderNumber);
                return;
            }

            var displayName = ResolveMemberDisplayName(member);

            try
            {
                await _emailService.SendMemberOrderConfirmationAsync(
                    member.Email,
                    displayName,
                    order.OrderNumber,
                    order.TotalPrice,
                    payment.Method,
                    payment.Status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send member confirmation email for order {OrderNumber}", order.OrderNumber);
            }
        }

        private static string ResolveMemberDisplayName(MemberEmailRecipient member)
        {
            var fullName = $"{member.FirstName} {member.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            if (!string.IsNullOrWhiteSpace(member.Username))
            {
                return member.Username;
            }

            return "bạn";
        }

        private async Task<Address> GetValidatedAddressAsync(int userId, int addressId)
        {
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);
            if (address == null) throw new BadRequestException("Địa chỉ giao hàng không hợp lệ");

            return address;
        }

        private async Task<List<CartItem>> ResolveCheckoutCartItemsAsync(int userId, CreateOrderRequestDto request)
        {
            if (request.BuyItNowProductId.HasValue && request.BuyItNowQuantity.HasValue)
            {
                var product = await _context.Products
                    .Include(p => p.Seller)
                    .Include(p => p.Store)
                    .FirstOrDefaultAsync(p => p.Id == request.BuyItNowProductId.Value);

                if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

                return new List<CartItem>
                {
                    new()
                    {
                        ProductId = product.Id,
                        Product = product,
                        Quantity = request.BuyItNowQuantity.Value
                    }
                };
            }

            var cartItemsQuery = _context.CartItems
                .Include(ci => ci.Product)
                    .ThenInclude(p => p.Seller)
                .Include(ci => ci.Product)
                    .ThenInclude(p => p.Store)
                .Where(ci => ci.Cart.UserId == userId);

            if (request.SelectedCartItemIds != null && request.SelectedCartItemIds.Any())
            {
                cartItemsQuery = cartItemsQuery.Where(ci => request.SelectedCartItemIds.Contains(ci.Id));
            }

            var cartItems = await cartItemsQuery.ToListAsync();
            if (!cartItems.Any()) throw new BadRequestException("Giỏ hàng hoặc lựa chọn trống");

            return cartItems;
        }

        private static void EnsureBuyerDoesNotPurchaseOwnListings(int userId, IEnumerable<CartItem> cartItems)
        {
            var ownListing = cartItems.FirstOrDefault(item => item.Product?.SellerId == userId);
            if (ownListing != null)
            {
                throw new BadRequestException("Bạn không thể mua listing của chính mình");
            }
        }

        private static AddressResponseDto MapShippingAddress(Address address)
        {
            return new AddressResponseDto
            {
                Id = address.Id,
                FullName = address.FullName,
                Phone = address.Phone,
                Street = address.Street,
                City = address.City,
                State = address.State,
                PostalCode = address.PostalCode,
                Country = address.Country,
                IsDefault = address.IsDefault == true
            };
        }

        private sealed record MemberEmailRecipient(
            string Email,
            string Username,
            string? FirstName,
            string? LastName);
    }
}
