using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IGuestCheckoutService
    {
        Task<CreateGuestOrderResponseDto> CreateOrderAsync(CreateGuestOrderRequestDto request, CancellationToken cancellationToken = default);
    }
}
