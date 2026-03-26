using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;

namespace ebay.Services.Implementations
{
    public class OrderProjectionMapper : IOrderProjectionMapper
    {
        public OrderResponseDto MapMemberOrder(Order order)
        {
            var payment = GetLatestPayment(order);

            return new OrderResponseDto
            {
                Id = order.Id,
                OrderNumber = order.OrderNumber,
                Subtotal = order.Subtotal,
                ShippingFee = order.ShippingFee ?? 0m,
                DiscountAmount = order.DiscountAmount ?? 0m,
                TotalAmount = order.TotalPrice,
                Status = order.Status ?? "pending",
                PaymentStatus = payment?.Status ?? "pending",
                PaymentMethod = payment?.Method ?? "COD",
                IsAuctionOrder = order.IsAuctionOrder ?? false,
                PaymentDueAt = order.PaymentDueAt,
                IsPaymentOverdue = (order.IsAuctionOrder ?? false)
                    && order.PaymentDueAt.HasValue
                    && order.PaymentDueAt.Value <= DateTime.UtcNow
                    && !string.Equals(payment?.Status, "completed", StringComparison.OrdinalIgnoreCase),
                CanRequestCancellation = OrderCancellationPolicyHelper.CanBuyerRequestCancellation(order),
                CancellationRequest = MapCancellationRequestSummary(
                    OrderCancellationPolicyHelper.GetLatestRequest(order)),
                CreatedAt = order.CreatedAt ?? order.OrderDate ?? DateTime.UtcNow,
                ShippingAddress = MapMemberShippingAddress(order),
                ShippingTracking = MapShippingTracking(order),
                Items = order.OrderItems.Select(MapMemberItem).ToList()
            };
        }

        public GuestOrderLookupResponseDto MapGuestLookup(Order order)
        {
            var payment = GetLatestPayment(order);

            return new GuestOrderLookupResponseDto
            {
                Found = true,
                OrderNumber = order.OrderNumber,
                Status = order.Status ?? "pending",
                PaymentStatus = payment?.Status ?? "pending",
                PaymentMethod = payment?.Method ?? "cod",
                CreatedAt = order.CreatedAt ?? order.OrderDate ?? DateTime.UtcNow,
                Totals = new GuestCheckoutTotalsResponseDto
                {
                    Subtotal = order.Subtotal,
                    ShippingFee = order.ShippingFee ?? 0m,
                    DiscountAmount = order.DiscountAmount ?? 0m,
                    Tax = order.Tax ?? 0m,
                    TotalAmount = order.TotalPrice
                },
                ShippingAddress = MapGuestShippingAddress(order),
                Items = order.OrderItems.Select(MapGuestLookupItem).ToList()
            };
        }

        private static Payment? GetLatestPayment(Order order)
        {
            return order.Payments
                .OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();
        }

        private static AddressResponseDto MapMemberShippingAddress(Order order)
        {
            return new AddressResponseDto
            {
                Id = order.Address?.Id ?? 0,
                FullName = FirstNonEmpty(order.ShipFullName, order.Address?.FullName),
                Phone = FirstNonEmpty(order.ShipPhone, order.Address?.Phone),
                Street = FirstNonEmpty(order.ShipStreet, order.Address?.Street),
                City = FirstNonEmpty(order.ShipCity, order.Address?.City),
                State = FirstNonEmpty(order.ShipState, order.Address?.State),
                PostalCode = FirstNonEmpty(order.ShipPostalCode, order.Address?.PostalCode),
                Country = FirstNonEmpty(order.ShipCountry, order.Address?.Country),
                IsDefault = order.Address?.IsDefault ?? false
            };
        }

        private static ShippingTrackingSummaryResponseDto? MapShippingTracking(Order order)
        {
            if (order.ShippingInfo == null)
            {
                return null;
            }

            return new ShippingTrackingSummaryResponseDto
            {
                Status = order.ShippingInfo.Status,
                Carrier = order.ShippingInfo.Carrier,
                TrackingNumber = order.ShippingInfo.TrackingNumber,
                ShippedAt = order.ShippingInfo.ShippedAt,
                EstimatedArrival = order.ShippingInfo.EstimatedArrival,
                DeliveredAt = order.ShippingInfo.DeliveredAt
            };
        }

        private static GuestOrderShippingSummaryResponseDto MapGuestShippingAddress(Order order)
        {
            return new GuestOrderShippingSummaryResponseDto
            {
                FullName = FirstNonEmpty(order.ShipFullName, order.Address?.FullName),
                Phone = FirstNonEmpty(order.ShipPhone, order.Address?.Phone),
                Street = FirstNonEmpty(order.ShipStreet, order.Address?.Street),
                City = FirstNonEmpty(order.ShipCity, order.Address?.City),
                State = FirstNonEmpty(order.ShipState, order.Address?.State),
                PostalCode = FirstNonEmpty(order.ShipPostalCode, order.Address?.PostalCode),
                Country = FirstNonEmpty(order.ShipCountry, order.Address?.Country)
            };
        }

        private static OrderItemResponseDto MapMemberItem(OrderItem orderItem)
        {
            return new OrderItemResponseDto
            {
                Id = orderItem.Id,
                ProductId = orderItem.ProductId,
                Title = ResolveItemTitle(orderItem),
                Image = ResolveItemImage(orderItem),
                Price = orderItem.UnitPrice,
                Quantity = orderItem.Quantity
            };
        }

        private static GuestOrderLookupItemResponseDto MapGuestLookupItem(OrderItem orderItem)
        {
            return new GuestOrderLookupItemResponseDto
            {
                Id = orderItem.Id,
                ProductId = orderItem.ProductId,
                Title = ResolveItemTitle(orderItem),
                Image = ResolveItemImage(orderItem),
                SellerDisplayName = ResolveSellerDisplayName(orderItem),
                Price = orderItem.UnitPrice,
                Quantity = orderItem.Quantity,
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

        private static string ResolveItemTitle(OrderItem orderItem)
        {
            return FirstNonEmpty(orderItem.ProductTitleSnapshot, orderItem.Product?.Title);
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

        private static string ResolveSellerDisplayName(OrderItem orderItem)
        {
            return FirstNonEmpty(orderItem.SellerDisplayNameSnapshot, orderItem.Seller?.Username);
        }

        private static string FirstNonEmpty(params string?[] values)
        {
            foreach (var value in values)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return string.Empty;
        }
    }
}
