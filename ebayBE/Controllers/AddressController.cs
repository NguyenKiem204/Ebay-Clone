using System.Security.Claims;
using ebay.DTOs.Requests;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;

        public AddressController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<AddressResponseDto>>>> GetAll()
        {
            var data = await _addressService.GetUserAddressesAsync(GetUserId());
            return Ok(ApiResponse<List<AddressResponseDto>>.SuccessResponse(data));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<AddressResponseDto>>> GetById(int id)
        {
            var data = await _addressService.GetAddressByIdAsync(GetUserId(), id);
            return Ok(ApiResponse<AddressResponseDto>.SuccessResponse(data));
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<AddressResponseDto>>> Create(AddressRequestDto request)
        {
            var data = await _addressService.CreateAddressAsync(GetUserId(), request);
            return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<AddressResponseDto>.SuccessResponse(data, "Thêm địa chỉ thành công"));
        }

// test
        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<AddressResponseDto>>> Update(int id, AddressRequestDto request)
        {
            var data = await _addressService.UpdateAddressAsync(GetUserId(), id, request);
            return Ok(ApiResponse<AddressResponseDto>.SuccessResponse(data, "Cập nhật địa chỉ thành công"));
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<object>>> Delete(int id)
        {
            await _addressService.DeleteAddressAsync(GetUserId(), id);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Xóa địa chỉ thành công"));
        }

        [HttpPatch("{id}/default")]
        public async Task<ActionResult<ApiResponse<object>>> SetDefault(int id)
        {
            await _addressService.SetDefaultAddressAsync(GetUserId(), id);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Đặt địa chỉ mặc định thành công"));
        }
    }
}
