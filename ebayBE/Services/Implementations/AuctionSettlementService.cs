using System.Data;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class AuctionSettlementService : IAuctionSettlementService
    {
        private const int AuctionPaymentDeadlineHours = 96;

        private readonly EbayDbContext _context;
        private readonly IOrderNumberGenerator _orderNumberGenerator;
        private readonly IOrderNotificationService _orderNotificationService;
        private readonly IAuctionNotificationService _auctionNotificationService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuctionSettlementService> _logger;

        public AuctionSettlementService(
            EbayDbContext context,
            IOrderNumberGenerator orderNumberGenerator,
            IOrderNotificationService orderNotificationService,
            IAuctionNotificationService auctionNotificationService,
            IEmailService emailService,
            ILogger<AuctionSettlementService> logger)
        {
            _context = context;
            _orderNumberGenerator = orderNumberGenerator;
            _orderNotificationService = orderNotificationService;
            _auctionNotificationService = auctionNotificationService;
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<int> FinalizeDueAuctionsAsync(int batchSize = 50, CancellationToken cancellationToken = default)
        {
            if (batchSize <= 0)
            {
                batchSize = 50;
            }

            var now = DateTime.UtcNow;
            var dueAuctionIds = await _context.Products
                .AsNoTracking()
                .Where(product =>
                    product.IsAuction == true &&
                    (product.AuctionStatus == null || product.AuctionStatus == "live") &&
                    product.AuctionEndTime.HasValue &&
                    product.AuctionEndTime.Value <= now)
                .OrderBy(product => product.AuctionEndTime)
                .Select(product => product.Id)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            var finalizedCount = 0;
            foreach (var productId in dueAuctionIds)
            {
                try
                {
                    if (await FinalizeAuctionIfDueAsync(productId, cancellationToken))
                    {
                        finalizedCount++;
                    }
                }
                catch (Exception ex) when (!cancellationToken.IsCancellationRequested)
                {
                    _logger.LogError(ex, "Failed to finalize auction for product {ProductId}", productId);
                }
            }

            return finalizedCount;
        }

        public async Task<bool> FinalizeAuctionIfDueAsync(int productId, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            AuctionSettlementNotificationContext? notifyContext = null;

            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);

            var product = await _context.Products
                .Include(item => item.Bids)
                .Include(item => item.Seller)
                .Include(item => item.Store)
                .FirstOrDefaultAsync(item => item.Id == productId, cancellationToken);

            if (product == null)
            {
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }

            var normalizedStatus = (product.AuctionStatus ?? "live").ToLowerInvariant();
            if (product.IsAuction != true ||
                normalizedStatus != "live" ||
                !product.AuctionEndTime.HasValue ||
                product.AuctionEndTime.Value > now)
            {
                await transaction.RollbackAsync(cancellationToken);
                return false;
            }

            var activeBids = product.Bids
                .Where(bid => bid.IsRetracted != true)
                .ToList();

            var participantIds = activeBids
                .Select(bid => bid.BidderId)
                .Distinct()
                .ToList();

            var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);

            foreach (var bid in activeBids)
            {
                bid.IsWinning = false;
            }

            if (computed.WinningBid != null)
            {
                computed.WinningBid.IsWinning = true;
                computed.WinningBid.Amount = computed.CurrentPrice;
            }

            product.CurrentBidPrice = computed.CurrentPrice;
            product.WinningBidderId = computed.TopBidderId;
            product.EndedAt = now;
            product.IsActive = false;
            product.Status = "ended";

            if (computed.TopBidderId.HasValue && computed.ReserveMet)
            {
                product.AuctionStatus = "sold";
                product.Stock = 0;

                var winnerId = computed.TopBidderId.Value;
                var existingOrder = await _context.OrderItems
                    .Where(item => item.ProductId == product.Id && item.Order.BuyerId == winnerId)
                    .Select(item => new { item.OrderId, item.Order.OrderNumber })
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingOrder == null)
                {
                    var address = await _context.Addresses
                        .Where(address => address.UserId == winnerId)
                        .OrderByDescending(address => address.IsDefault == true)
                        .ThenBy(address => address.Id)
                        .FirstOrDefaultAsync(cancellationToken);

                    var subtotal = computed.CurrentPrice;
                    var shippingFee = product.ShippingFee ?? 0m;
                    var totalPrice = subtotal + shippingFee;
                    var paymentDueAt = now.AddHours(AuctionPaymentDeadlineHours);

                    var order = new Order
                    {
                        CustomerType = "member",
                        BuyerId = winnerId,
                        OrderNumber = _orderNumberGenerator.Generate(),
                        AddressId = address?.Id,
                        ShipFullName = address?.FullName,
                        ShipPhone = address?.Phone,
                        ShipStreet = address?.Street,
                        ShipCity = address?.City,
                        ShipState = address?.State,
                        ShipPostalCode = address?.PostalCode,
                        ShipCountry = address?.Country,
                        OrderDate = now,
                        Subtotal = subtotal,
                        ShippingFee = shippingFee,
                        DiscountAmount = 0m,
                        Tax = 0m,
                        TotalPrice = totalPrice,
                        Status = "pending",
                        IsAuctionOrder = true,
                        PaymentDueAt = paymentDueAt,
                        PaymentReminderSentAt = null,
                        Note = $"Auto-created from auction listing #{product.Id}",
                        CreatedAt = now,
                        UpdatedAt = now
                    };

                    await _context.Orders.AddAsync(order, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

                    var orderItem = new OrderItem
                    {
                        OrderId = order.Id,
                        ProductId = product.Id,
                        SellerId = product.SellerId,
                        Quantity = 1,
                        UnitPrice = subtotal,
                        TotalPrice = subtotal,
                        ProductTitleSnapshot = product.Title,
                        ProductImageSnapshot = product.Images?.FirstOrDefault(),
                        SellerDisplayNameSnapshot = ResolveSellerDisplayName(product),
                        CreatedAt = now
                    };

                    var payment = new Payment
                    {
                        OrderId = order.Id,
                        UserId = winnerId,
                        Amount = totalPrice,
                        Method = "paypal",
                        Status = "pending",
                        CreatedAt = now
                    };

                    await _context.OrderItems.AddAsync(orderItem, cancellationToken);
                    await _context.Payments.AddAsync(payment, cancellationToken);

                    notifyContext = new AuctionSettlementNotificationContext
                    {
                        ProductId = product.Id,
                        WinnerId = winnerId,
                        OrderId = order.Id,
                        OrderNumber = order.OrderNumber,
                        ProductTitle = product.Title,
                        FinalPrice = subtotal,
                        LosingBidderIds = participantIds.Where(id => id != winnerId).ToList()
                    };
                }
                else
                {
                    var existingOrderEntity = await _context.Orders
                        .FirstOrDefaultAsync(order => order.Id == existingOrder.OrderId, cancellationToken);

                    if (existingOrderEntity != null && existingOrderEntity.IsAuctionOrder != true)
                    {
                        existingOrderEntity.IsAuctionOrder = true;
                        existingOrderEntity.PaymentDueAt ??= now.AddHours(AuctionPaymentDeadlineHours);
                        existingOrderEntity.UpdatedAt = now;
                    }

                    notifyContext = new AuctionSettlementNotificationContext
                    {
                        ProductId = product.Id,
                        WinnerId = winnerId,
                        OrderId = existingOrder.OrderId,
                        OrderNumber = existingOrder.OrderNumber,
                        ProductTitle = product.Title,
                        FinalPrice = computed.CurrentPrice,
                        LosingBidderIds = participantIds.Where(id => id != winnerId).ToList()
                    };
                }
            }
            else
            {
                product.AuctionStatus = computed.ReserveMet ? "ended" : "reserve_not_met";

                if (participantIds.Count > 0)
                {
                    notifyContext = new AuctionSettlementNotificationContext
                    {
                        ProductId = product.Id,
                        ProductTitle = product.Title,
                        FinalPrice = computed.CurrentPrice,
                        LosingBidderIds = participantIds
                    };
                }
            }

            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            if (notifyContext != null)
            {
                await NotifyParticipantsAsync(notifyContext, cancellationToken);
            }

            _logger.LogInformation(
                "Auction settled for product {ProductId}. Status={AuctionStatus}, Winner={WinnerId}, FinalPrice={FinalPrice}",
                product.Id,
                product.AuctionStatus,
                product.WinningBidderId,
                product.CurrentBidPrice);

            return true;
        }

        private static string ResolveSellerDisplayName(Product product)
        {
            if (!string.IsNullOrWhiteSpace(product.Store?.StoreName))
            {
                return product.Store.StoreName;
            }

            return product.Seller.Username;
        }

        private async Task NotifyParticipantsAsync(AuctionSettlementNotificationContext context, CancellationToken cancellationToken)
        {
            if (context.WinnerId > 0 && context.OrderId > 0)
            {
                await _orderNotificationService.TryCreateOrderPlacedNotificationAsync(
                    context.WinnerId,
                    context.OrderId,
                    context.OrderNumber,
                    cancellationToken);

                await _auctionNotificationService.TryCreateAuctionWonNotificationAsync(
                    context.WinnerId,
                    context.ProductId,
                    context.OrderId,
                    context.ProductTitle,
                    context.FinalPrice,
                    cancellationToken);
            }

            foreach (var bidderId in context.LosingBidderIds.Distinct())
            {
                await _auctionNotificationService.TryCreateAuctionLostNotificationAsync(
                    bidderId,
                    context.ProductId,
                    context.ProductTitle,
                    cancellationToken);
            }

            if (context.WinnerId <= 0)
            {
                return;
            }

            var winner = await _context.Users
                .AsNoTracking()
                .Where(user => user.Id == context.WinnerId)
                .Select(user => new
                {
                    user.Email,
                    user.Username,
                    user.FirstName,
                    user.LastName
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (winner == null || string.IsNullOrWhiteSpace(winner.Email))
            {
                _logger.LogWarning(
                    "Auction winner email skipped because account/email is missing. WinnerId={WinnerId}, OrderNumber={OrderNumber}",
                    context.WinnerId,
                    context.OrderNumber);
                return;
            }

            var displayName = $"{winner.FirstName} {winner.LastName}".Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = !string.IsNullOrWhiteSpace(winner.Username) ? winner.Username : "there";
            }

            try
            {
                await _emailService.SendAuctionWonEmailAsync(
                    winner.Email,
                    displayName,
                    context.ProductTitle,
                    context.FinalPrice,
                    context.OrderNumber);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send auction winner email for order {OrderNumber}", context.OrderNumber);
            }
        }

        private sealed class AuctionSettlementNotificationContext
        {
            public int ProductId { get; set; }
            public int WinnerId { get; set; }
            public int OrderId { get; set; }
            public string OrderNumber { get; set; } = string.Empty;
            public string ProductTitle { get; set; } = string.Empty;
            public decimal FinalPrice { get; set; }
            public List<int> LosingBidderIds { get; set; } = [];
        }
    }
}
