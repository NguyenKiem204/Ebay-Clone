using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ISellerOrderQueryService
    {
        Task<List<SellerOrderListItemResponseDto>> GetSellerOrdersAsync(
            int sellerId,
            CancellationToken cancellationToken = default);

        Task<SellerOrderDetailResponseDto> GetSellerOrderByIdAsync(
            int sellerId,
            int orderId,
            CancellationToken cancellationToken = default);
    }
}
