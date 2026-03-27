using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestCaseQueryService
    {
        Task<GuestCaseListResponseDto> GetGuestCasesAsync(
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default);

        Task<GuestReturnCaseDetailResponseDto> GetGuestReturnRequestAsync(
            int returnRequestId,
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default);

        Task<GuestDisputeCaseDetailResponseDto> GetGuestDisputeAsync(
            int disputeId,
            GuestCaseAccessRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
