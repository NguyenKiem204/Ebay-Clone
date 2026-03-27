using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IOrderCancellationService
    {
        Task<OrderCancellationRequestSummaryDto> RequestCancellationAsync(
            int buyerUserId,
            int orderId,
            string? reason,
            CancellationToken cancellationToken = default);

        Task<OrderCancellationRequestSummaryDto> ApproveCancellationRequestAsync(
            int actorUserId,
            string actorRole,
            int cancellationRequestId,
            string? sellerResponse,
            CancellationToken cancellationToken = default);

        Task<OrderCancellationRequestSummaryDto> RejectCancellationRequestAsync(
            int actorUserId,
            string actorRole,
            int cancellationRequestId,
            string? sellerResponse,
            CancellationToken cancellationToken = default);
    }
}
