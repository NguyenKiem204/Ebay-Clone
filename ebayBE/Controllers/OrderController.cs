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
    public class OrderController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrderController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<ActionResult<ApiResponse<OrderResponseDto>>> CreateOrder(CreateOrderRequestDto request)
        {
            var data = await _orderService.CreateOrderAsync(GetUserId(), request);
            return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<OrderResponseDto>.SuccessResponse(data, "Đặt hàng thành công"));
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<OrderResponseDto>>>> GetMyOrders([FromQuery] string? status)
        {
            var data = await _orderService.GetUserOrdersAsync(GetUserId(), status);
            return Ok(ApiResponse<List<OrderResponseDto>>.SuccessResponse(data));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<OrderResponseDto>>> GetById(int id)
        {
            var data = await _orderService.GetOrderByIdAsync(GetUserId(), id);
            return Ok(ApiResponse<OrderResponseDto>.SuccessResponse(data));
        }

        [HttpPut("{id}/cancel")]
        public async Task<ActionResult<ApiResponse<object>>> Cancel(int id)
        {
            await _orderService.CancelOrderAsync(GetUserId(), id);
            return Ok(ApiResponse<object>.SuccessResponse(null!, "Hủy đơn hàng thành công"));
        }
    }
}
