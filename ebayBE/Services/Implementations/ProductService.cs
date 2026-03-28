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
        private readonly IFileService _fileService;
        private readonly ILogger<ProductService> _logger;
        private readonly ICategoryService _categoryService;

        public ProductService(EbayDbContext context, IFileService fileService, ILogger<ProductService> logger, ICategoryService categoryService)
        {
            _context = context;
            _fileService = fileService;
            _logger = logger;
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
                .Where(p => (p.IsActive ?? true) && p.Status == "active" && (p.Stock ?? 0) > 0)
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

            if (request.IsAuction.HasValue)
            {
                query = query.Where(p => (p.IsAuction ?? false) == request.IsAuction.Value);
            }

            if (request.EndingSoon == true)
            {
                query = query.Where(p => p.IsAuction == true && p.AuctionEndTime.HasValue && p.AuctionEndTime > DateTime.UtcNow);
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
            var normalizedSortBy = string.IsNullOrWhiteSpace(request.SortBy)
                ? "relevance"
                : request.SortBy.Trim().ToLowerInvariant();

            query = normalizedSortBy switch
            {
                "relevance" => ApplyRelevanceSort(query, request.Keyword),
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "ending_soonest" => query
                    .OrderBy(p => p.AuctionEndTime ?? DateTime.MaxValue)
                    .ThenByDescending(p => p.CreatedAt),
                "most_bids" => query
                    .OrderByDescending(p => p.Bids.Count(b => b.IsRetracted != true))
                    .ThenBy(p => p.AuctionEndTime ?? DateTime.MaxValue),
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

        public async Task<List<ProductResponseDto>> GetActiveAuctionsAsync(int limit = 4)
        {
            var now = DateTime.UtcNow;
            var auctions = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.OrderItems)
                .Where(p =>
                    p.IsAuction == true &&
                    p.IsActive == true &&
                    p.Status == "active" &&
                    p.AuctionEndTime.HasValue &&
                    p.AuctionEndTime > now &&
                    (p.AuctionStatus == null || p.AuctionStatus == "live"))
                .OrderBy(p => p.AuctionEndTime)
                .ThenByDescending(p => p.Bids.Count(b => b.IsRetracted != true))
                .Take(limit)
                .ToListAsync();

            return auctions.Select(MapToDto).ToList();
        }

        public async Task<ProductResponseDto> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.Coupons)
                .Include(p => p.OrderItems)
                .Include(p => p.Wishlists)
                .Include(p => p.WatchlistItems)
                .Include(p => p.CartItems)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

            // Increase view count
            product.ViewCount = (product.ViewCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            var dto = MapToDto(product);
            dto.ActiveCoupons = await GetActiveCouponsForProductAsync(product);
            return dto;
        }

        public async Task<ProductResponseDto> GetProductBySlugAsync(string slug)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Include(p => p.Coupons)
                .Include(p => p.OrderItems)
                .Include(p => p.Wishlists)
                .Include(p => p.WatchlistItems)
                .Include(p => p.CartItems)
                .FirstOrDefaultAsync(p => p.Slug == slug);

            if (product == null) throw new NotFoundException("Sản phẩm không tồn tại");

            product.ViewCount = (product.ViewCount ?? 0) + 1;
            await _context.SaveChangesAsync();

            var dto = MapToDto(product);
            dto.ActiveCoupons = await GetActiveCouponsForProductAsync(product);
            return dto;
        }

        private async Task<List<CouponResponseDto>> GetActiveCouponsForProductAsync(Product product)
        {
            var now = DateTime.UtcNow;
            var coupons = await _context.Coupons
                .Where(c => c.IsActive == true && 
                           c.StartDate <= now && 
                           c.EndDate >= now &&
                           c.StoreId == product.StoreId)
                .Where(c => c.ApplicableTo == "all" || 
                           (c.ApplicableTo == "category" && c.CategoryId == product.CategoryId) ||
                           (c.ApplicableTo == "product" && c.Products.Any(p => p.Id == product.Id)))
                .ToListAsync();

            return coupons.Select(c => new CouponResponseDto
            {
                Id = c.Id,
                Code = c.Code,
                Description = c.Description,
                DiscountType = c.DiscountType,
                DiscountValue = c.DiscountValue,
                MinOrderAmount = c.MinOrderAmount,
                EndDate = c.EndDate,
                ApplicableTo = c.ApplicableTo
            }).ToList();
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
        .Include(p => p.Coupons)
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
    if (product == null) return new List<ProductResponseDto>();

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

    // fallback nếu chưa đủ
    if (recs.Count < limit)
    {
        var ids = recs.Select(r => r.Id).Concat(excludeIds).ToList();

        var extra = await _context.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.Reviews)
            .Include(p => p.Bids)
            .Include(p => p.OrderItems)
            .Where(p =>
                !ids.Contains(p.Id)
                && p.IsActive == true
                && p.Status == "active"
                && p.Price >= minPrice
                && p.Price <= maxPrice)
            .OrderByDescending(p => p.ViewCount)
            .Take(limit - recs.Count)
            .Select(p => MapToDto(p))
            .ToListAsync();

        recs.AddRange(extra);
    }

    return recs;
}

        public async Task<List<CategoryResponseDto>> GetCategoriesAsync()
{
    var allCategories = await _context.Categories
        .Where(c => c.IsActive == true)
        .OrderBy(c => c.DisplayOrder)
        .ToListAsync();

    var rootCategories = allCategories
        .Where(c => c.ParentId == null)
        .Select(c => MapCategoryToDto(c, allCategories))
        .ToList();

    return rootCategories;
}

        // ========== SELLER PRODUCT MANAGEMENT ==========

        public async Task<PagedResponseDto<ProductResponseDto>> GetSellerProductsAsync(int sellerId, SellerProductSearchRequest request)
{
    var query = _context.Products
        .Include(p => p.Category)
        .Include(p => p.Seller)
        .Include(p => p.Reviews)
        .Include(p => p.Bids)
        .Where(p => p.SellerId == sellerId)
        .AsQueryable();

    if (!string.IsNullOrWhiteSpace(request.Status))
    {
        var status = request.Status.ToLower();
        query = status switch
        {
            "active" => query.Where(p => p.Status == "active" && (p.Stock ?? 0) > 0 && (p.IsActive ?? true)),
            "draft" => query.Where(p => p.Status == "draft"),
            "out_of_stock" => query.Where(p => p.Status == "active" && (p.Stock ?? 0) == 0),
            "ended" => query.Where(p => p.Status == "ended"),
            _ => query
        };
    }

    if (!string.IsNullOrWhiteSpace(request.Keyword))
    {
        var kw = request.Keyword.ToLower();
        query = query.Where(p => p.Title.ToLower().Contains(kw));
    }

    var totalItems = await query.CountAsync();

    var items = await query
        .OrderByDescending(p => p.CreatedAt)
        .Skip((request.Page - 1) * request.PageSize)
        .Take(request.PageSize)
        .ToListAsync();

    return new PagedResponseDto<ProductResponseDto>
    {
        Items = items.Select(p => MapToDto(p)).ToList(),
        TotalItems = totalItems,
        Page = request.Page,
        PageSize = request.PageSize
    };
}

        public async Task<ProductResponseDto> CreateProductAsync(int sellerId, CreateProductRequest request)
        {
            _logger.LogInformation("Creating product for seller {SellerId}: {Title}", sellerId, request.Title);
            
            // Check listing limits
            var user = await _context.Users.FindAsync(sellerId);
            if (user != null && user.Role.ToLower() == "buyer")
            {
                var currentCount = await _context.Products.CountAsync(p => p.SellerId == sellerId);
                if (currentCount >= 10)
                {
                    _logger.LogWarning("Buyer {SellerId} reached listing limit (10)", sellerId);
                    throw new BadRequestException("Tài khoản Buyer chỉ được đăng tối đa 10 sản phẩm. Vui lòng nâng cấp lên Seller để đăng không giới hạn.");
                }
            }

            if (string.IsNullOrWhiteSpace(request.Title))
                throw new BadRequestException("Tiêu đề sản phẩm không được để trống");

            if (!request.IsAuction && request.Price <= 0)
                throw new BadRequestException("Giá sản phẩm phải lớn hơn 0");

            if (request.IsAuction && (!request.StartingBid.HasValue || request.StartingBid.Value <= 0))
                throw new BadRequestException("Listing đấu giá cần StartingBid hợp lệ");

            var normalizedStock = request.IsAuction ? 1 : request.Stock;
            var normalizedBasePrice = request.IsAuction
                ? (request.StartingBid ?? request.Price)
                : request.Price;

            // Get seller's store
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == sellerId);

            // Map condition to allowed DB values: 'new','used','refurbished','open box','pre-owned'
            string normalizedCondition = (request.Condition ?? "new").ToLower();
            if (normalizedCondition.Contains("new")) normalizedCondition = "new";
            else if (normalizedCondition.Contains("used")) normalizedCondition = "used";
            else if (normalizedCondition.Contains("refurbished")) normalizedCondition = "refurbished";
            else if (normalizedCondition.Contains("open")) normalizedCondition = "open box";
            else if (normalizedCondition.Contains("pre")) normalizedCondition = "pre-owned";
            else normalizedCondition = "new"; // Fallback

            // Upload images
            var imageUrls = new List<string>();
            if (request.Images != null && request.Images.Count > 0)
            {
                _logger.LogInformation("Uploading {Count} images for new product", request.Images.Count);
                foreach (var image in request.Images.Take(24)) // Max 24 images
                {
                    var url = await _fileService.SaveFileAsync(image, "products");
                    imageUrls.Add(url);
                }
            }

            var product = new Product
            {
                Title = request.Title,
                Slug = GenerateSlug(request.Title),
                Description = request.Description,
                Price = normalizedBasePrice,
                OriginalPrice = request.OriginalPrice,
                CategoryId = request.CategoryId,
                SellerId = sellerId,
                StoreId = store?.Id,
                Condition = normalizedCondition,
                Brand = request.Brand,
                Stock = normalizedStock,
                ShippingFee = request.ShippingFee,
                Weight = request.Weight,
                Dimensions = request.Dimensions,
                IsAuction = request.IsAuction,
                StartingBid = request.IsAuction ? normalizedBasePrice : null,
                ReservePrice = request.IsAuction ? request.ReservePrice : null,
                BuyItNowPrice = request.IsAuction ? request.BuyItNowPrice : null,
                CurrentBidPrice = request.IsAuction ? normalizedBasePrice : null,
                WinningBidderId = null,
                AuctionStatus = request.IsAuction ? "live" : null,
                AuctionStartTime = request.IsAuction ? DateTime.UtcNow : null,
                AuctionEndTime = request.IsAuction
                    ? DateTime.UtcNow.AddMinutes(ResolveAuctionDurationMinutes(request.AuctionDurationMinutes, request.AuctionDurationDays))
                    : null,
                EndedAt = null,
                Images = imageUrls,
                IsActive = request.Status?.ToLower() == "draft" ? false : true,
                Status = string.IsNullOrEmpty(request.Status) ? "active" : request.Status.ToLower(),
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully created product {ProductId} with slug {Slug}", product.Id, product.Slug);

            // Reload with includes
            var created = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .FirstAsync(p => p.Id == product.Id);

            return MapToDto(created);
        }

        public async Task<ProductResponseDto> UpdateProductAsync(int sellerId, int productId, UpdateProductRequest request)
        {
            _logger.LogInformation("Updating product {ProductId} for seller {SellerId}", productId, sellerId);
            
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
            {
                _logger.LogWarning("Product {ProductId} not found for update", productId);
                throw new NotFoundException("Sản phẩm không tồn tại");
            }

            if (product.SellerId != sellerId)
            {
                _logger.LogError("Seller {SellerId} attempted to update product {ProductId} owned by {OwnerId}", sellerId, productId, product.SellerId);
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa sản phẩm này");
            }

            var now = DateTime.UtcNow;
            var isAuctionListing = product.IsAuction == true;
            var hasActiveBids = product.Bids.Any(b => b.IsRetracted != true);
            var normalizedAuctionStatus = NormalizeAuctionStatus(product.AuctionStatus);
            var isAuctionClosed = IsAuctionClosedStatus(normalizedAuctionStatus)
                                 || (product.AuctionEndTime.HasValue && product.AuctionEndTime.Value <= now);
            var isAuctionLive = isAuctionListing && !isAuctionClosed;

            if (isAuctionLive)
            {
                if (request.IsAuction.HasValue && request.IsAuction.Value != true)
                {
                    throw new BadRequestException("Không thể chuyển listing đấu giá đang chạy sang fixed-price");
                }

                if (request.AuctionDurationDays.HasValue || request.AuctionDurationMinutes.HasValue)
                {
                    throw new BadRequestException("Không thể thay đổi thời lượng khi phiên đấu giá đang chạy");
                }

                if (request.Stock.HasValue && request.Stock.Value != (product.Stock ?? 1))
                {
                    throw new BadRequestException("Không thể thay đổi số lượng kho khi phiên đấu giá đang chạy");
                }

                if (hasActiveBids && (request.StartingBid.HasValue || request.ReservePrice.HasValue || request.BuyItNowPrice.HasValue))
                {
                    throw new BadRequestException("Không thể thay đổi cấu hình giá đấu giá sau khi đã có bid");
                }
            }

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != product.Title)
            {
                _logger.LogInformation("Updating product title from '{OldTitle}' to '{NewTitle}'", product.Title, request.Title);
                product.Title = request.Title;
                product.Slug = GenerateSlug(request.Title);
            }
            if (request.Description != null) product.Description = request.Description;
            if (request.Price.HasValue)
            {
                if (product.IsAuction == true)
                    throw new BadRequestException("Listing đấu giá không hỗ trợ cập nhật trực tiếp trường Price");

                product.Price = request.Price.Value;
            }
            if (request.OriginalPrice.HasValue) product.OriginalPrice = request.OriginalPrice.Value;
            if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
            if (request.Condition != null) product.Condition = request.Condition;
            if (request.Brand != null) product.Brand = request.Brand;
            if (request.ShippingFee.HasValue) product.ShippingFee = request.ShippingFee.Value;
            if (request.Weight.HasValue) product.Weight = request.Weight.Value;
            if (request.Dimensions != null) product.Dimensions = request.Dimensions;

            if (request.IsAuction.HasValue && request.IsAuction.Value != (product.IsAuction ?? false))
            {
                if (request.IsAuction.Value)
                {
                    var normalizedStartingBid = request.StartingBid ?? product.Price;
                    if (normalizedStartingBid <= 0)
                        throw new BadRequestException("Listing đấu giá cần StartingBid hợp lệ");

                    product.IsAuction = true;
                    product.StartingBid = normalizedStartingBid;
                    product.CurrentBidPrice = normalizedStartingBid;
                    product.Price = normalizedStartingBid;
                    product.ReservePrice = request.ReservePrice;
                    product.BuyItNowPrice = request.BuyItNowPrice;
                    product.AuctionStartTime = now;
                    product.AuctionEndTime = now.AddMinutes(ResolveAuctionDurationMinutes(request.AuctionDurationMinutes, request.AuctionDurationDays));
                    product.AuctionStatus = "live";
                    product.EndedAt = null;
                    product.WinningBidderId = null;
                    product.Stock = 1;
                    product.Status = "active";
                    product.IsActive = true;
                }
                else
                {
                    if (hasActiveBids)
                        throw new BadRequestException("Không thể chuyển listing đấu giá đã có bid sang fixed-price");

                    product.IsAuction = false;
                    product.StartingBid = null;
                    product.ReservePrice = null;
                    product.BuyItNowPrice = null;
                    product.CurrentBidPrice = null;
                    product.WinningBidderId = null;
                    product.AuctionStatus = null;
                    product.AuctionStartTime = null;
                    product.AuctionEndTime = null;
                    product.EndedAt = null;
                }
            }

            if (request.Stock.HasValue)
            {
                if (product.IsAuction == true && request.Stock.Value != 1)
                    throw new BadRequestException("Listing đấu giá chỉ hỗ trợ số lượng kho bằng 1");

                product.Stock = request.Stock.Value;
            }
            else if (product.IsAuction == true && (product.Stock ?? 1) != 1)
            {
                product.Stock = 1;
            }

            if (request.StartingBid.HasValue && product.IsAuction == true)
            {
                if (hasActiveBids)
                    throw new BadRequestException("Không thể cập nhật StartingBid sau khi đã có bid");

                product.StartingBid = request.StartingBid.Value;
                product.CurrentBidPrice = request.StartingBid.Value;
                product.Price = request.StartingBid.Value;
            }

            if (request.ReservePrice.HasValue && product.IsAuction == true)
            {
                if (hasActiveBids)
                    throw new BadRequestException("Không thể cập nhật ReservePrice sau khi đã có bid");

                product.ReservePrice = request.ReservePrice.Value;
            }

            if (request.BuyItNowPrice.HasValue && product.IsAuction == true)
            {
                if (hasActiveBids)
                    throw new BadRequestException("Không thể cập nhật BuyItNowPrice sau khi đã có bid");

                product.BuyItNowPrice = request.BuyItNowPrice.Value;
            }

            if ((request.AuctionDurationDays.HasValue || request.AuctionDurationMinutes.HasValue) && product.IsAuction == true)
            {
                if (isAuctionLive)
                    throw new BadRequestException("Không thể thay đổi thời lượng khi phiên đấu giá đang chạy");

                var auctionStart = product.AuctionStartTime ?? now;
                product.AuctionEndTime = auctionStart.AddMinutes(ResolveAuctionDurationMinutes(request.AuctionDurationMinutes, request.AuctionDurationDays));
            }

            // Handle images: keep existing ones specified, delete the rest, add new ones
            var updatedImages = new List<string>();

            if (request.ExistingImages != null)
            {
                // Delete images that are not in the ExistingImages list
                if (product.Images != null)
                {
                    foreach (var oldImage in product.Images)
                    {
                        if (!request.ExistingImages.Contains(oldImage))
                        {
                            _logger.LogInformation("Deleting removed image: {Url}", oldImage);
                            _fileService.DeleteFile(oldImage);
                        }
                    }
                }
                updatedImages.AddRange(request.ExistingImages);
            }
            else if (product.Images != null)
            {
                // If ExistingImages is not provided, keep all current images
                updatedImages.AddRange(product.Images);
            }

            // Upload new images
            if (request.NewImages != null && request.NewImages.Count > 0)
            {
                _logger.LogInformation("Uploading {Count} new images for product {ProductId}", request.NewImages.Count, productId);
                var remainingSlots = 24 - updatedImages.Count;
                foreach (var newImage in request.NewImages.Take(remainingSlots))
                {
                    var url = await _fileService.SaveFileAsync(newImage, "products");
                    updatedImages.Add(url);
                }
            }

            product.Images = updatedImages;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully updated product {ProductId}", productId);

            return MapToDto(product);
        }

        private static int ResolveAuctionDurationMinutes(int? durationMinutes, int? durationDays)
        {
            if (durationMinutes.HasValue && durationMinutes.Value > 0)
            {
                return durationMinutes.Value;
            }

            if (durationDays.HasValue && durationDays.Value > 0)
            {
                return durationDays.Value * 24 * 60;
            }

            return 7 * 24 * 60;
        }

        public async Task<ProductResponseDto> ToggleProductVisibilityAsync(int sellerId, int productId)
        {
            _logger.LogInformation("Toggling visibility for product {ProductId} by seller {SellerId}", productId, sellerId);
            
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.SellerId != sellerId)
                throw new ForbiddenException("Bạn không có quyền thay đổi trạng thái sản phẩm này");

            product.IsActive = !(product.IsActive ?? true);
            product.Status = (product.IsActive ?? true) ? "active" : "ended";
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            _logger.LogInformation("Product {ProductId} visibility set to {IsActive}, Status to {Status}", productId, product.IsActive, product.Status);

            return MapToDto(product);
        }

        public async Task<bool> DeleteProductAsync(int sellerId, int productId)
        {
            _logger.LogInformation("Deleting product {ProductId} by seller {SellerId}", productId, sellerId);
            
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.SellerId != sellerId)
                throw new ForbiddenException("Bạn không có quyền xoá sản phẩm này");

            // Delete product images from filesystem
            if (product.Images != null)
            {
                _logger.LogInformation("Deleting {Count} images for product {ProductId}", product.Images.Count, productId);
                foreach (var imageUrl in product.Images)
                {
                    _fileService.DeleteFile(imageUrl);
                }
            }

            _context.Products.Remove(product);
            var result = await _context.SaveChangesAsync() > 0;
            
            if (result)
                _logger.LogInformation("Successfully deleted product {ProductId}", productId);
            else
                _logger.LogWarning("Failed to delete product {ProductId} from database", productId);
            
            return result;
        }

        public async Task<bool> BulkDeleteProductsAsync(int sellerId, List<int> productIds)
        {
            _logger.LogInformation("Bulk deleting {Count} products by seller {SellerId}", productIds.Count, sellerId);
            
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.SellerId == sellerId)
                .ToListAsync();

            if (!products.Any()) return false;

            foreach (var product in products)
            {
                if (product.Images != null)
                {
                    foreach (var imageUrl in product.Images)
                    {
                        _fileService.DeleteFile(imageUrl);
                    }
                }
            }

            _context.Products.RemoveRange(products);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> BulkUpdateStatusAsync(int sellerId, List<int> productIds, string status)
        {
            _logger.LogInformation("Bulk updating status to {Status} for {Count} products by seller {SellerId}", status, productIds.Count, sellerId);
            
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id) && p.SellerId == sellerId)
                .ToListAsync();

            if (!products.Any()) return false;

            foreach (var product in products)
            {
                product.Status = status.ToLower();
                product.UpdatedAt = DateTime.UtcNow;
                
                if (product.Status == "active") product.IsActive = true;
                else if (product.Status == "draft" || product.Status == "ended") product.IsActive = false;
            }

            return await _context.SaveChangesAsync() > 0;
        }

        // ========== HELPER METHODS ==========

        private string GenerateSlug(string title)
        {
            var str = title.ToLower();
            str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
            str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", " ").Trim();
            str = str.Replace(" ", "-");
            // Add timestamp suffix for uniqueness
            str = $"{str}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            return str;
        }

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

        private static decimal CalculateMinimumNextBid(decimal currentPrice)
        {
            var normalizedPrice = currentPrice <= 0 ? 0.01m : currentPrice;
            return Math.Round(normalizedPrice + GetBidIncrement(normalizedPrice), 2, MidpointRounding.AwayFromZero);
        }

        private static decimal GetBidIncrement(decimal currentPrice)
        {
            if (currentPrice < 1m) return 0.05m;
            if (currentPrice < 5m) return 0.25m;
            if (currentPrice < 25m) return 0.50m;
            if (currentPrice < 100m) return 1.00m;
            if (currentPrice < 250m) return 2.50m;
            if (currentPrice < 500m) return 5.00m;
            if (currentPrice < 1000m) return 10.00m;
            if (currentPrice < 2500m) return 25.00m;
            if (currentPrice < 5000m) return 50.00m;
            return 100.00m;
        }

        private static string NormalizeAuctionStatus(string? status)
        {
            return string.IsNullOrWhiteSpace(status) ? "live" : status.Trim().ToLowerInvariant();
        }

        private static bool IsAuctionClosedStatus(string normalizedStatus)
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

        private static string ResolveAuctionDisplayStatus(Product product, DateTime now)
        {
            if (product.IsAuction != true)
            {
                return string.Empty;
            }

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
            var isClosed = IsAuctionClosedStatus(normalizedStatus) || hasEndedByTime;
            if (!isClosed)
            {
                return "live";
            }

            if (normalizedStatus == "sold" || product.WinningBidderId.HasValue)
            {
                return "sold";
            }

            return "ended";
        }

        private static IQueryable<Product> ApplyRelevanceSort(IQueryable<Product> query, string? keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
            {
                return query.OrderByDescending(p => p.CreatedAt);
            }

            var normalizedKeyword = keyword.Trim().ToLowerInvariant();

            return query
                .OrderByDescending(p => p.Title.ToLower() == normalizedKeyword)
                .ThenByDescending(p => p.Title.ToLower().StartsWith(normalizedKeyword))
                .ThenByDescending(p => p.Title.ToLower().Contains(normalizedKeyword))
                .ThenByDescending(p => (p.Description ?? string.Empty).ToLower().Contains(normalizedKeyword))
                .ThenByDescending(p => p.ViewCount)
                .ThenByDescending(p => p.CreatedAt);
        }

        
public static ProductResponseDto MapToDto(Product p) => new ProductResponseDto
{
    Id = p.Id,
    Title = p.Title,
    Slug = p.Slug,
    Description = p.Description,
    Price = p.Price,
    DiscountPrice = p.OriginalPrice,
    OriginalPrice = p.OriginalPrice,
    Thumbnail = p.Images != null && p.Images.Count > 0 ? p.Images[0] : null,
    Images = p.Images,
    Condition = p.Condition ?? "New",
    Brand = p.Brand,
    Status = p.Status ?? "active",
    IsActive = p.IsActive ?? true,
    Stock = p.Stock ?? 0,
    ShippingFee = p.ShippingFee ?? 0,
    ViewCount = p.ViewCount ?? 0,
    CategoryId = p.CategoryId ?? 0,
    CategoryName = p.Category?.Name ?? "General",
    SellerId = p.SellerId,
    SellerName = p.Seller?.Username ?? "Unknown",
    IsAuction = p.IsAuction ?? false,
    AuctionStartTime = EnsureUtc(p.AuctionStartTime),
    AuctionEndTime = EnsureUtc(p.AuctionEndTime),
    CurrentBid = p.CurrentBidPrice ?? (p.Bids != null && p.Bids.Any(b => b.IsRetracted != true)
        ? p.Bids.Where(b => b.IsRetracted != true).Max(b => b.Amount)
        : p.StartingBid),
    BidCount = p.Bids?.Count(b => b.IsRetracted != true) ?? 0,
    ReservePrice = p.ReservePrice,
    BuyItNowPrice = p.BuyItNowPrice,
    ReserveMet = !p.ReservePrice.HasValue || (p.CurrentBidPrice ?? p.StartingBid ?? 0) >= p.ReservePrice.Value,
    MinimumNextBid = p.IsAuction == true
        ? ((p.Bids?.Any(b => b.IsRetracted != true) ?? false)
            ? CalculateMinimumNextBid(p.CurrentBidPrice ?? p.StartingBid ?? p.Price)
            : Math.Round((p.StartingBid ?? p.CurrentBidPrice ?? p.Price), 2, MidpointRounding.AwayFromZero))
        : null,
    AuctionStatus = ResolveAuctionDisplayStatus(p, DateTime.UtcNow),
    WinningBidderId = p.WinningBidderId,
    SoldCount = p.OrderItems?.Sum(oi => oi.Quantity) ?? 0,
    CreatedAt = EnsureUtc(p.CreatedAt) ?? DateTime.UtcNow,
    Rating = p.Reviews != null && p.Reviews.Any() ? (decimal)p.Reviews.Average(r => r.Rating) : 5.0m,
    ReviewCount = p.Reviews?.Count ?? 0,
    SavedCount = (p.Wishlists?.Count ?? 0) + (p.WatchlistItems?.Count ?? 0),
    InCartCount = p.CartItems?.Count ?? 0
};
    }
}
