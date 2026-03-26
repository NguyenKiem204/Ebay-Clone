using System.Security.Claims;
using ebay.DTOs.Responses;
using ebay.Services.Implementations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ebay.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PaypalController : ControllerBase
    {
        private readonly IPaypalService _paypalService;

        public PaypalController(IPaypalService paypalService)
        {
            _paypalService = paypalService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("create-order/{orderId}")]
        public async Task<ActionResult<ApiResponse<string>>> CreateOrder(int orderId)
        {
            var paypalOrderId = await _paypalService.CreateOrderAsync(GetUserId(), orderId);
            return Ok(ApiResponse<string>.SuccessResponse(paypalOrderId));
        }

        [HttpPost("capture-order/{paypalOrderId}")]
        public async Task<ActionResult<ApiResponse<bool>>> CaptureOrder(string paypalOrderId)
        {
            var success = await _paypalService.CaptureOrderAsync(paypalOrderId);
            if (success)
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Thanh toán thành công"));
            return BadRequest(ApiResponse<bool>.ErrorResponse("Thanh toán thất bại"));
        }

        [HttpPost("fail-order/{paypalOrderId}")]
        public async Task<ActionResult<ApiResponse<bool>>> FailOrder(string paypalOrderId)
        {
            var success = await _paypalService.FailOrderAsync(paypalOrderId);
            if (success)
                return Ok(ApiResponse<bool>.SuccessResponse(true, "Thanh toán mô phỏng đã được đánh dấu thất bại"));
            return BadRequest(ApiResponse<bool>.ErrorResponse("Không thể đánh dấu thất bại cho thanh toán này"));
        }
    }
}
