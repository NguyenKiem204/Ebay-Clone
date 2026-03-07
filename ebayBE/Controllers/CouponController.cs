using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class CouponController : ControllerBase
    {
        private readonly ICouponService _couponService;

        public CouponController(ICouponService couponService)
        {
            _couponService = couponService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("validate")]
        public async Task<ActionResult<ApiResponse<CouponValidationResponseDto>>> Validate([FromBody] ValidateCouponRequest request)
        {
            var data = await _couponService.ValidateCouponAsync(request.Code, request.OrderAmount, GetUserId());
            return Ok(ApiResponse<CouponValidationResponseDto>.SuccessResponse(data));
        }
    }

    public class ValidateCouponRequest
    {
        public string Code { get; set; } = null!;
        public decimal OrderAmount { get; set; }
    }
}
