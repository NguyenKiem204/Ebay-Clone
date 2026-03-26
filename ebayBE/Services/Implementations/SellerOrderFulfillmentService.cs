using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ebay.Services.Implementations
{
    public class SellerOrderFulfillmentService : ISellerOrderFulfillmentService
    {
        private readonly EbayDbContext _context;
        private readonly ISellerOrderQueryService _sellerOrderQueryService;
        private readonly IOrderNotificationService _orderNotificationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<SellerOrderFulfillmentService> _logger;

        public SellerOrderFulfillmentService(
            EbayDbContext context,
            ISellerOrderQueryService sellerOrderQueryService,
            IOrderNotificationService orderNotificationService,
            IEmailService emailService,
            ILogger<SellerOrderFulfillmentService> logger)
        {
            _context = context;
            _sellerOrderQueryService = sellerOrderQueryService;
            _orderNotificationService = orderNotificationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<SellerOrderDetailResponseDto> UpsertTrackingAsync(
            int sellerId,
            int orderId,
            UpsertSellerOrderTrackingDto request,
            CancellationToken cancellationToken = default)
        {
            var carrier = NormalizeRequired(request.Carrier, "carrier_required");
            var trackingNumber = NormalizeRequired(request.TrackingNumber, "tracking_number_required");

            var order = await _context.Orders
                .Include(currentOrder => currentOrder.Buyer)
                .Include(currentOrder => currentOrder.OrderItems)
                .Include(currentOrder => currentOrder.Payments)
                .Include(currentOrder => currentOrder.ShippingInfo)
                .FirstOrDefaultAsync(
                    currentOrder => currentOrder.Id == orderId && currentOrder.OrderItems.Any(orderItem => orderItem.SellerId == sellerId),
                    cancellationToken);

            if (order == null)
            {
                throw new NotFoundException("Đơn hàng không tồn tại trong seller queue");
            }

            if (!SellerOrderFulfillmentPolicyHelper.CanUpdateTracking(order))
            {
                throw new BadRequestException(
                    "Đơn hàng này hiện chưa thể cập nhật tracking theo nghiệp vụ hiện tại",
                    ["seller_tracking_not_allowed"]);
            }

            var now = DateTime.UtcNow;
            var shippingInfo = order.ShippingInfo;
            var firstShipmentUpdate = shippingInfo?.ShippedAt == null;

            if (shippingInfo == null)
            {
                shippingInfo = new ShippingInfo
                {
                    OrderId = order.Id,
                    CreatedAt = now
                };

                order.ShippingInfo = shippingInfo;
                await _context.ShippingInfos.AddAsync(shippingInfo, cancellationToken);
            }

            shippingInfo.Carrier = carrier;
            shippingInfo.TrackingNumber = trackingNumber;
            shippingInfo.EstimatedArrival = request.EstimatedArrival;
            shippingInfo.ShippedAt ??= now;
            shippingInfo.Status = string.Equals(shippingInfo.Status, "out_for_delivery", StringComparison.OrdinalIgnoreCase)
                ? "out_for_delivery"
                : "in_transit";
            shippingInfo.UpdatedAt = now;

            order.Status = "shipped";
            order.UpdatedAt = now;

            await _context.SaveChangesAsync(cancellationToken);

            if (firstShipmentUpdate && order.BuyerId.HasValue)
            {
                await _orderNotificationService.TryCreateBuyerOrderShippedNotificationAsync(
                    order.BuyerId.Value,
                    order.Id,
                    order.OrderNumber,
                    cancellationToken);
            }

            if (firstShipmentUpdate)
            {
                await TrySendShipmentEmailAsync(order, carrier, trackingNumber, request.EstimatedArrival);
            }

            return await _sellerOrderQueryService.GetSellerOrderByIdAsync(
                sellerId,
                orderId,
                cancellationToken);
        }

        public async Task<SellerOrderDetailResponseDto> UpdateShipmentStatusAsync(
            int sellerId,
            int orderId,
            UpdateSellerOrderShipmentStatusDto request,
            CancellationToken cancellationToken = default)
        {
            var nextStatus = NormalizeShipmentStatus(request.Status);

            var order = await _context.Orders
                .Include(currentOrder => currentOrder.Buyer)
                .Include(currentOrder => currentOrder.OrderItems)
                .Include(currentOrder => currentOrder.Payments)
                .Include(currentOrder => currentOrder.ShippingInfo)
                .FirstOrDefaultAsync(
                    currentOrder => currentOrder.Id == orderId && currentOrder.OrderItems.Any(orderItem => orderItem.SellerId == sellerId),
                    cancellationToken);

            if (order == null)
            {
                throw new NotFoundException("Đơn hàng không tồn tại trong seller queue");
            }

            if (order.ShippingInfo == null || string.IsNullOrWhiteSpace(order.ShippingInfo.TrackingNumber) || !order.ShippingInfo.ShippedAt.HasValue)
            {
                throw new BadRequestException(
                    "Đơn hàng chưa có tracking hợp lệ để cập nhật tiến trình giao hàng",
                    ["seller_shipping_not_started"]);
            }

            var now = DateTime.UtcNow;
            var shippingInfo = order.ShippingInfo;
            var firstDeliveredUpdate = !shippingInfo.DeliveredAt.HasValue;

            switch (nextStatus)
            {
                case "out_for_delivery":
                    if (!SellerOrderFulfillmentPolicyHelper.CanMarkOutForDelivery(order))
                    {
                        throw new BadRequestException(
                            "Đơn hàng này hiện chưa thể chuyển sang out for delivery",
                            ["seller_out_for_delivery_not_allowed"]);
                    }

                    shippingInfo.Status = "out_for_delivery";
                    shippingInfo.UpdatedAt = now;
                    order.Status = "shipped";
                    order.UpdatedAt = now;
                    break;

                case "delivered":
                    if (!SellerOrderFulfillmentPolicyHelper.CanMarkDelivered(order))
                    {
                        throw new BadRequestException(
                            "Đơn hàng này hiện chưa thể chuyển sang delivered",
                            ["seller_delivered_not_allowed"]);
                    }

                    shippingInfo.Status = "delivered";
                    shippingInfo.DeliveredAt ??= now;
                    shippingInfo.UpdatedAt = now;
                    order.Status = "delivered";
                    order.UpdatedAt = now;
                    MarkCodPaymentAsCompletedIfNeeded(order, shippingInfo.DeliveredAt.Value);
                    break;
            }

            await _context.SaveChangesAsync(cancellationToken);

            if (nextStatus == "delivered" && firstDeliveredUpdate)
            {
                if (order.BuyerId.HasValue)
                {
                    await _orderNotificationService.TryCreateBuyerOrderDeliveredNotificationAsync(
                        order.BuyerId.Value,
                        order.Id,
                        order.OrderNumber,
                        cancellationToken);
                }

                await TrySendDeliveredEmailAsync(
                    order,
                    shippingInfo.Carrier ?? "Not available",
                    shippingInfo.TrackingNumber ?? "Not available",
                    shippingInfo.DeliveredAt ?? now);
            }

            return await _sellerOrderQueryService.GetSellerOrderByIdAsync(
                sellerId,
                orderId,
                cancellationToken);
        }

        private static string NormalizeRequired(string? value, string errorCode)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                throw new BadRequestException(
                    "Thông tin tracking chưa đầy đủ",
                    [errorCode]);
            }

            return value.Trim();
        }

        private static string NormalizeShipmentStatus(string? value)
        {
            var normalized = NormalizeRequired(value, "shipment_status_required")
                .ToLowerInvariant();

            if (normalized is not ("out_for_delivery" or "delivered"))
            {
                throw new BadRequestException(
                    "Trạng thái giao hàng chưa được hỗ trợ trong phase hiện tại",
                    ["seller_shipment_status_not_supported"]);
            }

            return normalized;
        }

        private static void MarkCodPaymentAsCompletedIfNeeded(Order order, DateTime paidAtUtc)
        {
            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            if (latestPayment == null)
            {
                return;
            }

            if (!string.Equals(latestPayment.Method, "cod", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            if (!string.Equals(latestPayment.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }

            latestPayment.Status = "completed";
            latestPayment.PaidAt = paidAtUtc;
        }

        private async Task TrySendShipmentEmailAsync(Order order, string carrier, string trackingNumber, DateTime? estimatedArrivalUtc)
        {
            if (string.Equals(order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(order.GuestEmail))
                {
                    _logger.LogWarning(
                        "Guest shipped email skipped because GuestEmail is missing for order {OrderNumber}",
                        order.OrderNumber);
                    return;
                }

                try
                {
                    await _emailService.SendGuestOrderShippedEmailAsync(
                        order.GuestEmail,
                        string.IsNullOrWhiteSpace(order.GuestFullName) ? "bạn" : order.GuestFullName,
                        order.OrderNumber,
                        carrier,
                        trackingNumber,
                        estimatedArrivalUtc);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send guest shipped email for order {OrderNumber}", order.OrderNumber);
                }

                return;
            }

            var memberEmail = order.Buyer?.Email;
            if (string.IsNullOrWhiteSpace(memberEmail))
            {
                _logger.LogWarning(
                    "Member shipped email skipped because Email is missing for user {UserId}, order {OrderNumber}",
                    order.BuyerId,
                    order.OrderNumber);
                return;
            }

            var memberDisplayName = ResolveMemberDisplayName(order);

            try
            {
                await _emailService.SendMemberOrderShippedEmailAsync(
                    memberEmail,
                    memberDisplayName,
                    order.OrderNumber,
                    carrier,
                    trackingNumber,
                    estimatedArrivalUtc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send member shipped email for order {OrderNumber}", order.OrderNumber);
            }
        }

        private async Task TrySendDeliveredEmailAsync(Order order, string carrier, string trackingNumber, DateTime deliveredAtUtc)
        {
            if (string.Equals(order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(order.GuestEmail))
                {
                    _logger.LogWarning(
                        "Guest delivered email skipped because GuestEmail is missing for order {OrderNumber}",
                        order.OrderNumber);
                    return;
                }

                try
                {
                    await _emailService.SendGuestOrderDeliveredEmailAsync(
                        order.GuestEmail,
                        string.IsNullOrWhiteSpace(order.GuestFullName) ? "bạn" : order.GuestFullName,
                        order.OrderNumber,
                        carrier,
                        trackingNumber,
                        deliveredAtUtc);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send guest delivered email for order {OrderNumber}", order.OrderNumber);
                }

                return;
            }

            var memberEmail = order.Buyer?.Email;
            if (string.IsNullOrWhiteSpace(memberEmail))
            {
                _logger.LogWarning(
                    "Member delivered email skipped because Email is missing for user {UserId}, order {OrderNumber}",
                    order.BuyerId,
                    order.OrderNumber);
                return;
            }

            var memberDisplayName = ResolveMemberDisplayName(order);

            try
            {
                await _emailService.SendMemberOrderDeliveredEmailAsync(
                    memberEmail,
                    memberDisplayName,
                    order.OrderNumber,
                    carrier,
                    trackingNumber,
                    deliveredAtUtc);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send member delivered email for order {OrderNumber}", order.OrderNumber);
            }
        }

        private static string ResolveMemberDisplayName(Order order)
        {
            var fullName = $"{order.Buyer?.FirstName} {order.Buyer?.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            if (!string.IsNullOrWhiteSpace(order.Buyer?.Username))
            {
                return order.Buyer.Username;
            }

            if (!string.IsNullOrWhiteSpace(order.ShipFullName))
            {
                return order.ShipFullName;
            }

            return "bạn";
        }
    }
}
