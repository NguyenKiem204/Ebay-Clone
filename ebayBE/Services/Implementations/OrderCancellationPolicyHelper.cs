using ebay.Models;

namespace ebay.Services.Implementations
{
    internal static class OrderCancellationPolicyHelper
    {
        private static readonly string[] ShippedStates = ["shipped", "delivered"];
        private static readonly string[] TerminalOrderStates = ["cancelled", "delivered"];

        public static OrderCancellationRequest? GetLatestRequest(Order order)
        {
            return order.OrderCancellationRequests
                .OrderByDescending(request => request.CreatedAt ?? DateTime.MinValue)
                .ThenByDescending(request => request.Id)
                .FirstOrDefault();
        }

        public static bool SupportsCancellationRequests(Order order)
        {
            if (order.IsAuctionOrder == true)
            {
                return false;
            }

            var sellerCount = order.OrderItems
                .Select(orderItem => orderItem.SellerId)
                .Distinct()
                .Count();

            if (sellerCount != 1)
            {
                return false;
            }

            var normalizedOrderStatus = Normalize(order.Status);
            if (TerminalOrderStates.Contains(normalizedOrderStatus))
            {
                return false;
            }

            var shippingStatus = Normalize(order.ShippingInfo?.Status);
            if (ShippedStates.Contains(shippingStatus))
            {
                return false;
            }

            return true;
        }

        public static bool CanBuyerRequestCancellation(Order order)
        {
            if (!SupportsCancellationRequests(order))
            {
                return false;
            }

            var latestRequest = GetLatestRequest(order);
            if (latestRequest == null)
            {
                return true;
            }

            return string.Equals(latestRequest.Status, "rejected", StringComparison.OrdinalIgnoreCase);
        }

        public static bool CanSellerManageCancellationRequest(Order order, int sellerId)
        {
            if (!SupportsCancellationRequests(order))
            {
                return false;
            }

            var latestRequest = GetLatestRequest(order);
            if (latestRequest == null || !string.Equals(latestRequest.Status, "pending", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            return order.OrderItems.All(orderItem => orderItem.SellerId == sellerId);
        }

        private static string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }
    }
}
