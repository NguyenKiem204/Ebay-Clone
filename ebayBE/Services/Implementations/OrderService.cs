using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly EbayDbContext _context;
        private readonly ICouponService _couponService;

        public OrderService(EbayDbContext context, ICouponService couponService)
        {
            _context = context;
            _couponService = couponService;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(int userId, CreateOrderRequestDto request)
        {
            // 1. Get Address
            var address = await _context.Addresses.FirstOrDefaultAsync(a => a.Id == request.AddressId && a.UserId == userId);
            if (address == null) throw new BadRequestException("Địa chỉ giao hàng không hợp lệ");

            // 2. Get Cart Items
            var cartItemsQuery = _context.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.Cart.UserId == userId);

            if (request.SelectedCartItemIds != null && request.SelectedCartItemIds.Any())
            {
                cartItemsQuery = cartItemsQuery.Where(ci => request.SelectedCartItemIds.Contains(ci.Id));
            }

            var cartItems = await cartItemsQuery.ToListAsync();
            if (!cartItems.Any()) throw new BadRequestException("Giỏ hàng trống");

            // 3. Start Transaction
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                decimal subtotal = 0;
                decimal shippingFee = 0;

                // 4. Validate Stock & Calculate Totals
                foreach (var item in cartItems)
                {
                    if (item.Product.Status != "active" || item.Product.IsActive != true)
                        throw new BadRequestException($"Sản phẩm {item.Product.Title} hiện không còn bán");

                    if ((item.Product.Stock ?? 0) < item.Quantity)
                        throw new BadRequestException($"Sản phẩm {item.Product.Title} không đủ số lượng trong kho");

                    subtotal += item.Product.Price * item.Quantity;
                    shippingFee += item.Product.ShippingFee ?? 0;

                    // Deduct stock
                    item.Product.Stock -= item.Quantity;
                }

                // 5. Coupon Validation
                decimal discountAmount = 0;
                int? couponId = null;
                if (!string.IsNullOrWhiteSpace(request.CouponCode))
                {
                    var couponResult = await _couponService.ValidateCouponAsync(request.CouponCode, subtotal, userId);
                    if (couponResult.Valid)
                    {
                        discountAmount = couponResult.DiscountAmount;
                        couponId = couponResult.CouponId;
                        if (couponId.HasValue)
                            await _couponService.UseCouponAsync(couponId.Value, userId);
                    }
                }

                var totalPrice = subtotal + shippingFee - discountAmount;

                // 6. Create Order record
                var order = new Order
                {
                    BuyerId = userId,
                    OrderNumber = "EBAY-" + DateTime.Now.Ticks.ToString().Substring(10),
                    Subtotal = subtotal,
                    ShippingFee = shippingFee,
                    DiscountAmount = discountAmount,
                    TotalPrice = totalPrice,
                    CouponId = couponId,
                    Status = "pending",
                    AddressId = request.AddressId,
                    Note = request.Note,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await _context.Orders.AddAsync(order);
                await _context.SaveChangesAsync(); // To get Order.Id

                // 7. Create Order Items
                var orderItems = cartItems.Select(ci => new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = ci.ProductId,
                    SellerId = ci.Product.SellerId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.Product.Price, // Capture price at moment of purchase
                    TotalPrice = ci.Product.Price * ci.Quantity,
                    CreatedAt = DateTime.UtcNow
                }).ToList();

                await _context.OrderItems.AddRangeAsync(orderItems);

                // 8. Create Initial Payment Record
                await _context.Payments.AddAsync(new Payment
                {
                    OrderId = order.Id,
                    UserId = userId,
                    Amount = totalPrice,
                    Method = request.PaymentMethod == "PayPal" ? "paypal" : "cod",
                    Status = "pending",
                    CreatedAt = DateTime.UtcNow
                });

                // 9. Clear Cart Items
                _context.CartItems.RemoveRange(cartItems);

                // 10. Notification
                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = userId,
                    Type = "order_success",
                    Title = "Đặt hàng thành công",
                    Body = $"Đơn hàng {order.OrderNumber} của bạn đã được tiếp nhận.",
                    IsRead = false,
                    Link = $"/orders/{order.Id}",
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return MapToDto(order, address, orderItems.Select(oi => {
                    var prod = cartItems.First(ci => ci.ProductId == oi.ProductId).Product;
                    return new OrderItemResponseDto {
                        ProductId = oi.ProductId,
                        Title = prod.Title,
                        Image = prod.Images != null && prod.Images.Any() ? prod.Images[0] : null,
                        Price = oi.UnitPrice,
                        Quantity = oi.Quantity
                    };
                }).ToList());
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId, string? status = null)
        {
            var query = _context.Orders
                .Include(o => o.Address)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Where(o => o.BuyerId == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status == status);
            }

            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return orders.Select(o => MapToDto(o, o.Address!, null)).ToList();
        }

        public async Task<OrderResponseDto> GetOrderByIdAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.Address)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null) throw new NotFoundException("Đơn hàng không tồn tại");

            return MapToDto(order, order.Address!, null);
        }

        public async Task CancelOrderAsync(int userId, int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == userId);

            if (order == null) throw new NotFoundException("Đơn hàng không tồn tại");

            if (order.Status != "pending")
                throw new BadRequestException("Chỉ có thể hủy đơn hàng đang chờ xử lý");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try {
                order.Status = "cancelled";
                order.UpdatedAt = DateTime.UtcNow;

                // Return stock
                foreach (var item in order.OrderItems)
                {
                    item.Product.Stock += item.Quantity;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            } catch {
                await transaction.RollbackAsync();
                throw;
            }
        }

        private static OrderResponseDto MapToDto(Order o, Address addr, List<OrderItemResponseDto>? items)
        {
            var payment = o.Payments.FirstOrDefault();
            return new OrderResponseDto
            {
                Id = o.Id,
                OrderNumber = o.OrderNumber,
                Subtotal = o.Subtotal,
                ShippingFee = o.ShippingFee ?? 0,
                DiscountAmount = o.DiscountAmount ?? 0,
                TotalAmount = o.TotalPrice,
                Status = o.Status ?? "pending",
                PaymentStatus = payment?.Status ?? "pending",
                PaymentMethod = payment?.Method ?? "COD",
                CreatedAt = o.CreatedAt ?? DateTime.UtcNow,
                ShippingAddress = new AddressResponseDto
                {
                    FullName = addr.FullName,
                    Phone = addr.Phone,
                    Street = addr.Street,
                    City = addr.City,
                    State = addr.State,
                    PostalCode = addr.PostalCode,
                    Country = addr.Country
                },
                Items = items ?? o.OrderItems.Select(oi => new OrderItemResponseDto
                {
                    ProductId = oi.ProductId,
                    Title = oi.Product?.Title ?? "Unknown",
                    Image = oi.Product?.Images != null && oi.Product.Images.Any() ? oi.Product.Images[0] : null,
                    Price = oi.UnitPrice,
                    Quantity = oi.Quantity
                }).ToList()
            };
        }
    }
}
