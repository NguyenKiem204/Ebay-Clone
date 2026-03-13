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

        public ProductService(EbayDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
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

            // Filter by status
            if (!string.IsNullOrWhiteSpace(request.Status))
            {
                query = request.Status.ToLower() switch
                {
                    "active" => query.Where(p => p.IsActive == true),
                    "hidden" => query.Where(p => p.IsActive == false),
                    _ => query
                };
            }

            // Search by keyword
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
            if (string.IsNullOrWhiteSpace(request.Title))
                throw new BadRequestException("Tiêu đề sản phẩm không được để trống");

            if (request.Price <= 0 && !(request.IsAuction))
                throw new BadRequestException("Giá sản phẩm phải lớn hơn 0");

            // Get seller's store
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == sellerId);

            // Upload images
            var imageUrls = new List<string>();
            if (request.Images != null && request.Images.Count > 0)
            {
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
                Price = request.Price,
                OriginalPrice = request.OriginalPrice,
                CategoryId = request.CategoryId,
                SellerId = sellerId,
                StoreId = store?.Id,
                Condition = request.Condition ?? "New",
                Brand = request.Brand,
                Stock = request.Stock,
                ShippingFee = request.ShippingFee,
                Weight = request.Weight,
                Dimensions = request.Dimensions,
                IsAuction = request.IsAuction,
                StartingBid = request.IsAuction ? request.StartingBid : null,
                AuctionStartTime = request.IsAuction ? DateTime.UtcNow : null,
                AuctionEndTime = request.IsAuction && request.AuctionDurationDays.HasValue
                    ? DateTime.UtcNow.AddDays(request.AuctionDurationDays.Value)
                    : null,
                Images = imageUrls,
                IsActive = true,
                Status = "active",
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();

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
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.SellerId != sellerId)
                throw new ForbiddenException("Bạn không có quyền chỉnh sửa sản phẩm này");

            // Update fields if provided
            if (!string.IsNullOrWhiteSpace(request.Title) && request.Title != product.Title)
            {
                product.Title = request.Title;
                product.Slug = GenerateSlug(request.Title);
            }
            if (request.Description != null) product.Description = request.Description;
            if (request.Price.HasValue) product.Price = request.Price.Value;
            if (request.OriginalPrice.HasValue) product.OriginalPrice = request.OriginalPrice.Value;
            if (request.CategoryId.HasValue) product.CategoryId = request.CategoryId.Value;
            if (request.Condition != null) product.Condition = request.Condition;
            if (request.Brand != null) product.Brand = request.Brand;
            if (request.Stock.HasValue) product.Stock = request.Stock.Value;
            if (request.ShippingFee.HasValue) product.ShippingFee = request.ShippingFee.Value;
            if (request.Weight.HasValue) product.Weight = request.Weight.Value;
            if (request.Dimensions != null) product.Dimensions = request.Dimensions;
            if (request.IsAuction.HasValue)
            {
                product.IsAuction = request.IsAuction.Value;
                if (request.IsAuction.Value)
                {
                    if (request.StartingBid.HasValue) product.StartingBid = request.StartingBid.Value;
                    if (request.AuctionDurationDays.HasValue)
                    {
                        product.AuctionStartTime = DateTime.UtcNow;
                        product.AuctionEndTime = DateTime.UtcNow.AddDays(request.AuctionDurationDays.Value);
                    }
                }
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

            return MapToDto(product);
        }

        public async Task<ProductResponseDto> ToggleProductVisibilityAsync(int sellerId, int productId)
        {
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
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return MapToDto(product);
        }

        public async Task<bool> DeleteProductAsync(int sellerId, int productId)
        {
            var product = await _context.Products
                .FirstOrDefaultAsync(p => p.Id == productId);

            if (product == null)
                throw new NotFoundException("Sản phẩm không tồn tại");

            if (product.SellerId != sellerId)
                throw new ForbiddenException("Bạn không có quyền xoá sản phẩm này");

            // Delete product images from filesystem
            if (product.Images != null)
            {
                foreach (var imageUrl in product.Images)
                {
                    _fileService.DeleteFile(imageUrl);
                }
            }

            _context.Products.Remove(product);
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

        private static ProductResponseDto MapToDto(Product p) => new ProductResponseDto
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
