using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestCaseCommandService
    {
        Task<ReturnRequestResponseDto> CancelReturnRequestAsync(
            int returnRequestId,
            CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ReturnRequestResponseDto> SubmitReturnTrackingAsync(
            int returnRequestId,
            SubmitGuestReturnTrackingDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> CancelInrClaimAsync(
            int disputeId,
            CancelGuestCaseRequestDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> EscalateInrClaimAsync(
            int disputeId,
            EscalateGuestInrClaimDto request,
            CancellationToken cancellationToken = default);
    }
}
