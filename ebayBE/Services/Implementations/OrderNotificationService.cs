using ebay.Models;
using ebay.Services.Interfaces;

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
                    Title = "Order received",
                    Body = $"Your order {orderNumber} has been created successfully.",
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
                    Title = "Cancellation request received",
                    Body = $"A buyer asked to cancel order {orderNumber}.",
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
                var resolutionText = approved ? "approved" : "declined";

                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = buyerUserId,
                    Type = "order_cancellation_resolution",
                    Title = approved ? "Cancellation approved" : "Cancellation declined",
                    Body = $"Your cancellation request for order {orderNumber} was {resolutionText}.",
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
                    Title = "Order shipped",
                    Body = $"Your order {orderNumber} is on the way and has updated tracking information.",
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
                    Title = "Order delivered",
                    Body = $"Your order {orderNumber} has been marked as delivered.",
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
