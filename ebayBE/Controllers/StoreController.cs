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
    public class StoreController : ControllerBase
    {
        private readonly IStoreService _storeService;

        public StoreController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("me")]
        public async Task<ActionResult<ApiResponse<StoreResponseDto?>>> GetMyStore()
        {
            var data = await _storeService.GetStoreBySellerIdAsync(GetUserId());
            return Ok(ApiResponse<StoreResponseDto?>.SuccessResponse(data));
        }

        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<ActionResult<ApiResponse<StoreResponseDto?>>> GetStoreByUserId(int userId)
        {
            var data = await _storeService.GetStoreBySellerIdAsync(userId);
            if (data == null) return NotFound(ApiResponse<StoreResponseDto?>.ErrorResponse("Cửa hàng không tồn tại"));
            return Ok(ApiResponse<StoreResponseDto?>.SuccessResponse(data));
        }

        [HttpPost]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<StoreResponseDto>>> CreateStore([FromForm] CreateStoreRequest request)
        {
            var data = await _storeService.CreateStoreAsync(GetUserId(), request);
            return Ok(ApiResponse<StoreResponseDto>.SuccessResponse(data, "Đăng ký cửa hàng thành công. Chúc mừng bạn đã trở thành người bán!"));
        }

        [HttpPut("me")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<StoreResponseDto>>> UpdateStore([FromForm] UpdateStoreRequest request)
        {
            var data = await _storeService.UpdateStoreAsync(GetUserId(), request);
            return Ok(ApiResponse<StoreResponseDto>.SuccessResponse(data, "Cập nhật hồ sơ cửa hàng thành công"));
        }

        [HttpDelete("me")]
        [Authorize(Roles = "seller,admin")]
        public async Task<ActionResult<ApiResponse<bool>>> DeactivateStore()
        {
            await _storeService.DeactivateStoreAsync(GetUserId());
            return Ok(ApiResponse<bool>.SuccessResponse(true, "Cửa hàng đã được tạm dừng hoạt động"));
        }
    }
}
