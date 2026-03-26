using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ISellerOrderFulfillmentService
    {
        Task<SellerOrderDetailResponseDto> UpsertTrackingAsync(
            int sellerId,
            int orderId,
            UpsertSellerOrderTrackingDto request,
            CancellationToken cancellationToken = default);

        Task<SellerOrderDetailResponseDto> UpdateShipmentStatusAsync(
            int sellerId,
            int orderId,
            UpdateSellerOrderShipmentStatusDto request,
            CancellationToken cancellationToken = default);
    }
}
