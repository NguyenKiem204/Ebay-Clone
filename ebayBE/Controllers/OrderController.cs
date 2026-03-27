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
        private readonly IOrderCancellationService _orderCancellationService;

        public OrderController(
            IOrderService orderService,
            IOrderCancellationService orderCancellationService)
        {
            _orderService = orderService;
            _orderCancellationService = orderCancellationService;
        }

        private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<ActionResult<ApiResponse<OrderResponseDto>>> CreateOrder(CreateOrderRequestDto request)
        {
            var data = await _orderService.CreateOrderAsync(GetUserId(), request);
            return CreatedAtAction(nameof(GetById), new { id = data.Id }, ApiResponse<OrderResponseDto>.SuccessResponse(data, "Đặt hàng thành công"));
        }

        [HttpPost("review")]
        public async Task<ActionResult<ApiResponse<MemberCheckoutReviewResponseDto>>> ReviewCheckout(CreateOrderRequestDto request)
        {
            var data = await _orderService.ReviewCheckoutAsync(GetUserId(), request);
            return Ok(ApiResponse<MemberCheckoutReviewResponseDto>.SuccessResponse(data));
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

        [HttpPost("{id}/cancel-request")]
        public async Task<ActionResult<ApiResponse<OrderCancellationRequestSummaryDto>>> RequestCancellation(
            int id,
            [FromBody] CreateOrderCancellationRequestDto? request,
            CancellationToken cancellationToken)
        {
            var data = await _orderCancellationService.RequestCancellationAsync(
                GetUserId(),
                id,
                request?.Reason,
                cancellationToken);

            return Ok(ApiResponse<OrderCancellationRequestSummaryDto>.SuccessResponse(
                data,
                "Đã gửi yêu cầu hủy đơn hàng"));
        }

        [HttpPut("{id}/cancel")]
        public async Task<ActionResult<ApiResponse<OrderCancellationRequestSummaryDto>>> Cancel(
            int id,
            [FromBody] CreateOrderCancellationRequestDto? request,
            CancellationToken cancellationToken)
        {
            var data = await _orderCancellationService.RequestCancellationAsync(
                GetUserId(),
                id,
                request?.Reason,
                cancellationToken);

            return Ok(ApiResponse<OrderCancellationRequestSummaryDto>.SuccessResponse(
                data,
                "Đã gửi yêu cầu hủy đơn hàng"));
        }
    }
}
