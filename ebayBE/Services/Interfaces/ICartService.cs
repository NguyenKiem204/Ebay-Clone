using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(int userId);
        Task AddToCartAsync(int userId, AddToCartRequestDto request);
        Task UpdateQuantityAsync(int userId, int productId, int quantity);
        Task RemoveItemAsync(int userId, int productId);
        Task ClearCartAsync(int userId);
        Task MergeCartAsync(int userId, List<AddToCartRequestDto> guestItems);
    }
}
