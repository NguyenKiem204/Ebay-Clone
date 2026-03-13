using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;
using ebay.Services.Interfaces;
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
            var coupon = await _context.Coupons
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
            var alreadyUsed = await _context.CouponUsages
                .AnyAsync(cu => cu.CouponId == coupon.Id && cu.UserId == userId);
            
            if (alreadyUsed)
                return new CouponValidationResponseDto { Valid = false, Message = "Bạn đã sử dụng mã này rồi" };

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

            return new CouponValidationResponseDto
            {
                Valid = true,
                CouponId = coupon.Id,
                Code = coupon.Code,
                DiscountAmount = discount,
                Description = coupon.DiscountType == "percentage" ? $"Giảm {coupon.DiscountValue}%" : $"Giảm {coupon.DiscountValue:N0}đ"
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
                ProductId = request.ProductId,
                CategoryId = request.CategoryId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UsedCount = 0
            };

            await _context.Coupons.AddAsync(coupon);
            await _context.SaveChangesAsync();

            return coupon;
        }
    }
}
