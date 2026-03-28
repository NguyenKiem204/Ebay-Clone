using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface ICouponService
    {
        Task<CouponValidationResponseDto> ValidateCouponAsync(string code, decimal orderAmount, int userId);
        Task UseCouponAsync(int couponId, int userId);
        Task<IEnumerable<Coupon>> GetAllCouponsAsync();
        Task<IEnumerable<Coupon>> GetSellerCouponsAsync(int sellerId);
        Task<Coupon?> GetCouponByIdAsync(int id);
        Task<CouponResponseDto> CreateCouponAsync(CreateCouponRequest request);
        Task<CouponResponseDto> UpdateCouponAsync(int sellerId, int id, UpdateCouponRequest request);
        Task<bool> DeleteCouponAsync(int sellerId, int id);
        Task<List<ProductResponseDto>> GetCouponProductsAsync(int couponId);
        Task<bool> EndCouponEarlyAsync(int id);
    }
}
