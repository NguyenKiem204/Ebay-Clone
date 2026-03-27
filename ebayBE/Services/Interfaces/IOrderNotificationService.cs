namespace ebay.Services.Interfaces
{
    public interface IOrderNotificationService
    {
        Task TryCreateOrderPlacedNotificationAsync(
            int userId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateSellerCancellationRequestNotificationAsync(
            int sellerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateBuyerCancellationResolutionNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            bool approved,
            CancellationToken cancellationToken = default);

        Task TryCreateBuyerOrderShippedNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default);

        Task TryCreateBuyerOrderDeliveredNotificationAsync(
            int buyerUserId,
            int orderId,
            string orderNumber,
            CancellationToken cancellationToken = default);
    }
}
