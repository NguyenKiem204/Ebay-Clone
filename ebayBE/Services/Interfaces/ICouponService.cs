using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface ICouponService
    {
        Task<CouponValidationResponseDto> ValidateCouponAsync(string code, decimal orderAmount, int userId);
        Task UseCouponAsync(int couponId, int userId);
        Task<Coupon> CreateCouponAsync(CreateCouponRequest request);
    }
}
