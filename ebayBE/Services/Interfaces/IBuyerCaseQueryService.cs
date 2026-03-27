using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IBuyerCaseQueryService
    {
        Task<List<BuyerCaseListItemResponseDto>> GetBuyerCasesAsync(int userId);

        Task<ReturnRequestResponseDto> GetReturnRequestAsync(int userId, int returnRequestId);

        Task<DisputeResponseDto> GetDisputeAsync(int userId, int disputeId);
    }
}
