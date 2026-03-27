using ebay.Exceptions;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class SellerOrderQueryService : ISellerOrderQueryService
    {
        private readonly EbayDbContext _context;

        public SellerOrderQueryService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<List<SellerOrderListItemResponseDto>> GetSellerOrdersAsync(
            int sellerId,
            CancellationToken cancellationToken = default)
        {
            var orders = await _context.Orders
                .AsNoTracking()
                .Where(order => order.OrderItems.Any(orderItem => orderItem.SellerId == sellerId))
                .Include(order => order.Buyer)
                .Include(order => order.OrderCancellationRequests)
                .Include(order => order.Payments)
                .Include(order => order.ShippingInfo)
                .Include(order => order.OrderItems)
                    .ThenInclude(orderItem => orderItem.Product)
                .OrderByDescending(order => order.CreatedAt ?? order.OrderDate ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);

            return orders
                .Select(order => MapSellerOrder(order, sellerId))
                .Where(order => order.Items.Count > 0)
                .ToList();
        }

        public async Task<SellerOrderDetailResponseDto> GetSellerOrderByIdAsync(
            int sellerId,
            int orderId,
            CancellationToken cancellationToken = default)
        {
            var order = await _context.Orders
                .AsNoTracking()
                .Where(currentOrder => currentOrder.Id == orderId && currentOrder.OrderItems.Any(orderItem => orderItem.SellerId == sellerId))
                .Include(currentOrder => currentOrder.Address)
                .Include(currentOrder => currentOrder.Buyer)
                .Include(currentOrder => currentOrder.OrderCancellationRequests)
                .Include(currentOrder => currentOrder.Payments)
                .Include(currentOrder => currentOrder.ShippingInfo)
                .Include(currentOrder => currentOrder.OrderItems)
                    .ThenInclude(orderItem => orderItem.Product)
                .FirstOrDefaultAsync(cancellationToken);

            if (order == null)
            {
                throw new NotFoundException("Đơn hàng không tồn tại trong seller queue");
            }

            return MapSellerOrderDetail(order, sellerId);
        }

        private static SellerOrderListItemResponseDto MapSellerOrder(Order order, int sellerId)
        {
            var sellerItems = order.OrderItems
                .Where(orderItem => orderItem.SellerId == sellerId)
                .OrderByDescending(orderItem => orderItem.CreatedAt ?? DateTime.MinValue)
                .ThenByDescending(orderItem => orderItem.Id)
                .ToList();

            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            return new SellerOrderListItemResponseDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerType = order.CustomerType,
                BuyerDisplayName = ResolveBuyerDisplayName(order),
                BuyerEmail = ResolveBuyerEmail(order),
                CreatedAt = order.CreatedAt ?? order.OrderDate ?? DateTime.UtcNow,
                OrderStatus = order.Status,
                PaymentStatus = latestPayment?.Status ?? "pending",
                PaymentMethod = latestPayment?.Method ?? "cod",
                ShippingStatus = order.ShippingInfo?.Status,
                IsAuctionOrder = order.IsAuctionOrder ?? false,
                PaymentDueAt = order.PaymentDueAt,
                SupportsCancellationRequests = OrderCancellationPolicyHelper.SupportsCancellationRequests(order),
                CanManageCancellationRequest = OrderCancellationPolicyHelper.CanSellerManageCancellationRequest(order, sellerId),
                CanUpdateTracking = SellerOrderFulfillmentPolicyHelper.CanUpdateTracking(order),
                CanMarkOutForDelivery = SellerOrderFulfillmentPolicyHelper.CanMarkOutForDelivery(order),
                CanMarkDelivered = SellerOrderFulfillmentPolicyHelper.CanMarkDelivered(order),
                CancellationRequest = MapCancellationRequestSummary(
                    OrderCancellationPolicyHelper.GetLatestRequest(order)),
                SellerTotalAmount = sellerItems.Sum(item => item.TotalPrice),
                SellerItemCount = sellerItems.Count,
                SellerQuantityTotal = sellerItems.Sum(item => item.Quantity),
                Items = sellerItems.Select(MapSellerOrderItem).ToList()
            };
        }

        private static SellerOrderDetailResponseDto MapSellerOrderDetail(Order order, int sellerId)
        {
            var sellerItems = order.OrderItems
                .Where(orderItem => orderItem.SellerId == sellerId)
                .OrderByDescending(orderItem => orderItem.CreatedAt ?? DateTime.MinValue)
                .ThenByDescending(orderItem => orderItem.Id)
                .ToList();

            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            return new SellerOrderDetailResponseDto
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                CustomerType = order.CustomerType,
                BuyerDisplayName = ResolveBuyerDisplayName(order),
                BuyerEmail = ResolveBuyerEmail(order),
                BuyerPhone = ResolveBuyerPhone(order),
                CreatedAt = order.CreatedAt ?? order.OrderDate ?? DateTime.UtcNow,
                OrderStatus = order.Status,
                PaymentStatus = latestPayment?.Status ?? "pending",
                PaymentMethod = latestPayment?.Method ?? "cod",
                ShippingStatus = order.ShippingInfo?.Status,
                IsAuctionOrder = order.IsAuctionOrder ?? false,
                PaymentDueAt = order.PaymentDueAt,
                SupportsCancellationRequests = OrderCancellationPolicyHelper.SupportsCancellationRequests(order),
                CanManageCancellationRequest = OrderCancellationPolicyHelper.CanSellerManageCancellationRequest(order, sellerId),
                CanUpdateTracking = SellerOrderFulfillmentPolicyHelper.CanUpdateTracking(order),
                CanMarkOutForDelivery = SellerOrderFulfillmentPolicyHelper.CanMarkOutForDelivery(order),
                CanMarkDelivered = SellerOrderFulfillmentPolicyHelper.CanMarkDelivered(order),
                CancellationRequest = MapCancellationRequestSummary(
                    OrderCancellationPolicyHelper.GetLatestRequest(order)),
                SellerTotalAmount = sellerItems.Sum(item => item.TotalPrice),
                SellerItemCount = sellerItems.Count,
                SellerQuantityTotal = sellerItems.Sum(item => item.Quantity),
                ContainsOtherSellerItems = order.OrderItems.Any(orderItem => orderItem.SellerId != sellerId),
                OtherSellerItemCount = order.OrderItems.Count(orderItem => orderItem.SellerId != sellerId),
                OrderSubtotal = order.Subtotal,
                OrderShippingFee = order.ShippingFee ?? 0m,
                OrderDiscountAmount = order.DiscountAmount ?? 0m,
                OrderTotalAmount = order.TotalPrice,
                BuyerNote = FirstNonEmptyOrNull(order.Note),
                ShippingAddress = MapShippingAddress(order),
                ShippingTracking = MapShippingTracking(order.ShippingInfo),
                Items = sellerItems.Select(MapSellerOrderItem).ToList()
            };
        }

        private static SellerOrderItemSummaryResponseDto MapSellerOrderItem(OrderItem orderItem)
        {
            return new SellerOrderItemSummaryResponseDto
            {
                OrderItemId = orderItem.Id,
                ProductId = orderItem.ProductId,
                Title = ResolveItemTitle(orderItem),
                Image = ResolveItemImage(orderItem),
                Quantity = orderItem.Quantity,
                UnitPrice = orderItem.UnitPrice,
                TotalPrice = orderItem.TotalPrice
            };
        }

        private static OrderCancellationRequestSummaryDto? MapCancellationRequestSummary(OrderCancellationRequest? request)
        {
            if (request == null)
            {
                return null;
            }

            return new OrderCancellationRequestSummaryDto
            {
                Id = request.Id,
                Status = request.Status,
                Reason = request.Reason,
                SellerResponse = request.SellerResponse,
                CreatedAt = request.CreatedAt ?? DateTime.UtcNow,
                RespondedAt = request.RespondedAt,
                RequestedByUserId = request.RequestedByUserId,
                ResolvedByUserId = request.ResolvedByUserId
            };
        }

        private static string ResolveBuyerDisplayName(Order order)
        {
            if (string.Equals(order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
            {
                return FirstNonEmpty(order.GuestFullName, order.ShipFullName, order.GuestEmail, "Guest buyer");
            }

            return FirstNonEmpty(
                order.Buyer?.Username,
                $"{order.Buyer?.FirstName} {order.Buyer?.LastName}".Trim(),
                order.ShipFullName,
                "Member buyer");
        }

        private static string? ResolveBuyerEmail(Order order)
        {
            if (string.Equals(order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
            {
                return FirstNonEmptyOrNull(order.GuestEmail);
            }

            return FirstNonEmptyOrNull(order.Buyer?.Email);
        }

        private static string? ResolveBuyerPhone(Order order)
        {
            if (string.Equals(order.CustomerType, "guest", StringComparison.OrdinalIgnoreCase))
            {
                return FirstNonEmptyOrNull(order.GuestPhone, order.ShipPhone);
            }

            return FirstNonEmptyOrNull(order.ShipPhone, order.Address?.Phone);
        }

        private static string ResolveItemTitle(OrderItem orderItem)
        {
            return FirstNonEmpty(orderItem.ProductTitleSnapshot, orderItem.Product?.Title, $"Product #{orderItem.ProductId}");
        }

        private static string? ResolveItemImage(OrderItem orderItem)
        {
            if (!string.IsNullOrWhiteSpace(orderItem.ProductImageSnapshot))
            {
                return orderItem.ProductImageSnapshot;
            }

            if (orderItem.Product?.Images != null && orderItem.Product.Images.Any())
            {
                return orderItem.Product.Images[0];
            }

            return null;
        }

        private static AddressResponseDto? MapShippingAddress(Order order)
        {
            var fullName = FirstNonEmptyOrNull(order.ShipFullName, order.Address?.FullName);
            var phone = FirstNonEmptyOrNull(order.ShipPhone, order.Address?.Phone);
            var street = FirstNonEmptyOrNull(order.ShipStreet, order.Address?.Street);
            var city = FirstNonEmptyOrNull(order.ShipCity, order.Address?.City);
            var country = FirstNonEmptyOrNull(order.ShipCountry, order.Address?.Country);

            if (fullName == null && phone == null && street == null && city == null && country == null)
            {
                return null;
            }

            return new AddressResponseDto
            {
                Id = order.AddressId ?? 0,
                FullName = fullName ?? "Not available",
                Phone = phone ?? "Not available",
                Street = street ?? "Not available",
                City = city ?? "Not available",
                State = FirstNonEmptyOrNull(order.ShipState, order.Address?.State),
                PostalCode = FirstNonEmptyOrNull(order.ShipPostalCode, order.Address?.PostalCode),
                Country = country ?? "Not available",
                IsDefault = order.Address?.IsDefault ?? false
            };
        }

        private static ShippingTrackingSummaryResponseDto? MapShippingTracking(ShippingInfo? shippingInfo)
        {
            if (shippingInfo == null)
            {
                return null;
            }

            return new ShippingTrackingSummaryResponseDto
            {
                Status = shippingInfo.Status,
                Carrier = shippingInfo.Carrier,
                TrackingNumber = shippingInfo.TrackingNumber,
                ShippedAt = shippingInfo.ShippedAt,
                EstimatedArrival = shippingInfo.EstimatedArrival,
                DeliveredAt = shippingInfo.DeliveredAt
            };
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value.Trim();
                }
            }

            return string.Empty;
        }

        private static string? FirstNonEmptyOrNull(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value.Trim();
                }
            }

            return null;
        }
    }
}
