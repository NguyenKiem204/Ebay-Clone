using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class AuctionNotificationService : IAuctionNotificationService
    {
        private const string OutbidType = "auction_outbid";
        private const string WonType = "auction_won";
        private const string LostType = "auction_lost";
        private const string EndingSoonType = "auction_ending_soon";
        private static readonly TimeSpan EndingSoonLeadTime = TimeSpan.FromHours(2);
        private static readonly TimeSpan DuplicateWindow = TimeSpan.FromHours(24);

        private readonly EbayDbContext _context;
        private readonly ILogger<AuctionNotificationService> _logger;

        public AuctionNotificationService(
            EbayDbContext context,
            ILogger<AuctionNotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public Task TryCreateOutbidNotificationAsync(
            int userId,
            int productId,
            string productTitle,
            CancellationToken cancellationToken = default)
        {
            return TryCreateNotificationAsync(
                userId,
                OutbidType,
                "You've been outbid",
                $"Another bidder has moved ahead on {productTitle}.",
                $"/products/{productId}",
                cancellationToken);
        }

        public Task TryCreateAuctionWonNotificationAsync(
            int userId,
            int productId,
            int? orderId,
            string productTitle,
            decimal finalPrice,
            CancellationToken cancellationToken = default)
        {
            var link = orderId.HasValue ? $"/orders/{orderId.Value}" : $"/products/{productId}";

            return TryCreateNotificationAsync(
                userId,
                WonType,
                "You won the auction",
                $"You won {productTitle} for {finalPrice:N0}.",
                link,
                cancellationToken);
        }

        public Task TryCreateAuctionLostNotificationAsync(
            int userId,
            int productId,
            string productTitle,
            CancellationToken cancellationToken = default)
        {
            return TryCreateNotificationAsync(
                userId,
                LostType,
                "Auction ended",
                $"You did not win the auction for {productTitle}.",
                $"/products/{productId}",
                cancellationToken);
        }

        public async Task<int> SendEndingSoonWatchlistNotificationsAsync(
            int batchSize = 50,
            CancellationToken cancellationToken = default)
        {
            if (batchSize <= 0)
            {
                batchSize = 50;
            }

            var now = DateTime.UtcNow;
            var soonCutoff = now.Add(EndingSoonLeadTime);

            var watchlistItems = await _context.WatchlistItems
                .Include(item => item.Product)
                .Where(item =>
                    item.Product.IsAuction == true &&
                    item.Product.IsActive == true &&
                    (item.Product.AuctionStatus == null || item.Product.AuctionStatus == "live") &&
                    item.Product.AuctionEndTime.HasValue &&
                    item.Product.AuctionEndTime.Value > now &&
                    item.Product.AuctionEndTime.Value <= soonCutoff)
                .OrderBy(item => item.Product.AuctionEndTime)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            var createdCount = 0;
            foreach (var item in watchlistItems)
            {
                var title = item.Product.Title;
                var link = $"/products/{item.ProductId}";

                var alreadyNotified = await _context.Notifications.AnyAsync(
                    notification =>
                        notification.UserId == item.UserId &&
                        notification.Type == EndingSoonType &&
                        notification.Link == link &&
                        notification.CreatedAt.HasValue &&
                        notification.CreatedAt.Value >= now.Subtract(DuplicateWindow),
                    cancellationToken);

                if (alreadyNotified)
                {
                    continue;
                }

                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = item.UserId,
                    Type = EndingSoonType,
                    Title = "Auction ending soon",
                    Body = $"{title} is ending soon. Place your next bid before time runs out.",
                    Link = link,
                    IsRead = false,
                    CreatedAt = now
                }, cancellationToken);

                createdCount++;
            }

            if (createdCount > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

            return createdCount;
        }

        private async Task TryCreateNotificationAsync(
            int userId,
            string type,
            string title,
            string body,
            string link,
            CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;
                var exists = await _context.Notifications.AnyAsync(
                    notification =>
                        notification.UserId == userId &&
                        notification.Type == type &&
                        notification.Link == link &&
                        notification.CreatedAt.HasValue &&
                        notification.CreatedAt.Value >= now.Subtract(DuplicateWindow),
                    cancellationToken);

                if (exists)
                {
                    return;
                }

                await _context.Notifications.AddAsync(new Notification
                {
                    UserId = userId,
                    Type = type,
                    Title = title,
                    Body = body,
                    Link = link,
                    IsRead = false,
                    CreatedAt = now
                }, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create auction notification {Type} for user {UserId}", type, userId);
            }
        }
    }
}
