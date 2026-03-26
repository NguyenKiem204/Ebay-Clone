using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace ebay.Services.Implementations
{
    public class BidService : IBidService
    {
        private readonly EbayDbContext _context;
        private readonly IAuctionSettlementService _auctionSettlementService;

        public BidService(EbayDbContext context, IAuctionSettlementService auctionSettlementService)
        {
            _context = context;
            _auctionSettlementService = auctionSettlementService;
        }

        public async Task<BidPlacementResponseDto> PlaceBidAsync(int productId, int bidderId, decimal amount)
        {
            if (amount <= 0)
            {
                throw new BadRequestException("Giá bid phải lớn hơn 0");
            }

            await _auctionSettlementService.FinalizeAuctionIfDueAsync(productId);

            var now = DateTime.UtcNow;
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable);

            var product = await _context.Products
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.IsAuction != true)
                throw new BadRequestException("Sản phẩm này không phải dạng đấu giá");

            if (product.IsActive != true || !string.Equals(product.Status, "active", StringComparison.OrdinalIgnoreCase))
                throw new BadRequestException("Listing này hiện không còn mở để đấu giá");

            if ((product.Stock ?? 0) <= 0)
                throw new BadRequestException("Sản phẩm không còn khả dụng để đấu giá");

            if (product.SellerId == bidderId)
                throw new BadRequestException("Bạn không thể tự bid sản phẩm của chính mình");

            var normalizedStatus = (product.AuctionStatus ?? "live").ToLowerInvariant();
            if (normalizedStatus is "ended" or "sold" or "cancelled" or "reserve_not_met")
                throw new BadRequestException("Phiên đấu giá đã đóng");

            if (product.AuctionStartTime.HasValue && product.AuctionStartTime.Value > now)
                throw new BadRequestException("Phiên đấu giá chưa bắt đầu");

            if (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now)
                throw new BadRequestException("Phiên đấu giá đã kết thúc");

            var activeBids = product.Bids
                .Where(b => b.IsRetracted != true)
                .ToList();

            var beforeState = AuctionPricingEngine.ComputeAuctionState(product, activeBids);

            if (beforeState.TopBidderId.HasValue && beforeState.TopBidderId.Value == bidderId)
            {
                if (amount <= beforeState.TopBidderMaxAmount)
                    throw new BadRequestException($"Bạn đang dẫn đầu. Max bid mới phải lớn hơn {beforeState.TopBidderMaxAmount:N2}");
            }
            else if (amount < beforeState.MinimumNextBid)
            {
                throw new BadRequestException($"Max bid tối thiểu phải từ {beforeState.MinimumNextBid:N2}");
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

            // Snapshot visible current price at the time this bid action is placed.
            bid.Amount = computed.CurrentPrice;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            // Fetch with bidder name for response
            var savedBid = await _context.Bids
                .Include(b => b.Bidder)
                .FirstAsync(b => b.Id == bid.Id);

            return new BidPlacementResponseDto
            {
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
                throw new NotFoundException("Sản phẩm không tồn tại");

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
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.IsAuction != true)
                throw new BadRequestException("Sản phẩm này không phải dạng đấu giá");

            var activeBids = product.Bids
                .Where(b => b.IsRetracted != true)
                .ToList();

            var computed = AuctionPricingEngine.ComputeAuctionState(product, activeBids);
            return BuildAuctionStateDto(product, computed, currentUserId);
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
                AuctionEndTime = product.AuctionEndTime,
                AuctionStatus = product.AuctionStatus ?? "live",
                IsCurrentUserWinning = currentUserId.HasValue && computed.TopBidderId.HasValue && currentUserId.Value == computed.TopBidderId.Value
            };
        }

        private BidResponseDto MapToResponse(Bid bid, int? currentUserId, bool includeMaxForOwner)
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
