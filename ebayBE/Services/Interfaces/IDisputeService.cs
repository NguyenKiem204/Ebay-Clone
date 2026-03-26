using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IDisputeService
    {
        Task<DisputeResponseDto> CreateInrClaimAsync(int userId, CreateInrClaimDto request);

        Task<DisputeResponseDto> CreateQualityIssueClaimAsync(int userId, CreateQualityIssueClaimDto request);

        Task<DisputeResponseDto> EscalateReturnRequestAsync(int userId, int returnRequestId, EscalateReturnRequestDto request);
    }
}
