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

        public ProductService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<LandingPageResponseDto> GetLandingPageProductsAsync()
        {
            var baseQuery = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews) // Include reviews for rating calculation
                .Include(p => p.Bids)
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

            if (!string.IsNullOrWhiteSpace(request.CategorySlug))
            {
                query = query.Where(p => p.Category != null && p.Category.Slug == request.CategorySlug);
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
                .Where(p => p.Id != productId && p.IsActive == true && p.Status == "active" && p.CategoryId == product.CategoryId)
                .OrderByDescending(p => p.CreatedAt)
                .Take(count)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return related;
        }

        public async Task<List<CategoryResponseDto>> GetCategoriesAsync()
        {
            var allCategories = await _context.Categories
                .Where(c => c.IsActive == true)
                .OrderBy(c => c.DisplayOrder)
                .ToListAsync();

            // Build hierarchy
            var rootCategories = allCategories
                .Where(c => c.ParentId == null)
                .Select(c => MapCategoryToDto(c, allCategories))
                .ToList();

            return rootCategories;
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
            SellerName = p.Seller?.Username ?? "Unknown",
            IsAuction = p.IsAuction ?? false,
            AuctionEndTime = p.AuctionEndTime,
            CurrentBid = p.Bids != null && p.Bids.Any() ? p.Bids.Max(b => b.Amount) : p.StartingBid,
            BidCount = p.Bids?.Count ?? 0,
            CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
            Rating = p.Reviews != null && p.Reviews.Any() ? (decimal)p.Reviews.Average(r => r.Rating) : 5.0m,
            ReviewCount = p.Reviews?.Count ?? 0
        };

        private static CategoryResponseDto MapCategoryToDto(Category c, List<Category> all) => new CategoryResponseDto
        {
            Id = c.Id,
            Name = c.Name,
            Slug = c.Slug,
            IconUrl = c.IconUrl,
            ImageUrl = c.ImageUrl,
            DisplayOrder = c.DisplayOrder ?? 0,
            ParentId = c.ParentId,
            SubCategories = all
                .Where(sub => sub.ParentId == c.Id)
                .Select(sub => MapCategoryToDto(sub, all))
                .ToList()
        };
    }
}
