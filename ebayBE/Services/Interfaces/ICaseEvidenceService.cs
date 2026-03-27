using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ICaseEvidenceService
    {
        Task<BuyerCaseEvidenceResponseDto> UploadReturnEvidenceAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken = default);

        Task<BuyerCaseEvidenceResponseDto> UploadDisputeEvidenceAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            UploadCaseEvidenceDto request,
            CancellationToken cancellationToken = default);
    }
}
