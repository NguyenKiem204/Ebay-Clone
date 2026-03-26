using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestReturnRequestService
    {
        Task<ReturnRequestResponseDto> CreateGuestReturnRequestAsync(
            CreateGuestReturnRequestDto request,
            CancellationToken cancellationToken = default);
    }
}
