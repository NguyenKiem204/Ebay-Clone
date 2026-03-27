using ebay.Models;

namespace ebay.Services.Implementations
{
    internal static class SellerOrderFulfillmentPolicyHelper
    {
        private static readonly string[] TerminalOrderStates = ["cancelled", "delivered", "refunded"];
        private static readonly string[] TerminalShippingStates = ["delivered"];
        private static readonly string[] SellerManagedShipmentStatuses = ["in_transit", "out_for_delivery"];

        public static bool SupportsSellerManagedFulfillment(Order order)
        {
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

            var normalizedShippingStatus = Normalize(order.ShippingInfo?.Status);
            if (TerminalShippingStates.Contains(normalizedShippingStatus))
            {
                return false;
            }

            return true;
        }

        public static bool CanUpdateTracking(Order order)
        {
            if (!SupportsSellerManagedFulfillment(order))
            {
                return false;
            }

            var latestPayment = order.Payments
                .OrderByDescending(payment => payment.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            if (latestPayment == null)
            {
                return false;
            }

            var normalizedMethod = Normalize(latestPayment.Method);
            var normalizedPaymentStatus = Normalize(latestPayment.Status);

            if (normalizedMethod == "cod")
            {
                return true;
            }

            return normalizedPaymentStatus == "completed";
        }

        public static bool CanMarkOutForDelivery(Order order)
        {
            if (!CanManageShipmentState(order))
            {
                return false;
            }

            return Normalize(order.ShippingInfo?.Status) == "in_transit";
        }

        public static bool CanMarkDelivered(Order order)
        {
            if (!CanManageShipmentState(order))
            {
                return false;
            }

            var normalizedShippingStatus = Normalize(order.ShippingInfo?.Status);
            return normalizedShippingStatus is "in_transit" or "out_for_delivery";
        }

        private static bool CanManageShipmentState(Order order)
        {
            if (!SupportsSellerManagedFulfillment(order) || !CanUpdateTracking(order))
            {
                return false;
            }

            if (order.ShippingInfo == null || !order.ShippingInfo.ShippedAt.HasValue)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(order.ShippingInfo.Carrier) || string.IsNullOrWhiteSpace(order.ShippingInfo.TrackingNumber))
            {
                return false;
            }

            var normalizedShippingStatus = Normalize(order.ShippingInfo.Status);
            return SellerManagedShipmentStatuses.Contains(normalizedShippingStatus);
        }

        private static string Normalize(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? string.Empty
                : value.Trim().ToLowerInvariant();
        }
    }
}
