using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IInternalCaseQueryService
    {
        Task<List<BuyerCaseListItemResponseDto>> GetQueueCasesAsync(
            int actorUserId,
            string actorRole,
            CancellationToken cancellationToken = default);

        Task<ReturnRequestResponseDto> GetReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            CancellationToken cancellationToken = default);

        Task<DisputeResponseDto> GetDisputeAsync(
            int actorUserId,
            string actorRole,
            int disputeId,
            CancellationToken cancellationToken = default);
    }
}
