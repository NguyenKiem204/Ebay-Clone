using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class SellerService : ISellerService
    {
        private readonly EbayDbContext _context;

        public SellerService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<SellerProfileDto> GetSellerProfileAsync(int sellerId)
        {
            var seller = await _context.Users
                .Include(u => u.SellerFeedback)
                .Include(u => u.Store)
                .FirstOrDefaultAsync(u => u.Id == sellerId)
                ?? throw new KeyNotFoundException($"Seller {sellerId} not found");

            // Count total reviews across all seller's products
            var totalReviews = await _context.Reviews
                .Where(r => r.Product.SellerId == sellerId)
                .CountAsync();

            // Count total items sold
            var itemsSold = await _context.OrderItems
                .Where(oi => oi.Product.SellerId == sellerId)
                .SumAsync(oi => oi.Quantity);

            // Calculate positive percentage from SellerFeedback or reviews
            decimal positivePercent = 0;
            if (seller.SellerFeedback != null && seller.SellerFeedback.TotalReviews > 0)
            {
                var total = seller.SellerFeedback.TotalReviews.Value;
                var positive = seller.SellerFeedback.PositiveCount ?? 0;
                positivePercent = total > 0 ? Math.Round((decimal)positive / total * 100, 1) : 0;
            }
            else if (totalReviews > 0)
            {
                var positiveCount = await _context.Reviews
                    .Where(r => r.Product.SellerId == sellerId && r.Rating >= 4)
                    .CountAsync();
                positivePercent = Math.Round((decimal)positiveCount / totalReviews * 100, 1);
            }

            // Calculate detailed ratings from actual reviews
            var ratings = await _context.Reviews
                .Where(r => r.Product.SellerId == sellerId)
                .GroupBy(r => 1)
                .Select(g => new
                {
                    Avg = g.Average(r => r.Rating),
                    Count = g.Count()
                })
                .FirstOrDefaultAsync();

            var avgRating = ratings?.Avg ?? 5.0;

            return new SellerProfileDto
            {
                Id = seller.Id,
                Username = seller.Username,
                AvatarUrl = seller.AvatarUrl,
                PositivePercent = positivePercent,
                TotalReviews = totalReviews,
                ItemsSold = itemsSold,
                JoinedDate = seller.CreatedAt?.ToString("MMM yyyy") ?? "Unknown",
                StoreName = seller.Store?.StoreName,
                StoreSlug = seller.Store?.Slug,
                DetailedRatings = new SellerDetailedRatingsDto
                {
                    // Simulate sub-ratings from overall avg (in reality these would be separate fields)
                    AccurateDescription = Math.Round((decimal)Math.Min(avgRating * 0.95, 5.0), 1),
                    ReasonableShippingCost = Math.Round((decimal)Math.Min(avgRating * 1.0, 5.0), 1),
                    ShippingSpeed = Math.Round((decimal)Math.Min(avgRating * 1.0, 5.0), 1),
                    Communication = Math.Round((decimal)Math.Min(avgRating * 0.98, 5.0), 1)
                }
            };
        }

        public async Task<PagedResponseDto<SellerReviewDto>> GetSellerReviewsAsync(int sellerId, int? productId, int page, int pageSize)
        {
            var query = _context.Reviews
                .Include(r => r.Reviewer)
                .Include(r => r.Product)
                .Where(r => r.Product.SellerId == sellerId);

            if (productId.HasValue)
            {
                query = query.Where(r => r.ProductId == productId.Value);
            }

            var totalCount = await query.CountAsync();

            var reviews = await query
                .OrderByDescending(r => r.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new SellerReviewDto
                {
                    Id = r.Id,
                    ReviewerName = MaskUsername(r.Reviewer.Username),
                    ReviewerTotalReviews = r.Reviewer.Reviews.Count,
                    Rating = r.Rating,
                    Comment = r.Comment,
                    Title = r.Title,
                    TimeAgo = GetTimeAgo(r.CreatedAt),
                    IsVerifiedPurchase = r.IsVerifiedPurchase ?? false,
                    ProductTitle = r.Product.Title,
                    ProductId = r.ProductId
                })
                .ToListAsync();

            return new PagedResponseDto<SellerReviewDto>
            {
                Items = reviews,
                TotalItems = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        private static string MaskUsername(string username)
        {
            if (string.IsNullOrEmpty(username) || username.Length <= 2)
                return username;
            return $"{username[0]}***{username[^1]}";
        }

        private static string GetTimeAgo(DateTime? date)
        {
            if (!date.HasValue) return "Unknown";
            var diff = DateTime.UtcNow - date.Value;
            if (diff.TotalDays < 30) return "Past month";
            if (diff.TotalDays < 180) return "Past 6 months";
            if (diff.TotalDays < 365) return "Past year";
            return $"{(int)(diff.TotalDays / 365)} years ago";
        }
    }
}
