using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestDisputeService
    {
        Task<DisputeResponseDto> CreateGuestInrClaimAsync(
            CreateGuestInrClaimDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> CreateGuestQualityIssueClaimAsync(
            CreateGuestQualityIssueClaimDto request,
            CancellationToken cancellationToken = default);
    }
}
