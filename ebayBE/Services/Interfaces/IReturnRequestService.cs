using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IReturnRequestService
    {
        Task<ReturnRequestResponseDto> CreateReturnRequestAsync(int userId, CreateReturnRequestDto request);
    }
}
