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
                .Where(p => p.IsActive == true && p.Status == "active");

            var latest = await baseQuery
                .OrderByDescending(p => p.CreatedAt)
                .Take(10)
                .Select(p => MapToDto(p))
                .ToListAsync();

            var deals = await baseQuery
                .OrderBy(p => p.Price)
                .Take(10)
                .Select(p => MapToDto(p))
                .ToListAsync();

            var trending = await baseQuery
                .OrderByDescending(p => p.ViewCount)
                .Take(10)
                .Select(p => MapToDto(p))
                .ToListAsync();

            return new LandingPageResponseDto
            {
                LatestProducts = latest,
                BestDeals = deals,
                TrendingProducts = trending
            };
        }

        public async Task<PagedResponseDto<ProductResponseDto>> SearchProductsAsync(ProductSearchRequestDto request)
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
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
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

            product.ViewCount = (product.ViewCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            return MapToDto(product);
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
            CreatedAt = p.CreatedAt ?? DateTime.UtcNow,
            Rating = 5.0m, // Placeholder
            ReviewCount = 0 // Placeholder
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
