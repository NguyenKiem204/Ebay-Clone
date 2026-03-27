using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IBuyerCaseCommandService
    {
        Task<ReturnRequestResponseDto> CancelReturnRequestAsync(
            int userId,
            int returnRequestId,
            CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ReturnRequestResponseDto> SubmitReturnTrackingAsync(
            int userId,
            int returnRequestId,
            SubmitReturnTrackingDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> CancelInrClaimAsync(
            int userId,
            int disputeId,
            CancelBuyerCaseRequestDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> EscalateInrClaimAsync(
            int userId,
            int disputeId,
            EscalateInrClaimDto request,
            CancellationToken cancellationToken = default);
    }
}
