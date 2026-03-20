using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly EbayDbContext _context;
        private readonly ICategoryService _categoryService;

        public ProductService(EbayDbContext context, ICategoryService categoryService)
        {
            _context = context;
            _categoryService = categoryService;
        }

        public async Task<LandingPageResponseDto> GetLandingPageProductsAsync()
        {
            var baseQuery = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Where(p => p.IsActive == true && p.Status == "active");

            var latest = await baseQuery
                .OrderByDescending(p => p.CreatedAt)
                .Take(10)
                .ToListAsync();

            var deals = await baseQuery
                .Where(p => p.OriginalPrice != null && p.OriginalPrice > p.Price)
                .OrderByDescending(p => p.OriginalPrice != null ? (double)(p.OriginalPrice.Value - p.Price) / (double)p.OriginalPrice.Value : 0)
                .Take(13)
                .ToListAsync();

            var trending = await baseQuery
                .OrderByDescending(p => p.ViewCount)
                .Take(10)
                .ToListAsync();

            var bannerEntities = await _context.Banners
                .Where(b => b.IsActive == true)
                .OrderBy(b => b.DisplayOrder ?? 0)
                .ToListAsync();

            var banners = bannerEntities.Select(b => new BannerResponseDto
            {
                Id = b.Id,
                Title = b.Title,
                Description = b.Description,
                CtaText = b.CtaText,
                ImageUrl = b.ImageUrl,
                LinkUrl = b.LinkUrl,
                BgColor = b.BgColor,
                TextColor = b.TextColor,
                Type = b.Type ?? "single",
                Items = b.Items != null ? System.Text.Json.JsonSerializer.Deserialize<List<BannerItemDto>>(b.Items, new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web)) : null
            }).ToList();

            return new LandingPageResponseDto
            {
                Banners = banners,
                LatestProducts = latest.Select(p => MapToDto(p)).ToList(),
                BestDeals = deals.Select(p => MapToDto(p)).ToList(),
                TrendingProducts = trending.Select(p => MapToDto(p)).ToList()
            };
        }

        public async Task<PagedResponseDto<ProductResponseDto>> SearchProductsAsync(ProductSearchRequestDto request)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Where(p => p.IsActive == true && p.Status == "active")
                .AsQueryable();

            // Filters
            if (!string.IsNullOrWhiteSpace(request.Keyword))
            {
                var kw = request.Keyword.ToLower();
                query = query.Where(p => p.Title.ToLower().Contains(kw) || p.Description.ToLower().Contains(kw));
            }

            if (request.CategoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == request.CategoryId.Value);
            }

            if (request.CategorySlugs != null && request.CategorySlugs.Any())
            {
                var expandedSlugs = new HashSet<string>();
                var navGroups = await _categoryService.GetNavGroupsAsync();
                var categoriesTree = await _categoryService.GetCategoryTreeAsync();
                
                // Helper to flatten categories
                List<CategoryResponseDto> Flatten(List<CategoryResponseDto> tree)
                {
                    var res = new List<CategoryResponseDto>();
                    foreach (var c in tree)
                    {
                        res.Add(c);
                        if (c.SubCategories?.Any() == true) res.AddRange(Flatten(c.SubCategories));
                    }
                    return res;
                }
                var allFlattened = Flatten(categoriesTree);

                foreach (var slug in request.CategorySlugs)
                {
                    // If it's a NavGroup (e.g., "electronics"), add all its categories
                    var group = navGroups.FirstOrDefault(g => g.Slug == slug);
                    if (group != null)
                    {
                        var groupFlat = Flatten(group.Categories);
                        foreach (var c in groupFlat) expandedSlugs.Add(c.Slug);
                        continue;
                    }

                    // Otherwise, find the category and add it + its subcategories
                    var cat = allFlattened.FirstOrDefault(c => c.Slug == slug);
                    if (cat != null)
                    {
                        var catFlat = Flatten(new List<CategoryResponseDto> { cat });
                        foreach (var c in catFlat) expandedSlugs.Add(c.Slug);
                    }
                    else
                    {
                        expandedSlugs.Add(slug); // Fallback
                    }
                }

                query = query.Where(p => p.Category != null && expandedSlugs.Contains(p.Category.Slug));
            }

            if (!string.IsNullOrWhiteSpace(request.Condition))
            {
                query = query.Where(p => p.Condition == request.Condition);
            }

            if (request.MinPrice.HasValue)
            {
                query = query.Where(p => p.Price >= request.MinPrice.Value);
            }

            if (request.MaxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= request.MaxPrice.Value);
            }

            // Sorting
            query = request.SortBy switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "popular" => query.OrderByDescending(p => p.ViewCount),
                _ => query.OrderByDescending(p => p.CreatedAt) // newest
            };

            var totalItems = await query.CountAsync();
            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return new PagedResponseDto<ProductResponseDto>
            {
                Items = items,
                TotalItems = totalItems,
                Page = request.Page,
                PageSize = request.PageSize
            };
        }

        public async Task<ProductResponseDto> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Include(p => p.Wishlists)
                .Include(p => p.WatchlistItems)
                .Include(p => p.CartItems)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

            // Increase view count
            product.ViewCount = (product.ViewCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        public async Task<ProductResponseDto> GetProductBySlugAsync(string slug)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Include(p => p.Wishlists)
                .Include(p => p.WatchlistItems)
                .Include(p => p.CartItems)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

            product.ViewCount = (product.ViewCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        public async Task<List<ProductResponseDto>> GetRelatedProductsAsync(int productId, int count = 10)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return new List<ProductResponseDto>();

            var related = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Where(p => p.Id != productId && p.IsActive == true && p.Status == "active" && p.CategoryId == product.CategoryId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return related;
        }

        public async Task<List<ProductResponseDto>> GetRecommendationsAsync(int productId, List<int> excludeIds, int limit = 6)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null) return [];

            var minPrice = product.Price * 0.5m;
            var maxPrice = product.Price * 1.5m;

            var recs = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Where(p =>
                    !excludeIds.Contains(p.Id)
                    && p.IsActive == true
                    && p.Status == "active"
                    && p.CategoryId == product.CategoryId
                    && p.Price >= minPrice
                    && p.Price <= maxPrice)
                .OrderByDescending(p => p.ViewCount)
                .Take(limit)
                .Select(p => MapToDto(p))
                .ToListAsync();

            // Fallback: if not enough in same category, widen to any category in price range
            if (recs.Count < limit)
            {
                var ids = recs.Select(r => r.Id).Concat(excludeIds).ToList();
                var extra = await _context.Products
                    .Include(p => p.Category).Include(p => p.Seller)
                    .Include(p => p.Reviews).Include(p => p.Bids).Include(p => p.OrderItems)
                    .Where(p => !ids.Contains(p.Id) && p.IsActive == true && p.Status == "active"
                                && p.Price >= minPrice && p.Price <= maxPrice)
                    .OrderByDescending(p => p.ViewCount)
                    .Take(limit - recs.Count)
                    .Select(p => MapToDto(p))
                    .ToListAsync();
                recs.AddRange(extra);
            }

            return recs;
        }


        private static ProductResponseDto MapToDto(Product p) => new ProductResponseDto
        {
            Id = p.Id,
            Title = p.Title,
            Slug = p.Slug,
            Description = p.Description,
            Price = p.Price,
            DiscountPrice = p.OriginalPrice,
            Thumbnail = p.Images != null && p.Images.Count > 0 ? p.Images[0] : null,
            Condition = p.Condition ?? "new",
            Status = p.Status ?? "active",
            Stock = p.Stock ?? 0,
            ShippingFee = p.ShippingFee ?? 0,
            ViewCount = p.ViewCount ?? 0,
            CategoryId = p.CategoryId ?? 0,
            CategoryName = p.Category?.Name ?? "General",
            SellerId = p.SellerId,
            SellerName = p.Seller?.Username ?? "Unknown",
            IsAuction = p.IsAuction ?? false,
            AuctionEndTime = p.AuctionEndTime,
            CurrentBid = p.Bids != null && p.Bids.Any() ? p.Bids.Max(b => b.Amount) : p.StartingBid,
            BidCount = p.Bids?.Count ?? 0,
            SoldCount = p.OrderItems?.Sum(oi => oi.Quantity) ?? 0,
            CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
            Rating = p.Reviews != null && p.Reviews.Any() ? (decimal)p.Reviews.Average(r => r.Rating) : 5.0m,
            ReviewCount = p.Reviews?.Count ?? 0,
            SavedCount = (p.Wishlists?.Count ?? 0) + (p.WatchlistItems?.Count ?? 0),
            InCartCount = p.CartItems?.Count ?? 0
        };
    }
}
