using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class AuctionPaymentFollowUpService : IAuctionPaymentFollowUpService
    {
        private const int ReminderLeadHours = 24;

        private readonly EbayDbContext _context;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuctionPaymentFollowUpService> _logger;

        public AuctionPaymentFollowUpService(
            EbayDbContext context,
            IEmailService emailService,
            ILogger<AuctionPaymentFollowUpService> logger)
        {
            _context = context;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<int> SendAuctionPaymentRemindersAsync(int batchSize = 50, CancellationToken cancellationToken = default)
        {
            if (batchSize <= 0)
            {
                batchSize = 50;
            }

            var now = DateTime.UtcNow;
            var reminderCutoff = now.AddHours(ReminderLeadHours);

            var candidates = await _context.Orders
                .Include(o => o.Buyer)
                .Include(o => o.Payments)
                .Include(o => o.OrderItems)
                .Where(o =>
                    o.IsAuctionOrder == true &&
                    o.Status == "pending" &&
                    o.PaymentDueAt.HasValue &&
                    o.PaymentDueAt.Value > now &&
                    o.PaymentDueAt.Value <= reminderCutoff &&
                    !o.PaymentReminderSentAt.HasValue)
                .OrderBy(o => o.PaymentDueAt)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            var sentCount = 0;

            foreach (var order in candidates)
            {
                var latestPayment = order.Payments
                    .OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
                    .FirstOrDefault();

                if (latestPayment == null || !string.Equals(latestPayment.Status, "pending", StringComparison.OrdinalIgnoreCase))
                {
                    order.PaymentReminderSentAt = now;
                    continue;
                }

                var buyerEmail = order.Buyer?.Email;
                var buyerDisplayName = ResolveBuyerDisplayName(order.Buyer);
                var firstItem = order.OrderItems.OrderBy(item => item.Id).FirstOrDefault();
                var productTitle = firstItem?.ProductTitleSnapshot ?? "Auction item";
                var finalPrice = firstItem?.TotalPrice ?? order.TotalPrice;

                if (string.IsNullOrWhiteSpace(buyerEmail))
                {
                    _logger.LogWarning(
                        "Skip auction payment reminder because buyer email missing. Order={OrderNumber}",
                        order.OrderNumber);
                    order.PaymentReminderSentAt = now;
                    continue;
                }

                try
                {
                    await _emailService.SendAuctionPaymentReminderEmailAsync(
                        buyerEmail,
                        buyerDisplayName,
                        productTitle,
                        finalPrice,
                        order.OrderNumber,
                        order.PaymentDueAt!.Value);

                    sentCount++;
                    order.PaymentReminderSentAt = now;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send auction payment reminder for order {OrderNumber}", order.OrderNumber);
                }
            }

            if (candidates.Count > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

            return sentCount;
        }

        public async Task<int> CancelOverdueAuctionOrdersAsync(int batchSize = 50, CancellationToken cancellationToken = default)
        {
            if (batchSize <= 0)
            {
                batchSize = 50;
            }

            var now = DateTime.UtcNow;

            var overdueOrders = await _context.Orders
                .Include(o => o.Payments)
                .Where(o =>
                    o.IsAuctionOrder == true &&
                    o.Status == "pending" &&
                    o.PaymentDueAt.HasValue &&
                    o.PaymentDueAt.Value <= now)
                .OrderBy(o => o.PaymentDueAt)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            var cancelledCount = 0;

            foreach (var order in overdueOrders)
            {
                var latestPayment = order.Payments
                    .OrderByDescending(p => p.CreatedAt ?? DateTime.MinValue)
                    .FirstOrDefault();

                if (latestPayment == null || string.Equals(latestPayment.Status, "completed", StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                latestPayment.Status = "failed";
                latestPayment.PaidAt = null;
                latestPayment.PaymentGateway ??= "paypal_simulated";

                order.Status = "cancelled";
                order.UpdatedAt = now;

                var timeoutTag = $"[AUTO] Auction payment deadline exceeded at {now:O}.";
                order.Note = string.IsNullOrWhiteSpace(order.Note)
                    ? timeoutTag
                    : $"{order.Note}\n{timeoutTag}";

                cancelledCount++;
            }

            if (cancelledCount > 0)
            {
                await _context.SaveChangesAsync(cancellationToken);
            }

            return cancelledCount;
        }

        private static string ResolveBuyerDisplayName(User? buyer)
        {
            if (buyer == null)
            {
                return "bạn";
            }

            var fullName = $"{buyer.FirstName} {buyer.LastName}".Trim();
            if (!string.IsNullOrWhiteSpace(fullName))
            {
                return fullName;
            }

            if (!string.IsNullOrWhiteSpace(buyer.Username))
            {
                return buyer.Username;
            }

            return "bạn";
        }
    }
}
