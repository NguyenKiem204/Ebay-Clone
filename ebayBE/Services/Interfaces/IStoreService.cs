using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IStoreService
    {
        Task<StoreResponseDto?> GetStoreBySellerIdAsync(int sellerId);
        Task<StoreResponseDto> CreateStoreAsync(int userId, CreateStoreRequest request);
        Task<StoreResponseDto> UpdateStoreAsync(int sellerId, UpdateStoreRequest request);
        Task<bool> DeactivateStoreAsync(int sellerId);
    }
}
