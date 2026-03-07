using ebay.DTOs.Requests;
using ebay.DTOs.Responses;

namespace ebay.Services.Interfaces
{
    public interface IAddressService
    {
        Task<List<AddressResponseDto>> GetUserAddressesAsync(int userId);
        Task<AddressResponseDto> GetAddressByIdAsync(int userId, int addressId);
        Task<AddressResponseDto> CreateAddressAsync(int userId, AddressRequestDto request);
        Task<AddressResponseDto> UpdateAddressAsync(int userId, int addressId, AddressRequestDto request);
        Task DeleteAddressAsync(int userId, int addressId);
        Task SetDefaultAddressAsync(int userId, int addressId);
    }
}
