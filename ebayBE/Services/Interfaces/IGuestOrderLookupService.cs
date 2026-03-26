using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestOrderLookupService
    {
        Task<GuestOrderLookupResponseDto> LookupAsync(GuestOrderLookupRequestDto request, CancellationToken cancellationToken = default);
        Task ResendConfirmationEmailAsync(GuestOrderLookupRequestDto request, CancellationToken cancellationToken = default);
    }
}
