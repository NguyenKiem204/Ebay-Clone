using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
using ebay.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class CouponService : ICouponService
    {
        private readonly EbayDbContext _context;

        public CouponService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<CouponValidationResponseDto> ValidateCouponAsync(string code, decimal orderAmount, int userId)
        {
            // Note: For a robust validation, we need the list of products in the cart.
            // Since this method signature doesn't have it, we'll perform general checks.
            // A more specific version should be called during checkout with List<CartItem>.
            
            var coupon = await _context.Coupons
                .Include(c => c.Products)
                .Include(c => c.Store)
                .FirstOrDefaultAsync(c => c.Code == code && c.IsActive == true);

            if (coupon == null)
                return new CouponValidationResponseDto { Valid = false, Message = "Mã giảm giá không hợp lệ" };

            if (coupon.StartDate > DateTime.UtcNow || coupon.EndDate < DateTime.UtcNow)
                return new CouponValidationResponseDto { Valid = false, Message = "Mã giảm giá đã hết hạn" };

            if (coupon.UsedCount >= coupon.MaxUsage)
                return new CouponValidationResponseDto { Valid = false, Message = "Mã giảm giá đã hết lượt sử dụng" };

            if (orderAmount < (coupon.MinOrderAmount ?? 0))
                return new CouponValidationResponseDto { Valid = false, Message = $"Đơn hàng tối thiểu {coupon.MinOrderAmount:N0}đ để sử dụng mã này" };

            // Check if user already used this coupon
            var usedByUserCount = await _context.CouponUsages
                .CountAsync(cu => cu.CouponId == coupon.Id && cu.UserId == userId);
            
            if (usedByUserCount >= coupon.MaxUsagePerUser)
                return new CouponValidationResponseDto { Valid = false, Message = $"Bạn đã đạt giới hạn sử dụng mã này ({coupon.MaxUsagePerUser} lần)" };

            decimal discount = 0;
            if (coupon.DiscountType == "percentage")
            {
                discount = orderAmount * coupon.DiscountValue / 100;
                if (coupon.MaxDiscount.HasValue && discount > coupon.MaxDiscount.Value)
                {
                    discount = coupon.MaxDiscount.Value;
                }
            }
            else // fixed
            {
                discount = coupon.DiscountValue;
            }

            string applicabilityDesc = coupon.ApplicableTo switch
            {
                "all" => "tất cả sản phẩm trong cửa hàng",
                "category" => "các sản phẩm thuộc danh mục nhất định",
                "product" => "một số sản phẩm được chọn",
                _ => "sản phẩm áp dụng"
            };

            return new CouponValidationResponseDto
            {
                Valid = true,
                CouponId = coupon.Id,
                Code = coupon.Code,
                DiscountAmount = discount,
                Description = $"Giảm {(coupon.DiscountType == "percentage" ? $"{coupon.DiscountValue}%" : $"{coupon.DiscountValue:N0}đ")} cho {applicabilityDesc}"
            };
        }

        public async Task UseCouponAsync(int couponId, int userId)
        {
            var coupon = await _context.Coupons.FindAsync(couponId);
            if (coupon != null)
            {
                coupon.UsedCount = (coupon.UsedCount ?? 0) + 1;
                
                await _context.CouponUsages.AddAsync(new CouponUsage
                {
                    CouponId = couponId,
                    UserId = userId,
                    UsedAt = DateTime.UtcNow
                });
            }
        }

        public async Task<Coupon> CreateCouponAsync(CreateCouponRequest request)
        {
            if (request.StoreId.HasValue) 
            {
                await ValidateStoreAsync(request.StoreId.Value);
            }

            if (request.EndDate <= request.StartDate)
            {
                throw new ArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
            }

            if (request.DiscountType == "percentage" && request.DiscountValue > 100)
            {
                throw new ArgumentException("Giảm giá theo phần trăm không được vượt quá 100%");
            }

            if (request.DiscountType == "fixed" && request.MinOrderAmount.HasValue && request.MinOrderAmount.Value <= request.DiscountValue)
            {
                throw new ArgumentException("Giá trị đơn hàng tối thiểu phải lớn hơn giá trị giảm giá");
            }

            // For fixed type: auto-set MaxDiscount = DiscountValue
            if (request.DiscountType == "fixed")
                request.MaxDiscount = request.DiscountValue;

            var coupon = new Coupon
            {
                Code = request.Code,
                Description = request.Description,
                DiscountType = request.DiscountType,
                DiscountValue = request.DiscountValue,
                MinOrderAmount = request.MinOrderAmount,
                MaxDiscount = request.MaxDiscount,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                MaxUsage = request.MaxUsage,
                MaxUsagePerUser = request.MaxUsagePerUser,
                CouponType = request.CouponType,
                ApplicableTo = request.ApplicableTo,
                StoreId = request.StoreId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UsedCount = 0
            };

            await ApplyApplicabilityRules(coupon, request.ApplicableTo, request.CategoryId, request.ProductIds);

            await _context.Coupons.AddAsync(coupon);
            await _context.SaveChangesAsync();

            // Load relations for response
            await _context.Entry(coupon).Reference(c => c.Store).LoadAsync();
            await _context.Entry(coupon).Reference(c => c.Category).LoadAsync();
            await _context.Entry(coupon).Collection(c => c.Products).LoadAsync();
            await CreatePromotionNotificationAsync(
                coupon.Store?.SellerId,
                "promotion_created",
                "Promotion created",
                $"Promotion {coupon.Code} is now active.",
                "/seller/marketing");

            return coupon;
        }

        public async Task<IEnumerable<Coupon>> GetAllCouponsAsync()
        {
            return await _context.Coupons
                .Include(c => c.Category)
                .Include(c => c.Store)
                .Include(c => c.Products)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Coupon>> GetSellerCouponsAsync(int sellerId)
        {
            var store = await _context.Stores.FirstOrDefaultAsync(s => s.SellerId == sellerId);
            if (store == null) return Enumerable.Empty<Coupon>();

            return await _context.Coupons
                .Where(c => c.StoreId == store.Id)
                .Include(c => c.Category)
                .Include(c => c.Store)
                .Include(c => c.Products)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<Coupon?> GetCouponByIdAsync(int id)
        {
            return await _context.Coupons
                .Include(c => c.Category)
                .Include(c => c.Store)
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<CouponResponseDto> UpdateCouponAsync(int sellerId, int id, UpdateCouponRequest request)
        {
            var coupon = await _context.Coupons.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == id);
            if (coupon == null) throw new KeyNotFoundException("Mã giảm giá không tồn tại");

            if (coupon.StoreId.HasValue)
            {
                var store = await _context.Stores.FindAsync(coupon.StoreId.Value);
                if (store != null && store.SellerId != sellerId)
                {
                    throw new ForbiddenException("Bạn không có quyền chỉnh sửa mã giảm giá này");
                }
            }

            if (request.EndDate <= request.StartDate)
            {
                throw new ArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
            }

            // Immutability checks
            if (request.Code != coupon.Code && !string.IsNullOrEmpty(request.Code))
                throw new ArgumentException("Không được sửa mã giảm giá sau khi đã tạo");

            if (coupon.StartDate <= DateTime.UtcNow)
            {
                // If already started, force the original StartDate and DiscountType 
                // to ignore any minor precision/format changes from the frontend
                request.StartDate = coupon.StartDate;
                request.DiscountType = coupon.DiscountType;
            }
            else
            {
                if (request.EndDate <= request.StartDate)
                {
                    throw new ArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
                }
                coupon.StartDate = request.StartDate;
            }

            if (request.DiscountType == "percentage" && request.DiscountValue > 100)
            {
                throw new ArgumentException("Giảm giá theo phần trăm không được vượt quá 100%");
            }

            if (request.DiscountType == "fixed" && request.MinOrderAmount.HasValue && request.MinOrderAmount.Value <= request.DiscountValue)
            {
                throw new ArgumentException("Giá trị đơn hàng tối thiểu phải lớn hơn giá trị giảm giá");
            }

            // For fixed type: auto-set MaxDiscount = DiscountValue
            if (request.DiscountType == "fixed")
                request.MaxDiscount = request.DiscountValue;

            if (request.MaxUsage.HasValue && request.MaxUsage < (coupon.UsedCount ?? 0))
            {
                throw new ArgumentException($"Số lượng sử dụng tối đa không được nhỏ hơn số lượng đã dùng ({coupon.UsedCount})");
            }

            coupon.Description = request.Description;
            coupon.DiscountType = request.DiscountType;
            coupon.DiscountValue = request.DiscountValue;
            coupon.MinOrderAmount = request.MinOrderAmount;
            coupon.MaxDiscount = request.MaxDiscount;
            coupon.StartDate = request.StartDate;
            coupon.EndDate = request.EndDate;
            coupon.MaxUsage = request.MaxUsage;
            coupon.MaxUsagePerUser = request.MaxUsagePerUser;
            coupon.CouponType = request.CouponType;
            coupon.ApplicableTo = request.ApplicableTo;
            coupon.IsActive = request.IsActive;

            if (request.StoreId.HasValue && request.StoreId != coupon.StoreId)
            {
                await ValidateStoreAsync(request.StoreId.Value);
                coupon.StoreId = request.StoreId;
            }

            await ApplyApplicabilityRules(coupon, request.ApplicableTo, request.CategoryId, request.ProductIds);

            await _context.SaveChangesAsync();

            // Load relations for response
            await _context.Entry(coupon).Reference(c => c.Store).LoadAsync();
            await _context.Entry(coupon).Reference(c => c.Category).LoadAsync();
            await _context.Entry(coupon).Collection(c => c.Products).LoadAsync();
            await CreatePromotionNotificationAsync(
                sellerId,
                "promotion_updated",
                "Promotion updated",
                $"Promotion {coupon.Code} was updated successfully.",
                "/seller/marketing");

            return MapCouponToResponseDto(coupon);
        }

        private static CouponResponseDto MapCouponToResponseDto(Coupon coupon)
        {
            return new CouponResponseDto
            {
                Id = coupon.Id,
                Code = coupon.Code,
                Description = coupon.Description,
                DiscountType = coupon.DiscountType,
                DiscountValue = coupon.DiscountValue,
                MinOrderAmount = coupon.MinOrderAmount,
                MaxDiscount = coupon.MaxDiscount,
                StartDate = coupon.StartDate,
                EndDate = coupon.EndDate,
                MaxUsage = coupon.MaxUsage,
                MaxUsagePerUser = coupon.MaxUsagePerUser,
                CouponType = coupon.CouponType,
                UsedCount = coupon.UsedCount,
                IsActive = coupon.IsActive,
                CreatedAt = coupon.CreatedAt,
                CategoryId = coupon.CategoryId,
                StoreId = coupon.StoreId,
                ApplicableTo = coupon.ApplicableTo,
                SelectedProductIds = coupon.Products?.Select(p => p.Id).ToList(),
                SelectedProductTitles = coupon.Products?.Select(p => p.Title).ToList(),
                Products = coupon.Products?.Select(p => ProductService.MapToDto(p)).ToList()
            };
        }

        private async Task ApplyApplicabilityRules(Coupon coupon, string? applicableTo, int? categoryId, List<int?>? productIds)
        {
            if (!coupon.StoreId.HasValue) 
                throw new ArgumentException("Mã giảm giá phải thuộc về một cửa hàng");

            if (applicableTo == "all")
            {
                // Check if store has any products
                var hasProducts = await _context.Products.AnyAsync(p => p.StoreId == coupon.StoreId && p.IsActive == true);
                if (!hasProducts) throw new ArgumentException("Cửa hàng hiện chưa có sản phẩm nào đang hoạt động để áp dụng mã");

                coupon.CategoryId = null;
                coupon.ProductId = null;
                coupon.Products.Clear();
            }
            else if (applicableTo == "category")
            {
                if (!categoryId.HasValue) throw new ArgumentException("Thiếu ID danh mục cho loại áp dụng theo danh mục");
                
                // Check if category exists
                var category = await _context.Categories.FindAsync(categoryId);
                if (category == null) throw new ArgumentException("Danh mục không tồn tại");

                // Check if store has products in this category
                var hasProductsInCategory = await _context.Products.AnyAsync(p => p.StoreId == coupon.StoreId && p.CategoryId == categoryId && p.IsActive == true);
                if (!hasProductsInCategory) throw new ArgumentException("Cửa hàng không có sản phẩm nào thuộc danh mục này đang hoạt động");

                coupon.CategoryId = categoryId;
                coupon.ProductId = null;
                coupon.Products.Clear();
            }
            else if (applicableTo == "product")
            {
                coupon.CategoryId = null;
                coupon.ProductId = null;

                // Filter out nulls and convert to normal int list
                var cleanProductIds = productIds.Where(id => id.HasValue).Select(id => id!.Value).ToList();

                if (cleanProductIds.Count == 0) throw new ArgumentException("Cần chọn ít nhất một sản phẩm");

                // Load and set products
                var products = await _context.Products
                    .Where(p => cleanProductIds.Contains(p.Id))
                    .ToListAsync();
                
                if (products.Count != cleanProductIds.Count)
                {
                    var foundIds = products.Select(p => p.Id).ToList();
                    var missingIds = cleanProductIds.Except(foundIds).ToList();
                    throw new ArgumentException($"Không tìm thấy sản phẩm có ID: {string.Join(", ", missingIds)}");
                }

                // Ensure all products belong to the store and are active
                foreach (var p in products)
                {
                    if (p.StoreId != coupon.StoreId) 
                        throw new ArgumentException($"Sản phẩm '{p.Title}' không thuộc về cửa hàng này");
                    if (p.IsActive != true) 
                        throw new ArgumentException($"Sản phẩm '{p.Title}' hiện đang không hoạt động");
                }

                coupon.Products.Clear();
                foreach (var p in products) coupon.Products.Add(p);
            }
        }

        public async Task<bool> DeleteCouponAsync(int sellerId, int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;

            if (coupon.StoreId.HasValue)
            {
                var store = await _context.Stores.FindAsync(coupon.StoreId.Value);
                if (store != null && store.SellerId != sellerId)
                {
                    return false;
                }
            }

            _context.Coupons.Remove(coupon);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> EndCouponEarlyAsync(int id)
        {
            var coupon = await _context.Coupons.FindAsync(id);
            if (coupon == null) return false;
            var sellerUserId = coupon.StoreId.HasValue
                ? (await _context.Stores.AsNoTracking().Where(store => store.Id == coupon.StoreId.Value).Select(store => (int?)store.SellerId).FirstOrDefaultAsync())
                : null;

            coupon.IsActive = false;
            coupon.EndDate = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await CreatePromotionNotificationAsync(
                sellerUserId,
                "promotion_ended",
                "Promotion ended",
                $"Promotion {coupon.Code} has ended.",
                "/seller/marketing");
            return true;
        }

        private async Task CreatePromotionNotificationAsync(int? userId, string type, string title, string body, string link)
        {
            if (!userId.HasValue)
            {
                return;
            }

            _context.Notifications.Add(new Notification
            {
                UserId = userId.Value,
                Type = type,
                Title = title,
                Body = body,
                Link = link,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();
        }

        private async Task ValidateStoreAsync(int storeId)
        {
            var store = await _context.Stores.FindAsync(storeId);
            if (store == null) throw new KeyNotFoundException("Không tìm thấy cửa hàng");
            // In a real app, check if current user is the seller of this store:
            // if (store.SellerId != currentUserId) throw new UnauthorizedAccessException(...);
        }
        public async Task<List<ProductResponseDto>> GetCouponProductsAsync(int couponId)
        {
            var coupon = await _context.Coupons
                .Include(c => c.Products)
                .FirstOrDefaultAsync(c => c.Id == couponId);

            if (coupon == null) return new List<ProductResponseDto>();

            IQueryable<Product> query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.Reviews)
                .Include(p => p.Bids)
                .Where(p => p.IsActive == true && p.Status == "active");

            if (coupon.ApplicableTo == "product")
            {
                var productIds = coupon.Products.Select(p => p.Id).ToList();
                query = query.Where(p => productIds.Contains(p.Id));
            }
            else if (coupon.ApplicableTo == "category")
            {
                query = query.Where(p => p.CategoryId == coupon.CategoryId && p.StoreId == coupon.StoreId);
            }
            else if (coupon.ApplicableTo == "all")
            {
                query = query.Where(p => p.StoreId == coupon.StoreId);
            }

            var products = await query.ToListAsync();
            return products.Select(p => ProductService.MapToDto(p)).ToList();
        }
    }
}
