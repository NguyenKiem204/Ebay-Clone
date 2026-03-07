using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Exceptions;
using ebay.Models;
using ebay.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ebay.Services.Implementations
{
    public class AddressService : IAddressService
    {
        private readonly EbayDbContext _context;

        public AddressService(EbayDbContext context)
        {
            _context = context;
        }

        public async Task<List<AddressResponseDto>> GetUserAddressesAsync(int userId)
        {
            return await _context.Addresses
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.CreatedAt)
                .Select(a => MapToDto(a))
                .ToListAsync();
        }

        public async Task<AddressResponseDto> GetAddressByIdAsync(int userId, int addressId)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (address == null) throw new NotFoundException("Địa chỉ không tồn tại");

            return MapToDto(address);
        }

        public async Task<AddressResponseDto> CreateAddressAsync(int userId, AddressRequestDto request)
        {
            var count = await _context.Addresses.CountAsync(a => a.UserId == userId);
            if (count >= 10) throw new BadRequestException("Bạn chỉ được lưu tối đa 10 địa chỉ");

            // If this is the first address, it must be default
            if (count == 0) request.IsDefault = true;

            if (request.IsDefault)
            {
                await ResetDefaultAddressAsync(userId);
            }

            var address = new Address
            {
                UserId = userId,
                FullName = request.FullName,
                Phone = request.Phone,
                Street = request.Street,
                City = request.City,
                State = request.State,
                PostalCode = request.PostalCode,
                Country = request.Country,
                IsDefault = request.IsDefault,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _context.Addresses.AddAsync(address);
            await _context.SaveChangesAsync();

            return MapToDto(address);
        }

        public async Task<AddressResponseDto> UpdateAddressAsync(int userId, int addressId, AddressRequestDto request)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (address == null) throw new NotFoundException("Địa chỉ không tồn tại");

            if (request.IsDefault && address.IsDefault != true)
            {
                await ResetDefaultAddressAsync(userId);
            }

            address.FullName = request.FullName;
            address.Phone = request.Phone;
            address.Street = request.Street;
            address.City = request.City;
            address.State = request.State;
            address.PostalCode = request.PostalCode;
            address.Country = request.Country;
            address.IsDefault = request.IsDefault;
            address.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(address);
        }

        public async Task DeleteAddressAsync(int userId, int addressId)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (address == null) throw new NotFoundException("Địa chỉ không tồn tại");

            if (address.IsDefault == true)
            {
                throw new BadRequestException("Không thể xóa địa chỉ mặc định. Vui lòng đặt địa chỉ khác làm mặc định trước.");
            }

            _context.Addresses.Remove(address);
            await _context.SaveChangesAsync();
        }

        public async Task SetDefaultAddressAsync(int userId, int addressId)
        {
            var address = await _context.Addresses
                .FirstOrDefaultAsync(a => a.Id == addressId && a.UserId == userId);

            if (address == null) throw new NotFoundException("Địa chỉ không tồn tại");

            if (address.IsDefault == true) return;

            await ResetDefaultAddressAsync(userId);
            address.IsDefault = true;
            address.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        private async Task ResetDefaultAddressAsync(int userId)
        {
            var currentDefault = await _context.Addresses
                .FirstOrDefaultAsync(a => a.UserId == userId && a.IsDefault == true);

            if (currentDefault != null)
            {
                currentDefault.IsDefault = false;
                currentDefault.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static AddressResponseDto MapToDto(Address a) => new AddressResponseDto
        {
            Id = a.Id,
            FullName = a.FullName,
            Phone = a.Phone,
            Street = a.Street,
            City = a.City,
            State = a.State,
            PostalCode = a.PostalCode,
            Country = a.Country,
            IsDefault = a.IsDefault ?? false
        };
    }
}
