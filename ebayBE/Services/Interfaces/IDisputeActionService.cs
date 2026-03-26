using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IDisputeActionService
    {
        Task<DisputeResponseDto> AcknowledgeDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            AcknowledgeDisputeDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> MarkDisputeInProgressAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            MarkDisputeInProgressDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> ResolveDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            ResolveDisputeDto request,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> CloseDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            CloseDisputeDto request,
            CancellationToken cancellationToken = default);
    }
}
