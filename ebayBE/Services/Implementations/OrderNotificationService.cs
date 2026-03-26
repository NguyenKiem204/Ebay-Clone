using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class OrderNotificationService : IOrderNotificationService
    {
        private const string OrderNotificationType = "order";

        private readonly EbayDbContext _context;
        private readonly ILogger<OrderNotificationService> _logger;

        public OrderNotificationService(
            EbayDbContext context,
            ILogger<OrderNotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task TryCreateOrderPlacedNotificationAsync(
            int userId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = userId,
                    Type = OrderNotificationType,
                    Title = "Dat hang thanh cong",
                    Body = $"Don hang {orderNumber} cua ban da duoc tiep nhan.",
                    IsRead = false,
                    Link = $"/orders/{orderId}",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create order notification for order {OrderNumber} and user {UserId}",
                    orderNumber,
                    userId);
            }
        }

        public async Task TryCreateSellerCancellationRequestNotificationAsync(
            int sellerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = sellerUserId,
                    Type = "order_cancellation_request",
                    Title = "Yeu cau huy don hang",
                    Body = $"Buyer da gui yeu cau huy don hang {orderNumber}.",
                    IsRead = false,
                    Link = "/seller/orders",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create seller cancellation-request notification for order {OrderNumber} and seller {SellerUserId}",
                    orderNumber,
                    sellerUserId);
            }
        }

        public async Task TryCreateBuyerCancellationResolutionNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            bool approved,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var resolutionText = approved ? "duoc chap nhan" : "bi tu choi";

                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = buyerUserId,
                    Type = "order_cancellation_resolution",
                    Title = approved ? "Yeu cau huy da duoc chap nhan" : "Yeu cau huy da bi tu choi",
                    Body = $"Yeu cau huy don hang {orderNumber} cua ban da {resolutionText}.",
                    IsRead = false,
                    Link = $"/orders/{orderId}",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create buyer cancellation-resolution notification for order {OrderNumber} and buyer {BuyerUserId}",
                    orderNumber,
                    buyerUserId);
            }
        }

        public async Task TryCreateBuyerOrderShippedNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = buyerUserId,
                    Type = "order_shipped",
                    Title = "Don hang da duoc gui",
                    Body = $"Don hang {orderNumber} cua ban da duoc ship va co thong tin tracking moi.",
                    IsRead = false,
                    Link = $"/orders/{orderId}",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create buyer shipped notification for order {OrderNumber} and buyer {BuyerUserId}",
                    orderNumber,
                    buyerUserId);
            }
        }

        public async Task TryCreateBuyerOrderDeliveredNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = buyerUserId,
                    Type = "order_delivered",
                    Title = "Don hang da giao thanh cong",
                    Body = $"Don hang {orderNumber} cua ban da duoc danh dau la giao thanh cong.",
                    IsRead = false,
                    Link = $"/orders/{orderId}",
                    CreatedAt = DateTime.UtcNow
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to create buyer delivered notification for order {OrderNumber} and buyer {BuyerUserId}",
                    orderNumber,
                    buyerUserId);
            }
        }
    }
}
