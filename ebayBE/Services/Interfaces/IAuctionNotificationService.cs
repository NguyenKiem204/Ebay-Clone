namespace ebay.Services.Interfaces
{
    public interface IAuctionNotificationService
    {
        Task TryCreateOutbidNotificationAsync(
            int userId,
            int productId,
            string productTitle,
            CancellationToken cancellationToken = default);

        Task TryCreateAuctionWonNotificationAsync(
            int userId,
            int productId,
            int? orderId,
            string productTitle,
            decimal finalPrice,
            CancellationToken cancellationToken = default);

        Task TryCreateAuctionLostNotificationAsync(
            int userId,
            int productId,
            string productTitle,
            CancellationToken cancellationToken = default);

        Task<int> SendEndingSoonWatchlistNotificationsAsync(
            int batchSize = 50,
            CancellationToken cancellationToken = default);
    }
}
