using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class WatchlistController : ControllerBase
    {
        private readonly EbayDbContext _context;

        public WatchlistController(EbayDbContext context)
        {
            _context = context;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<SavedItemResponseDto>>>> GetWatchlist()
        {
            var userId = GetUserId();
            var watchlistItems = await _context.WatchlistItems
                .Where(item => item.UserId == userId)
                .Include(item => item.Product)
                    .ThenInclude(product => product.Bids)
                .Include(item => item.Product)
                    .ThenInclude(product => product.Seller)
                .OrderByDescending(item => item.CreatedAt)
                .ToListAsync();

            var items = watchlistItems.Select(item =>
            {
                var product = item.Product;
                var activeBids = product.Bids
                    .Where(bid => bid.IsRetracted != true)
                    .ToList();

                var computed = product.IsAuction == true
                    ? AuctionPricingEngine.ComputeAuctionState(product, activeBids)
                    : null;

                var userHasBid = activeBids.Any(bid => bid.BidderId == userId);

                return new SavedItemResponseDto
                {
                    ProductId = item.ProductId,
                    ProductName = product.Title,
                    ProductSlug = product.Slug ?? string.Empty,
                    ProductImage = product.Images != null && product.Images.Count > 0 ? product.Images[0] : null,
                    Price = product.Price,
                    ShippingFee = product.ShippingFee ?? 0,
                    SellerName = product.Seller?.Username,
                    SavedAt = item.CreatedAt,
                    IsAuction = product.IsAuction == true,
                    CurrentPrice = computed?.CurrentPrice ?? product.Price,
                    BidCount = activeBids.Count,
                    AuctionEndTime = product.AuctionEndTime,
                    AuctionStatus = product.AuctionStatus ?? (product.IsAuction == true ? "live" : null),
                    UserBidStatus = product.IsAuction == true
                        ? DetermineUserBidStatus(product, computed, userId, userHasBid)
                        : "NONE"
                };
            }).ToList();

            return Ok(ApiResponse<List<SavedItemResponseDto>>.SuccessResponse(items));
        }

        [HttpPost("{productId}")]
        public async Task<ActionResult<ApiResponse<object>>> Toggle(int productId)
        {
            var userId = GetUserId();
            var existing = await _context.WatchlistItems
                .FirstOrDefaultAsync(item => item.UserId == userId && item.ProductId == productId);

            if (existing != null)
            {
                _context.WatchlistItems.Remove(existing);
                await _context.SaveChangesAsync();
                return Ok(ApiResponse<object>.SuccessResponse(new { watching = false }, "Removed from watchlist."));
            }

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return NotFound(ApiResponse<object>.ErrorResponse("Product not found."));
            }

            await _context.WatchlistItems.AddAsync(new WatchlistItem
            {
                UserId = userId,
                ProductId = productId,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
            return Ok(ApiResponse<object>.SuccessResponse(new { watching = true }, "Added to watchlist."));
        }

        private static string DetermineUserBidStatus(
            Product product,
            AuctionPricingEngine.AuctionComputation? computed,
            int currentUserId,
            bool hasBid)
        {
            if (product.IsAuction != true || !hasBid || computed == null)
            {
                return "NONE";
            }

            var normalizedStatus = (product.AuctionStatus ?? "live").ToLowerInvariant();
            var isClosed = normalizedStatus is "sold" or "ended" or "reserve_not_met" or "cancelled";

            if (isClosed || (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= DateTime.UtcNow))
            {
                return computed.TopBidderId == currentUserId && normalizedStatus == "sold"
                    ? "WINNING"
                    : "LOST";
            }

            return computed.TopBidderId == currentUserId ? "LEADING" : "OUTBID";
        }
    }
}
