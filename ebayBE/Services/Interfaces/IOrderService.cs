using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IOrderService
    {
        Task<OrderResponseDto> CreateOrderAsync(int userId, CreateOrderRequestDto request);
        Task<List<OrderResponseDto>> GetUserOrdersAsync(int userId, string? status = null);
        Task<OrderResponseDto> GetOrderByIdAsync(int userId, int orderId);
        Task CancelOrderAsync(int userId, int orderId);
    }
}
