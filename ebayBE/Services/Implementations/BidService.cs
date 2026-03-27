using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class BidService : IBidService
    {
        private readonly EbayDbContext _context;
        private readonly IAuctionSettlementService _auctionSettlementService;
        private readonly IAuctionNotificationService _auctionNotificationService;

        public BidService(
            EbayDbContext context,
            IAuctionSettlementService auctionSettlementService,
            IAuctionNotificationService auctionNotificationService)
        {
            _context = context;
            _auctionSettlementService = auctionSettlementService;
            _auctionNotificationService = auctionNotificationService;
        }

        public async Task<BidPlacementResponseDto> PlaceBidAsync(int productId, int bidderId, decimal amount)
        {
            if (amount <= 0)
            {
                throw new BadRequestException("Bid amount must be greater than 0.");
            }

            await _auctionSettlementService.FinalizeAuctionIfDueAsync(productId);

            var bidder = await _context.Users.FirstOrDefaultAsync(u => u.Id == bidderId);
            if (bidder == null)
            {
                throw new NotFoundException("User not found.");
            }

            if (bidder.IsActive != true)
            {
                throw new BadRequestException("Your account is not allowed to join auctions right now.");
            }

            if (bidder.LockoutEnd.HasValue && bidder.LockoutEnd.Value > DateTime.UtcNow)
            {
                throw new BadRequestException("Your account is temporarily locked and cannot place bids.");
            }

            var now = DateTime.UtcNow;
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var product = await _context.Products
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                throw new NotFoundException("Product not found.");
            }

            if (product.IsAuction != true)
            {
                throw new BadRequestException("This product is not an auction listing.");
            }

            if (product.IsActive != true || !string.Equals(product.Status, "active", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("This listing is no longer open for bidding.");
            }

            if ((product.Stock ?? 0) <= 0)
            {
                throw new BadRequestException("This item is no longer available for bidding.");
            }

            if (product.SellerId == bidderId)
            {
                throw new BadRequestException("You cannot bid on your own listing.");
            }

            var normalizedAuctionStatus = NormalizeAuctionStatus(product.AuctionStatus);
            if (IsClosedAuctionStatus(normalizedAuctionStatus))
            {
                throw new BadRequestException("This auction is closed.");
            }

            if (product.AuctionStartTime.HasValue && product.AuctionStartTime.Value > now)
            {
                throw new BadRequestException("This auction has not started yet.");
            }

            if (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now)
            {
                throw new BadRequestException("This auction has already ended.");
            }

            var activeBids = product.Bids
                .Where(b => b.IsRetracted != true)
                .ToList();

            var beforeState = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
            var previousTopBidderId = beforeState.TopBidderId;

            if (beforeState.TopBidderId.HasValue && beforeState.TopBidderId.Value == bidderId)
            {
                if (amount <= beforeState.TopBidderMaxAmount)
                {
                    throw new BadRequestException($"You are already leading. Your new max bid must be greater than {beforeState.TopBidderMaxAmount:N2}.");
                }
            }
            else if (amount < beforeState.MinimumNextBid)
            {
                throw new BadRequestException($"Your max bid must be at least {beforeState.MinimumNextBid:N2}.");
            }

            var bid = new Bid
            {
                ProductId = productId,
                BidderId = bidderId,
                Amount = 0,
                MaxAmount = amount,
                BidTime = now,
                IsWinning = false,
                IsRetracted = false
            };

            _context.Bids.Add(bid);
            activeBids.Add(bid);

            var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
            ApplyAuctionState(product, activeBids, computed, now);

            bid.Amount = computed.CurrentPrice;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            if (previousTopBidderId.HasValue &&
                previousTopBidderId.Value != bidderId &&
                computed.TopBidderId != previousTopBidderId)
            {
                await _auctionNotificationService.TryCreateOutbidNotificationAsync(
                    previousTopBidderId.Value,
                    product.Id,
                    product.Title);
            }

            var savedBid = await _context.Bids
                .Include(b => b.Bidder)
                .FirstAsync(b => b.Id == bid.Id);

            return new BidPlacementResponseDto
            {
                Status = DetermineUserBidStatus(product, computed, bidderId, hasBid: true),
                CurrentPrice = computed.CurrentPrice,
                YourBid = amount,
                Bid = MapToResponse(savedBid, bidderId, includeMaxForOwner: true),
                AuctionState = BuildAuctionStateDto(product, computed, bidderId)
            };
        }

        public async Task<List<BidResponseDto>> GetBidsByProductIdAsync(int productId)
        {
            var bids = await _context.Bids
                .Include(b => b.Bidder)
                .Where(b => b.ProductId == productId && b.IsRetracted != true)
                .OrderByDescending(b => b.BidTime)
                .ToListAsync();

            return bids.Select(b => MapToResponse(b, currentUserId: null, includeMaxForOwner: false)).ToList();
        }

        public async Task<BidResponseDto?> GetWinningBidAsync(int productId)
        {
            await _auctionSettlementService.FinalizeAuctionIfDueAsync(productId);

            var product = await _context.Products
                .Include(p => p.Bids)
                    .ThenInclude(b => b.Bidder)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                throw new NotFoundException("Product not found.");
            }

            var activeBids = product.Bids
                .Where(b => b.IsRetracted != true)
                .ToList();

            var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
            if (computed.WinningBid != null)
            {
                computed.WinningBid.Amount = computed.CurrentPrice;
            }

            return computed.WinningBid != null
                ? MapToResponse(computed.WinningBid, currentUserId: null, includeMaxForOwner: false)
                : null;
        }

        public async Task<AuctionStateResponseDto> GetAuctionStateAsync(int productId, int? currentUserId = null)
        {
            await _auctionSettlementService.FinalizeAuctionIfDueAsync(productId);

            var product = await _context.Products
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                throw new NotFoundException("Product not found.");
            }

            if (product.IsAuction != true)
            {
                throw new BadRequestException("This product is not an auction listing.");
            }

            var activeBids = product.Bids
                .Where(b => b.IsRetracted != true)
                .ToList();

            var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
            return BuildAuctionStateDto(product, computed, currentUserId);
        }

        public async Task<PagedResponseDto<MyAuctionItemResponseDto>> GetMyAuctionsAsync(int bidderId, string? status, int page, int pageSize)
        {
            page = page <= 0 ? 1 : page;
            pageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 100);

            var userAuctionIds = await _context.Bids
                .Where(b => b.BidderId == bidderId && b.IsRetracted != true)
                .Select(b => b.ProductId)
                .Distinct()
                .ToListAsync();

            foreach (var productId in userAuctionIds)
            {
                await _auctionSettlementService.FinalizeAuctionIfDueAsync(productId);
            }

            var products = await _context.Products
                .Include(p => p.Seller)
                .Include(p => p.Bids)
                    .ThenInclude(b => b.Bidder)
                .Where(p => p.IsAuction == true && p.Bids.Any(b => b.BidderId == bidderId && b.IsRetracted != true))
                .ToListAsync();

            var normalizedStatus = string.IsNullOrWhiteSpace(status)
                ? "participating"
                : status.Trim().ToLowerInvariant();

            var items = products
                .Select(product =>
                {
                    var activeBids = product.Bids.Where(b => b.IsRetracted != true).ToList();
                    var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
                    var userStatus = DetermineUserBidStatus(product, computed, bidderId, hasBid: true);
                    var userMaxBid = activeBids
                        .Where(b => b.BidderId == bidderId)
                        .Select(b => b.MaxAmount ?? b.Amount)
                        .DefaultIfEmpty()
                        .Max();

                    return new MyAuctionItemResponseDto
                    {
                        ProductId = product.Id,
                        ProductTitle = product.Title,
                        ProductSlug = product.Slug,
                        Thumbnail = product.Images?.FirstOrDefault(),
                        CurrentPrice = computed.CurrentPrice,
                        YourMaxBid = userMaxBid > 0 ? Math.Round(userMaxBid, 2, MidpointRounding.AwayFromZero) : null,
                        BidCount = computed.BidCount,
                        AuctionEndTime = EnsureUtc(product.AuctionEndTime),
                        AuctionStatus = product.AuctionStatus ?? "live",
                        UserBidStatus = userStatus,
                        IsWinning = userStatus is "LEADING" or "WINNING",
                        SellerName = product.Seller?.Username ?? "Unknown"
                    };
                })
                .Where(item => normalizedStatus switch
                {
                    "leading" => item.UserBidStatus == "LEADING",
                    "won" => item.UserBidStatus == "WINNING",
                    "lost" => item.UserBidStatus == "LOST",
                    _ => item.UserBidStatus is "LEADING" or "OUTBID"
                })
                .OrderBy(item => item.UserBidStatus is "WINNING" or "LOST" ? DateTime.MaxValue : item.AuctionEndTime ?? DateTime.MaxValue)
                .ThenByDescending(item => item.AuctionEndTime)
                .ToList();

            var pagedItems = items
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return new PagedResponseDto<MyAuctionItemResponseDto>
            {
                Items = pagedItems,
                TotalItems = items.Count,
                Page = page,
                PageSize = pageSize
            };
        }

        private static void ApplyAuctionState(Product product, List<Bid> activeBids, AuctionPricingEngine.AuctionComputation computed, DateTime now)
        {
            product.CurrentBidPrice = computed.CurrentPrice;
            product.WinningBidderId = computed.TopBidderId;

            if (string.IsNullOrWhiteSpace(product.AuctionStatus))
            {
                product.AuctionStatus = "live";
            }

            if (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now && product.AuctionStatus == "live")
            {
                product.AuctionStatus = computed.ReserveMet && computed.TopBidderId.HasValue ? "ended" : "reserve_not_met";
                product.EndedAt = now;
            }

            foreach (var bid in activeBids)
            {
                bid.IsWinning = false;
            }

            if (computed.WinningBid != null)
            {
                computed.WinningBid.IsWinning = true;
                computed.WinningBid.Amount = computed.CurrentPrice;
            }
        }

        private AuctionStateResponseDto BuildAuctionStateDto(Product product, AuctionPricingEngine.AuctionComputation computed, int? currentUserId)
        {
            var hasBid = currentUserId.HasValue && product.Bids.Any(b => b.BidderId == currentUserId.Value && b.IsRetracted != true);

            return new AuctionStateResponseDto
            {
                ProductId = product.Id,
                CurrentPrice = computed.CurrentPrice,
                MinimumNextBid = computed.MinimumNextBid,
                ReservePrice = product.ReservePrice,
                ReserveMet = computed.ReserveMet,
                BuyItNowAvailable = computed.BuyItNowAvailable,
                BuyItNowPrice = product.BuyItNowPrice,
                BidCount = computed.BidCount,
                WinningBidderId = computed.TopBidderId,
                AuctionStartTime = EnsureUtc(product.AuctionStartTime),
                AuctionEndTime = EnsureUtc(product.AuctionEndTime),
                AuctionStatus = ResolveAuctionDisplayStatus(product, computed.TopBidderId, DateTime.UtcNow),
                IsCurrentUserWinning = currentUserId.HasValue && computed.TopBidderId.HasValue && currentUserId.Value == computed.TopBidderId.Value,
                UserBidStatus = DetermineUserBidStatus(product, computed, currentUserId, hasBid)
            };
        }

        private static string DetermineUserBidStatus(Product product, AuctionPricingEngine.AuctionComputation computed, int? currentUserId, bool hasBid)
        {
            if (!currentUserId.HasValue || !hasBid)
            {
                return "NONE";
            }

            var normalizedAuctionStatus = NormalizeAuctionStatus(product.AuctionStatus);
            var isClosed = IsClosedAuctionStatus(normalizedAuctionStatus)
                || (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= DateTime.UtcNow);

            if (isClosed)
            {
                if (computed.TopBidderId.HasValue && computed.TopBidderId.Value == currentUserId.Value && computed.ReserveMet)
                {
                    return "WINNING";
                }

                return "LOST";
            }

            return computed.TopBidderId.HasValue && computed.TopBidderId.Value == currentUserId.Value
                ? "LEADING"
                : "OUTBID";
        }

        private static string NormalizeAuctionStatus(string? status)
        {
            return string.IsNullOrWhiteSpace(status) ? "live" : status.Trim().ToLowerInvariant();
        }

        private static bool IsClosedAuctionStatus(string normalizedStatus)
        {
            return normalizedStatus is "sold" or "ended" or "reserve_not_met" or "cancelled";
        }

        private static DateTime? EnsureUtc(DateTime? value)
        {
            if (!value.HasValue)
            {
                return null;
            }

            return DateTime.SpecifyKind(value.Value, DateTimeKind.Utc);
        }

        private static string ResolveAuctionDisplayStatus(Product product, int? winningBidderId, DateTime now)
        {
            var normalizedStatus = NormalizeAuctionStatus(product.AuctionStatus);
            if (normalizedStatus == "cancelled")
            {
                return "cancelled";
            }

            if (product.AuctionStartTime.HasValue && product.AuctionStartTime.Value > now)
            {
                return "scheduled";
            }

            var hasEndedByTime = product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now;
            var isClosed = IsClosedAuctionStatus(normalizedStatus) || hasEndedByTime;
            if (!isClosed)
            {
                return "live";
            }

            if (normalizedStatus == "sold" || product.WinningBidderId.HasValue || winningBidderId.HasValue)
            {
                return "sold";
            }

            return "ended";
        }

        private static BidResponseDto MapToResponse(Bid bid, int? currentUserId, bool includeMaxForOwner)
        {
            var shouldIncludeMax = includeMaxForOwner && currentUserId.HasValue && currentUserId.Value == bid.BidderId;

            return new BidResponseDto
            {
                Id = bid.Id,
                BidderId = bid.BidderId,
                BidderName = bid.Bidder.Username,
                Amount = bid.Amount,
                MaxAmount = shouldIncludeMax ? Math.Round(bid.MaxAmount ?? bid.Amount, 2, MidpointRounding.AwayFromZero) : null,
                BidTime = bid.BidTime ?? DateTime.UtcNow,
                IsWinning = bid.IsWinning ?? false,
                IsRetracted = bid.IsRetracted ?? false
            };
        }
    }
}
