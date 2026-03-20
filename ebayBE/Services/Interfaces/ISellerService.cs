using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ISellerService
    {
        Task<SellerProfileDto> GetSellerProfileAsync(int sellerId);
        Task<PagedResponseDto<SellerReviewDto>> GetSellerReviewsAsync(int sellerId, int? productId, int page, int pageSize);
    }
}
