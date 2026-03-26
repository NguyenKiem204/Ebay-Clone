using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IReturnRequestActionService
    {
        Task<ReturnRequestResponseDto> ApproveReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            ApproveReturnRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ReturnRequestResponseDto> RejectReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            RejectReturnRequestDto request,
            CancellationToken cancellationToken = default);

        Task<ReturnRequestResponseDto> CompleteReturnRequestAsync(
            int actorUserId,
            string actorRole,
            int returnRequestId,
            CompleteReturnRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
