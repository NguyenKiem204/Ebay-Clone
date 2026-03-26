using ebay.DTOs.Responses;
using ebay.Models;

namespace ebay.Services.Interfaces
{
    public interface IOrderProjectionMapper
    {
        OrderResponseDto MapMemberOrder(Order order);
        GuestOrderLookupResponseDto MapGuestLookup(Order order);
    }
}
